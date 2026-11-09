import { useCallback, useEffect, useRef, useState } from "react";

import { Button, ErrorNote } from "~/components/ui";
import { IconBolt, IconCheck, IconGauge, IconTarget } from "~/components/icons";
import { age as fmtAge, moneyPence } from "~/lib/format";
import { NO_SLIDERS, type ScenarioDelta, type ScenarioNumbers, type Sliders } from "~/lib/scenario";
import { applyScenarioFn, scenarioPreviewFn } from "~/server/checkin";

/**
 * What-if sliders — a PREVIEW OVERLAY and nothing more.
 *
 * Every number here is computed on the server by `scenarioPreviewFn` from the
 * user's own stored rows plus the slider positions. The browser sends the slider
 * values and formats what comes back; it never does the arithmetic. Moving a
 * slider writes NOTHING — the profile row only changes when "Keep this" is
 * pressed, and "Reset" clears the overlay without touching anything.
 *
 * This is an illustration of assumptions the user chose. Not a prediction, not
 * advice, and never a promise.
 */

type Control = {
  key: keyof Sliders;
  label: string;
  hint: string;
  maxPence: number;
  stepPence: number;
};

type Props = {
  currency: string;
  /** The return assumption the chart is currently on (3–7%), re-checked on the server. */
  annualReturnPct: number;
  /** The largest spending cut that makes sense — the user's own monthly spending. */
  maxCutPence: number;
  /** Re-runs the dashboard loader after "Keep this". */
  onKept: () => Promise<void> | void;
};

