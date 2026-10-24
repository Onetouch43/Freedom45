import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { PathChart } from "~/components/PathChart";
import { Button, Card, Disclaimer, ErrorNote, Label } from "~/components/ui";
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconCoin,
  IconInfo,
  IconTarget,
  IconTrendUp,
  IconUser,
} from "~/components/icons";
import { age as fmtAge, money, shortDate } from "~/lib/format";
import { project } from "~/lib/projection";
import { dashboardFn, sessionUserFn, updateNumbersFn } from "~/server/actions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Path to 45 — Freedom45" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    if (!user) throw redirect({ to: "/login" });
    return { signedIn: true, dbConnected };
  },
  loader: async ({ context }) => {
    if (!context.dbConnected) return null;
    const data = await dashboardFn();
    if (!data.signedIn) throw redirect({ to: "/login" });
    if (!data.onboarded) throw redirect({ to: "/onboarding" });
    return data;
  },
  component: Dashboard,
});

const inputClass =
  "w-full min-h-12 rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white";

function Dashboard() {
  const router = useRouter();
  const data = Route.useLoaderData();

  const profile = data?.profile ?? null;
  const currency = profile?.currency ?? "GBP";
  const [rate, setRate] = useState(5);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    monthlyIncome: profile?.monthlyIncome ?? 0,
    monthlySpending: profile?.monthlySpending ?? 0,
    currentSavings: profile?.currentSavings ?? 0,
  });

  const saveNumbers = useServerFn(updateNumbersFn);

  /**
   * The estimate moves with real logged spending.
   *
   * Month-to-date pence from the Spending Tracker is scaled to a full month, and
   * the larger of that rate and the number stored on the profile is used — so one
   * coffee logged on the 1st can never flatter the estimated freedom date. With
   * nothing logged, the profile number is used unchanged. Nothing is hardcoded.
   */
  const now = new Date();
  const daysElapsed = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthSpentPence = data?.monthSpentPence ?? 0;
  const spendCount = data?.spendCount ?? 0;
  const rateFromLogs =
    spendCount > 0 ? Math.round((monthSpentPence / daysElapsed) * daysInMonth) / 100 : 0;
  const storedSpending = profile?.monthlySpending ?? 0;
  const spending = rateFromLogs > 0 ? Math.max(rateFromLogs, storedSpending) : storedSpending;
  const spendingBasis: "logs" | "profile" =
    spendCount > 0 && rateFromLogs > storedSpending ? "logs" : "profile";

  const projection = useMemo(
    () =>
      project({
        currentAge: profile?.currentAge ?? 25,
        targetAge: profile?.targetFreedomAge ?? 45,
        currentSavings: profile?.currentSavings ?? 0,
        monthlyIncome: profile?.monthlyIncome ?? 0,
        monthlySpending: spending,
        annualReturnPct: rate,
      }),
    [profile, rate, spending],
  );

  if (!data || !profile) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header signedIn />
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
          <Card>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Your plan isn&apos;t available yet
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              The database isn&apos;t connected, so there are no saved numbers to show. This page fills
              in as soon as the connection is added.
            </p>
          </Card>
        </main>
      <Footer signedIn={true} />
      </div>
    );
  }

  const targetAge = profile.targetFreedomAge || 45;
  const surplus = profile.monthlyIncome - spending;
  const snapshots = data.snapshots;
  const first = snapshots[0];
  const change = first ? profile.currentSavings - first.savings : 0;
  const currentAge = profile.currentAge || 25;
  const shortfall = Math.max(0, projection.fiNumber - projection.balanceAtTargetAge);

  /**
   * One true sentence about the pace. "Nothing is left over" is only claimed when the monthly
   * surplus really is zero or negative — a surplus that simply doesn't reach the target by the
   * target age says where the pace does land instead. Illustration only, never advice.
   */
  function paceNote(): string {
    if (projection.fiAge !== null && projection.fiAge <= currentAge + 0.05) {
      return `You're already at the ${money(projection.fiNumber, currency)} that would cover ${money(
        spending,
        currency,
      )} a month — on these assumptions the target is met today.`;
    }
    if (projection.fiAge === null) {
      if (surplus > 0) {
        return `At ${money(spending, currency)} of spending a month against ${money(
          profile.monthlyIncome,
          currency,
        )} coming in, ${money(surplus, currency)} a month is left over — but on this pace the balance is about ${money(
          projection.balanceAtTargetAge,
          currency,
        )} by age ${targetAge}, roughly ${money(shortfall, currency)} short of the ${money(
          projection.fiNumber,
          currency,
        )} target, and doesn't reach it inside this illustration's window.`;
      }
      if (surplus === 0) {
        return `At ${money(spending, currency)} of spending a month against ${money(
          profile.monthlyIncome,
          currency,
        )} coming in, nothing is left over to build up — so on this pace the balance never reaches the target.`;
      }
      return `Your spending (${money(spending, currency)} a month) is more than what comes in (${money(
        profile.monthlyIncome,
        currency,
      )}), so money has to come out of savings each month — on this pace the balance never reaches the target.`;
    }
    const years = Math.round((projection.fiAge - targetAge) * 10) / 10;
    if (years > 0) return `That's ${fmtAge(years)} years later than the age ${targetAge} you're aiming for.`;
    if (years < 0) return `That's ${fmtAge(-years)} years ahead of the age ${targetAge} you're aiming for.`;
    return `That lands right on the age ${targetAge} you're aiming for.`;
  }

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await saveNumbers({ data: draft });
      if (result.ok) {
        setSaved(true);
        setEditing(false);
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

  function toggleEditing() {
    setEditing((v) => !v);
    setSaved(false);
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header signedIn />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Path to 45</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Hi {profile.profession ? profile.profession : "there"} — here&apos;s what your own numbers do
            over time.
          </p>
        </div>

        {/* ------------------------------------------------------- the answer */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg shadow-emerald-900/15">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-emerald-50/90 uppercase">
            <IconTarget size={15} />
            Estimated freedom date
          </div>
          {projection.fiAge === null ? (
            <p className="numeric mt-2 text-[2.1rem] leading-[1.05] font-black">Not on this pace</p>
          ) : (
            <p className="numeric mt-1 text-[3.4rem] leading-[1] font-black">Age {fmtAge(projection.fiAge)}</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-emerald-50/95">{paceNote()}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <HeroStat
              icon={<IconCoin size={17} />}
              label="Your freedom number"
              value={money(projection.fiNumber, currency)}
            />
            <HeroStat
              icon={<IconTrendUp size={17} />}
              label="Left over each month"
              value={`${surplus < 0 ? "-" : ""}${money(Math.abs(surplus), currency)}`}
            />
          </div>

          <button
            type="button"
            onClick={toggleEditing}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-base font-bold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50 active:bg-emerald-100"
          >
            {editing ? "Close the number form" : "Update my numbers"}
            {editing ? null : <IconArrowRight size={18} />}
          </button>
          <p className="mt-2 text-center text-[11px] text-emerald-50/80">
            An estimate based on your assumptions — never a promise.
          </p>
        </section>

        <Card>
          <PathChart
            points={projection.points}
            fiNumber={projection.fiNumber}
            targetAge={targetAge}
            fiAge={projection.fiAge}
            currency={currency}
          />
          <div className="mt-3">
            <Label htmlFor="rate">
              Assumed yearly return: <span className="font-bold">{rate}%</span>
            </Label>
            <input
              id="rate"
              type="range"
              min={3}
              max={7}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>3% (cautious)</span>
              <span>5% (default)</span>
              <span>7% (optimistic)</span>
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------------- your numbers */}
        <Card>
          <SectionTitle icon={<IconUser size={18} />} title="Your numbers">
            {editing ? (
              <button
                type="button"
                onClick={toggleEditing}
                className="-mr-1 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
            ) : null}
          </SectionTitle>

          {saved ? (
            <p className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <IconCheck size={18} />
              Saved — your path above is up to date.
            </p>
          ) : null}

          {editing ? (
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="u-income">Money in each month</Label>
                <input
                  id="u-income"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.monthlyIncome}
                  onChange={(e) => setDraft({ ...draft, monthlyIncome: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="u-spending">Money out each month</Label>
                <input
                  id="u-spending"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.monthlySpending}
                  onChange={(e) => setDraft({ ...draft, monthlySpending: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="u-savings">Saved so far</Label>
                <input
                  id="u-savings"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.currentSavings}
                  onChange={(e) => setDraft({ ...draft, currentSavings: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <ErrorNote>{error}</ErrorNote>
              <Button type="button" disabled={busy} onClick={() => void save()} className="w-full">
                {busy ? "Saving…" : "Save and add a check-in"}
              </Button>
            </div>
          ) : (
            <>
              <dl className="mt-2 divide-y divide-slate-100 text-sm dark:divide-white/10">
                <Row label="Money in each month" value={money(profile.monthlyIncome, currency)} />
                <Row label="Money out each month" value={money(spending, currency)} />
                <Row label="Saved so far" value={money(profile.currentSavings, currency)} />
                <Row label="Target age" value={String(targetAge)} />
              </dl>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Change anything here when your pay, rent or savings move — each save adds a check-in to
                the trend below.
              </p>
              {spendCount > 0 ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Your estimated date uses{" "}
                  <strong className="text-slate-700 dark:text-slate-200">{money(spending, currency)}</strong>{" "}
                  a month of spending —{" "}
                  {spendingBasis === "logs"
                    ? `the rate your ${spendCount} logged ${spendCount === 1 ? "spend" : "spends"} this month point to`
                    : "the number on your profile, which is higher than your logged rate"}{" "}
                  — so logging spends moves the date.{" "}
                  <Link to="/spending" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
                    Log a spend
                  </Link>
                </p>
              ) : null}
            </>
          )}
        </Card>

        {/* ---------------------------------------------------- progress */}
        <Card>
          <SectionTitle icon={<IconTrendUp size={18} />} title="Progress over time">
            {snapshots.length > 1 ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {snapshots.length} check-ins
              </span>
            ) : null}
          </SectionTitle>
          {snapshots.length <= 1 ? (
            <div className="mt-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You&apos;ve got one check-in so far — that&apos;s the starting line. Save your numbers
                again in a month or two and the trend appears here, so you can see the pace actually
                moving.
              </p>
              <Button type="button" variant="light" onClick={toggleEditing} className="mt-3 w-full">
                Add a second check-in
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {change >= 0 ? "Up" : "Down"} {money(Math.abs(change), currency)} since your first
                check-in on {shortDate(first?.createdAt ?? "")}.
              </p>
              <ul className="mt-2">
                {[...snapshots].reverse().slice(0, 8).map((snapshot) => (
                  <li
                    key={snapshot.id}
                    className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-white/10"
                  >
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <IconClock size={15} />
                      {shortDate(snapshot.createdAt)}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {money(snapshot.savings, currency)} saved
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* ---------------------------------------------------- assumptions */}
        <Card>
          <SectionTitle icon={<IconInfo size={18} />} title="What this illustration assumes" />
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              • Your money grows at <strong>{rate}% a year</strong>, compounded monthly. Real returns
              bounce around and can be negative in a given year.
            </li>
            <li>
              • Freedom means <strong>25 × your yearly spending</strong> ({money(projection.fiNumber, currency)}),
              the balance where drawing 4% a year covers {money(spending, currency)} a month.
            </li>
            <li>
              • Your spending stays at {money(spending, currency)} a month and your income at{" "}
              {money(profile.monthlyIncome, currency)} — no pay rises, no inflation, no big purchases.
            </li>
            <li>
              • Everything left over each month ({money(Math.max(0, surplus), currency)}) goes into the
              balance, and nothing is taken out along the way.
            </li>
            <li>• Your savings start at {money(profile.currentSavings, currency)} and you&apos;re {currentAge} now.</li>
          </ul>
        </Card>

        {/* -------------------------------------------------------- next step */}
        <Card>
          <SectionTitle icon={<IconBolt size={18} />} title="Next step" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Your own money is only half of the path. Tell us how many hours you have and the side
            hustles you could actually run appear in a ranked list.
          </p>
          <Link
            to="/side-hustles"
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-base font-semibold text-white shadow-sm shadow-emerald-600/25 transition-colors hover:bg-emerald-500"
          >
            Find side hustles that suit you
            <IconArrowRight size={18} />
          </Link>
        </Card>

        <Disclaimer />
      </main>
      <Footer signedIn={true} />
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-50/90">
        {icon}
        {label}
      </dt>
      <dd className="numeric mt-0.5 text-lg font-bold text-white">{value}</dd>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-slate-600 dark:text-slate-300">{label}</dt>
      <dd className="numeric font-semibold text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
