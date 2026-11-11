import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import {
  IconArrowRight,
  IconCheck,
  IconCoin,
  IconInfo,
  IconTarget,
  IconTrendUp,
  IconUser,
} from "~/components/icons";
import { Button, Card, Disclaimer, ErrorNote, Label } from "~/components/ui";
import { age as fmtAge, moneyPence } from "~/lib/format";
import { sessionUserFn } from "~/server/actions";
import { familyPageFn, saveFamilyFn } from "~/server/family";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family Mode — Freedom45" },
      {
        name: "description",
        content:
          "Your Personal FI and your household's Family FI side by side, with the years between them shown plainly — built only from numbers you type in.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    if (!user) throw redirect({ to: "/login" });
    return { signedIn: true, dbConnected };
  },
  loader: async ({ context }) => {
    if (!context.dbConnected) return null;
    const data = await familyPageFn();
    if (!data.ok) {
      if (data.reason === "signed-out") throw redirect({ to: "/login" });
      if (data.reason === "no-profile") throw redirect({ to: "/onboarding" });
      return null;
    }
    if (!data.onboarded) throw redirect({ to: "/onboarding" });
    return data;
  },
  component: FamilyPage,
});

const inputClass =
  "w-full min-h-12 rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

type Draft = {
  partnerIncluded: boolean;
  partnerIncome: number;
  partnerContribution: number;
  partnerSavings: number;
  childrenCount: number;
  childCost: number;
  familySupport: number;
};

/** Pence from the server → whole pounds for the inputs. */
const toPounds = (pence: number): number => Math.round(pence) / 100;

/** Pounds typed by the user → integer pence. The server re-validates and clamps. */
const toPence = (pounds: number): number =>
  Math.round((Number.isFinite(pounds) ? pounds : 0) * 100);

