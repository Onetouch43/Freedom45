import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, Disclaimer, ErrorNote, Label } from "~/components/ui";
import { IconArrowRight, IconCheck, IconInfo, IconTrendUp, IconWallet } from "~/components/icons";
import { PAYMENT_METHODS, SPEND_CATEGORIES, pounds, todayIso, type SpendRow } from "~/lib/spending";
import { addSpendFn, spendingPageFn, type SpendingPageData } from "~/server/spending";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/spending")({
  head: () => ({ meta: [{ title: "Spending — Freedom45" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    if (!user) throw redirect({ to: "/login" });
    return { signedIn: true, dbConnected };
  },
  loader: async ({ context }) => {
    if (!context.dbConnected) return null;
    const data = await spendingPageFn();
    if (!data.signedIn) throw redirect({ to: "/login" });
    return data;
  },
  component: SpendingPage,
});

const inputClass =
  "w-full min-h-12 rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white";

const dayLabel = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
};

function SpendingPage() {
  const router = useRouter();
  const data = Route.useLoaderData() as SpendingPageData | null;
  const addSpend = useServerFn(addSpendFn);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Food");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [spentAt, setSpentAt] = useState<string>(todayIso());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    setJustSaved("");
    try {
      const result = await addSpend({ data: { amount, category, paymentMethod, note, spentAt } });
      if (result.ok) {
        setAmount("");
        setNote("");
        setSpentAt(todayIso());
        setJustSaved("Logged — your list and chart below are up to date.");
        await router.invalidate();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Couldn't save that spend. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header signedIn />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Card>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Spending isn&apos;t available yet</h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              The database isn&apos;t connected, so there is nowhere to save a spend yet.
            </p>
          </Card>
        </main>
        <Footer signedIn />
      </div>
    );
  }

  const { month } = data;
  const groups: Array<{ name: SpendRow["group"]; rows: SpendRow[] }> = [
    { name: "Today", rows: data.spends.filter((s) => s.group === "Today") },
    { name: "This week", rows: data.spends.filter((s) => s.group === "This week") },
    { name: "Earlier", rows: data.spends.filter((s) => s.group === "Earlier") },
  ];

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header signedIn />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Spending</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Log a spend in a few taps. Everything here comes from what you type in — no bank logins.
          </p>
        </div>

        {/* --------------------------------------------------------- alerts */}
        {data.alerts.length > 0 ? (
          <div className="space-y-2.5" aria-live="polite">
            {data.alerts.map((alert) => {
              const isBudget = alert.kind === "budget";
              return (
                <div
                  key={alert.kind}
                  role="status"
                  className={`rounded-2xl border p-3.5 ${
                    isBudget
                      ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-100"
                      : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100"
                  }`}
                >
                  <p className="flex items-center gap-2 text-base font-bold">
                    <IconInfo size={18} />
                    {alert.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed opacity-90">{alert.body}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {data.needsIncome ? (
          <div className="rounded-2xl border border-slate-300 bg-white p-3.5 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
            <p className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <IconInfo size={18} />
              Finish your numbers to see a budget
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              A monthly budget is worked out from the income on your profile. There&apos;s no income on
              file yet, so we won&apos;t invent one — add it and the budget alert starts working.
            </p>
            <Link
              to="/dashboard"
              className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-800 dark:bg-white/10 dark:text-white"
            >
              Add my income
              <IconArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        {/* ------------------------------------------------------ quick add */}
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              <IconWallet size={18} />
            </span>
            Quick add
          </h2>

          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="4.20"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {SPEND_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="spentAt">Date</Label>
                <input
                  id="spentAt"
                  type="date"
                  max={todayIso()}
                  value={spentAt}
                  onChange={(e) => setSpentAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Paid by
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPaymentMethod(method)}
                      className={`min-h-12 rounded-xl border text-base font-semibold capitalize transition-colors ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <input
                id="note"
                type="text"
                maxLength={120}
                placeholder="Coffee on the way in"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
            </div>

            <ErrorNote>{error}</ErrorNote>
            {justSaved ? (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                <IconCheck size={18} />
                {justSaved}
              </p>
            ) : null}

            <Button type="button" onClick={() => void save()} disabled={busy} className="w-full">
              {busy ? "Saving…" : "Save spend"}
            </Button>
          </div>
        </Card>

        {/* --------------------------------------------------------- chart */}
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              <IconTrendUp size={18} />
            </span>
            This month: spending vs saving
          </h2>

          <MonthBars spentPence={month.spentPence} savedPence={month.savedPence} incomePence={month.incomePence} />

          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {month.incomePence > 0
              ? `Day ${month.daysElapsed} of ${month.daysInMonth}. Spending is what you've logged this month; saving is your monthly income minus that.`
              : "Spending is what you've logged this month. Add your income on the dashboard to see the saving side too."}
          </p>
        </Card>

        {/* -------------------------------------------------------- insight */}
        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">This week vs last week</h2>
          {data.insight ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{data.insight}</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Nothing to compare yet — log a few spends over the next week and this line tells you which
              category moved.
            </p>
          )}
        </Card>

        {/* ----------------------------------------------------------- list */}
        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent spends</h2>
          {data.spends.length === 0 ? (
            <div className="mt-2 rounded-xl bg-slate-50 p-4 text-center dark:bg-white/5">
              <p className="text-base font-semibold text-slate-800 dark:text-white">
                No spends yet — add your first coffee
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Use Quick add above. One tap and it appears here.
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-4">
              {groups.map((group) =>
                group.rows.length === 0 ? null : (
                  <div key={group.name}>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase dark:text-slate-400">
                      {group.name}
                    </p>
                    <ul className="mt-1 divide-y divide-slate-100 dark:divide-white/10">
                      {group.rows.map((spend) => (
                        <li key={spend.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                              {spend.category}
                              {spend.note ? (
                                <span className="font-normal text-slate-500 dark:text-slate-400">
                                  {" "}
                                  · {spend.note}
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {dayLabel(spend.spentAt)} · {spend.paymentMethod}
                            </p>
                          </div>
                          <span className="numeric shrink-0 text-base font-bold text-slate-900 dark:text-white">
                            {pounds(spend.amountPence)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">How these figures are worked out</h2>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              • <strong>This month&apos;s spending</strong> adds up every spend you have logged with a date
              inside the current calendar month.
            </li>
            <li>
              • <strong>Your monthly budget</strong> comes from your own profile: your monthly income, less
              the share you said you want to keep. No income on file means no budget — never an invented
              one.
            </li>
            <li>
              • The <strong>budget banner</strong> appears once you have logged 80% or more of that budget.
              The <strong>habit banner</strong> appears when the same category is logged three or more
              times inside 24 hours.
            </li>
            <li>
              • Amounts are stored to the penny as whole pence, so nothing is rounded away. Alerts are
              information about your own entries, not advice.
            </li>
          </ul>
        </Card>

        <Disclaimer />
      </main>
      <Footer signedIn />
    </div>
  );
}

/**
 * Spending vs saving for the month, as two plain bars. Hand-rolled CSS on purpose:
 * it adds no dependency, renders identically at 360px, and is readable without a
 * legend (the label and amount sit on the bar).
 */
function MonthBars({
  spentPence,
  savedPence,
  incomePence,
}: {
  spentPence: number;
  savedPence: number;
  incomePence: number;
}) {
  const max = Math.max(spentPence, savedPence, 1);
  const rows = [
    { label: "Spent", pence: spentPence, colour: "bg-rose-500", track: "bg-rose-100 dark:bg-rose-500/20" },
    {
      label: "Saved",
      pence: savedPence,
      colour: "bg-emerald-600",
      track: "bg-emerald-100 dark:bg-emerald-500/20",
    },
  ];
  const total = spentPence + savedPence;

  return (
    <div className="mt-3 space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
            <span className="numeric font-bold text-slate-900 dark:text-white">{pounds(row.pence)}</span>
          </div>
          <div
            className={`mt-1 h-4 w-full overflow-hidden rounded-full ${row.track}`}
            role="img"
            aria-label={`${row.label}: ${pounds(row.pence)}`}
          >
            <div
              className={`h-full rounded-full ${row.colour}`}
              style={{ width: `${Math.max(2, (row.pence / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      {incomePence > 0 && total > 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Of {pounds(incomePence)} in, {Math.round((spentPence / incomePence) * 100)}% is logged as spent so
          far this month.
        </p>
      ) : null}
    </div>
  );
}
