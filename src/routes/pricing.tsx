import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, Disclaimer, ErrorNote } from "~/components/ui";
import {
  COMPANY_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  REGISTERED_ADDRESS,
} from "~/lib/company";
import { sessionUserFn } from "~/server/actions";
import { entitlementFn, restorePurchaseFn } from "~/server/entitlement";
import { createCheckoutSessionFn } from "~/server/stripe";

/** Shown when checkout cannot start — the server sends the same wording. */
const PAYMENTS_OFF = "Payments aren't switched on yet — please try again shortly.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Freedom45" },
      {
        name: "description",
        content:
          "Freedom45 is free for the FI calculator, your Path to 45 projection, a basic tracker and the whole investment library. The paid plan is £6 a month or £59 a year and adds Family Mode, what-if scenarios and no ads.",
      },
    ],
  }),
  beforeLoad: async () => {
    const [{ user }, entitlement] = await Promise.all([
      sessionUserFn().catch(() => ({ user: null })),
      entitlementFn().catch(() => null),
    ]);
    return {
      signedIn: Boolean(user),
      paid: Boolean(entitlement?.paid),
      paidUntil: entitlement?.paidUntil ?? null,
    };
  },
  component: PricingPage,
});

/** What the paid tier adds. Same list the business plan sets out. */
// The investment library is deliberately NOT on this list: it is free for everyone
// at launch (best thing on the site, first impressions, search traffic).
const PAID_FEATURES = [
  "Family Mode — a spouse, children and parents, with Personal FI and Family FI side by side",
  "Scenarios and what-if sliders you can keep",
  "No ads",
];

const FREE_FEATURES = [
  "The FI calculator",
  "Your Path to 45 projection and weekly check-in",
  "A basic spending tracker with alerts",
  "The full investment library — free for everyone",
];