function FamilyPage() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const save = useServerFn(saveFamilyFn);

  const currency = data?.currency ?? "GBP";
  const household = data?.household;
  const [draft, setDraft] = useState<Draft>({
    partnerIncluded: household?.partnerIncluded ?? false,
    partnerIncome: toPounds(household?.partnerIncomePence ?? 0),
    partnerContribution: toPounds(household?.partnerContributionPence ?? 0),
    partnerSavings: toPounds(household?.partnerSavingsPence ?? 0),
    childrenCount: household?.childrenCount ?? 0,
    childCost: toPounds(household?.childCostPence ?? 0),
    familySupport: toPounds(household?.familySupportPence ?? 0),
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!data) {
    return (
      <div className="min-h-dvh bg-page">
        <Header signedIn />
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
          <Card>
            <h1 className="text-lg font-bold text-body">Family Mode isn&apos;t available yet</h1>
            <p className="mt-1.5 text-sm text-muted">
              The database isn&apos;t connected, so there are no saved numbers to work from. This page
              fills in as soon as the connection is added.
            </p>
          </Card>
        </main>
        <Footer signedIn={true} />
      </div>
    );
  }

  const { personal, family, gapYears, currentAge, returnPct } = data;

  async function persist(next: Draft) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await save({
        data: {
          partnerIncluded: next.partnerIncluded,
          partnerIncomePence: toPence(next.partnerIncome),
          partnerContributionPence: toPence(next.partnerContribution),
          partnerSavingsPence: toPence(next.partnerSavings),
          childrenCount: Math.round(next.childrenCount),
          childCostPence: toPence(next.childCost),
          familySupportPence: toPence(next.familySupport),
        },
      });
      if (result.ok) {
        setSaved(true);
        await router.invalidate();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  /** Empty means "not counted" — so clearing puts the household back to nothing. */
  async function clearHousehold() {
    const cleared: Draft = {
      partnerIncluded: false,
      partnerIncome: 0,
      partnerContribution: 0,
      partnerSavings: 0,
      childrenCount: 0,
      childCost: 0,
      familySupport: draft.familySupport,
    };
    setDraft(cleared);
    await persist(cleared);
  }

  function gapSentence(): string {
    if (!family) {
      return "No partner or children set, so there's no household number to show — Personal FI is your own figures only.";
    }
    if (personal.fiAge === null || family.fiAge === null) {
      return family.fiAge === null
        ? "On these assumptions the household's pace doesn't reach the target inside this illustration, so there's no Family FI age to compare with."
        : "On these assumptions your own pace doesn't reach the target inside this illustration, so there's no Personal FI age to compare with.";
    }
    const years = gapYears ?? 0;
    if (years === 0) {
      return `Counting your household leaves the estimate at the same age — ${fmtAge(personal.fiAge)} either way.`;
    }
    const direction = years > 0 ? "later" : "sooner";
    return `Counting your household moves the estimate from age ${fmtAge(personal.fiAge)} to ${fmtAge(
      family.fiAge,
    )} — ${fmtAge(Math.abs(years))} ${Math.abs(years) === 1 ? "year" : "years"} ${direction}.`;
  }

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 pb-24 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-body">Family Mode</h1>
          <p className="mt-1 text-sm text-muted">
            Your own numbers, and the same numbers with your household in them — side by side.
          </p>
        </div>

        {/* ------------------------------------------------ the two estimates */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          <EstimateCard
            label="Personal FI"
            icon={<IconTarget size={15} />}
            numbers={personal}
            currency={currency}
            highlight={false}
          />
          {family ? (
            <EstimateCard
              label="Family FI"
              icon={<IconUser size={15} />}
              numbers={family}
              currency={currency}
              highlight
            />
          ) : null}
        </div>

        <Card>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-body">
            <span className="mt-0.5 text-accent">
              <IconInfo size={16} />
            </span>
            <span>{gapSentence()}</span>
          </p>
          {family ? (
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Both dates use the same {returnPct}% a year assumption as your dashboard&apos;s default,
              and both count you as age {currentAge} now. The difference is only the household you
              typed in below.
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Add a partner or children below and the household estimate appears here beside your own.
            </p>
          )}
        </Card>

        {/* ------------------------------------------------------- the household */}
        <Card>
          <SectionTitle icon={<IconUser size={18} />} title="Your household" />
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Every field is optional. Anything you leave empty is not counted — it is never treated as
            zero income or as a cost we made up.
          </p>

          {saved ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-accent-fill/12 p-3 text-sm font-medium text-accent">
              <IconCheck size={18} />
              Saved — both estimates above are up to date.
            </p>
          ) : null}

          <div className="mt-3 space-y-4">
            <div>
              <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-body">
                <input
                  type="checkbox"
                  checked={draft.partnerIncluded}
                  onChange={(e) => setDraft({ ...draft, partnerIncluded: e.target.checked })}
                  className="h-5 w-5 accent-accent-fill"
                />
                Include a partner in the household numbers
              </label>
              {draft.partnerIncluded ? (
                <div className="mt-2 space-y-3">
                  <div>
                    <Label htmlFor="f-partner-income">Their money in each month</Label>
                    <input
                      id="f-partner-income"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.partnerIncome}
                      onChange={(e) =>
                        setDraft({ ...draft, partnerIncome: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="f-partner-contribution">
                      What they put toward household costs each month
                    </Label>
                    <input
                      id="f-partner-contribution"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.partnerContribution}
                      onChange={(e) =>
                        setDraft({ ...draft, partnerContribution: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">
                      Taken off your monthly outgoings for the household estimate, so a shared cost
                      isn&apos;t counted twice — it&apos;s already inside their income.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="f-partner-savings">What they have saved</Label>
                    <input
                      id="f-partner-savings"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft.partnerSavings}
                      onChange={(e) =>
                        setDraft({ ...draft, partnerSavings: Number(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-line pt-4">
              <Label htmlFor="f-children">Children</Label>
              <input
                id="f-children"
                type="number"
                inputMode="numeric"
                min={0}
                max={10}
                value={draft.childrenCount}
                onChange={(e) => setDraft({ ...draft, childrenCount: Number(e.target.value) })}
                className={inputClass}
              />
              {draft.childrenCount > 0 ? (
                <div className="mt-3">
                  <Label htmlFor="f-child-cost">Cost per child each month — your own figure</Label>
                  <input
                    id="f-child-cost"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.childCost}
                    onChange={(e) => setDraft({ ...draft, childCost: Number(e.target.value) })}
                    className={inputClass}
                  />
                  {draft.childCost <= 0 ? (
                    <p className="mt-1.5 rounded-xl border border-warn/40 bg-warn-fill/12 p-2.5 text-[11px] leading-relaxed text-warn">
                      Put in your own number — it can be a placeholder you change later. We
                      don&apos;t know what children cost you and won&apos;t guess: a range some
                      households use to start a conversation is £300–£900 a month per child, and
                      that is only an illustrative placeholder, not a researched figure or a claim
                      about your situation.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">
                      Multiplied by {draft.childrenCount}{" "}
                      {draft.childrenCount === 1 ? "child" : "children"} and added to the
                      household&apos;s monthly outgoings.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t border-line pt-4">
              <Label htmlFor="f-family-support">Parents or others you support each month</Label>
              <input
                id="f-family-support"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.familySupport}
                onChange={(e) => setDraft({ ...draft, familySupport: Number(e.target.value) })}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] leading-relaxed text-faint">
                The same family support figure your dashboard uses, so a change here moves both
                dates.
              </p>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void persist(draft)}
                className="w-full"
              >
                {busy ? "Saving…" : "Save my household"}
              </Button>
              {household && (household.partnerIncluded || household.childrenCount > 0) ? (
                <Button
                  type="button"
                  variant="light"
                  disabled={busy}
                  onClick={() => void clearHousehold()}
                  className="w-full"
                >
                  Clear partner and children
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        {/* --------------------------------------------------- how it's worked out */}
        <Card>
          <SectionTitle icon={<IconInfo size={18} />} title="How the two numbers differ" />
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
            <li>
              • <strong className="text-body">Personal FI</strong> is exactly what your dashboard
              shows: your money in, your money out, your savings, your family support.
            </li>
            <li>
              • <strong className="text-body">Family FI</strong> adds your partner&apos;s income and
              savings, takes their contribution off your outgoings, and adds each child&apos;s cost
              at the figure you typed. Nothing else changes.
            </li>
            <li>
              • Both use the same projection maths and the same {returnPct}% a year return
              assumption — so the only difference is the household.
            </li>
            <li>
              • Freedom still means 25 × a year of household spending, and the age is still your
              age.
            </li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            These are illustrations built from your own assumptions. They are not a prediction, and
            they are not advice about whether to have a partner, children or anyone else in your
            plan.
          </p>
        </Card>

        <Card>
          <SectionTitle icon={<IconTrendUp size={18} />} title="Where to go next" />
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Move the what-if sliders on your dashboard to see how a change in income or spending
            would land on both dates.
          </p>
          <Link
            to="/dashboard"
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-fill px-4 text-base font-semibold text-on-accent transition-colors hover:bg-accent-fill-hover"
          >
            See my Path to 45
            <IconArrowRight size={18} />
          </Link>
        </Card>

        <Disclaimer />
      </main>
      <Footer signedIn={true} />
    </div>
  );
}

function EstimateCard({
  label,
  icon,
  numbers,
  currency,
  highlight,
}: {
  label: string;
  icon: React.ReactNode;
  numbers: { fiAge: number | null; fiNumberPence: number; monthlySurplusPence: number; progressPct: number };
  currency: string;
  highlight: boolean;
}) {
  return (
    <section
      className={`rounded-card border p-4 ${
        highlight ? "border-accent/45 bg-surface" : "border-line bg-surface"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase ${
          highlight ? "text-accent" : "text-muted"
        }`}
      >
        {icon}
        {label}
      </div>
      {numbers.fiAge === null ? (
        <p className="numeric mt-2 text-[1.45rem] leading-tight font-black text-body">
          Not on this pace
        </p>
      ) : (
        <p className="numeric mt-1 text-[2.1rem] leading-none font-black text-body">
          Age {fmtAge(numbers.fiAge)}
        </p>
      )}
      <p className="mt-1 text-[11px] text-faint">Estimated freedom date</p>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1 text-muted">
            <IconCoin size={13} />
            Freedom number
          </dt>
          <dd className="numeric font-semibold text-body">
            {moneyPence(numbers.fiNumberPence, currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1 text-muted">
            <IconTrendUp size={13} />
            Left over
          </dt>
          <dd className="numeric font-semibold text-body">
            {numbers.monthlySurplusPence < 0 ? "-" : ""}
            {moneyPence(Math.abs(numbers.monthlySurplusPence), currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">Progress</dt>
          <dd className="numeric font-semibold text-body">{numbers.progressPct}%</dd>
        </div>
      </dl>
    </section>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-body">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill/12 text-accent">
        {icon}
      </span>
      {title}
    </h2>
  );
}
