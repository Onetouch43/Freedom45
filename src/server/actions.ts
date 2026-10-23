import { createServerFn } from "@tanstack/react-start";

import { HUSTLE_BY_KEY } from "~/data/side-hustles";
import { DbNotConnectedError, ensureSchema, isDbConfigured, query } from "~/db";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  verifyPassword,
  type SessionUser,
} from "./auth";

/* ------------------------------------------------------------------- types */

export type ProfileData = {
  profession: string;
  field: string;
  hoursFreePerWeek: number;
  skills: string[];
  monthlyIncome: number;
  currentSavings: number;
  monthlySpending: number;
  targetFreedomAge: number;
  currentAge: number;
  currency: string;
  onboardedAt: string | null;
};

export type SnapshotData = {
  id: number;
  savings: number;
  income: number;
  spending: number;
  createdAt: string;
};

export type OnboardingInput = {
  profession: string;
  field: string;
  hoursFreePerWeek: number;
  skills: string[];
  monthlyIncome: number;
  currentSavings: number;
  monthlySpending: number;
  targetFreedomAge: number;
  currentAge: number;
  currency: string;
  /** Consent to the Terms and Privacy Policy. Required before anything is saved. */
  consent?: boolean;
  /** 18+ confirmation. Required before anything is saved. */
  ageConfirmed?: boolean;
};

export type DashboardData = {
  dbConnected: boolean;
  signedIn: boolean;
  onboarded: boolean;
  profile: ProfileData | null;
  snapshots: SnapshotData[];
};

export type MutationResult = { ok: true } | { ok: false; reason: string; message: string };

export const DEFAULT_ONBOARDING: OnboardingInput = {
  profession: "",
  field: "",
  hoursFreePerWeek: 8,
  skills: [],
  monthlyIncome: 2500,
  currentSavings: 1000,
  monthlySpending: 2200,
  targetFreedomAge: 45,
  currentAge: 25,
  currency: "GBP",
};

/* ------------------------------------------------------------------ helpers */

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

function parseSkills(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value !== "string" || value.trim() === "") return [];
  return value
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

/** Postgres array literal for a text[] parameter — avoids array-type ambiguity. */
const skillsLiteral = (skills: string[]): string =>
  `{${skills.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;

const isUniqueViolation = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("23505") || /duplicate key|unique/i.test(message);
};

function failure(error: unknown): { ok: false; reason: string; message: string } {
  if (error instanceof DbNotConnectedError) {
    return {
      ok: false,
      reason: "db-not-connected",
      message: "The database isn't connected yet, so this can't be saved.",
    };
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return { ok: false, reason: "error", message };
}

async function requireUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}

async function loadProfile(userId: number): Promise<ProfileData | null> {
  const rows = await query<Record<string, unknown>>(
    `select profession, field, hours_free_per_week, skills, monthly_income,
            current_savings, monthly_spending, target_freedom_age, current_age,
            currency, onboarded_at
       from profiles where user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    profession: text(row.profession),
    field: text(row.field),
    hoursFreePerWeek: num(row.hours_free_per_week),
    skills: parseSkills(row.skills),
    monthlyIncome: num(row.monthly_income),
    currentSavings: num(row.current_savings),
    monthlySpending: num(row.monthly_spending),
    targetFreedomAge: num(row.target_freedom_age) || 45,
    currentAge: num(row.current_age) || 25,
    currency: text(row.currency) || "GBP",
    onboardedAt: row.onboarded_at ? String(row.onboarded_at) : null,
  };
}

async function loadSnapshots(userId: number): Promise<SnapshotData[]> {
  const rows = await query<Record<string, unknown>>(
    `select id, savings, income, spending, created_at
       from snapshots where user_id = $1 order by created_at asc, id asc limit 60`,
    [userId],
  );
  return rows.map((row) => ({
    id: num(row.id),
    savings: num(row.savings),
    income: num(row.income),
    spending: num(row.spending),
    createdAt: String(row.created_at),
  }));
}

/* -------------------------------------------------------- server functions */

/** Who is signed in (if anyone) plus whether a database is connected. */
export const sessionUserFn = createServerFn().handler(
  async (): Promise<{ user: SessionUser | null; dbConnected: boolean }> => {
    const dbConnected = isDbConfigured();
    const user = await getSessionUser();
    return { user, dbConnected };
  },
);

