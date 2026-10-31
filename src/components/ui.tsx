import type { ReactNode } from "react";

/**
 * Shown on every screen that touches money or investments. Information only —
 * never advice.
 */
export function Disclaimer({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <aside
      className={`rounded-xl border border-warn/40 bg-warn-fill/12 p-3 text-warn ${className}`}
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
      className={`rounded-card border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-body">
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
      "bg-accent-fill text-on-accent hover:bg-accent-fill-hover active:bg-accent-fill-hover disabled:opacity-50",
    light:
      "border border-line bg-surface-2 text-body hover:border-line-strong hover:bg-surface disabled:opacity-50",
    ghost: "text-muted hover:text-body",
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
      className="rounded-xl border border-danger/40 bg-danger-fill/14 p-3 text-sm text-danger"
    >
      {children}
    </p>
  );
}
