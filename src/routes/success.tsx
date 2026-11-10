import { createFileRoute, Link } from "@tanstack/react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Card, Disclaimer } from "~/components/ui";
import { COMPANY_NAME, CONTACT_EMAIL } from "~/lib/company";
import { sessionUserFn } from "~/server/actions";
import { checkoutReceiptFn, type CheckoutReceipt } from "~/server/stripe";

/**
 * Where Stripe sends the browser after a successful payment.
 *
 * IMPORTANT: visiting this page proves nothing. Anyone can type the URL, so the
 * page never marks an account as paid — it asks Stripe what that session ID
 * actually is and shows only what Stripe reports. Marking an account paid is the
 * webhook's job (see the TODO in ~/server/stripe.ts).
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
    const [{ user }, receipt] = await Promise.all([
      sessionUserFn().catch(() => ({ user: null })),
      checkoutReceiptFn({ data: { sessionId: search.session_id } }).catch(
        () => null as CheckoutReceipt | null,
      ),
    ]);
    return { signedIn: Boolean(user), receipt };
  },
  component: SuccessPage,
});

const PAID_FEATURES = [
  "Family Mode — Personal FI and Family FI side by side",
  "Scenarios and what-if sliders you can keep",
  "PDF export of your plan",
  "The full investment library",
  "No ads",
];

function SuccessPage() {
  const { signedIn, receipt } = Route.useRouteContext();
  const confirmed = Boolean(receipt?.confirmed);

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          {confirmed ? "Payment received" : "Thank you"}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-body sm:text-3xl">
          {confirmed ? "You're all set" : "Thanks for subscribing"}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {confirmed
            ? "Stripe has confirmed your payment and sent you a receipt by email. Here is what you have paid for."
            : "Thanks for choosing the paid plan. We could not read the payment back from Stripe just now — if you were charged, Stripe's receipt email is your confirmation."}
        </p>

        {receipt?.confirmed ? (
          <Card className="mt-4">
            <h2 className="text-base font-semibold text-body">Your payment</h2>
            <dl className="mt-2 space-y-2 text-sm leading-relaxed">
              {receipt.planLabel ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Plan</dt>
                  <dd className="font-semibold text-body">{receipt.planLabel}</dd>
                </div>
              ) : null}
              {receipt.amountLabel ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Amount</dt>
                  <dd className="font-semibold text-body">{receipt.amountLabel}</dd>
                </div>
              ) : null}
              {receipt.email ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Receipt sent to</dt>
                  <dd className="break-all text-right font-semibold text-body">{receipt.email}</dd>
                </div>
              ) : null}
            </dl>
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
            Your plan is tied to your account, not to this page. Switching the paid features on for
            your login is the last piece we are connecting — until that is done you still have
            everything on the free tier, and nothing is lost. Questions about a payment:{" "}
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
