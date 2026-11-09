import { createServerFn } from "@tanstack/react-start";

import { DbNotConnectedError, ensureSchema, isDbConfigured, query } from "~/db";
import {
  NO_SLIDERS,
  RETURN_DEFAULT,
  SLIDER_CAPS,
  diffScenarios,
  runScenario,
  toCheckInPence,
  toReturnPct,
  toSliderPence,
  type ScenarioBase,
  type ScenarioDelta,
  type ScenarioNumbers,
  type Sliders,
} from "~/lib/scenario";
import { getSessionUser, type SessionUser } from "./auth";

/**
 * Weekly check-in + what-if sliders — the server layer.
 *
 * EVERY number these functions return is worked out here, from rows the user
 * typed in. The browser sends slider positions or an amount; it never does the
 * arithmetic itself, and nothing it sends is trusted: each amount is re-validated
 * as integer pence and clamped before it is used or stored.
 *
 * Two rules hold throughout:
 *  1. The what-if preview NEVER writes. Moving a slider runs a read-only query and
 *     returns numbers; the profile row is byte-identical until "Keep this" is
 *     pressed.
 *  2. Everything is an illustration of the user's own assumptions — never a
 *     prediction and never advice.
 */

/* --------------------------------------------------------------------- types */

type ProfileRow = {
  current_savings: unknown;
  monthly_income: unknown;
  monthly_spending: unknown;
  extra_monthly_saving: unknown;
  family_support_monthly: unknown;
  current_age: unknown;
  target_freedom_age: unknown;
  currency: unknown;
};

export type CheckInResult =
  | {
      ok: true;
      /** Pence added to the balance by this check-in (0 for "Not this week"). */
      amountPence: number;
      /** The balance on file after the check-in, in pence. */
      savingsPence: number;
      /** How many snapshot rows the user now has. */
      snapshotCount: number;
      /** The estimate after the check-in — the same maths the dashboard shows. */
      estimate: ScenarioNumbers;
      currency: string;
    }
  | { ok: false; reason: string; message: string };

export type PreviewResult =
  | {
      ok: true;
      /** The validated slider positions actually used, in pence. */
      sliders: Sliders;
      /** The user's stored position with no sliders applied. */
      current: ScenarioNumbers;
      /** The preview with the sliders applied. Nothing has been saved. */
      estimate: ScenarioNumbers;
      /** estimate − current, worked out here so the browser only formats numbers. */
      delta: ScenarioDelta;
      currency: string;
      targetAge: number;
    }
  | { ok: false; reason: string; message: string };

export type ApplyResult =
  | {
      ok: true;
      sliders: Sliders;
      /** The estimate now stored on the profile. */
      estimate: ScenarioNumbers;
      snapshotCount: number;
      currency: string;
    }
  | { ok: false; reason: string; message: string };

type SliderInput = {
  saveMorePence?: number;
  sideHustlePence?: number;
  cutSpendingPence?: number;
  familySupportPence?: number;
  annualReturnPct?: number;
};

/* ------------------------------------------------------------------- helpers */

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

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

