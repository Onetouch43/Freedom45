import { createServerFn } from "@tanstack/react-start";

import { DbNotConnectedError, ensureSchema, isDbConfigured, query } from "~/db";
import {
  budgetFromProfile,
  buildInsight,
  groupFor,
  isCategory,
  isPaymentMethod,
  pounds,
  todayIso,
  toPence,
  type SpendAlert,
  type SpendRow,
  type WeekTotals,
} from "~/lib/spending";
import { getSessionUser, type SessionUser } from "./auth";

/**
 * The Spending Tracker's server layer.
 *
 * Every number the /spending screen shows is derived here from rows the user
 * typed in — nothing is estimated, sampled or invented, and no money figure is
 * trusted from the browser. Amounts are INTEGER PENCE throughout.
 *
 * Alerts are INFORMATION about the user's own logged rows. They are not advice
 * and they never tell anyone what to do.
 */

/** How many recent spends the page lists. */
const LIST_LIMIT = 20;
/** Longest note we keep — capped server-side so nothing huge is stored. */
const NOTE_MAX = 120;
/** Monthly budget alert fires once this share of the month's budget is used. */
const BUDGET_ALERT_AT = 0.8;
/** Habit alert: the same category logged this many times… */
const HABIT_COUNT = 3;
/** …inside this many hours. */
const HABIT_HOURS = 24;

/* --------------------------------------------------------------------- types */

export type SpendingPageData = {
  dbConnected: boolean;
  signedIn: boolean;
  onboarded: boolean;
  currency: string;
  spends: SpendRow[];
  month: {
    /** Everything logged with a spent_at inside this calendar month. */
    spentPence: number;
    /** What is left of this month's income after that spending (never negative). */
    savedPence: number;
    incomePence: number;
    /** income × (1 − savings rate). Null when there is no income on file. */
    budgetPence: number | null;
    /** Share of the budget used, 0–∞. Null when there is no budget. */
    usedPct: number | null;
    daysElapsed: number;
    daysInMonth: number;
  };
  /** One plain sentence comparing this week with last, or null if there's nothing to compare. */
  insight: string | null;
  alerts: SpendAlert[];
  /** True when the profile has no income, so no budget can honestly be derived. */
  needsIncome: boolean;
  /** The user's stated monthly spending from onboarding, in pence (context only). */
  statedMonthlySpendPence: number;
};

export type AddSpendInput = {
  /** Pounds and pence as typed, e.g. "4.20" or 4.2. Converted to integer pence. */
  amount: string | number;
  category: string;
  paymentMethod: string;
  note?: string;
  /** YYYY-MM-DD; defaults to today. */
  spentAt?: string;
};

export type AddSpendResult =
  | { ok: true; id: number }
  | { ok: false; reason: string; message: string };

/* ------------------------------------------------------------------- helpers */

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function failure(error: unknown): { ok: false; reason: string; message: string } {
  if (error instanceof DbNotConnectedError) {
    return {
      ok: false,
      reason: "db-not-connected",
      message: "The database isn't connected yet, so this can't be saved.",
    };
  }
  return {
    ok: false,
    reason: "error",
    message: error instanceof Error ? error.message : "Something went wrong.",
  };
}

async function requireUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}

/* ------------------------------------------------------------ page assembly */

type ProfileBits = {
  monthlyIncomePence: number;
  statedMonthlySpendPence: number;
  onboarded: boolean;
  currency: string;
};

