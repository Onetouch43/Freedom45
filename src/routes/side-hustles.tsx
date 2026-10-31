import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { DbNotice } from "~/components/DbNotice";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, Disclaimer, ErrorNote } from "~/components/ui";
import {
  IconArrowRight,
  IconBolt,
  IconBookmark,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCoin,
  IconFilter,
  IconRocket,
} from "~/components/icons";
import {
  COST_LABELS,
  HUSTLE_BY_KEY,
  INCOME_CAVEAT,
  SIDE_HUSTLES,
  SPEED_LABELS,
  TAG_LABELS,
  type SideHustle,
} from "~/data/side-hustles";
import { matchHustles, type Match } from "~/lib/matcher";
import { FIELDS, HOURS, SKILLS } from "~/lib/options";
import { hustlePageFn, removeHustleFn, saveHustleFn, sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/side-hustles")({
  head: () => ({ meta: [{ title: "Side hustles that suit you — Freedom45" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    // Private, like the dashboard — but with no database connected there is no
    // way to hold a session, so the list stays visible instead of dead-ending
    // everyone at the login screen.
    if (!user && dbConnected) throw redirect({ to: "/login" });
    return { signedIn: Boolean(user), dbConnected };
  },
  loader: async ({ context }) => {
    if (!context.dbConnected || !context.signedIn) return null;
    const data = await hustlePageFn();
    if (!data.signedIn) throw redirect({ to: "/login" });
    return data;
  },
  component: SideHustles,
});

const FALLBACK_HOURS = 8;
const STRETCH_PREVIEW = 4;
const BEST_PREVIEW = 8;

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
    on
      ? "bg-accent-fill text-on-accent  "
      : "bg-surface-2 text-body hover:bg-surface-2   "
  }`;

function SideHustles() {
  const { signedIn, dbConnected } = Route.useRouteContext();
  const data = Route.useLoaderData();
  const profile = data?.profile ?? null;

  const [hours, setHours] = useState<number>(profile?.hoursFreePerWeek || FALLBACK_HOURS);
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [field, setField] = useState<string>(profile?.field ?? "");
  const [query, setQuery] = useState("");
  const [savedKeys, setSavedKeys] = useState<string[]>(data?.savedKeys ?? []);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [dbNotice, setDbNotice] = useState(!dbConnected);
  const [showAllStretch, setShowAllStretch] = useState(false);
  const [showAllBest, setShowAllBest] = useState(false);

  const save = useServerFn(saveHustleFn);
  const remove = useServerFn(removeHustleFn);

  const result = useMemo(
    () => matchHustles({ hours, skills, field, query }),
    [hours, skills, field, query],
  );
  // Used only for the empty state: what a couple more hours a week would open up.
  const wider = useMemo(
    () => matchHustles({ hours: hours + 4, skills, field, query }),
    [hours, skills, field, query],
  );

  const saved = new Set(savedKeys);
  const savedHustles = savedKeys.map((key) => HUSTLE_BY_KEY[key]).filter(Boolean);
  const profileUsed = Boolean(profile);
  const onProfileSettings =
    hours === (profile?.hoursFreePerWeek || FALLBACK_HOURS) &&
    field === (profile?.field ?? "") &&
    query === "" &&
    skills.length === (profile?.skills ?? []).length &&
    skills.every((s) => (profile?.skills ?? []).includes(s));

  async function toggle(key: string, saveIt: boolean) {
    if (!dbConnected) {
      setDbNotice(true);
      setError("Nothing was saved — there's nowhere to store it yet. Saving starts working as soon as the connection is added.");
      return;
    }
    setBusyKey(key);
    setError("");
    try {
      const res = saveIt ? await save({ data: { key } }) : await remove({ data: { key } });
      if (res.ok) {
        setSavedKeys((prev) =>
          saveIt ? Array.from(new Set([...prev, key])) : prev.filter((k) => k !== key),
        );
      } else if (res.reason === "db-not-connected") {
        setDbNotice(true);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't save that just now. Please try again.");
    } finally {
      setBusyKey("");
    }
  }

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const reset = () => {
    setHours(profile?.hoursFreePerWeek || FALLBACK_HOURS);
    setSkills(profile?.skills ?? []);
    setField(profile?.field ?? "");
    setQuery("");
    setShowAllStretch(false);
  };

  const stretch = showAllStretch ? result.stretch : result.stretch.slice(0, STRETCH_PREVIEW);
  const best = showAllBest ? result.best : result.best.slice(0, BEST_PREVIEW);
  const nothing = result.best.length === 0 && result.stretch.length === 0;

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-body">
            Side hustles you could run
          </h1>
          <p className="mt-1 text-sm text-muted">
            {profileUsed
              ? "Starting from what you told us in onboarding. Change any filter to look further afield."
              : "Pick your free time and skills below — nothing you pick here is saved unless you save a hustle."}
          </p>
        </div>

        {dbNotice ? <DbNotice what="your saved hustles" /> : null}

        {profileUsed && !profile?.onboardedAt ? (
          <Card className="text-sm text-muted">
            Finish <Link to="/onboarding" className="font-semibold text-accent underline">onboarding</Link>{" "}
            and these filters will start from your saved answers.
          </Card>
        ) : null}

        {/* ------------------------------------------------------------ filters */}
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-body">Your filters</h2>
            {!onProfileSettings ? (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {profileUsed ? "Back to my profile" : "Clear filters"}
              </button>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="hours" className="text-sm font-medium text-body">
              Free hours a week: <span className="font-bold text-body">{hours}</span>
              {profile?.hoursFreePerWeek ? (
                <span className="ml-1 text-xs text-muted">
                  (you said {profile.hoursFreePerWeek})
                </span>
              ) : null}
            </label>
            <input
              id="hours"
              type="range"
              min={1}
              max={30}
              step={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-2 w-full accent-accent-fill"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HOURS.map((h) => (
                <button key={h} type="button" onClick={() => setHours(h)} className={chip(hours === h)}>
                  {h} hrs
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-body">
              What you&apos;re good at
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={chip(skills.includes(skill))}
                >
                  {skill}
                </button>
              ))}
            </div>
            {(profile?.skills?.length ?? 0) > 0 ? (
              <p className="mt-2 text-xs text-muted">
                From your profile: {profile?.skills.join(", ")}. Tap to add or remove.
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <label htmlFor="field" className="text-sm font-medium text-body">
              Your field
            </label>
            <select
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body"
            >
              <option value="">Any field — don&apos;t use my job</option>
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="search" className="text-sm font-medium text-body">
              Search the list
            </label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. writing, gardens, weekends"
              className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body placeholder:text-faint"
            />
          </div>
        </Card>

        <ErrorNote>{error}</ErrorNote>

        {savedHustles.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-body">
              My hustles ({savedHustles.length})
            </h2>
            {savedHustles.map((hustle) => (
              <Card key={hustle.key} className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-body">{hustle.title}</h3>
                  <p className="mt-0.5 text-xs text-muted">{hustle.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="light"
                  className="!px-3 !py-2 !text-xs"
                  disabled={busyKey === hustle.key}
                  onClick={() => void toggle(hustle.key, false)}
                >
                  Remove
                </Button>
              </Card>
            ))}
          </section>
        ) : null}

        {nothing ? (
          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-body">
              Nothing matches those filters
            </h2>
            <p className="text-sm text-muted">
              That happens with narrow filters rather than because there&apos;s nothing here. The list has{" "}
              {SIDE_HUSTLES.length} hustles in it.
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>
                • More free time helps most: at {hours + 4} hrs/week instead of {hours},{" "}
                {wider.all.length > 0
                  ? `${wider.all.length} option${wider.all.length === 1 ? "" : "s"} would show up.`
                  : "still nothing matches — try a different search word."}
              </li>
              <li>• Untick some skills. Matching on seven skills at once is very narrow.</li>
              <li>• Set your field back to “Any field” to drop the job filter.</li>
              <li>• Search a single plain word, like “dogs” or “garden”.</li>
            </ul>
            <Button type="button" variant="light" onClick={reset} className="w-full">
              {profileUsed ? "Back to my profile" : "Clear filters"}
            </Button>
          </Card>
        ) : null}

        {result.best.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-body">
              Best fit ({result.best.length})
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Closest matches first — based on your free hours, your skills and your field.
            </p>
            {best.map((match) => (
              <HustleCard
                key={match.hustle.key}
                match={match}
                saved={saved.has(match.hustle.key)}
                busy={busyKey === match.hustle.key}
                onToggle={toggle}
              />
            ))}
            {result.best.length > best.length ? (
              <Button
                type="button"
                variant="light"
                className="w-full"
                onClick={() => setShowAllBest(true)}
              >
                Show {result.best.length - best.length} more
              </Button>
            ) : null}
          </section>
        ) : null}

        {result.stretch.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-body">
                Also possible if you stretch ({result.stretch.length})
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Either they want a bit more time than you have, or there&apos;s no obvious overlap with
                your skills — worth a look, not a natural fit.
              </p>
            </div>
            {stretch.map((match) => (
              <HustleCard
                key={match.hustle.key}
                match={match}
                saved={saved.has(match.hustle.key)}
                busy={busyKey === match.hustle.key}
                onToggle={toggle}
              />
            ))}
            {result.stretch.length > stretch.length ? (
              <Button
                type="button"
                variant="light"
                className="w-full"
                onClick={() => setShowAllStretch(true)}
              >
                Show {result.stretch.length - stretch.length} more
              </Button>
            ) : null}
          </section>
        ) : null}

        <Disclaimer />
      </main>
      <Footer signedIn={signedIn} />
    </div>
  );
}

function HustleCard({
  match,
  saved,
  busy,
  onToggle,
}: {
  match: Match;
  saved: boolean;
  busy: boolean;
  onToggle: (key: string, save: boolean) => Promise<void>;
}) {
  const hustle: SideHustle = match.hustle;
  return (
    <Card className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold tracking-tight text-body">
          {hustle.title}
        </h3>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onToggle(hustle.key, !saved)}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
 saved
 ? "bg-accent-fill/12 text-accent hover:bg-accent-fill/20 "
 : "bg-accent-fill text-on-accent hover:bg-accent-fill-hover"
 } disabled:opacity-50`}
        >
          {busy ? "…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <p className="text-sm text-muted">{hustle.summary}</p>

      <ul className="space-y-1">
        {match.reasons.map((reason) => (
          <li key={reason} className="text-xs text-accent">
            ✓ {reason}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-body">
          {COST_LABELS[hustle.cost]}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-body">
          {SPEED_LABELS[hustle.speed]}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-body">
          {hustle.hoursMin}–{hustle.hoursMax} hrs/week
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        <span className="font-semibold text-body">What it involves: </span>
        {hustle.involves}
      </p>

      <p className="rounded-xl bg-warn-fill/12 p-2.5 text-xs leading-relaxed text-warn">
        <span className="font-semibold">What it isn&apos;t: </span>
        {hustle.notFor}
      </p>

      <p className="text-[11px] leading-relaxed text-muted">
        Suits: {hustle.fits.map((tag) => TAG_LABELS[tag]).join(", ")}. Typical money for a new starter:{" "}
        <span className="font-semibold">{hustle.income}</span>. {INCOME_CAVEAT}
      </p>
    </Card>
  );
}