/** The stored position, straight from the profile row. Read-only. */
async function loadBase(userId: number): Promise<{ base: ScenarioBase; currency: string } | null> {
  const rows = await query<ProfileRow>(
    `select current_savings, monthly_income, monthly_spending, extra_monthly_saving,
            family_support_monthly, current_age, target_freedom_age, currency
       from profiles where user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;
  return { base: baseFromRow(row), currency: text(row.currency) || "GBP" };
}

function baseFromRow(row: ProfileRow): ScenarioBase {
  return {
    currentAge: num(row.current_age) || 25,
    targetAge: num(row.target_freedom_age) || 45,
    currentSavingsPence: Math.round(num(row.current_savings) * 100),
    monthlyIncomePence: Math.round(num(row.monthly_income) * 100),
    monthlySpendingPence: Math.round(num(row.monthly_spending) * 100),
    extraMonthlySavingPence: Math.round(num(row.extra_monthly_saving) * 100),
    familySupportPence: Math.round(num(row.family_support_monthly) * 100),
  };
}

/** Every slider, re-validated on the server. Nothing from the browser is trusted. */
function validateSliders(data: SliderInput | undefined): Sliders {
  return {
    saveMorePence: toSliderPence(data?.saveMorePence, SLIDER_CAPS.saveMorePence),
    sideHustlePence: toSliderPence(data?.sideHustlePence, SLIDER_CAPS.sideHustlePence),
    cutSpendingPence: toSliderPence(data?.cutSpendingPence, SLIDER_CAPS.cutSpendingPence),
    familySupportPence: toSliderPence(data?.familySupportPence, SLIDER_CAPS.familySupportPence),
  };
}

async function snapshotCount(userId: number): Promise<number> {
  const rows = await query<{ n: number }>(`select count(*)::int as n from snapshots where user_id = $1`, [
    userId,
  ]);
  return num(rows[0]?.n);
}

/* --------------------------------------------------------- weekly check-in */

/**
 * "Did you save this week?" — one tap.
 *
 * Adds the amount to the balance, writes it as a snapshot row through the same
 * mechanism "Update my numbers" uses, and returns the re-priced estimate so the
 * card can show the new date straight away. "Not this week" records a check-in
 * with nothing added, so the card never nags and nothing is invented.
 */
export const weeklyCheckInFn = createServerFn({ method: "POST" })
  .inputValidator((data: { amountPence?: number | string; notThisWeek?: boolean }) => data)
  .handler(async ({ data }): Promise<CheckInResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };

    const notThisWeek = data?.notThisWeek === true;
    const amountPence = notThisWeek ? 0 : toCheckInPence(data?.amountPence);
    if (!notThisWeek && amountPence <= 0) {
      return {
        ok: false,
        reason: "amount",
        message: "Enter how much you saved, or tap “Not this week”.",
      };
    }

    try {
      await ensureSchema();
      const updated = await query<ProfileRow>(
        `update profiles
            set current_savings = coalesce(current_savings, 0) + $2, updated_at = now()
          where user_id = $1
          returning current_savings, monthly_income, monthly_spending, extra_monthly_saving,
                    family_support_monthly, current_age, target_freedom_age, currency`,
        [user.id, amountPence / 100],
      );
      const row = updated[0];
      if (!row) {
        return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      }
      await query(
        `insert into snapshots (user_id, savings, income, spending) values ($1,$2,$3,$4)`,
        [user.id, num(row.current_savings), num(row.monthly_income), num(row.monthly_spending)],
      );
      const base = baseFromRow(row);
      return {
        ok: true,
        amountPence,
        savingsPence: base.currentSavingsPence,
        snapshotCount: await snapshotCount(user.id),
        estimate: runScenario(base, NO_SLIDERS, RETURN_DEFAULT),
        currency: text(row.currency) || "GBP",
      };
    } catch (error) {
      return failure(error);
    }
  });

/* ------------------------------------------------------------ what-if preview */

/**
 * Re-price the estimate with the sliders moved — READ ONLY.
 *
 * It runs a single `select` and returns numbers. No insert, no update: the stored
 * profile row is untouched until the user presses "Keep this".
 */
export const scenarioPreviewFn = createServerFn({ method: "POST" })
  .inputValidator((data: SliderInput) => data)
  .handler(async ({ data }): Promise<PreviewResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    const sliders = validateSliders(data);
    const rate = toReturnPct(data?.annualReturnPct ?? RETURN_DEFAULT);
    try {
      if (!isDbConfigured()) throw new DbNotConnectedError();
      const loaded = await loadBase(user.id);
      if (!loaded) {
        return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      }
      const current = runScenario(loaded.base, NO_SLIDERS, rate);
      const estimate = runScenario(loaded.base, sliders, rate);
      return {
        ok: true,
        sliders,
        current,
        estimate,
        delta: diffScenarios(current, estimate),
        currency: loaded.currency,
        targetAge: loaded.base.targetAge,
      };
    } catch (error) {
      return failure(error);
    }
  });

/**
 * "Keep this" — the only place a scenario is written.
 *
 * Side-hustle income is folded into money in, the spending cut into money out, and
 * the two commitments the profile has columns for (extra saving, family support)
 * are stored as they are. A snapshot is appended so the trend records the change.
 */
export const applyScenarioFn = createServerFn({ method: "POST" })
  .inputValidator((data: SliderInput) => data)
  .handler(async ({ data }): Promise<ApplyResult> => {
    const user = await requireUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    const sliders = validateSliders(data);
    try {
      await ensureSchema();
      const updated = await query<ProfileRow>(
        `update profiles
            set monthly_income = coalesce(monthly_income, 0) + $2,
                monthly_spending = greatest(0, coalesce(monthly_spending, 0) - $3),
                extra_monthly_saving = $4,
                family_support_monthly = $5,
                updated_at = now()
          where user_id = $1
          returning current_savings, monthly_income, monthly_spending, extra_monthly_saving,
                    family_support_monthly, current_age, target_freedom_age, currency`,
        [
          user.id,
          sliders.sideHustlePence / 100,
          sliders.cutSpendingPence / 100,
          sliders.saveMorePence / 100,
          sliders.familySupportPence / 100,
        ],
      );
      const row = updated[0];
      if (!row) {
        return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      }
      await query(
        `insert into snapshots (user_id, savings, income, spending) values ($1,$2,$3,$4)`,
        [user.id, num(row.current_savings), num(row.monthly_income), num(row.monthly_spending)],
      );
      const base = baseFromRow(row);
      return {
        ok: true,
        sliders,
        estimate: runScenario(base, NO_SLIDERS, RETURN_DEFAULT),
        snapshotCount: await snapshotCount(user.id),
        currency: text(row.currency) || "GBP",
      };
    } catch (error) {
      return failure(error);
    }
  });