export const signupFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string } }): Promise<MutationResult> => {
    const email = String(data?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(data?.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, reason: "email", message: "That email address doesn't look right." };
    }
    if (password.length < 8) {
      return { ok: false, reason: "password", message: "Use at least 8 characters for your password." };
    }
    try {
      await ensureSchema();
      const rows = await query<{ id: number }>(
        `insert into users (email, password_hash) values ($1, $2) returning id`,
        [email, hashPassword(password)],
      );
      const userId = num(rows[0]?.id);
      if (!userId) return { ok: false, reason: "error", message: "Could not create the account." };
      // A default profile row now, so onboarding only ever updates.
      await query(
        `insert into profiles (user_id, target_freedom_age, currency) values ($1, 45, 'GBP')
         on conflict (user_id) do nothing`,
        [userId],
      );
      await createSession(userId);
      return { ok: true };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return {
          ok: false,
          reason: "email-taken",
          message: "That email is already registered — log in instead.",
        };
      }
      return failure(error);
    }
  },
);

export const loginFn = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { email: string; password: string };
  }): Promise<{ ok: true; onboarded: boolean } | { ok: false; reason: string; message: string }> => {
    const email = String(data?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(data?.password ?? "");
    try {
      await ensureSchema();
      const rows = await query<{ id: number; password_hash: string }>(
        `select id, password_hash from users where lower(email) = $1 limit 1`,
        [email],
      );
      const row = rows[0];
      if (!row || !verifyPassword(password, text(row.password_hash))) {
        return { ok: false, reason: "credentials", message: "Email or password doesn't match." };
      }
      const userId = num(row.id);
      await createSession(userId);
      const profile = await loadProfile(userId);
      return { ok: true, onboarded: Boolean(profile?.onboardedAt) };
    } catch (error) {
      return failure(error);
    }
  },
);

export const logoutFn = createServerFn({ method: "POST" }).handler(async (): Promise<MutationResult> => {
  await destroySession();
  return { ok: true };
});

/** Everything the dashboard needs, in one call. */
export const dashboardFn = createServerFn().handler(async (): Promise<DashboardData> => {
  const dbConnected = isDbConfigured();
  const user = await requireUser();
  if (!user) {
    return { dbConnected, signedIn: false, onboarded: false, profile: null, snapshots: [] };
  }
  try {
    await ensureSchema();
    const profile = await loadProfile(user.id);
    const snapshots = await loadSnapshots(user.id);
    return {
      dbConnected,
      signedIn: true,
      onboarded: Boolean(profile?.onboardedAt),
      profile,
      snapshots,
    };
  } catch {
    return { dbConnected, signedIn: true, onboarded: false, profile: null, snapshots: [] };
  }
});

export const saveOnboardingFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: OnboardingInput }): Promise<MutationResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    // Consent gate: nothing is written without both boxes ticked. Enforced here,
    // not only in the UI, so the rule holds for any caller.
    if (data?.consent !== true || data?.ageConfirmed !== true) {
      return {
        ok: false,
        reason: "consent-required",
        message:
          "Please confirm you are 18 or over and agree to the Terms and Privacy Policy before saving.",
      };
    }
    try {
      await ensureSchema();
      const input: OnboardingInput = { ...DEFAULT_ONBOARDING, ...data };
      const currency = ["GBP", "USD", "EUR"].includes(input.currency) ? input.currency : "GBP";
      await query(
        `insert into profiles (
           user_id, profession, field, hours_free_per_week, skills, monthly_income,
           current_savings, monthly_spending, target_freedom_age, current_age, currency,
           consent_at, age_confirmed, onboarded_at, updated_at
         ) values ($1,$2,$3,$4,$5::text[],$6,$7,$8,$9,$10,$11, now(), true, now(), now())
         on conflict (user_id) do update set
           profession = excluded.profession,
           field = excluded.field,
           hours_free_per_week = excluded.hours_free_per_week,
           skills = excluded.skills,
           monthly_income = excluded.monthly_income,
           current_savings = excluded.current_savings,
           monthly_spending = excluded.monthly_spending,
           target_freedom_age = excluded.target_freedom_age,
           current_age = excluded.current_age,
           currency = excluded.currency,
           consent_at = coalesce(profiles.consent_at, now()),
           age_confirmed = true,
           onboarded_at = coalesce(profiles.onboarded_at, now()),
           updated_at = now()`,
        [
          user.id,
          String(input.profession ?? ""),
          String(input.field ?? ""),
          Math.round(num(input.hoursFreePerWeek)),
          skillsLiteral(Array.isArray(input.skills) ? input.skills.map(String).slice(0, 20) : []),
          num(input.monthlyIncome),
          num(input.currentSavings),
          num(input.monthlySpending),
          Math.round(num(input.targetFreedomAge)) || 45,
          Math.round(num(input.currentAge)) || 25,
          currency,
        ],
      );
      // First progress point, so "progress over time" has a starting point.
      await query(
        `insert into snapshots (user_id, savings, income, spending) values ($1,$2,$3,$4)`,
        [user.id, num(input.currentSavings), num(input.monthlyIncome), num(input.monthlySpending)],
      );
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);

