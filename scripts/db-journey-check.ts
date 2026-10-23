/**
 * Data-layer journey check — run it against a REAL Postgres to prove the whole
 * signup → onboarding → dashboard → hustles → logout/login + migrate flow's
 * database work, without needing a browser.
 *
 *   cd /home/team/shared/site
 *   DATABASE_URL=postgres://postgres@127.0.0.1:55432/f45_test \
 *     bun run scripts/db-journey-check.ts
 *
 * It runs the SAME statements the server functions run (copied verbatim from
 * src/server/actions.ts + src/server/auth.ts) and asserts the shapes the UI
 * depends on — number/array/timestamp coercion, the lower(email) unique index,
 * the (user_id, hustle_key) unique constraint, session lookup, snapshot order —
 * and that re-running the migration is idempotent.
 *
 * Not imported by the app and not part of the build; test-only.
 */
import { query, runMigration, TABLES, driverName } from "../src/db";

const results: string[] = [];
const ok = (name: string, pass: boolean, detail = ""): void => {
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const skillsLiteral = (skills: string[]): string =>
  `{${skills.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;

const email = `journey-${String(Date.now())}@example.com`;
const passwordHash = "scrypt:aa:bb";

/* 1 — migration, run twice: idempotent, six tables --------------- */
const first = await runMigration();
const second = await runMigration();
ok("1 migrate runs and reports all six tables", first.ok && first.tables.length === 6, first.tables.join(","));
ok("7 re-running migrate is idempotent", second.ok && second.tables.length === TABLES.length, "no error, still 6");

/* 2 — signup: user row + default profile + session --------------- */
const inserted = await query<{ id: number }>(
  `insert into users (email, password_hash) values ($1, $2) returning id`,
  [email, passwordHash],
);
const userId = num(inserted[0]?.id);
ok("2 signup returns the new user id as a number", userId > 0, `id=${String(userId)}`);
await query(
  `insert into profiles (user_id, target_freedom_age, currency) values ($1, 45, 'GBP')
   on conflict (user_id) do nothing`,
  [userId],
);
const dupe = await query(`insert into users (email, password_hash) values ($1,$2) returning id`, [
  email.toUpperCase(),
  passwordHash,
]).then(
  () => false,
  (error: unknown) => /duplicate key|unique/i.test(String(error)),
);
ok("2 lower(email) unique index rejects a duplicate signup", dupe);

const tokenHash = "journey-test-token-hash";
await query(`insert into sessions (token, user_id, expires_at) values ($1, $2, $3)`, [
  tokenHash,
  userId,
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
]);
const session = await query<{ id: number | string; email: string }>(
  `select u.id, u.email from sessions s join users u on u.id = s.user_id
    where s.token = $1 and s.expires_at > now()`,
  [tokenHash],
);
ok("2 session cookie value resolves back to the user", session.length === 1 && String(session[0]?.email) === email);

/* 3 — onboarding, exactly as saveOnboardingFn writes it ---------- */
const skills = ["Public speaking", "Spreadsheets"];
await query(
  `insert into profiles (
     user_id, profession, field, hours_free_per_week, skills, monthly_income,
     current_savings, monthly_spending, target_freedom_age, current_age, currency,
     onboarded_at, updated_at
   ) values ($1,$2,$3,$4,$5::text[],$6,$7,$8,$9,$10,$11, now(), now())
   on conflict (user_id) do update set
     profession = excluded.profession, field = excluded.field,
     hours_free_per_week = excluded.hours_free_per_week, skills = excluded.skills,
     monthly_income = excluded.monthly_income, current_savings = excluded.current_savings,
     monthly_spending = excluded.monthly_spending, target_freedom_age = excluded.target_freedom_age,
     current_age = excluded.current_age, currency = excluded.currency,
     onboarded_at = coalesce(profiles.onboarded_at, now()), updated_at = now()`,
  [userId, "Junior analyst", "Finance", 10, skillsLiteral(skills), 2800, 3500, 1900, 45, 26, "GBP"],
);
const profile = (
  await query<Record<string, unknown>>(
    `select profession, field, hours_free_per_week, skills, monthly_income, current_savings,
            monthly_spending, target_freedom_age, current_age, currency, onboarded_at
       from profiles where user_id = $1`,
    [userId],
  )
)[0];
ok(
  "3 onboarding saves every field",
  Boolean(profile) &&
    String(profile?.profession) === "Junior analyst" &&
    String(profile?.field) === "Finance" &&
    num(profile?.hours_free_per_week) === 10 &&
    skills.length === (Array.isArray(profile?.skills) ? (profile.skills as unknown[]).length : -1) &&
    num(profile?.monthly_income) === 2800 &&
    num(profile?.monthly_spending) === 1900 &&
    num(profile?.target_freedom_age) === 45 &&
    num(profile?.current_age) === 26 &&
    String(profile?.currency) === "GBP" &&
    Boolean(profile?.onboarded_at),
  `skills=${JSON.stringify(profile?.skills)} income=${JSON.stringify(profile?.monthly_income)} onboarded_at=${String(profile?.onboarded_at)}`,
);
ok(
  "3 timestamptz reads back as an ISO string (driver-agnostic)",
  typeof profile?.onboarded_at === "string" && !Number.isNaN(Date.parse(String(profile?.onboarded_at))),
);

/* 4 — "update my numbers" appends a snapshot -------------------- */
const updated = await query(
  `update profiles set monthly_income = $2, current_savings = $3, monthly_spending = $4, updated_at = now()
    where user_id = $1 returning user_id`,
  [userId, 3100, 4200, 1900],
);
ok("4 update-my-numbers finds the profile", updated.length === 1);
await query(`insert into snapshots (user_id, savings, income, spending) values ($1,$2,$3,$4)`, [
  userId,
  4200,
  3100,
  1900,
]);
const snapshots = await query<Record<string, unknown>>(
  `select id, savings, income, spending, created_at from snapshots
    where user_id = $1 order by created_at asc, id asc limit 60`,
  [userId],
);
ok("4 a snapshot is appended and ordered oldest-first", snapshots.length === 1 && num(snapshots[0]?.savings) === 4200);
ok(
  "4 snapshot created_at is an ISO string the list can render",
  typeof snapshots[0]?.created_at === "string" && !Number.isNaN(Date.parse(String(snapshots[0]?.created_at))),
);

/* 5 — side hustles: save two, re-save one, remove one ------------ */
for (const key of ["tutoring", "dog-walking"]) {
  await query(
    `insert into side_hustle_selections (user_id, hustle_key) values ($1, $2)
     on conflict (user_id, hustle_key) do nothing`,
    [userId, key],
  );
}
await query(
  `insert into side_hustle_selections (user_id, hustle_key) values ($1, $2)
   on conflict (user_id, hustle_key) do nothing`,
  [userId, "tutoring"],
);
const saved = await query<{ hustle_key: string }>(
  `select hustle_key from side_hustle_selections where user_id = $1 order by created_at asc, id asc`,
  [userId],
);
ok("5 two hustles saved, re-save is a no-op", saved.length === 2, saved.map((r) => r.hustle_key).join(","));
await query(`delete from side_hustle_selections where user_id = $1 and hustle_key = $2`, [userId, "tutoring"]);
const afterRemove = await query<{ hustle_key: string }>(
  `select hustle_key from side_hustle_selections where user_id = $1 order by created_at asc, id asc`,
  [userId],
);
ok("5 removing one leaves the other", afterRemove.length === 1 && afterRemove[0]?.hustle_key === "dog-walking");

/* 6 — session survives a "log out / log back in" ----------------- */
const relogin = await query<{ id: number | string; email: string }>(
  `select u.id, u.email from sessions s join users u on u.id = s.user_id
    where s.token = $1 and s.expires_at > now()`,
  [tokenHash],
);
const stillThere = await query(
  `select p.user_id from profiles p where p.user_id = $1 and p.onboarded_at is not null`,
  [userId],
);
const hustleStill = await query(`select hustle_key from side_hustle_selections where user_id = $1`, [userId]);
ok("6 session, profile and saved hustle all still present after re-login", relogin.length === 1 && stillThere.length === 1 && hustleStill.length === 1);
await query(`delete from sessions where token = $1`, [tokenHash]);
const afterLogout = await query(`select token from sessions where token = $1`, [tokenHash]);
ok("6 logout deletes the session row", afterLogout.length === 0);

console.log(`driver: ${driverName()}`);
for (const line of results) console.log(line);
const failed = results.filter((line) => line.startsWith("FAIL")).length;
console.log(failed === 0 ? "ALL CHECKS PASSED" : `${String(failed)} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