async function loadProfileBits(userId: number): Promise<ProfileBits> {
  const rows = await query<Record<string, unknown>>(
    `select monthly_income, monthly_spending, onboarded_at, currency
       from profiles where user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) {
    return { monthlyIncomePence: 0, statedMonthlySpendPence: 0, onboarded: false, currency: "GBP" };
  }
  return {
    monthlyIncomePence: Math.round(num(row.monthly_income) * 100),
    statedMonthlySpendPence: Math.round(num(row.monthly_spending) * 100),
    onboarded: Boolean(row.onboarded_at),
    currency: text(row.currency) || "GBP",
  };
}

async function weekByCategory(
  userId: number,
  fromDaysAgo: number,
  toDaysAgo: number,
): Promise<WeekTotals> {
  const rows = await query<Record<string, unknown>>(
    `select category, coalesce(sum(amount_pence), 0) as pence
       from spending_logs
      where user_id = $1
        and spent_at between current_date - $2::int and current_date - $3::int
      group by category`,
    [userId, fromDaysAgo, toDaysAgo],
  );
  const map: WeekTotals = new Map();
  for (const row of rows) map.set(text(row.category), Math.round(num(row.pence)));
  return map;
}

async function habitAlert(userId: number): Promise<SpendAlert | null> {
  const rows = await query<Record<string, unknown>>(
    `select category, count(*) as n
       from spending_logs
      where user_id = $1 and created_at >= now() - ($2::int * interval '1 hour')
      group by category
      having count(*) >= $3::int
      order by count(*) desc
      limit 1`,
    [userId, HABIT_HOURS, HABIT_COUNT],
  );
  const row = rows[0];
  if (!row) return null;
  const category = text(row.category);
  const count = Math.round(num(row.n));
  return {
    kind: "habit",
    title: `${count} ${category} spends in the last ${HABIT_HOURS} hours`,
    body: "That's a pattern in your own log, not a judgement — and information only, never advice.",
  };
}

/** Everything the /spending page renders, in one round trip. */
export const spendingPageFn = createServerFn().handler(async (): Promise<SpendingPageData> => {
  const dbConnected = isDbConfigured();
  const empty: SpendingPageData = {
    dbConnected,
    signedIn: false,
    onboarded: false,
    currency: "GBP",
    spends: [],
    month: {
      spentPence: 0,
      savedPence: 0,
      incomePence: 0,
      budgetPence: null,
      usedPct: null,
      daysElapsed: 1,
      daysInMonth: 30,
    },
    insight: null,
    alerts: [],
    needsIncome: false,
    statedMonthlySpendPence: 0,
  };

  const user = await requireUser();
  if (!user) return empty;

  try {
    await ensureSchema();
    const profile = await loadProfileBits(user.id);

    const clockRows = await query<Record<string, unknown>>(
      `select current_date::text as today,
              extract(day from current_date)::int as days_elapsed,
              extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int as days_in_month`,
    );
    const clock = clockRows[0] ?? {};
    const today = text(clock.today).slice(0, 10) || todayIso();
    const daysElapsed = Math.max(1, Math.round(num(clock.days_elapsed)) || 1);
    const daysInMonth = Math.max(28, Math.round(num(clock.days_in_month)) || 30);

    const spendRows = await query<Record<string, unknown>>(
      `select id, amount_pence, category, payment_method, note, spent_at::text as spent_at
         from spending_logs
        where user_id = $1
        order by spent_at desc, id desc
        limit ${LIST_LIMIT}`,
      [user.id],
    );

    const spends: SpendRow[] = spendRows.map((row) => {
      const spentAt = text(row.spent_at).slice(0, 10);
      const category = text(row.category);
      const method = text(row.payment_method);
      return {
        id: Math.round(num(row.id)),
        amountPence: Math.round(num(row.amount_pence)),
        category: isCategory(category) ? category : "Other",
        paymentMethod: isPaymentMethod(method) ? method : "card",
        note: text(row.note),
        spentAt,
        group: groupFor(spentAt, today),
      };
    });

    const monthRows = await query<Record<string, unknown>>(
      `select coalesce(sum(amount_pence), 0) as pence
         from spending_logs
        where user_id = $1
          and spent_at >= date_trunc('month', current_date)::date
          and spent_at <= current_date`,
      [user.id],
    );
    const spentPence = Math.round(num(monthRows[0]?.pence));
    const incomePence = profile.monthlyIncomePence;
    const budgetPence = budgetFromProfile(incomePence, profile.statedMonthlySpendPence);
    const usedPct = budgetPence ? (spentPence / budgetPence) * 100 : null;

    const alerts: SpendAlert[] = [];
    if (budgetPence && usedPct !== null && usedPct >= BUDGET_ALERT_AT * 100) {
      alerts.push({
        kind: "budget",
        title: `You've used ${Math.round(usedPct)}% of this month's budget`,
        body: `${pounds(spentPence)} of the ${pounds(
          budgetPence,
        )} your own numbers allow for this month, with ${daysInMonth - daysElapsed} day${
          daysInMonth - daysElapsed === 1 ? "" : "s"
        } to go. Information only — not advice.`,
      });
    }
    const habit = await habitAlert(user.id);
    if (habit) alerts.push(habit);

    const last7 = await weekByCategory(user.id, 6, 0);
    const prev7 = await weekByCategory(user.id, 13, 7);

    return {
      dbConnected,
      signedIn: true,
      onboarded: profile.onboarded,
      currency: profile.currency,
      spends,
      month: {
        spentPence,
        savedPence: Math.max(0, incomePence - spentPence),
        incomePence,
        budgetPence,
        usedPct,
        daysElapsed,
        daysInMonth,
      },
      insight: buildInsight(last7, prev7),
      alerts,
      needsIncome: budgetPence === null,
      statedMonthlySpendPence: profile.statedMonthlySpendPence,
    };
  } catch {
    return empty;
  }
});

/* ---------------------------------------------------------------- mutations */

/** Log one spend. Validated here — the browser's values are never trusted. */
export const addSpendFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: AddSpendInput }): Promise<AddSpendResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };

    const amountPence = toPence(data?.amount ?? "");
    if (amountPence === null) {
      return { ok: false, reason: "amount", message: "Enter an amount above £0, like 4.20." };
    }
    if (amountPence > 10_000_000) {
      return { ok: false, reason: "amount", message: "That's over £100,000 — please check the amount." };
    }
    const category = String(data?.category ?? "");
    if (!isCategory(category)) {
      return { ok: false, reason: "category", message: "Pick a category from the list." };
    }
    const paymentMethod = String(data?.paymentMethod ?? "");
    if (!isPaymentMethod(paymentMethod)) {
      return { ok: false, reason: "payment-method", message: "Choose cash or card." };
    }
    const note = String(data?.note ?? "").slice(0, NOTE_MAX).trim();
    const spentAt = String(data?.spentAt ?? "").trim() || todayIso();
    if (!ISO_DATE.test(spentAt)) {
      return { ok: false, reason: "date", message: "That date doesn't look right." };
    }
    if (spentAt > todayIso()) {
      return { ok: false, reason: "date", message: "You can't log a spend in the future." };
    }

    try {
      await ensureSchema();
      const rows = await query<{ id: number }>(
        `insert into spending_logs (user_id, amount_pence, category, payment_method, note, spent_at)
         values ($1, $2, $3, $4, $5, $6::date)
         returning id`,
        [user.id, amountPence, category, paymentMethod, note || null, spentAt],
      );
      return { ok: true, id: Math.round(num(rows[0]?.id)) };
    } catch (error) {
      return failure(error);
    }
  },
);

/** Remove one of the user's own spends — the WHERE pins the owner, so nothing else can go. */
export const deleteSpendFn = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { id: number };
  }): Promise<{ ok: true } | { ok: false; reason: string; message: string }> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    try {
      await ensureSchema();
      await query(`delete from spending_logs where id = $1 and user_id = $2`, [
        Math.round(num(data?.id)),
        user.id,
      ]);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
);
