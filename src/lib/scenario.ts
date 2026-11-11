/**
 * Weekly check-in + what-if scenario maths — pure helpers, no DB and no framework.
 *
 * Everything here is an ILLUSTRATION built from the numbers the user typed in. It
 * is not a prediction and never financial advice.
 *
 * Money is INTEGER PENCE at the boundary (what the browser sends, what the server
 * validates) and converted to pounds only where the shared projection maths works
 * in pounds. Every money figure this module returns is pence.
 */

import { project } from "./projection";

/* -------------------------------------------------------------------- limits */

/** How many pence of any slider the server will accept, per slider. */
export const SLIDER_CAPS = {
  saveMorePence: 100_000, // £1,000 a month
  sideHustlePence: 200_000, // £2,000 a month
  cutSpendingPence: 100_000, // £1,000 a month
  familySupportPence: 200_000, // £2,000 a month
} as const;

/** The largest single weekly check-in the server will store (£5,000). */
export const CHECKIN_MAX_PENCE = 500_000;

/** A month is 4.33 weeks on average — used to turn a monthly figure into a weekly one. */
export const WEEKS_PER_MONTH = 4.33;

/** Return assumptions the illustration is allowed to use (the chart's 3–7% range). */
export const RETURN_MIN = 3;
export const RETURN_MAX = 7;
export const RETURN_DEFAULT = 5;

/* --------------------------------------------------------------------- types */

export type Sliders = {
  saveMorePence: number;
  sideHustlePence: number;
  cutSpendingPence: number;
  familySupportPence: number;
};

export const NO_SLIDERS: Sliders = {
  saveMorePence: 0,
  sideHustlePence: 0,
  cutSpendingPence: 0,
  familySupportPence: 0,
};

/** The user's stored position, in pence, as read from the database. */
export type ScenarioBase = {
  currentAge: number;
  targetAge: number;
  currentSavingsPence: number;
  monthlyIncomePence: number;
  monthlySpendingPence: number;
  /** Money the user has committed to put by each month (stored on the profile). */
  extraMonthlySavingPence: number;
  /** Money the user sends to family each month (stored on the profile). */
  familySupportPence: number;
};

/** Every number the results panel shows. All money is integer pence. */
export type ScenarioNumbers = {
  /** Estimated age the balance first covers the freedom number, or null if it never does. */
  fiAge: number | null;
  /** 25 × a year of spending, in pence. */
  fiNumberPence: number;
  /** How far the balance already is towards the freedom number, 0–100, one decimal. */
  progressPct: number;
  /** Pence a month short of the pace that reaches the target age (0 when already there). */
  monthlyGapPence: number;
  /** Money left over each month under this scenario (negative means spending outruns income). */
  monthlySurplusPence: number;
  /** Money coming in each month, including side-hustle income and extra saving. */
  effectiveIncomePence: number;
  /** Money going out each month, including family support. */
  effectiveSpendingPence: number;
};

/* ------------------------------------------------------------------ validate */

/**
 * Turn anything the browser sent into a usable integer-pence slider value.
 * Never negative, never above the cap, never a fraction, never NaN.
 */
export function toSliderPence(value: unknown, cap: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(cap, Math.max(0, Math.round(parsed)));
}

/** Same idea for a single check-in amount: integer pence, 0…CHECKIN_MAX_PENCE. */
export function toCheckInPence(value: unknown): number {
  return toSliderPence(value, CHECKIN_MAX_PENCE);
}

/** Clamp the return assumption into the range the chart offers. */
export function toReturnPct(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return RETURN_DEFAULT;
  return Math.min(RETURN_MAX, Math.max(RETURN_MIN, parsed));
}

/* ------------------------------------------------------------------- maths */

/**
 * The monthly contribution that would grow `presentPence` to `futurePence` in
 * `months` months at `monthlyRate`. Standard future-value-of-an-annuity, solved
 * for the payment. 0 when the balance is already there.
 */
export function requiredMonthlyPence(
  presentPence: number,
  futurePence: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0 || futurePence <= presentPence) return 0;
  const rate = Math.max(0, monthlyRate);
  const growth = Math.pow(1 + rate, months);
  const payment =
    rate === 0
      ? (futurePence - presentPence) / months
      : (futurePence - presentPence * growth) * (rate / (growth - 1));
  return Math.max(0, Math.round(payment));
}

/**
 * Run one scenario. The four sliders are PREVIEW ONLY: they are added to the
 * user's stored position here and never written anywhere.
 *
 * - save more → extra money put by each month (adds to what is left over)
 * - side hustle → extra money coming in (adds to what is left over)
 * - cut spending → lower spending, which lowers the freedom number as well
 * - family support → money that has to go out each month, so the target rises too
 */
