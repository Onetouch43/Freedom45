/**
 * Server-only handle to the team's database (Postgres).
 *
 * Everything driver-specific lives in THIS module. The rest of the app only ever
 * calls `query()` / `runMigration()` / `ensureSchema()` / `isDbConfigured()`.
 *
 * TWO DRIVERS, PICKED FROM THE URL:
 *
 *  1. An ordinary managed Postgres (`postgres://…`, e.g. Tiger Cloud / RDS /
 *     supabase the normal way) is reached with Bun's BUILT-IN Postgres client —
 *     `new SQL(url)` from `import { SQL } from "bun"`. No extra runtime
 *     dependency, native `postgres://` support, prepared statements.
 *  2. A Neon-style HTTP endpoint (any host containing `neon.tech`) keeps using
 *     `@neondatabase/serverless`, which is the only driver that speaks Neon's
 *     HTTP protocol. That branch exists purely as a fallback for a URL that was
 *     provisioned by Neon — a plain `postgres://` host never takes it.
 *
 * The URL is resolved lazily (per call, not at module load) so the site still
 * builds, publishes and serves before a database is connected: a query without
 * `DATABASE_URL` throws `DbNotConnectedError`, which callers turn into a clear
 * "database not connected yet" state instead of a crash.
 */

import { neon } from "@neondatabase/serverless";

/* ------------------------------------------------------------------ errors */

export class DbNotConnectedError extends Error {
  constructor() {
    super("database-not-connected");
    this.name = "DbNotConnectedError";
  }
}

/** True when a connection string is present. Safe to call anywhere. */
export const isDbConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

/* ------------------------------------------------------- driver selection */

/**
 * True for a Neon HTTP endpoint. Neon's own `postgres://` strings also contain
 * `neon.tech`, so they land here too — which is right: the Neon serverless driver
 * accepts both the HTTP URL and Neon's pooler `postgres://…neon.tech…` string.
 */
const isNeonUrl = (url: string): boolean => /neon\.tech/i.test(url);

/** Minimal shape of the pieces of Bun's `SQL` client this module uses. */
type BunSqlClient = {
  unsafe: (text: string, params?: unknown[]) => Promise<unknown>;
  end?: (options?: { timeout?: number }) => Promise<void>;
};
type BunSqlCtor = new (url: string, options?: Record<string, unknown>) => BunSqlClient;

/**
 * Bun's built-in `SQL` class — the same class as `import { SQL } from "bun"`,
 * read off the runtime global instead. A bare (or dynamic) import of the `"bun"`
 * specifier makes Rollup fail the production build with "Rollup failed to resolve
 * import \"bun\"", even with `@vite-ignore`; the global needs no resolution and is
 * identical at runtime.
 */
function bunSqlCtor(): BunSqlCtor | null {
  const host = globalThis as unknown as { Bun?: { SQL?: BunSqlCtor } };
  return typeof host.Bun?.SQL === "function" ? host.Bun.SQL : null;
}

/**
 * One pooled Bun client per connection string, reused across calls, so a page
 * render that runs several statements does not open several pools.
 */
let pgClient: BunSqlClient | null = null;
let pgClientUrl: string | null = null;

async function bunClient(url: string): Promise<BunSqlClient> {
  if (pgClient && pgClientUrl === url) return pgClient;
  const Ctor = bunSqlCtor();
  if (!Ctor) {
    throw new Error(
      "no-postgres-driver: this runtime has no built-in Postgres client — run the app on Bun, or connect a Neon URL",
    );
  }
  if (pgClient && typeof pgClient.end === "function") {
    try {
      // Fire and forget: the old URL is being replaced, not awaited on.
      void pgClient.end({ timeout: 1 }).catch(() => undefined);
    } catch {
      // ignored
    }
  }
  pgClient = new Ctor(url);
  pgClientUrl = url;
  return pgClient;
}

/**
 * The Neon query function. Kept for the `neon.tech` branch only; the returned
 * callable has the standard tagged-template signature.
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new DbNotConnectedError();
  }
  return neon(url);
};

/** Which driver the current `DATABASE_URL` selects. Handy for diagnostics. */
export function driverName(): "bun-sql" | "neon-http" | "none" {
  const url = process.env.DATABASE_URL;
  if (!url) return "none";
  return isNeonUrl(url) ? "neon-http" : "bun-sql";
}

/* ------------------------------------------------------------------ query */

/**
 * Rows are normalised to plain JSON-ish values so call sites behave identically
 * whichever driver ran the statement: `timestamptz` becomes an ISO string (the
 * Neon driver's shape) instead of a `Date`, and `numeric` is left as the string
 * Postgres sends — every call site already coerces with `Number()`.
 */
function normaliseRow<T>(row: unknown): T {
  if (row === null || typeof row !== "object") return row as T;
  const source = row as Record<string, unknown>;
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
      changed = true;
    } else {
      out[key] = value;
    }
  }
  return (changed ? out : source) as T;
}

