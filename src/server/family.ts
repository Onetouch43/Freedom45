import { createServerFn } from "@tanstack/react-start";

import { DbNotConnectedError, ensureSchema, isDbConfigured, query } from "~/db";
import {
  FAMILY_CAPS,
  NO_SLIDERS,
  RETURN_DEFAULT,
  SLIDER_CAPS,
  familyGapYears,
  hasHousehold,
  householdBase,
  runScenario,
  spendingFromLogs,
  toChildCount,
  toSliderPence,
  type Household,
  type ScenarioBase,
  type ScenarioNumbers,
} from "~/lib/scenario";
import { getSessionUser } from "./auth";

/**
 * Family Mode — Personal FI beside Family FI, worked out entirely here.
 *
 * The browser sends the household the user typed in; this module re-validates every
 * figure as integer pence, clamps it, and prices BOTH dates with the same projection
 * maths the dashboard uses (`runScenario` → `project`). Nothing is invented: a blank
 * field means "not counted", and a child only ever costs the figure the user typed.
 *
 * Personal FI is the user's own position exactly as the dashboard prices it — the
 * same logs-aware spending figure, the same extra saving and family support. Adding
 * a partner or children can therefore move Family FI and leave Personal FI alone.
 *
 * Everything is an illustration of the user's own assumptions. Not advice.
 */

/* --------------------------------------------------------------------- types */

type ProfileRow = {
  monthly_income: unknown;
  monthly_spending: unknown;
  current_savings: unknown;
  extra_monthly_saving: unknown;
  family_support_monthly: unknown;
  current_age: unknown;
  target_freedom_age: unknown;
  currency: unknown;
  onboarded_at: unknown;
  partner_included: unknown;
  partner_income_monthly: unknown;
  partner_contribution_monthly: unknown;
  partner_savings: unknown;
  children_count: unknown;
  child_cost_monthly: unknown;
};

export type FamilyNumbers = {
  /** The user's own figures only — identical to the dashboard's Personal FI. */
  personal: ScenarioNumbers;
  /** The household's figures, or null when no partner and no children are set. */
  family: ScenarioNumbers | null;
  /** Family FI age minus Personal FI age, one decimal. Negative = household lands sooner. */
  gapYears: number | null;
  /** The household exactly as stored, in integer pence. */
  household: Household & { familySupportPence: number };
  /** The spending figure Personal FI is built on, and where it came from. */
  mySpendingPence: number;
  spendingBasis: "logs" | "profile";
  extraSavingPence: number;
  currentAge: number;
  targetAge: number;
  /** The one return assumption both dates use (the dashboard's default). */
  returnPct: number;
  currency: string;
};

export type FamilyPageData =
  | ({ ok: true; signedIn: boolean; onboarded: boolean; dbConnected: boolean } & FamilyNumbers)
  | { ok: false; reason: string; message: string };

export type FamilySaveInput = {
  partnerIncluded?: boolean;
  partnerIncomePence?: number | string;
  partnerContributionPence?: number | string;
  partnerSavingsPence?: number | string;
  childrenCount?: number | string;
  childCostPence?: number | string;
  familySupportPence?: number | string;
};

/* ------------------------------------------------------------------- helpers */

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown): string => (value === null || value === undefined ? "" : String(value));

