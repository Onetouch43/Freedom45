/**
 * Illustrative projection maths. Pure functions — no DB, no framework — so the
 * dashboard can recompute instantly as the visitor moves the return slider.
 *
 * Everything here is a plain illustration of the user's own numbers under stated
 * assumptions. It is not a prediction and not financial advice.
 */

export type ProjectionInput = {
  currentAge: number;
  targetAge: number;
  currentSavings: number;
  monthlyIncome: number;
  monthlySpending: number;
  annualReturnPct: number;
};

export type ProjectionPoint = { age: number; balance: number };

export type Projection = {
  /** Monthly money left after spending; negative means spending outruns income. */
  monthlySurplus: number;
  /** The balance where 4% a year covers the user's spending (illustrative). */
  fiNumber: number;
  /** Age the current pace first reaches the target balance, or null if never. */
  fiAge: number | null;
  /** True when that age is at or before the user's target age. */
  onTrack: boolean;
  /** Yearly balances from now to the end of the charted window. */
  points: ProjectionPoint[];
  chartMaxAge: number;
  /** What the balance is at the target age under these assumptions. */
  balanceAtTargetAge: number;
};

/** Illustrative "financially independent" balance: 25 × a year of spending. */
export const fiNumberFor = (monthlySpending: number): number => monthlySpending * 12 * 25;

const CHART_CAP_AGE = 85;
const MAX_AGE = 100;

export function project(input: ProjectionInput): Projection {
  const currentAge = clamp(input.currentAge, 16, 80);
  const targetAge = clamp(input.targetAge, currentAge, 90);
  const start = Math.max(0, input.currentSavings);
  const income = Math.max(0, input.monthlyIncome);
  const spending = Math.max(0, input.monthlySpending);
  const monthlySurplus = income - spending;
  const fiNumber = fiNumberFor(spending);
  const monthlyRate = clamp(input.annualReturnPct, 0, 20) / 100 / 12;

  // Simulate the whole horizon (to MAX_AGE), whatever the target age, so fiAge is the age the
  // pace really reaches the target. The loop used to stop at the target age: for anyone not
  // already on track that meant fiAge came back null — "never reaches it" — even when a healthy
  // monthly surplus would get there at 60. The chart window is trimmed after the fact.
  let balance = start;
  let fiAge: number | null = start >= fiNumber ? currentAge : null;
  let balanceAtTargetAge = start;
  const points: ProjectionPoint[] = [{ age: currentAge, balance }];

  for (let month = 1; ; month++) {
    const age = currentAge + month / 12;
    if (age > MAX_AGE) break;
    balance = balance * (1 + monthlyRate) + monthlySurplus;
    if (balance < 0) balance = 0;
    if (age <= targetAge + 0.001) balanceAtTargetAge = balance;
    if (month % 12 === 0) {
      points.push({ age: Math.round(age * 100) / 100, balance });
    }
    if (fiAge === null && balance >= fiNumber) {
      fiAge = Math.round(age * 10) / 10;
    }
  }

  const chartMaxAge = chartMaxAgeFor(currentAge, targetAge, fiAge);
  const trimmed = points.filter((p) => p.age <= chartMaxAge + 0.01);
  // Always chart at least up to the target age, so the target is visible on the line.
  const windowed =
    trimmed.length > 1 && trimmed[trimmed.length - 1].age >= targetAge - 0.01
      ? trimmed
      : points.filter((p) => p.age <= Math.max(chartMaxAge, targetAge) + 0.01);

  return {
    monthlySurplus,
    fiNumber,
    fiAge,
    onTrack: fiAge !== null && fiAge <= targetAge,
    points: windowed.length > 1 ? windowed : points,
    chartMaxAge,
    balanceAtTargetAge,
  };
}

function chartMaxAgeFor(currentAge: number, targetAge: number, fiAge: number | null): number {
  const needs = fiAge !== null ? Math.ceil(fiAge) + 3 : targetAge;
  return Math.min(CHART_CAP_AGE, Math.max(currentAge + 1, targetAge, Math.min(needs, CHART_CAP_AGE)));
}

function balanceAtAge(points: ProjectionPoint[], age: number): number {
  let best = points[0]?.balance ?? 0;
  for (const point of points) {
    if (point.age <= age + 0.001) best = point.balance;
  }
  return best;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function yearsFrom(ageFrom: number, ageTo: number): number {
  return Math.max(0, Math.round((ageTo - ageFrom) * 10) / 10);
}
