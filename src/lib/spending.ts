/**
 * Spending Tracker — shared, pure helpers.
 *
 * No database, no framework: this module is safe to import from the browser AND
 * from the server, so the form and the server function agree on the categories,
 * the penny arithmetic and the Today / This week / Earlier buckets.
 *
 * Money is INTEGER PENCE everywhere. £12.34 is 1234. Nothing here is advice.
 */

export const SPEND_CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Fun",
  "Family",
  "Investments",
  "Other",
] as const;
export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

export const PAYMENT_METHODS = ["cash", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type SpendGroup = "Today" | "This week" | "Earlier";

export type SpendRow = {
  id: number;
  amountPence: number;
  category: SpendCategory;
  paymentMethod: PaymentMethod;
  note: string;
  /** YYYY-MM-DD */
  spentAt: string;
  group: SpendGroup;
};

export type SpendAlert = {
  kind: "budget" | "habit";
  title: string;
  body: string;
};

export const isCategory = (value: string): value is SpendCategory =>
  (SPEND_CATEGORIES as readonly string[]).includes(value);

export const isPaymentMethod = (value: string): value is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(value);

/** "4.20" / 4.2 / "£4.20" → 420 pence. Null when it isn't a usable amount. */
export function toPence(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const pence = Math.round(value * 100);
    return pence > 0 ? pence : null;
  }
  const cleaned = String(value)
    .replace(/[£,\s]/g, "")
    .trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const pence = Math.round(Number(cleaned) * 100);
  return Number.isFinite(pence) && pence > 0 ? pence : null;
}

/** Pence → "£12.34". Every money figure in the tracker goes through here. */
export const pounds = (pence: number): string =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(
    Math.round(pence) / 100,
  );

/** Today's date where the money is spent, as YYYY-MM-DD (Europe/London). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Today / This week / Earlier. "This week" is the six days before today, so the
 * three buckets never overlap and every row lands in exactly one.
 */
export function groupFor(spentAt: string, today: string): SpendGroup {
  if (spentAt === today) return "Today";
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${spentAt}T00:00:00Z`)) / dayMs);
  if (Number.isFinite(diff) && diff >= 1 && diff <= 6) return "This week";
  return "Earlier";
}

/**
 * The month's budget, from the user's OWN profile:
 *   savings rate = (income − stated monthly spending) / income
 *   budget       = income × (1 − savings rate)
 *
 * With no income on file there is no honest budget, so this returns null and the
 * page prompts for the missing number instead of inventing one.
 */
export function budgetFromProfile(incomePence: number, statedSpendPence: number): number | null {
  if (incomePence <= 0) return null;
  const savingsRate = Math.min(1, Math.max(0, (incomePence - statedSpendPence) / incomePence));
  const budget = Math.round(incomePence * (1 - savingsRate));
  return budget > 0 ? budget : incomePence;
}

export type WeekTotals = Map<string, number>;

/**
 * "You spent 40% more on Food this week (£140.00, up from £100.00 the week
 * before)." Built only from real rows in the two seven-day windows.
 */
export function buildInsight(last7: WeekTotals, prev7: WeekTotals): string | null {
  const categories = new Set([...last7.keys(), ...prev7.keys()]);
  let best: { category: string; last: number; prev: number; delta: number } | null = null;
  for (const category of categories) {
    const last = last7.get(category) ?? 0;
    const prev = prev7.get(category) ?? 0;
    if (last === 0 && prev === 0) continue;
    // Rank by the size of the change in pounds, so a £40 jump on Housing beats a
    // 100% rise on a £3 coffee.
    const delta = Math.abs(last - prev);
    if (!best || delta > best.delta) best = { category, last, prev, delta };
  }
  if (!best) return null;
  if (best.prev === 0) {
    return `You spent ${pounds(best.last)} on ${best.category} in the last 7 days — nothing in the 7 days before.`;
  }
  if (best.last === 0) {
    return `You spent nothing on ${best.category} in the last 7 days, down from ${pounds(best.prev)} the week before.`;
  }
  const pct = Math.round(((best.last - best.prev) / best.prev) * 100);
  if (pct === 0) {
    return `Your ${best.category} spending is level with the week before — ${pounds(best.last)} in the last 7 days.`;
  }
  const direction = pct > 0 ? "more" : "less";
  return `You spent ${Math.abs(pct)}% ${direction} on ${best.category} this week (${pounds(
    best.last,
  )} in the last 7 days, against ${pounds(best.prev)} the week before).`;
}
