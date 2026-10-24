import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Card, Disclaimer } from "~/components/ui";
import { IconArrowRight, ICONS } from "~/components/icons";

export const Route = createFileRoute("/family")({
  head: () => ({ meta: [{ title: "Family Mode — Freedom45" }] }),
  component: FamilyPage,
});

/**
 * Family Mode is NOT built. This page says so plainly and describes what will
 * live here, so nobody mistakes an unbuilt tab for a working feature.
 */
function FamilyPage() {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 pb-24 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Family Mode
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Not built yet — this is a signpost, not a feature. Nothing on this page calculates anything.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100">
          <p className="flex items-center gap-2 text-base font-bold">
            <ICONS.family size={18} />
            Coming soon
          </p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">
            Family Mode is on the roadmap. Your dashboard and Spending Tracker work today and are
            unaffected.
          </p>
        </div>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">What will live here</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              • <strong>Your household</strong> — a spouse or partner, children and parents, added once
              and reused.
            </li>
            <li>
              • <strong>Personal FI vs Family FI</strong> — two estimated dates side by side, so the
              difference between your own number and the household&apos;s is visible rather than hidden.
            </li>
            <li>
              • <strong>The trade-off, shown honestly</strong> — what a change in household spending or
              income does to the estimated date, as a range of assumptions rather than a promise.
            </li>
            <li>
              • <strong>Shared costs</strong> — housing, childcare and family support logged in the same
              hand-typed way as the Spending Tracker. No bank logins.
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">While you wait</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Log what you spend today and your Path to 45 estimate moves with it — that part is live now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/spending"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white"
            >
              Log a spend
              <IconArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-800 dark:bg-white/10 dark:text-white"
            >
              See my Path to 45
            </Link>
          </div>
        </Card>

        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
