import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { DbNotice } from "~/components/DbNotice";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, Disclaimer, ErrorNote, Label } from "~/components/ui";
import { CURRENCIES } from "~/lib/format";
import {
  FIELDS as FIELD_OPTIONS,
  HOURS as HOUR_OPTIONS,
  SKILLS as SKILL_OPTIONS,
} from "~/lib/options";
import {
  DEFAULT_ONBOARDING,
  saveOnboardingFn,
  sessionUserFn,
  type OnboardingInput,
} from "~/server/actions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your Path to 45" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    if (!user) throw redirect({ to: "/login" });
    return { signedIn: true, dbConnected };
  },
  component: Onboarding,
});

const FIELDS = FIELD_OPTIONS;

const SKILLS = SKILL_OPTIONS;

const HOURS = HOUR_OPTIONS;

const STEP_TITLES = [
  "About you",
  "Your free time",
  "What you're good at",
  "Money in and out",
  "What you've saved",
  "Your target age",
  "Before you start",
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white";

function Onboarding() {
  const { signedIn, dbConnected } = Route.useRouteContext();
  const navigate = useNavigate();
  const save = useServerFn(saveOnboardingFn);
  const [form, setForm] = useState<OnboardingInput>(DEFAULT_ONBOARDING);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [ageOk, setAgeOk] = useState(false);

  const update = <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSkill = (skill: string) =>
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));

  const last = step === STEP_TITLES.length - 1;

  async function submit() {
    // Nothing is written without both confirmations; the server refuses too.
    if (!consent || !ageOk) {
      setError(
        "Please confirm you are 18 or over and agree to the Terms and Privacy Policy before saving.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await save({ data: { ...form, consent, ageConfirmed: ageOk } });
      if (result.ok) {
        await navigate({ to: "/dashboard", replace: true });
      } else {
        setError(result.message);
      }
    } catch {
      setError("Couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!dbConnected || !signedIn) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
        <Header signedIn={signedIn} />
        <main className="mx-auto max-w-md space-y-4 px-4 py-8">
          <DbNotice what="your plan" />
        </main>
      </div>
    );
  }

  const progress = Math.round(((step + 1) / STEP_TITLES.length) * 100);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header signedIn />
      <main className="mx-auto max-w-md px-4 py-6">
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>
              Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            {step === 0 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  What do you do right now?
                </h1>
                <div>
                  <Label htmlFor="field">Your field</Label>
                  <select
                    id="field"
                    value={form.field}
                    onChange={(e) => update("field", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose one…</option>
                    {FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="profession">Job title (optional)</Label>
                  <input
                    id="profession"
                    value={form.profession}
                    onChange={(e) => update("profession", e.target.value)}
                    placeholder="e.g. junior designer"
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    className={inputClass}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  How many hours a week could you put towards something of your own?
                </h1>
                <div className="grid grid-cols-3 gap-2">
                  {HOURS.map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => update("hoursFreePerWeek", hours)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                        form.hoursFreePerWeek === hours
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                      }`}
                    >
                      {hours} hrs
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A rough guess is fine — you can change it later. Most people start with 4–8.
                </p>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  What are you good at?
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Tap anything that sounds like you — or skip it.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => {
                    const on = form.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                          on
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <Label htmlFor="extra">Anything else? (optional)</Label>
                  <input
                    id="extra"
                    value={form.skills.filter((s) => !SKILLS.includes(s)).join(", ")}
                    onChange={(e) =>
                      update("skills", [
                        ...form.skills.filter((s) => SKILLS.includes(s)),
                        ...e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      ])
                    }
                    placeholder="e.g. guitar, Spanish"
                    className={inputClass}
                  />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Money in, money out
                </h1>
                <div>
                  <Label htmlFor="income">What comes in each month (after tax)</Label>
                  <input
                    id="income"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.monthlyIncome}
                    onChange={(e) => update("monthlyIncome", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="spending">What you spend each month</Label>
                  <input
                    id="spending"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.monthlySpending}
                    onChange={(e) => update("monthlySpending", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rough monthly averages are enough. Everything stays on your own account.
                </p>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  What have you saved so far?
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Savings and investments you could put towards being free — a rough number is fine.
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label="Current savings"
                  value={form.currentSavings}
                  onChange={(e) => update("currentSavings", Number(e.target.value))}
                  className={inputClass}
                />
              </>
            ) : null}

            {step === 5 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  When do you want to be free?
                </h1>
                <div>
                  <Label htmlFor="age">How old are you now?</Label>
                  <input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    min={16}
                    max={80}
                    value={form.currentAge}
                    onChange={(e) => update("currentAge", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="targetAge">The age you&apos;re aiming for</Label>
                  <input
                    id="targetAge"
                    type="number"
                    inputMode="numeric"
                    min={20}
                    max={90}
                    value={form.targetFreedomAge}
                    onChange={(e) => update("targetFreedomAge", Number(e.target.value))}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Default is 45 — change it if you like.
                  </p>
                </div>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Before you start</h1>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Two ticks, then we build your path. You can delete everything later in Settings.
                </p>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3 dark:border-white/15">
                  <input
                    type="checkbox"
                    checked={ageOk}
                    onChange={(e) => setAgeOk(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    I confirm I am 18 or over and live in the UK.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3 dark:border-white/15">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold underline underline-offset-2">
                      Terms of Service
                    </Link>{" "}
                    and the{" "}
                    <Link to="/privacy" className="font-semibold underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    , and I understand Freedom45 gives educational estimates only and is not
                    financial advice.
                  </span>
                </label>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Freedom45 provides educational estimates only. Not financial, investment, or tax
                  advice.
                </p>
              </>
            ) : null}

            <ErrorNote>{error}</ErrorNote>

            <div className="flex items-center gap-2 pt-1">
              {step > 0 ? (
                <Button type="button" variant="light" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  Back
                </Button>
              ) : null}
              {last ? (
                <Button
                  type="button"
                  disabled={busy || !consent || !ageOk}
                  onClick={() => void submit()}
                  className="flex-1"
                >
                  {busy ? "Building your path…" : "See my Path to 45"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
                  className="flex-1"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Disclaimer className="mt-4" compact />
      </main>
      <Footer signedIn />
    </div>
  );
}