export function runScenario(
  base: ScenarioBase,
  sliders: Sliders,
  annualReturnPct: number = RETURN_DEFAULT,
): ScenarioNumbers {
  const incomePence = base.monthlyIncomePence + sliders.sideHustlePence;
  const extraPence = base.extraMonthlySavingPence + sliders.saveMorePence;
  const spendingPence =
    Math.max(0, base.monthlySpendingPence - sliders.cutSpendingPence) +
    base.familySupportPence +
    sliders.familySupportPence;

  const result = project({
    currentAge: base.currentAge,
    targetAge: base.targetAge,
    currentSavings: base.currentSavingsPence / 100,
    // Extra saving is money that does not get spent, so it is added to what comes
    // in for the purpose of the monthly surplus — the income figure the user typed
    // is still reported separately.
    monthlyIncome: (incomePence + extraPence) / 100,
    monthlySpending: spendingPence / 100,
    annualReturnPct: toReturnPct(annualReturnPct),
  });

  const fiNumberPence = Math.round(result.fiNumber * 100);
  const surplusPence = Math.round(result.monthlySurplus * 100);
  const monthsToTarget = Math.max(
    1,
    Math.round((Math.max(base.targetAge, base.currentAge) - base.currentAge) * 12),
  );
  const neededPence = requiredMonthlyPence(
    base.currentSavingsPence,
    fiNumberPence,
    toReturnPct(annualReturnPct) / 100 / 12,
    monthsToTarget,
  );

  return {
    fiAge: result.fiAge,
    fiNumberPence,
    progressPct:
      fiNumberPence > 0
        ? Math.min(100, Math.round((base.currentSavingsPence / fiNumberPence) * 1000) / 10)
        : 0,
    monthlyGapPence: Math.max(0, neededPence - surplusPence),
    monthlySurplusPence: surplusPence,
    effectiveIncomePence: incomePence + extraPence,
    effectiveSpendingPence: spendingPence,
  };
}

/* ------------------------------------------------------------ spending basis */

/**
 * The spending figure the estimate is built on.
 *
 * Month-to-date pence from the Spending Tracker is scaled to a full month, and the
 * larger of that rate and the number stored on the profile is used — so one coffee
 * logged on the 1st can never flatter the estimated date. With nothing logged, the
 * profile number is used unchanged. Shared by the dashboard and Family Mode so the
 * Personal FI number is the same on both.
 */
export function spendingFromLogs(
  monthSpentPence: number,
  spendCount: number,
  storedSpending: number,
  now: Date = new Date(),
): { spending: number; basis: "logs" | "profile" } {
  const daysElapsed = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const rateFromLogs =
    spendCount > 0 ? Math.round((monthSpentPence / daysElapsed) * daysInMonth) / 100 : 0;
  return {
    spending: rateFromLogs > 0 ? Math.max(rateFromLogs, storedSpending) : storedSpending,
    basis: spendCount > 0 && rateFromLogs > storedSpending ? "logs" : "profile",
  };
}

/* ---------------------------------------------------------------- family mode */

/** The household a user describes on /family. Every money field is integer pence. */
export type Household = {
  partnerIncluded: boolean;
  partnerIncomePence: number;
  /** What the partner puts toward the household's monthly costs. */
  partnerContributionPence: number;
  partnerSavingsPence: number;
  childrenCount: number;
  /** Cost per child each month — TYPED IN by the user, never invented. */
  childCostPence: number;
};

export const NO_HOUSEHOLD: Household = {
  partnerIncluded: false,
  partnerIncomePence: 0,
  partnerContributionPence: 0,
  partnerSavingsPence: 0,
  childrenCount: 0,
  childCostPence: 0,
};

/** What the server will accept for each Family Mode field. */
export const FAMILY_CAPS = {
  partnerIncomePence: 1_000_000, // £10,000 a month
  partnerContributionPence: 1_000_000, // £10,000 a month
  partnerSavingsPence: 10_000_000, // £100,000
  childCostPence: 500_000, // £5,000 a month per child
  childrenMax: 10,
} as const;

/** Whole number of children, 0…FAMILY_CAPS.childrenMax, never NaN. */
export function toChildCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(FAMILY_CAPS.childrenMax, Math.max(0, Math.round(parsed)));
}

/** True when the user has described a household worth pricing. */
export function hasHousehold(household: Household): boolean {
  return household.partnerIncluded || household.childrenCount > 0;
}

/**
 * The household's position, derived from the user's own stored position.
 *
 * - Money in: the user's income plus the partner's income (and the extra saving the
 *   user already committed, which `runScenario` adds).
 * - Money out: the user's spending, less what the partner puts toward those costs
 *   (so a shared cost is not counted twice), plus every child's typed monthly cost,
 *   plus the existing family support.
 * - Savings: the user's own balance plus the partner's.
 *
 * Nothing here is a claim about what a household or a child costs — every figure
 * comes from something the user typed.
 */
