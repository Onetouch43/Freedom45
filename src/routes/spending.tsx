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
  "w-full min-h-12 rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

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
      <div className="min-h-dvh bg-page">
        <Header signedIn />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Card>
            <h1 className="text-lg font-bold text-body">Spending isn&apos;t available yet</h1>
            <p className="mt-1.5 text-sm text-muted">
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
    <div className="min-h-dvh bg-page">
      <Header signedIn />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-body">Spending</h1>
          <p className="mt-1 text-sm text-muted">
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
 ? "border-danger/40 bg-danger-fill/14 text-danger "
 : "border-warn/40 bg-warn-fill/12 text-warn "
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
          <div className="rounded-2xl border border-line-strong bg-surface p-3.5 text-body">
            <p className="flex items-center gap-2 text-base font-bold text-body">
              <IconInfo size={18} />
              Finish your numbers to see a budget
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              A monthly budget is worked out from the income on your profile. There&apos;s no income on
              file yet, so we won&apos;t invent one — add it and the budget alert starts working.
            </p>
            <Link
              to="/dashboard"
              className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-body"
            >
              Add my income
              <IconArrowRight size={16} />
            </Link>
          </div>
        ) : null}

        {/* ------------------------------------------------------ quick add */}
        <Card>
          <h2 className="flex items-center gap-2 text-sm font-bold text-body">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill/12 text-accent">
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
              <legend className="mb-1.5 block text-sm font-medium text-body">
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
 ? "border-accent-fill bg-accent-fill text-on-accent"
 : "border-line-strong bg-surface text-body "
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
              <p className="flex items-center gap-2 rounded-xl bg-accent-fill/12 p-3 text-sm font-medium text-accent">
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
          <h2 className="flex items-center gap-2 text-sm font-bold text-body">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill/12 text-accent">
              <IconTrendUp size={18} />
            </span>
            This month: spending vs saving
          </h2>

          <MonthBars spentPence={month.spentPence} savedPence={month.savedPence} incomePence={month.incomePence} />

          <p className="mt-3 text-xs leading-relaxed text-muted">
            {month.incomePence > 0
              ? `Day ${month.daysElapsed} of ${month.daysInMonth}. Spending is what you've logged this month; saving is your monthly income minus that.`
              : "Spending is what you've logged this month. Add your income on the dashboard to see the saving side too."}
          </p>
        </Card>

        {/* -------------------------------------------------------- insight */}
        <Card>
          <h2 className="text-sm font-bold text-body">This week vs last week</h2>
          {data.insight ? (
            <p className="mt-2 text-sm leading-relaxed text-body">{data.insight}</p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Nothing to compare yet — log a few spends over the next week and this line tells you which
              category moved.
            </p>
          )}
        </Card>

        {/* ----------------------------------------------------------- list */}
        <Card>
          <h2 className="text-sm font-bold text-body">Recent spends</h2>
          {data.spends.length === 0 ? (
            <div className="mt-2 rounded-xl bg-page p-4 text-center">
              <p className="text-base font-semibold text-body">
                No spends yet — add your first coffee
              </p>
              <p className="mt-1 text-sm text-muted">
                Use Quick add above. One tap and it appears here.
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-4">
              {groups.map((group) =>
                group.rows.length === 0 ? null : (
                  <div key={group.name}>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                      {group.name}
                    </p>
                    <ul className="mt-1 divide-y divide-line">
                      {group.rows.map((spend) => (
                        <li key={spend.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-body">
                              {spend.category}
                              {spend.note ? (
                                <span className="font-normal text-muted">
                                  {" "}
                                  · {spend.note}
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted">
                              {dayLabel(spend.spentAt)} · {spend.paymentMethod}
                            </p>
                          </div>
                          <span className="numeric shrink-0 text-base font-bold text-body">
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
          <h2 className="text-sm font-bold text-body">How these figures are worked out</h2>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
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
    { label: "Spent", pence: spentPence, colour: "bg-danger-fill", track: "bg-danger-fill/20 " },
    {
      label: "Saved",
      pence: savedPence,
      colour: "bg-accent-fill",
      track: "bg-accent-fill/20 ",
    },
  ];
  const total = spentPence + savedPence;

  return (
    <div className="mt-3 space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-body">{row.label}</span>
            <span className="numeric font-bold text-body">{pounds(row.pence)}</span>
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
        <p className="text-xs text-muted">
          Of {pounds(incomePence)} in, {Math.round((spentPence / incomePence) * 100)}% is logged as spent so
          far this month.
        </p>
      ) : null}
    </div>
  );
}
