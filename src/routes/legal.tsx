import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "~/components/Header";
import { DISCLAIMER_TEXT, Footer } from "~/components/Footer";
import {
  DRAFT_BANNER,
  EFFECTIVE_DATE,
  LEGAL_TABS,
  SOLE_TRADER_LINE,
  type LegalTab,
  type LegalTabId,
} from "~/lib/legalContent";
import { APP_URL, APP_URL_LABEL } from "~/lib/site";
import { sessionUserFn } from "~/server/actions";

const TAB_IDS = LEGAL_TABS.map((tab) => tab.id);

/**
 * The tab lives in the URL, so /legal?tab=privacy can be sent to someone
 * directly. An unknown or missing value falls back to Terms rather than 404ing —
 * and it is dropped from the search rather than normalised into it, so bare
 * /legal answers 200 instead of redirecting to /legal?tab=terms.
 */
export const Route = createFileRoute("/legal")({
  validateSearch: (search: Record<string, unknown>): { tab?: LegalTabId } => {
    const raw = typeof search.tab === "string" ? search.tab.toLowerCase() : "";
    return (TAB_IDS as string[]).includes(raw) ? { tab: raw as LegalTabId } : {};
  },
  head: () => ({
    meta: [
      { title: "Legal — Terms, Privacy and Contact — Freedom45" },
      {
        name: "description",
        content:
          "Freedom45's terms of use, privacy notice and contact details in one place: an educational planning tool, not financial advice.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: LegalTabsPage,
});

function LegalTabsPage() {
  const { signedIn } = Route.useRouteContext();
  const { tab } = Route.useSearch();
  const active = LEGAL_TABS.find((item) => item.id === tab) ?? LEGAL_TABS[0];

  return (
    <>
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl px-4 pt-5">
        <h1 className="text-2xl font-bold tracking-tight text-body sm:text-3xl">
          Legal, privacy and contact
        </h1>

        {/* The draft banner is the first thing on the page: nobody should quote
            this page as if the company details were settled. */}
        <p
          role="note"
          className="mt-3 rounded-card border border-warn/40 bg-warn-fill/12 px-3 py-2.5 text-sm font-semibold leading-snug text-warn"
        >
          {DRAFT_BANNER}
        </p>

        {/* Company identity: one block, above the tabs, so every tab is read
            under the same business line and effective date. */}
        <div className="mt-3 rounded-card border border-line bg-surface p-3.5">
          <p className="text-[15px] font-semibold leading-relaxed text-body">
            {SOLE_TRADER_LINE}
          </p>
          <dl className="mt-2.5 space-y-2 text-[13px] leading-relaxed">
            <div>
              <dt className="font-semibold text-muted">Effective date</dt>
              <dd className="text-body">{EFFECTIVE_DATE}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Live app</dt>
              <dd className="break-all">
                <a
                  href={APP_URL}
                  className="text-accent underline underline-offset-2"
                  rel="noopener"
                >
                  {APP_URL_LABEL}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* Tabs. Real links, not buttons: shareable, middle-clickable, and they
            work before hydration. Each is 44px tall for thumbs. */}
        <nav aria-label="Legal sections" className="mt-4">
          <ul className="grid grid-cols-3 gap-1 rounded-card border border-line bg-surface p-1">
            {LEGAL_TABS.map((tab) => {
              const isActive = tab.id === active.id;
              return (
                <li key={tab.id} className="min-w-0">
                  <Link
                    to="/legal"
                    search={{ tab: tab.id }}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-center rounded-xl px-1 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-accent-fill text-on-accent"
                        : "text-muted hover:bg-surface-2 hover:text-body"
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The panel. Keyed on the tab so a screen reader re-announces it. */}
        <section key={active.id} aria-labelledby="legal-tab-heading" className="mt-5">
          <h2 id="legal-tab-heading" className="text-xl font-bold tracking-tight text-body">
            {active.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{active.summary}</p>
          <div className="mt-5 space-y-5">
            {active.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-base font-semibold text-body">{section.heading}</h3>
                <div className="mt-1.5 space-y-2 text-[15px] leading-relaxed text-body">
                  {section.blocks.map((block, index) =>
                    block.kind === "p" ? (
                      <p key={index}>{withPlaceholderMarks(block.text)}</p>
                    ) : (
                      <ul
                        key={index}
                        className="ml-4 list-disc space-y-1.5 marker:text-faint"
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{withPlaceholderMarks(item)}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The legal posture needs the estimate disclaimer on every money screen,
            and the standalone Disclaimers page stays reachable from here. */}
        <div className="mt-6 rounded-card border border-warn/40 bg-warn-fill/12 p-3">
          <p className="text-[13px] leading-relaxed text-warn">{DISCLAIMER_TEXT}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-warn">
            <Link to="/disclaimer" className="font-semibold underline underline-offset-2">
              Read the full disclaimer
            </Link>
          </p>
        </div>

        <nav aria-label="Related pages" className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {RELATED_PAGES.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted underline-offset-4 hover:text-body hover:underline"
            >
              {page.label}
            </Link>
          ))}
        </nav>
      </main>
      <Footer signedIn={signedIn} />
    </>
  );
}

const RELATED_PAGES = [
  { to: "/disclaimer", label: "Disclaimers" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/guide", label: "Guide" },
] as const;

/**
 * Renders text, highlighting anything in square brackets. The brackets are part
 * of the placeholder strings themselves, so the wording stays exactly as the
 * owner gave it — this only makes it obvious that the detail is still missing.
 */
function withPlaceholderMarks(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\])/g).map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <mark
        key={index}
        className="rounded bg-warn-fill/25 px-1 font-semibold text-warn"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

/** Exported for the word-count check: the tabs, in the order they render. */
export const legalTabsForCheck: LegalTab[] = LEGAL_TABS;
