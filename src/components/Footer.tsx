import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * The site-wide footer. Every page carries it — landing, money screens and the
 * legal set alike — so the "not financial advice" line, the disclaimers link and
 * the placeholder notice are never more than one screen away.
 *
 * LAYOUT: the signed-in phone bottom tab bar is `fixed` to the bottom of the
 * viewport, so a footer in the normal flow would end up underneath it. When
 * `signedIn` is set we add bottom padding that clears the bar (plus the phone's
 * safe-area inset). The footer therefore sits ABOVE the nav, never over it.
 */
export const LEGAL_LINKS = [
  { to: "/disclaimer", label: "Disclaimers" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/guide", label: "Guide" },
  { to: "/about", label: "About" },
] as const;

export function Footer({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <footer
      className={`mx-auto mt-8 max-w-3xl px-4 ${
        signedIn ? "pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-10" : "pb-10"
      }`}
    >
      <div className="border-t border-slate-200 pt-5 dark:border-white/10">
        <nav aria-label="Legal and information" className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-9 items-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Freedom45 provides educational estimates only. Not financial, investment, or tax advice.
          See our{" "}
          <Link to="/disclaimer" className="underline underline-offset-2">
            full disclaimer
          </Link>
          .
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Company details are placeholders until the business is registered: legal name, company
          number and registered address all read as marked placeholders below. Built for the UK.
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Freedom45 · Prices in pounds sterling.
        </p>
      </div>
    </footer>
  );
}

/**
 * Shared shell for the legal and information pages: header, one screen of plain
 * English, and the footer. Keeps the five pages in one visual language.
 */
export function LegalPage({
  title,
  intro,
  children,
  signedIn = false,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {title}
        </h1>
        {intro ? (
          <div className="mt-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {intro}
          </div>
        ) : null}
        <div className="mt-6 space-y-5">{children}</div>
      </div>
      <Footer signedIn={signedIn} />
    </div>
  );
}

/** One titled section inside a legal page. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">{heading}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

/** A bulleted list that reads cleanly on a phone. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1.5 marker:text-slate-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * A detail we do not have yet. Deliberately loud so nobody mistakes it for real
 * text: the owner supplies the real company name / number / address and these
 * strings get replaced.
 */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-amber-200 px-1 font-semibold text-amber-950 dark:bg-amber-400/30 dark:text-amber-100">
      [{children}]
    </mark>
  );
}

/** The site's exact disclaimer wording, kept in one place. */
export const DISCLAIMER_TEXT =
  "Freedom45 provides educational estimates only. Not financial, investment, or tax advice. Projections are illustrative and based on assumptions you provide. Past performance does not guarantee future results. Consult a licensed professional.";

export const COMPANY_NAME_PLACEHOLDER = "COMPANY LEGAL NAME — to be confirmed";
export const COMPANY_NUMBER_PLACEHOLDER = "COMPANY NUMBER — to be confirmed";
export const COMPANY_ADDRESS_PLACEHOLDER = "REGISTERED ADDRESS — to be confirmed";
export const PRIVACY_EMAIL_PLACEHOLDER = "PRIVACY CONTACT EMAIL — to be confirmed";
export const CONTACT_EMAIL_PLACEHOLDER = "CONTACT EMAIL — to be confirmed";