function failure(error: unknown): FamilyPageData {
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

const PROFILE_COLUMNS = `monthly_income, monthly_spending, current_savings, extra_monthly_saving,
            family_support_monthly, current_age, target_freedom_age, currency, onboarded_at,
            partner_included, partner_income_monthly, partner_contribution_monthly,
            partner_savings, children_count, child_cost_monthly`;

function householdFromRow(row: ProfileRow): Household & { familySupportPence: number } {
  return {
    partnerIncluded: row.partner_included === true || row.partner_included === "t",
    partnerIncomePence: Math.round(num(row.partner_income_monthly) * 100),
    partnerContributionPence: Math.round(num(row.partner_contribution_monthly) * 100),
    partnerSavingsPence: Math.round(num(row.partner_savings) * 100),
    childrenCount: toChildCount(row.children_count),
    childCostPence: Math.round(num(row.child_cost_monthly) * 100),
    familySupportPence: Math.round(num(row.family_support_monthly) * 100),
  };
}

/** Every Family Mode field, re-validated here. Nothing from the browser is trusted. */
function validateHousehold(data: FamilySaveInput | undefined): Household & { familySupportPence: number } {
  return {
    partnerIncluded: data?.partnerIncluded === true,
    partnerIncomePence: toSliderPence(data?.partnerIncomePence, FAMILY_CAPS.partnerIncomePence),
    partnerContributionPence: toSliderPence(
      data?.partnerContributionPence,
      FAMILY_CAPS.partnerContributionPence,
    ),
    partnerSavingsPence: toSliderPence(data?.partnerSavingsPence, FAMILY_CAPS.partnerSavingsPence),
    childrenCount: toChildCount(data?.childrenCount),
    childCostPence: toSliderPence(data?.childCostPence, FAMILY_CAPS.childCostPence),
    familySupportPence: toSliderPence(data?.familySupportPence, SLIDER_CAPS.familySupportPence),
  };
}

async function loadSpendTotals(
  userId: number,
): Promise<{ monthSpentPence: number; spendCount: number }> {
  const rows = await query<{ month_pence: unknown; n: unknown }>(
    `select coalesce(sum(amount_pence) filter (
              where spent_at >= date_trunc('month', current_date)::date and spent_at <= current_date
            ), 0) as month_pence,
            count(*) as n
       from spending_logs where user_id = $1`,
    [userId],
  );
  const row = rows[0] ?? { month_pence: 0, n: 0 };
  return { monthSpentPence: Math.round(num(row.month_pence)), spendCount: num(row.n) };
}

/** Read the profile and price both dates from it. Shared by the page and the save. */
async function priceFamily(userId: number): Promise<FamilyNumbers | null> {
  const rows = await query<ProfileRow>(
    `select ${PROFILE_COLUMNS} from profiles where user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (!row) return null;

  const totals = await loadSpendTotals(userId);
  const { spending, basis } = spendingFromLogs(
    totals.monthSpentPence,
    totals.spendCount,
    num(row.monthly_spending),
  );

  const currentAge = num(row.current_age) || 25;
  const targetAge = num(row.target_freedom_age) || 45;
  const base: ScenarioBase = {
    currentAge,
    targetAge,
    currentSavingsPence: Math.round(num(row.current_savings) * 100),
    monthlyIncomePence: Math.round(num(row.monthly_income) * 100),
    monthlySpendingPence: Math.round(spending * 100),
    extraMonthlySavingPence: Math.round(num(row.extra_monthly_saving) * 100),
    familySupportPence: Math.round(num(row.family_support_monthly) * 100),
  };

  const personal = runScenario(base, NO_SLIDERS, RETURN_DEFAULT);
  const household = householdFromRow(row);
  const family = hasHousehold(household)
    ? runScenario(householdBase(base, household), NO_SLIDERS, RETURN_DEFAULT)
    : null;

  return {
    personal,
    family,
    gapYears: family ? familyGapYears(personal, family) : null,
    household,
    mySpendingPence: base.monthlySpendingPence,
    spendingBasis: basis,
    extraSavingPence: base.extraMonthlySavingPence,
    currentAge,
    targetAge,
    returnPct: RETURN_DEFAULT,
    currency: text(row.currency) || "GBP",
  };
}

/* -------------------------------------------------------- server functions */

/** Everything /family shows: both estimates, the gap, and the stored household. */
export const familyPageFn = createServerFn().handler(async (): Promise<FamilyPageData> => {
  const dbConnected = isDbConfigured();
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, reason: "signed-out", message: "Please log in again." };
  }
  try {
    await ensureSchema();
    const numbers = await priceFamily(user.id);
    if (!numbers) return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
    const rows = await query<{ onboarded_at: unknown }>(
      `select onboarded_at from profiles where user_id = $1`,
      [user.id],
    );
    return {
      ok: true,
      signedIn: true,
      onboarded: Boolean(rows[0]?.onboarded_at),
      dbConnected,
      ...numbers,
    };
  } catch (error) {
    return failure(error);
  }
});

/**
 * Save the household and re-price both dates.
 *
 * The only write Family Mode makes. Every field is optional: clearing them puts the
 * household back to "not counted", which restores the Personal FI position and hides
 * the Family FI card rather than showing an invented one.
 */
export const saveFamilyFn = createServerFn({ method: "POST" })
  .inputValidator((data: FamilySaveInput) => data)
  .handler(async ({ data }): Promise<FamilyPageData> => {
    const user = await getSessionUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };
    const household = validateHousehold(data);
    try {
      await ensureSchema();
      const updated = await query<{ user_id: number }>(
        `update profiles
            set partner_included = $2,
                partner_income_monthly = $3,
                partner_contribution_monthly = $4,
                partner_savings = $5,
                children_count = $6,
                child_cost_monthly = $7,
                family_support_monthly = $8,
                updated_at = now()
          where user_id = $1
          returning user_id`,
        [
          user.id,
          household.partnerIncluded,
          household.partnerIncomePence / 100,
          household.partnerContributionPence / 100,
          household.partnerSavingsPence / 100,
          household.childrenCount,
          household.childCostPence / 100,
          household.familySupportPence / 100,
        ],
      );
      if (!updated.length) {
        return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      }
      const numbers = await priceFamily(user.id);
      if (!numbers) return { ok: false, reason: "no-profile", message: "Finish onboarding first." };
      return {
        ok: true,
        signedIn: true,
        onboarded: true,
        dbConnected: isDbConfigured(),
        ...numbers,
      };
    } catch (error) {
      return failure(error);
    }
  });
