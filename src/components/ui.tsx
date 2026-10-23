import type { ReactNode } from "react";

/**
 * Shown on every screen that touches money or investments. Information only —
 * never advice.
 */
export function Disclaimer({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside
      className={`rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 ${className}`}
    >
      <p className="text-[11px] leading-relaxed sm:text-xs">
        <span className="font-semibold">Information only — not financial advice. </span>
        {compact
          ? "Everything here is a general illustration built from the numbers you type in, not a recommendation or a prediction."
          : "The numbers on this screen are a general illustration built from the figures you type in. They are not a recommendation, a prediction, or a promise. Investing can lose money, and everyone's situation is different — consider talking to a qualified, regulated adviser before acting on anything you see here."}
      </p>
    </aside>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
      {children}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "light" }) {
  const styles = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 shadow-sm",
    light:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20",
    ghost: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold transition-colors ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      {children}
    </p>
  );
}
