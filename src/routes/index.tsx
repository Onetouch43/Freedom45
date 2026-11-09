import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { PathChart } from "~/components/PathChart";
import { Card, Disclaimer } from "~/components/ui";
import { project } from "~/lib/projection";
import { age } from "~/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freedom45 — the age your money gets you free" },
      {
        name: "description",
        content:
          "Turn the numbers you already know into a live plan: see the age your current pace reaches financial independence by about 45. Free, about a minute to set up.",
      },
    ],
  }),
  component: Landing,
});

const SAMPLE = project({
  currentAge: 25,
  targetAge: 45,
  currentSavings: 2000,
  monthlyIncome: 2600,
  monthlySpending: 2200,
  annualReturnPct: 5,
});

const STEPS = [
  {
    n: "1",
    title: "Type in six numbers",
    body: "What you earn, what you spend, what you've saved, your free hours each week. About 60 seconds — no bank login, no spreadsheet.",
  },
  {
    n: "2",
    title: "See your Path to 45",
    body: "One clear line: the age your current pace reaches financial freedom, and the balance you'd be sitting on along the way. Every assumption is written on the screen.",
  },
  {
    n: "3",
    title: "Keep it honest",
    body: "Update your numbers whenever they change. Freedom45 tracks the trend so you can see whether you're moving closer or drifting.",
  },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-page">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="pt-10 pb-8 text-center sm:pt-16">
          <p className="mb-3 inline-block rounded-full bg-accent-fill/20 px-3 py-1 text-xs font-semibold text-accent">
            For anyone starting out after university
          </p>
          <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-body sm:text-5xl">
            Be free of the 9–5 <span className="text-accent">by 45.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            Your first salary feels small — but the years ahead are the ones that count most.
            Freedom45 turns the numbers you already know into a live plan: the age your current pace
            gets you to, and what your own free hours could do to it.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="w-full rounded-xl bg-accent-fill px-6 py-3.5 text-center text-base font-semibold text-on-accent hover:bg-accent-fill-hover sm:w-auto"
            >
              Start free — 60 seconds
            </Link>
            <Link
              to="/login"
              className="w-full rounded-xl px-6 py-3.5 text-center text-base font-medium text-muted hover:bg-surface-2 sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Email and password only. No card, no bank connection.
          </p>
        </section>

        <Card className="mb-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-body">
              What the dashboard shows
            </h2>
            <span className="text-[11px] font-medium text-muted">
              Example data, not yours
            </span>
          </div>
          <div className="mt-2 text-body">
            <p className="text-2xl font-black tracking-tight text-body">
              Age {age(SAMPLE.fiAge ?? 45)}
            </p>
            <p className="text-xs text-muted">
              the age this example pace reaches freedom, assuming a 5% yearly return
            </p>
          </div>
          <PathChart
            points={SAMPLE.points}
            fiNumber={SAMPLE.fiNumber}
            targetAge={45}
            fiAge={SAMPLE.fiAge}
            currency="GBP"
          />
          <p className="mt-1 text-[11px] text-muted">
            Illustration: someone 25, earning £2,600 a month, spending £2,200, with £2,000 saved,
            investing the difference at 5% a year. Real returns vary and can be negative.
          </p>
        </Card>

        <section id="how" className="mb-10 scroll-mt-16">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-body">
            How it works
          </h2>
          <ol className="space-y-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-3 rounded-card border border-line bg-surface p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-fill text-sm font-black text-on-accent">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-semibold text-body">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-8 rounded-card border border-line bg-surface p-6 text-center">
          <h2 className="text-xl font-bold text-body">One minute now, a plan you can keep.</h2>
          <Link
            to="/signup"
            className="mt-4 inline-block rounded-xl bg-accent-fill px-6 py-3 font-semibold text-on-accent hover:bg-accent-fill-hover"
          >
            Start free
          </Link>
        </section>

        <Disclaimer />

        <p className="mt-6 text-center text-xs text-muted">
          Freedom45 gives general information about money — not financial advice.
        </p>
      </main>
      <Footer signedIn={false} />
    </div>
  );
}
