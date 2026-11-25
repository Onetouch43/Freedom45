import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Card, Disclaimer } from "~/components/ui";
import { COMPANY_NAME, CONTACT_EMAIL } from "~/lib/company";
import { sessionUserFn } from "~/server/actions";
import { claimPurchaseFn, type ClaimResult } from "~/server/entitlement";

/**
 * Where Stripe sends the browser after a successful payment.
 *
 * Visiting this page proves nothing on its own. The session ID is read back from
 * Stripe with the secret key (`claimPurchaseFn`), and `paid_until` is only set when
 * Stripe says the payment is complete and the paying email matches the signed-in
 * account. Nothing here is ever marked paid from the URL or from the browser.
 */
export const Route = createFileRoute("/success")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thank you — Freedom45" },
      {
        name: "description",
        content: "Your Freedom45 subscription is set up. Here is what the paid plan includes.",
      },
    ],
  }),
  beforeLoad: async ({ search }) => {
    const [{ user }, claim] = await Promise.all([
      sessionUserFn().catch(() => ({ user: null })),
      claimPurchaseFn({ data: { sessionId: search.session_id ?? "" } }).catch(
        () => null as ClaimResult | null,
      ),
    ]);
    return { signedIn: Boolean(user), claim };
  },
  component: SuccessPage,
});

/** What the paid tier adds. The investment library is free — it is not on this list. */
const PAID_FEATURES = [
  "Family Mode — Personal FI and Family FI side by side",
  "Scenarios and what-if sliders you can keep",
  "No ads",
];

function SuccessPage() {
  const { signedIn, claim } = Route.useRouteContext();
  const paid = Boolean(claim?.paid);
  const needsSignIn = claim?.status === "not-signed-in" || claim?.status === "email-mismatch";

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {paid ? "Payment received" : "Thank you"}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-body sm:text-3xl">
          {paid ? "You're all set" : "Thanks for subscribing"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {claim?.message ??
            "We could not read the payment back from Stripe just now. If you were charged, Stripe's receipt email is your confirmation — you can also press “Restore my purchase” on the pricing page."}
        </p>

        {paid ? (
          <Card className="mt-4">
            <h2 className="text-base font-semibold text-body">Your paid plan</h2>
            <dl className="mt-2 space-y-2 text-sm leading-relaxed">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd className="font-semibold text-accent">On</dd>
              </div>
              {claim?.planLabel ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Plan</dt>
                  <dd className="font-semibold text-body">{claim.planLabel}</dd>
                </div>
              ) : null}
              {claim?.payingEmail ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Receipt sent to</dt>
                  <dd className="break-all text-right font-semibold text-body">
                    {claim.payingEmail}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              It is tied to your account, not to this page — sign in on any device and Family Mode
              and the what-if sliders are there.
            </p>
          </Card>
        ) : null}

        {needsSignIn ? (
          <Card className="mt-4">
            <h2 className="text-base font-semibold text-body">One step left</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your payment is safe with Stripe. To switch the paid tools on, sign in with the email
              you paid with, then press “Restore my purchase” on the pricing page. It takes one tap
              and no card details.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent-fill px-4 text-base font-semibold text-on-accent transition-colors hover:bg-accent-fill-hover"
              >
                Sign in
              </Link>
              <Link
                to="/pricing"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-line bg-surface-2 px-4 text-base font-semibold text-body transition-colors hover:border-line-strong hover:bg-surface"
              >
                Go to pricing
              </Link>
            </div>
          </Card>
        ) : null}

        <Card className="mt-4">
          <h2 className="text-base font-semibold text-body">What the paid plan includes</h2>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-body">
            {PAID_FEATURES.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-accent">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl bg-surface-2 p-3 text-[13px] leading-relaxed text-muted">
            The investment library, the FI calculator, your Path to 45 projection and the spending
            tracker stay free for everyone. Questions about a payment:{" "}
            <a className="underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Card>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-accent-fill px-4 text-base font-semibold text-on-accent transition-colors hover:bg-accent-fill-hover"
          >
            Back to your dashboard
          </Link>
          <Link
            to="/pricing"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-line bg-surface-2 px-4 text-base font-semibold text-body transition-colors hover:border-line-strong hover:bg-surface"
          >
            Back to pricing
          </Link>
        </div>

        <Disclaimer className="mt-4" />

        <p className="mt-4 text-xs leading-relaxed text-faint">
          Payments are processed by Stripe. Freedom45 is a product of {COMPANY_NAME} and never holds
          your money.
        </p>
      </main>
      <Footer signedIn={signedIn} />
    </div>
  );
}
