import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Card, Disclaimer } from "~/components/ui";
import { IconArrowRight, ICONS } from "~/components/icons";

export const Route = createFileRoute("/investments")({
  head: () => ({ meta: [{ title: "Investments — Freedom45" }] }),
  component: InvestmentsPage,
});

/**
 * The investment library is NOT built. This page is an honest signpost: it
 * describes what will live here and states that nothing on it is a
 * recommendation. It deliberately names no provider and no product.
 */
function InvestmentsPage() {
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl space-y-3.5 px-4 py-5 pb-24 sm:space-y-4 sm:py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Investments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            The investment library isn&apos;t built yet. This page explains what is coming — it does not
            recommend anything.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-100">
          <p className="flex items-center gap-2 text-base font-bold">
            <ICONS.investments size={18} />
            Coming soon
          </p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">
            Nothing here picks a product or tells you what to buy. When it ships it will be neutral
            information with sources and dates.
          </p>
        </div>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">What will live here</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              • <strong>UK wrappers explained</strong> — Individual Savings Accounts, workplace pensions
              and personal pensions, in plain English, with the current rules sourced and dated.
            </li>
            <li>
              • <strong>Risk and time horizon</strong> — what volatility means over decades, and why a
              long horizon is not the same as a guarantee.
            </li>
            <li>
              • <strong>Compounding, worked through</strong> — the arithmetic behind the estimate on your
              dashboard, so you can check it yourself.
            </li>
            <li>
              • <strong>Fees</strong> — how a yearly percentage charge compounds against you, with a
              worked example.
            </li>
            <li>
              • <strong>Where to check the rules yourself</strong> — links to GOV.UK, MoneyHelper and the
              regulator, each with the date it was checked.
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">What it will never do</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>• Name a fund or platform as the one to choose.</li>
            <li>• Predict what markets will do.</li>
            <li>• Replace regulated advice about your own circumstances.</li>
          </ul>
          <Link
            to="/guide"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 text-sm font-semibold text-slate-800 dark:bg-white/10 dark:text-white"
          >
            Read the user guide
            <IconArrowRight size={16} />
          </Link>
        </Card>

        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