export function householdBase(base: ScenarioBase, household: Household): ScenarioBase {
  const partner = household.partnerIncluded;
  const partnerIncomePence = partner ? household.partnerIncomePence : 0;
  const partnerContributionPence = partner ? household.partnerContributionPence : 0;
  const partnerSavingsPence = partner ? household.partnerSavingsPence : 0;
  const childrenPence = household.childrenCount * household.childCostPence;
  return {
    ...base,
    currentSavingsPence: base.currentSavingsPence + partnerSavingsPence,
    monthlyIncomePence: base.monthlyIncomePence + partnerIncomePence,
    monthlySpendingPence:
      Math.max(0, base.monthlySpendingPence - partnerContributionPence) + childrenPence,
  };
}

/**
 * Years between Personal FI and Family FI, to one decimal. Negative means the
 * household estimate lands sooner. Null when either date is not reached at all.
 */
export function familyGapYears(
  personal: ScenarioNumbers,
  family: ScenarioNumbers,
): number | null {
  if (personal.fiAge === null || family.fiAge === null) return null;
  return Math.round((family.fiAge - personal.fiAge) * 10) / 10;
}

/* -------------------------------------------------------------- what-if deltas */

/** How a scenario compares with the user's current position. Worked out on the server. */
export type ScenarioDelta = {
  /** Years sooner (negative) or later (positive) the target is reached, or null if either never is. */
  fiAgeYears: number | null;
  fiNumberPence: number;
  progressPct: number;
  monthlyGapPence: number;
  monthlySurplusPence: number;
};

/** `estimate` minus `current`, so a negative number means "better" for dates and gaps. */
export function diffScenarios(current: ScenarioNumbers, estimate: ScenarioNumbers): ScenarioDelta {
  return {
    fiAgeYears:
      current.fiAge !== null && estimate.fiAge !== null
        ? Math.round((estimate.fiAge - current.fiAge) * 10) / 10
        : null,
    fiNumberPence: estimate.fiNumberPence - current.fiNumberPence,
    progressPct: Math.round((estimate.progressPct - current.progressPct) * 10) / 10,
    monthlyGapPence: estimate.monthlyGapPence - current.monthlyGapPence,
    monthlySurplusPence: estimate.monthlySurplusPence - current.monthlySurplusPence,
  };
}

/* -------------------------------------------------------------- weekly check-in */

export type CheckInState = {
  /** True when there is no income on file, so no target can honestly be suggested. */
  needsNumbers: boolean;
  /** The amount the one-tap button offers, in pence. Null when there is nothing to suggest. */
  suggestionPence: number | null;
  /** Where the suggestion came from — shown to the user so nothing is a mystery. */
  basis: "surplus" | "last-check-in" | "none";
  /** What the user's own numbers leave over each month, in pence. */
  monthlySurplusPence: number;
  /** ISO timestamp of the most recent check-in, or null. */
  lastCheckInAt: string | null;
  /** True when a check-in was already recorded in the last 7 days. */
  checkedInThisWeek: boolean;
  /** What the last two check-ins say was saved in between, in pence, or null. */
  lastAmountPence: number | null;
};

/**
 * Work out what to offer in the "Did you save this week?" card from the user's OWN
 * stored numbers: their monthly surplus ÷ 4.33, or — when nothing is left over —
 * whatever their last check-in actually showed. Nothing is ever invented: with no
 * income on file the card asks for the numbers instead of guessing a target.
 */
export function buildCheckInState(
  base: ScenarioBase,
  snapshots: { savings: number; createdAt: string }[],
  now: Date = new Date(),
): CheckInState {
  const surplusPence = Math.round(
    base.monthlyIncomePence +
      base.extraMonthlySavingPence -
      base.monthlySpendingPence -
      base.familySupportPence,
  );

  const last = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];
  const lastAmountPence =
    last && previous ? Math.round((last.savings - previous.savings) * 100) : null;

  const lastCheckInAt = last?.createdAt ?? null;
  const checkedInThisWeek = last
    ? previous !== undefined &&
      now.getTime() - new Date(last.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  const needsNumbers = base.monthlyIncomePence <= 0;

  let suggestionPence: number | null = null;
  let basis: CheckInState["basis"] = "none";

  if (!needsNumbers) {
    if (surplusPence > 0) {
      // Monthly surplus ÷ 4.33 weeks, rounded to the nearest pound, never below £1.
      suggestionPence = Math.max(100, Math.round(surplusPence / WEEKS_PER_MONTH / 100) * 100);
      basis = "surplus";
    } else if (lastAmountPence !== null && lastAmountPence > 0) {
      suggestionPence = lastAmountPence;
      basis = "last-check-in";
    }
  }

  return {
    needsNumbers,
    suggestionPence,
    basis,
    monthlySurplusPence: surplusPence,
    lastCheckInAt,
    checkedInThisWeek,
    lastAmountPence,
  };
}
