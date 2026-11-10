import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Card, Disclaimer } from "~/components/ui";
import { IconBook } from "~/components/icons";
import {
  CHECKED_ON_LABEL,
  LIBRARY_ENTRIES,
  LIBRARY_GROUPS,
  LIBRARY_INTRO,
  NOT_COVERED,
  TAX_YEAR,
  allSourceUrls,
  entriesInGroup,
  type LibraryEntry,
  type LibraryFact,
  type WorkedExample,
} from "~/data/investment-library";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/investments")({
  head: () => ({
    meta: [
      { title: "Investment library — Freedom45" },
      {
        name: "description",
        content:
          "Plain-English explanations of the UK ISAs, pensions and investing ideas you meet first — every figure linked to the government page it came from, with the date it was checked.",
      },
    ],
  }),
  beforeLoad: async () => {
    // Read only, and never fatal: the library is public, but a signed-in reader
    // keeps the five-tab bar and the footer clearance that come with it.
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: InvestmentsPage,
});

const MONTHS = [
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

/** "2026-11-09" → "9 Nov 2026", built by hand so server and client agree. */
function shortDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const name = MONTHS[Number(month) - 1] ?? "";
  return `${Number(day)} ${name} ${year}`;
}

/** Publisher for each distinct source URL, in the order the file uses them. */
const SOURCES: { url: string; publisher: string }[] = (() => {
  const publisherFor = new Map<string, string>();
  for (const entry of LIBRARY_ENTRIES) {
    for (const fact of entry.facts) {
      if (!publisherFor.has(fact.sourceUrl)) {
        publisherFor.set(fact.sourceUrl, fact.source);
      }
    }
  }
  return allSourceUrls().map((url) => ({
    url,
    publisher: publisherFor.get(url) ?? "",
  }));
})();

function InvestmentsPage() {
  const { signedIn } = Route.useRouteContext();

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 pb-24 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-body">
            {LIBRARY_INTRO.title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {LIBRARY_INTRO.standfirst}
          </p>
        </div>

        <Card>
          <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-accent/40 bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-accent">
            <IconBook size={13} />
            Figures checked {CHECKED_ON_LABEL} · tax year {TAX_YEAR}
          </p>
          <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
            {LIBRARY_INTRO.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>

        <Disclaimer />

        {LIBRARY_GROUPS.map((group) => {
          const entries = entriesInGroup(group.id);
          if (entries.length === 0) return null;
          return (
            <section key={group.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <h2 className="text-base font-bold text-body">{group.label}</h2>
                <p className="text-[11px] font-semibold text-faint">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <div className="space-y-2">
                {entries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          );
        })}

        <Card>
          <h2 className="text-base font-bold text-body">
            What this library does not do
          </h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
            {NOT_COVERED.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-body">Sources</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Every figure above comes from one of these pages. Each was read on{" "}
            {CHECKED_ON_LABEL}.
          </p>
          <ul className="mt-3 space-y-2.5">
            {SOURCES.map((source) => (
              <li key={source.url} className="min-w-0">
                <p className="text-[13px] font-semibold text-body">
                  {source.publisher}
                </p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-[11px] leading-snug text-accent underline underline-offset-2"
                >
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
            {LIBRARY_INTRO.footerNote}
          </p>
        </Card>
      </main>
      <Footer signedIn={signedIn} />
    </div>
  );
}

/**
 * One library entry, collapsed by default. Eleven expanded at once would be a
 * wall of text on a phone, so the summary is the card and "Read more" opens it.
 */
function EntryCard({ entry }: { entry: LibraryEntry }) {
  return (
    <details className="group rounded-card border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-body">
            {entry.title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {entry.summary}
          </p>
        </div>
        <span className="mt-0.5 inline-flex min-h-8 shrink-0 items-center rounded-full border border-line bg-surface-2 px-2.5 text-[11px] font-semibold text-accent">
          <span className="group-open:hidden">Read more</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>

      <div className="border-t border-line px-4 pb-4 pt-3.5">
        <div className="space-y-2.5 text-sm leading-relaxed text-muted">
          {entry.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-3.5 space-y-3">
          <SubSection heading="How it works">{entry.howItWorks}</SubSection>
          <SubSection heading="What it's for">{entry.whatItsFor}</SubSection>
          <SubSection heading="What to watch out for">
            {entry.watchOutFor}
          </SubSection>
        </div>

        {entry.facts.length > 0 ? (
          <div className="mt-3.5 rounded-xl border border-line bg-surface-2/50 p-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
              Figures and sources
            </h4>
            <ul className="mt-2">
              {entry.facts.map((fact) => (
                <FactRow key={`${fact.label}-${fact.value}`} fact={fact} />
              ))}
            </ul>
          </div>
        ) : null}

        {entry.workedExample ? (
          <WorkedExampleBlock example={entry.workedExample} />
        ) : null}
      </div>
    </details>
  );
}

function SubSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
        {heading}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function FactRow({ fact }: { fact: LibraryFact }) {
  return (
    <li className="border-t border-line/70 py-2.5 first:border-t-0 first:pt-0 last:pb-0">
      <p className="text-[12px] font-semibold text-faint">{fact.label}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-body">{fact.value}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-faint">
        <a
          href={fact.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 items-center font-semibold text-accent underline underline-offset-2"
        >
          Source: {fact.source}
        </a>
        <span aria-hidden="true">·</span>
        <span>checked {shortDate(fact.checkedOn)}</span>
      </p>
    </li>
  );
}

function WorkedExampleBlock({ example }: { example: WorkedExample }) {
  return (
    <div className="mt-3.5 rounded-xl border border-line bg-surface-2/50 p-3">
      <h4 className="text-[13px] font-bold text-body">{example.title}</h4>

      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
        Assumptions
      </p>
      <ul className="mt-1 ml-4 list-disc space-y-1 text-[12px] leading-snug text-muted marker:text-faint">
        {example.assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>

      <table className="mt-3 w-full table-fixed border-collapse">
        <tbody>
          {example.rows.map((row) => (
            <tr key={row.label} className="border-t border-line first:border-t-0">
              <th
                scope="row"
                className="w-3/5 break-words py-1.5 pr-2 text-left text-[12px] font-normal leading-snug text-muted"
              >
                {row.label}
              </th>
              <td className="break-words py-1.5 text-right text-[13px] font-semibold tabular-nums text-body">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-faint">
        {example.note}
      </p>
    </div>
  );
}
