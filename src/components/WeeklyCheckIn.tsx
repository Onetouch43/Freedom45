import { useState } from "react";

import { Button, ErrorNote } from "~/components/ui";
import { IconCheckCircle, IconClock, IconCoin, IconWallet } from "~/components/icons";
import { age as fmtAge, moneyPence, shortDate } from "~/lib/format";
import type { CheckInState, ScenarioNumbers } from "~/lib/scenario";
import { weeklyCheckInFn } from "~/server/checkin";

/**
 * "Did you save this week?" — the whole weekly ritual, in one tap.
 *
 * The suggested amount is worked out on the server from the user's own stored
 * numbers (their monthly surplus ÷ 4.33, or their last check-in). Tapping accepts
 * it; the two alternatives are "Not this week" and an editable amount. Nothing is
 * invented: with no income on file the card asks for the numbers instead.
 *
 * This is a record of what the user typed in. It is not advice and it is never a
 * promise about the future.
 */

type Props = {
  state: CheckInState & { estimate: ScenarioNumbers };
  currency: string;
  /** Opens the "Your numbers" form further down the page. */
  onAddNumbers: () => void;
  /** Re-runs the dashboard loader so the estimate above re-prices immediately. */
  onSaved: () => Promise<void> | void;
};

type Done = {
  amountPence: number;
  savingsPence: number;
  fiAge: number | null;
  wasAge: number | null;
  notThisWeek: boolean;
};

export function WeeklyCheckIn({ state, currency, onAddNumbers, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState("");

  const suggestion = state.suggestionPence;
  const wasAge = state.estimate.fiAge;

  async function submit(pence: number, notThisWeek = false) {
    setBusy(true);
    setError("");
    try {
      const result = await weeklyCheckInFn({
        data: notThisWeek ? { notThisWeek: true } : { amountPence: pence },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone({
        amountPence: result.amountPence,
        savingsPence: result.savingsPence,
        fiAge: result.estimate.fiAge,
        wasAge,
        notThisWeek,
      });
      setCustom(false);
      setAmount("");
      await onSaved();
    } catch {
      setError("Couldn't save that check-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function submitCustom() {
    const pence = Math.round(Number(String(amount).replace(/[£,\s]/g, "")) * 100);
    if (!Number.isFinite(pence) || pence <= 0) {
      setError("Enter an amount in pounds, for example 25 or 25.50.");
      return;
    }
    void submit(pence);
  }

  return (
    <section className="rounded-card border border-accent/40 bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-body">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill/12 text-accent">
            <IconWallet size={18} />
          </span>
          Did you save this week?
        </h2>
        {state.checkedInThisWeek && !done ? (
          <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
            Checked in
          </span>
        ) : null}
      </div>

      {done ? (
        <div className="mt-3">
          <p className="flex items-start gap-2 rounded-xl bg-accent-fill/12 p-3 text-sm font-medium text-accent">
            <IconCheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>
              {done.notThisWeek
                ? "Noted — nothing added this week."
                : `Checked in — ${moneyPence(done.amountPence, currency)} added.`}{" "}
              <span className="font-normal text-body">
                Your balance is now {moneyPence(done.savingsPence, currency)}.
              </span>
            </span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Estimated freedom date:{" "}
            <strong className="text-body">
              {done.fiAge === null ? "not on this pace" : `age ${fmtAge(done.fiAge)}`}
            </strong>
            {done.fiAge !== null && done.wasAge !== null && done.fiAge !== done.wasAge ? (
              <>
                {" "}
                (it was age {fmtAge(done.wasAge)} a moment ago)
              </>
            ) : null}
            . The estimate above has been re-priced.
          </p>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="mt-3 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-accent hover:text-body"
          >
            Check in again
          </button>
        </div>
      ) : state.needsNumbers ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            There&apos;s no income on your profile yet, so there&apos;s nothing honest to suggest here.
            Add what comes in and goes out each month and this card will work the suggestion out from
            your own numbers.
          </p>
          <Button type="button" onClick={onAddNumbers} className="mt-3 w-full">
            Add my numbers
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {suggestion !== null && state.basis === "surplus" ? (
              <>
                Your own numbers leave about{" "}
                <strong className="text-body">{moneyPence(state.monthlySurplusPence, currency)}</strong>{" "}
                a month over — that&apos;s roughly{" "}
                <strong className="text-body">{moneyPence(suggestion, currency)}</strong> a week. Did
                anything get put by?
              </>
            ) : suggestion !== null ? (
              <>
                Last time you checked in, the difference was{" "}
                <strong className="text-body">{moneyPence(suggestion, currency)}</strong>. Same again
                this week?
              </>
            ) : (
              <>
                On your numbers nothing is left over each month at the moment, so there&apos;s no
                amount to suggest. If you did put something by, type it in — otherwise tap “Not this
                week”.
              </>
            )}
          </p>

          <div className="mt-3 space-y-2">
            {suggestion !== null ? (
              <Button
                type="button"
                disabled={busy}
                onClick={() => void submit(suggestion)}
                className="min-h-12 w-full"
              >
                <IconCoin size={18} />
                <span className="ml-2">
                  {busy ? "Saving…" : `Yes — I saved ${moneyPence(suggestion, currency)}`}
                </span>
              </Button>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="light"
                disabled={busy}
                onClick={() => void submit(0, true)}
                className="min-h-12"
              >
                {busy ? "Saving…" : "Not this week"}
              </Button>
              <Button
                type="button"
                variant="light"
                disabled={busy}
                onClick={() => {
                  setCustom((v) => !v);
                  setError("");
                }}
                className="min-h-12"
              >
                {custom ? "Hide amount" : "Another amount"}
              </Button>
            </div>

            {custom ? (
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <label htmlFor="checkin-amount" className="mb-1.5 block text-sm font-medium text-body">
                  How much did you save, in pounds?
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkin-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={amount}
                    placeholder="25"
                    onChange={(e) => setAmount(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <Button type="button" disabled={busy} onClick={submitCustom} className="min-h-12 shrink-0">
                    Save
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <ErrorNote>{error}</ErrorNote>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
            <IconClock size={13} />
            One tap adds a check-in and re-prices the estimate above.
            {state.lastCheckInAt
              ? ` Last check-in: ${shortDate(state.lastCheckInAt)}.`
              : " This will be your first check-in."}
          </p>
        </>
      )}
    </section>
  );
}
