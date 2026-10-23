/** Display helpers. Deliberately dependency-free so server and client agree. */

export const CURRENCIES = ["GBP", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOLS: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

export const currencySymbol = (currency: string): string => SYMBOLS[currency] ?? `${currency} `;

/** £1,234 — rounded, grouped, deterministic (no ICU, no hydration mismatch). */
export function money(amount: number, currency = "GBP"): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${currencySymbol(currency)}${digits}`;
}

export function number(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "27.0" / "27" — trims the trailing .0 so ages read naturally. */
export function age(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(date.getDate())} ${months[date.getMonth()] ?? ""} ${String(date.getFullYear())}`;
}