/** A plain date for the "your plan is on until…" line. Never a countdown. */
function formatDay(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "the end of the paid period";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function PricingPage() {
  const { signedIn, paid, paidUntil } = Route.useRouteContext();
  const startCheckout = useServerFn(createCheckoutSessionFn);
  const restore = useServerFn(restorePurchaseFn);
  const [busy, setBusy] = useState<"monthly" | "yearly" | null>(null);
  const [message, setMessage] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreNote, setRestoreNote] = useState("");
  const [restoredPaid, setRestoredPaid] = useState(paid);

  /** The safety net: paid in Stripe but never got back to /success. */
  async function restorePurchase() {
    setRestoring(true);
    setRestoreNote("");
    try {
      const result = await restore({});
      setRestoreNote(result.message);
      if (result.paid) setRestoredPaid(true);
    } catch {
      setRestoreNote("Couldn't check just now. Please try again in a moment.");
    } finally {
      setRestoring(false);
    }
  }

  async function choose(plan: "monthly" | "yearly") {
    setBusy(plan);
    setMessage("");
    try {
      const result = await startCheckout({ data: { plan } });
      if (result.ok) {
        // Stripe's hosted Checkout page. Never a blank tab: this is the same
        // window, so the back button returns to /pricing.
        window.location.assign(result.url);
        return;
      }
      setMessage(result.message || PAYMENTS_OFF);
    } catch {
      setMessage(PAYMENTS_OFF);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-body sm:text-3xl">
          Pricing
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Start free and stay free for as long as you like. The paid plan is optional and adds the
          household and planning tools. Prices are in pounds sterling, including VAT where it
          applies.
        </p>

        <ErrorNote>{message}</ErrorNote>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Free */}
          <Card className="flex flex-col">
            <h2 className="text-base font-semibold text-body">Free</h2>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-body">£0</span>
              <span className="text-sm text-muted">forever</span>
            </p>
            <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-body">
              {FREE_FEATURES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-accent">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to={signedIn ? "/dashboard" : "/signup"}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface-2 px-4 text-base font-semibold text-body transition-colors hover:border-line-strong hover:bg-surface"
            >
              {signedIn ? "Go to your dashboard" : "Start free"}
            </Link>
          </Card>

          {/* Monthly */}
          <Card className="flex flex-col">
            <h2 className="text-base font-semibold text-body">Monthly</h2>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-body">£6</span>
              <span className="text-sm text-muted">per month</span>
            </p>
            <ul className="mt-3 flex-1 space-y-2 text-sm leading-relaxed text-body">
              {PAID_FEATURES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-accent">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-4 w-full"
              disabled={busy !== null}
              onClick={() => void choose("monthly")}
            >
              {busy === "monthly" ? "Opening checkout…" : "Choose Monthly"}
            </Button>
          </Card>

          {/* Yearly — the best value card */}
          <Card className="flex flex-col border-accent/45 bg-accent-fill/[0.06] sm:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-body">Yearly</h2>
              <span className="rounded-full bg-accent-fill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-on-accent">
                Best value
              </span>
              <span className="rounded-full border border-accent/45 px-2.5 py-1 text-[11px] font-bold text-accent">
                Save £13
              </span>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-body">£59</span>
              <span className="text-sm text-muted">per year</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              The same as £4.92 a month — £13 less than paying monthly for a year.
            </p>
            <ul className="mt-3 grid flex-1 gap-2 text-sm leading-relaxed text-body sm:grid-cols-2">
              {PAID_FEATURES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-accent">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              className="mt-4 w-full sm:max-w-xs"
              disabled={busy !== null}
              onClick={() => void choose("yearly")}
            >
              {busy === "yearly" ? "Opening checkout…" : "Choose Yearly"}
            </Button>
          </Card>
        </div>

        <Card className="mt-4">
          <h2 className="text-base font-semibold text-body">
            {restoredPaid ? "Your paid plan is on" : "Already paid?"}
          </h2>
          {restoredPaid ? (
            <p className="mt-2 text-sm leading-relaxed text-body">
              The paid tools — Family Mode and the what-if sliders — are switched on for this
              account
              {paidUntil ? ` until ${formatDay(paidUntil)}` : ""}. Nothing else to do.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If you paid and closed the tab before the confirmation page, or you are not sure
              whether the plan reached this account, press the button below. It looks up a live
              subscription in Stripe under the email you are signed in with and switches the paid
              tools on. It never takes a payment.
            </p>
          )}
          {restoreNote ? (
            <p
              role="status"
              className="mt-3 rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-body"
            >
              {restoreNote}
            </p>
          ) : null}
          {signedIn && !restoredPaid ? (
            <Button
              type="button"
              variant="light"
              className="mt-3 w-full"
              disabled={restoring}
              onClick={() => void restorePurchase()}
            >
              {restoring ? "Checking Stripe…" : "Restore my purchase"}
            </Button>
          ) : null}
          {!signedIn ? (
            <Link
              to="/login"
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface-2 px-4 text-base font-semibold text-body transition-colors hover:border-line-strong hover:bg-surface"
            >
              Sign in to restore a purchase
            </Link>
          ) : null}
        </Card>

        <Card className="mt-4">
          <h2 className="text-base font-semibold text-body">What paying does and does not buy</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-body">
            <li>
              You pay for the app's tools — the household plan and the scenarios. That is
              software, not a service. The investment library is free whether you pay or not.
            </li>
            <li>
              <strong>Paying does not buy financial advice.</strong> Nothing in Freedom45 is
              financial, investment or tax advice, and paying does not make us your adviser or
              create a fiduciary relationship.
            </li>
            <li>
              Payments are handled by Stripe on its own payment page. We never see or store your
              card details, and we never hold your money.
            </li>
            <li>
              You can cancel at any time and keep access to the paid tools until the end of the
              period you have paid for. Prices and what is included are always shown before you
              pay.
            </li>
          </ul>
        </Card>

        <Disclaimer className="mt-4" />

        <p className="mt-4 text-xs leading-relaxed text-faint">
          {COMPANY_NAME} · {CONTACT_EMAIL} · {CONTACT_PHONE} · {REGISTERED_ADDRESS}
        </p>
      </main>
      <Footer signedIn={signedIn} />
    </div>
  );
}