/** "Update my numbers" — saves the changed figures and appends a snapshot. */
export const updateNumbersFn = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { monthlyIncome: number; currentSavings: number; monthlySpending: number };
  }): Promise<MutationResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    try {
      await ensureSchema();
      const updated = await query<{ user_id: number }>(
        `update profiles
            set monthly_income = $2, current_savings = $3, monthly_spending = $4, updated_at = now()
          where user_id = $1
          returning user_id`,
        [user.id, num(data?.monthlyIncome), num(data?.currentSavings), num(data?.monthlySpending)],
      );
      if (!updated.length) {
        return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      }
      await query(
        `insert into snapshots (user_id, savings, income, spending) values ($1,$2,$3,$4)`,
        [user.id, num(data?.currentSavings), num(data?.monthlyIncome), num(data?.monthlySpending)],
      );
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);

/* ------------------------------------------------------ side-hustle matcher */

export type HustlePageData = {
  dbConnected: boolean;
  signedIn: boolean;
  onboarded: boolean;
  profile: ProfileData | null;
  /** Keys in side_hustle_selections, oldest save first. */
  savedKeys: string[];
};

/** Profile (for the filter defaults) plus the hustles this user has saved. */
export const hustlePageFn = createServerFn().handler(async (): Promise<HustlePageData> => {
  const dbConnected = isDbConfigured();
  const user = await requireUser();
  if (!user) {
    return { dbConnected, signedIn: false, onboarded: false, profile: null, savedKeys: [] };
  }
  try {
    await ensureSchema();
    const profile = await loadProfile(user.id);
    const rows = await query<{ hustle_key: string }>(
      `select hustle_key from side_hustle_selections where user_id = $1 order by created_at asc, id asc`,
      [user.id],
    );
    return {
      dbConnected,
      signedIn: true,
      onboarded: Boolean(profile?.onboardedAt),
      profile,
      savedKeys: rows.map((row) => text(row.hustle_key)).filter(Boolean),
    };
  } catch {
    return { dbConnected, signedIn: true, onboarded: false, profile: null, savedKeys: [] };
  }
});

/** Save one hustle. Re-saving the same key is a no-op, not an error. */
export const saveHustleFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { key: string } }): Promise<MutationResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    const key = String(data?.key ?? "");
    if (!HUSTLE_BY_KEY[key]) {
      return { ok: false, reason: "unknown-hustle", message: "That hustle isn't in the list." };
    }
    try {
      await ensureSchema();
      await query(
        `insert into side_hustle_selections (user_id, hustle_key) values ($1, $2)
         on conflict (user_id, hustle_key) do nothing`,
        [user.id, key],
      );
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);

export const removeHustleFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { key: string } }): Promise<MutationResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    try {
      await ensureSchema();
      await query(`delete from side_hustle_selections where user_id = $1 and hustle_key = $2`, [
        user.id,
        String(data?.key ?? ""),
      ]);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);

/**
 * "Delete my data" — removes the user row and everything hanging off it in ONE
 * statement, so it is a single atomic transaction: if any part fails, nothing is
 * deleted. Child rows are deleted explicitly first (the CTEs) and `users` last;
 * every foreign key also cascades, so nothing can be orphaned.
 */
export const deleteAccountFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<MutationResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    try {
      await ensureSchema();
      await query(
        `with s as (delete from snapshots where user_id = $1),
              h as (delete from side_hustle_selections where user_id = $1),
              e as (delete from spending_entries where user_id = $1),
              p as (delete from profiles where user_id = $1),
              x as (delete from sessions where user_id = $1)
         delete from users where id = $1`,
        [user.id],
      );
      // The session row is gone; clear the cookie so the browser forgets it too.
      await destroySession();
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);