export function WhatIf({ currency, annualReturnPct, maxCutPence, onKept }: Props) {
  const [sliders, setSliders] = useState<Sliders>(NO_SLIDERS);
  const [preview, setPreview] = useState<{
    current: ScenarioNumbers;
    estimate: ScenarioNumbers;
    delta: ScenarioDelta;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keeping, setKeeping] = useState(false);
  const [kept, setKept] = useState<{ fiAge: number | null } | null>(null);

  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controls: Control[] = [
    {
      key: "saveMorePence",
      label: "Save more",
      hint: "Extra you put by each month",
      maxPence: 100_000,
      stepPence: 500,
    },
    {
      key: "sideHustlePence",
      label: "Side-hustle income",
      hint: "Extra coming in each month",
      maxPence: 200_000,
      stepPence: 500,
    },
    {
      key: "cutSpendingPence",
      label: "Cut spending",
      hint: "Less going out each month",
      maxPence: Math.max(500, Math.min(100_000, Math.round(maxCutPence / 500) * 500)),
      stepPence: 500,
    },
    {
      key: "familySupportPence",
      label: "Family support",
      hint: "Money you send to family each month",
      maxPence: 200_000,
      stepPence: 500,
    },
  ];

  const run = useCallback(
    async (values: Sliders) => {
      const mine = ++seq.current;
      setLoading(true);
      setError("");
      try {
        const result = await scenarioPreviewFn({ data: { ...values, annualReturnPct } });
        if (mine !== seq.current) return; // a newer move has already been sent
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setPreview({
          current: result.current,
          estimate: result.estimate,
          delta: result.delta,
        });
      } catch {
        if (mine === seq.current) setError("Couldn't re-price that just now. Please try again.");
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    },
    [annualReturnPct],
  );

  // Debounced: the slider feels instant, the server does the maths.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void run(sliders);
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sliders, run]);

  const changed = Object.values(sliders).some((value) => value > 0);

  function move(key: keyof Sliders, pence: number) {
    setKept(null);
    setSliders((prev) => ({ ...prev, [key]: pence }));
  }

  function reset() {
    setKept(null);
    setError("");
    setSliders(NO_SLIDERS);
  }

  async function keep() {
    setKeeping(true);
    setError("");
    try {
      const result = await applyScenarioFn({ data: { ...sliders, annualReturnPct } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setKept({ fiAge: result.estimate.fiAge });
      setSliders(NO_SLIDERS);
      await onKept();
      await run(NO_SLIDERS);
    } catch {
      setError("Couldn't keep that. Please try again.");
    } finally {
      setKeeping(false);
    }
  }

  const estimate = preview?.estimate ?? null;
  const delta = preview?.delta ?? null;

  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-body">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill/12 text-accent">
            <IconGauge size={18} />
          </span>
          What if…
        </h2>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
          Preview
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Move a slider to see what it would do to your estimated freedom date. Nothing is saved until
        you press Keep this.
      </p>

      <div className="mt-3 space-y-3">
        {controls.map((control) => (
          <div key={control.key}>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`slider-${control.key}`} className="text-sm font-medium text-body">
                {control.label}
              </label>
              <span className="numeric shrink-0 text-sm font-bold text-accent">
                {moneyPence(sliders[control.key], currency)}
                <span className="text-[11px] font-medium text-muted">/mo</span>
              </span>
            </div>
            <input
              id={`slider-${control.key}`}
              type="range"
              min={0}
              max={control.maxPence}
              step={control.stepPence}
              value={Math.min(sliders[control.key], control.maxPence)}
              onChange={(e) => move(control.key, Number(e.target.value))}
              className="w-full accent-accent-fill"
            />
            <p className="mt-0.5 text-[11px] text-faint">{control.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-card border border-line bg-surface-2 p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
          <IconTarget size={14} className="text-accent" />
          Estimated, on these sliders
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <Stat
            label="Freedom date"
            value={
              estimate === null
                ? "…"
                : estimate.fiAge === null
                  ? "Not on this pace"
                  : `Age ${fmtAge(estimate.fiAge)}`
            }
            note={deltaNote(delta?.fiAgeYears ?? null, "sooner", "later", "same pace")}
            good={delta !== null && delta.fiAgeYears !== null && delta.fiAgeYears < 0}
          />
          <Stat
            label="Freedom number"
            value={estimate === null ? "…" : moneyPence(estimate.fiNumberPence, currency)}
            note={
              delta === null || delta.fiNumberPence === 0
                ? "unchanged"
                : `${moneyPence(Math.abs(delta.fiNumberPence), currency)} ${delta.fiNumberPence < 0 ? "lower" : "higher"}`
            }
            good={delta !== null && delta.fiNumberPence < 0}
          />
          <Stat
            label="Progress"
            value={estimate === null ? "…" : `${estimate.progressPct}%`}
            note={
              delta === null || delta.progressPct === 0
                ? "unchanged"
                : `${delta.progressPct > 0 ? "+" : "−"}${Math.abs(delta.progressPct)} pts`
            }
            good={delta !== null && delta.progressPct > 0}
          />
          <Stat
            label="Monthly gap"
            value={
              estimate === null
                ? "…"
                : estimate.monthlyGapPence === 0
                  ? "None"
                  : moneyPence(estimate.monthlyGapPence, currency)
            }
            note={
              delta === null || delta.monthlyGapPence === 0
                ? "unchanged"
                : `${moneyPence(Math.abs(delta.monthlyGapPence), currency)} ${delta.monthlyGapPence < 0 ? "less" : "more"} a month`
            }
            good={delta !== null && delta.monthlyGapPence < 0}
          />
        </div>

        {estimate !== null ? (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent-fill"
                style={{ width: `${Math.max(1, Math.min(100, estimate.progressPct))}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-faint">
              {moneyPence(estimate.monthlyGapPence, currency)} a month short of the pace that reaches
              your target age — on {annualReturnPct}% a year, with spending held at{" "}
              {moneyPence(estimate.effectiveSpendingPence, currency)}.
            </p>
          </div>
        ) : null}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {kept ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent-fill/12 p-3 text-sm font-medium text-accent">
          <IconCheck size={18} className="mt-0.5 shrink-0" />
          <span>
            Kept — this is now your profile. Estimated freedom date:{" "}
            <strong>{kept.fiAge === null ? "not on this pace" : `age ${fmtAge(kept.fiAge)}`}</strong>.
          </span>
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={!changed || keeping || loading}
          onClick={() => void keep()}
          className="min-h-12"
        >
          {keeping ? "Keeping…" : "Keep this"}
        </Button>
        <Button
          type="button"
          variant="light"
          disabled={!changed || keeping}
          onClick={reset}
          className="min-h-12"
        >
          Reset
        </Button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-faint">
        <IconBolt size={13} />
        An estimate on your assumptions, never a promise. Moving a slider saves nothing.
      </p>
    </section>
  );
}

function deltaNote(
  years: number | null,
  better: string,
  worse: string,
  same: string,
): string {
  if (years === null || years === 0) return same;
  const size = Math.abs(years) === 1 ? "1 year" : `${Math.abs(years)} years`;
  return `${size} ${years < 0 ? better : worse}`;
}

function Stat({
  label,
  value,
  note,
  good,
}: {
  label: string;
  value: string;
  note: string;
  good: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="numeric mt-0.5 text-base font-bold text-body">{value}</p>
      <p className={`mt-0.5 text-[11px] ${good ? "text-accent" : "text-faint"}`}>{note}</p>
    </div>
  );
}