/** Run one parameterised statement and return its rows ([] when it returns none). */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new DbNotConnectedError();
  }

  if (isNeonUrl(url)) {
    // Use the driver's plain (non-tag) `query(text, params)` API. Faking a
    // tagged-template call with an already-parameterised string does not work:
    // the HTTP driver generates its own placeholders for a tag call, so it sent
    // our text and our `$1…` markers separately and Postgres parsed identifiers
    // like `id$1` (seen live as: column "id$1" does not exist).
    const client = neon(url) as unknown as {
      query: (text: string, params?: unknown[]) => Promise<unknown>;
    };
    const rows = await client.query(text, params);
    return (Array.isArray(rows) ? rows : []).map(normaliseRow<T>);
  }

  const client = await bunClient(url);
  // `unsafe` takes the statement and its parameters as-is — the same call shape
  // this module has always exposed — so `$1…$n` placeholders keep working.
  const rows = await client.unsafe(text, params);
  return (Array.isArray(rows) ? rows : []).map(normaliseRow<T>);
}

/* --------------------------------------------------------------- migration */

/** Tables this app owns. Kept here so the migration and the doctor agree. */
export const TABLES = [
  "users",
  "profiles",
  "sessions",
  "spending_entries",
  "spending_logs",
  "side_hustle_selections",
  "snapshots",
] as const;

/**
 * Idempotent schema. Every statement is create-if-not-exists, so it is safe to
 * re-run (and safe to run concurrently). Includes the tables later tasks need
 * (spending_entries, side_hustle_selections, snapshots) so nobody migrates twice.
 */
export const DDL: string[] = [
  `create table if not exists users (
     id serial primary key,
     email text not null,
     password_hash text not null,
     created_at timestamptz not null default now()
   )`,
  `create unique index if not exists users_email_lower_key on users (lower(email))`,

  `create table if not exists profiles (
     user_id integer primary key references users(id) on delete cascade,
     profession text,
     field text,
     hours_free_per_week integer,
     skills text[] not null default '{}',
     monthly_income numeric(12,2),
     current_savings numeric(12,2),
     monthly_spending numeric(12,2),
     target_freedom_age integer not null default 45,
     current_age integer,
     currency text not null default 'GBP',
     onboarded_at timestamptz,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,

  // Consent record (idempotent, so existing databases pick it up on the next run).
  `alter table profiles add column if not exists consent_at timestamptz`,
  `alter table profiles add column if not exists age_confirmed boolean not null default false`,

  `create table if not exists sessions (
     token text primary key,
     user_id integer not null references users(id) on delete cascade,
     expires_at timestamptz not null,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists sessions_user_id_idx on sessions (user_id)`,

  `create table if not exists spending_entries (
     id serial primary key,
     user_id integer not null references users(id) on delete cascade,
     amount numeric(12,2) not null,
     category text,
     note text,
     spent_at timestamptz not null default now(),
     created_at timestamptz not null default now()
   )`,
  `create index if not exists spending_entries_user_spent_idx on spending_entries (user_id, spent_at desc)`,
  // The Spending Tracker. Money is stored as INTEGER PENCE — never a float — so a
  // pound amount can never drift by a rounding error. `spent_at` is a plain date
  // (the day the money went out, as the user remembers it); `created_at` is when
  // the row was typed in, which is what the "3 in 24 hours" habit alert counts.
  `create table if not exists spending_logs (
     id serial primary key,
     user_id integer not null references users(id) on delete cascade,
     amount_pence integer not null check (amount_pence > 0),
     category text not null check (category in ('Housing','Food','Transport','Fun','Family','Investments','Other')),
     payment_method text not null check (payment_method in ('cash','card')),
     note text,
     spent_at date not null,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists spending_logs_user_spent_idx on spending_logs (user_id, spent_at desc, id desc)`,
  `create index if not exists spending_logs_user_created_idx on spending_logs (user_id, created_at desc)`,

  `create table if not exists side_hustle_selections (
     id serial primary key,
     user_id integer not null references users(id) on delete cascade,
     hustle_key text not null,
     created_at timestamptz not null default now(),
     unique (user_id, hustle_key)
   )`,

  `create table if not exists snapshots (
     id serial primary key,
     user_id integer not null references users(id) on delete cascade,
     savings numeric(12,2) not null default 0,
     income numeric(12,2) not null default 0,
     spending numeric(12,2) not null default 0,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists snapshots_user_created_idx on snapshots (user_id, created_at desc)`,
];

export type MigrationResult = { ok: true; tables: string[] };

/** Create anything missing and report which of our tables now exist. */
export async function runMigration(): Promise<MigrationResult> {
  for (const statement of DDL) {
    await query(statement);
  }
  const rows = await query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public'`,
  );
  const present = new Set(rows.map((r) => String(r.table_name)));
  return { ok: true, tables: TABLES.filter((t) => present.has(t)) };
}

let schemaReady: Promise<void> | null = null;

/**
 * Run the migration once per server process, lazily, before the first query.
 * Means the app works the moment `DATABASE_URL` appears — no manual step — while
 * `/api/migrate` and `bun run migrate` stay available for an explicit run.
 */
export async function ensureSchema(): Promise<void> {
  if (!isDbConfigured()) throw new DbNotConnectedError();
  schemaReady ??= runMigration()
    .then(() => undefined)
    .catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  await schemaReady;
}
