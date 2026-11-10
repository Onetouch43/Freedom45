import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { APP_URL } from "~/lib/site";
import { getSessionUser } from "./auth";

/**
 * Stripe Checkout, TEST MODE ONLY.
 *
 * HOW IT WORKS: the browser never sees a secret. A server function asks Stripe
 * for a Checkout Session with the price ID for the plan the user picked, and the
 * browser is sent to the `url` Stripe returns. No Stripe.js, no publishable key,
 * no card details anywhere near this app — Stripe hosts the payment page.
 *
 * The secret key comes from `process.env.STRIPE_SECRET_KEY` and is read here, on
 * the server, at call time. It is never written to a file, never sent to the
 * client and never logged. When the key is missing or Stripe rejects it, the
 * caller gets one plain message and the page keeps working.
 *
 * The prices are TEST-MODE price IDs and both are recurring, so the session is
 * created with `mode: "subscription"`.
 */
const STRIPE_API = "https://api.stripe.com/v1";

/** Test-mode price IDs. Server-side constants; they are not secret. */
export const PRICE_IDS = {
  monthly: "price_1Ua4fTGTV18WfpS7MA52IOEv",
  yearly: "price_1Ua4kgGTV18WlpS7ZE7U9Jlo",
} as const;

export type PlanId = keyof typeof PRICE_IDS;

/** The only thing a user is ever told when checkout cannot start. */
export const PAYMENTS_OFF_MESSAGE =
  "Payments aren't switched on yet — please try again shortly.";

function secretKey(): string | null {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  return key.length > 0 ? key : null;
}

/**
 * NOTE ON THE PUBLISHABLE KEY: `STRIPE_PUBLISHABLE_KEY` /
 * `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are not needed for this flow. This is a
 * TanStack Start + Vite app, not Next.js, so a `NEXT_PUBLIC_` variable is not
 * exposed to the browser automatically — and a redirect-to-Checkout flow does
 * not need it at all. Nothing here fails when it is absent.
 */

function isLoopback(host: string): boolean {
  const name = host.split(":")[0]?.trim().toLowerCase() ?? "";
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "0.0.0.0" ||
    name === "::1" ||
    name === "[::1]"
  );
}

/**
 * The origin to send Stripe back to, taken from the incoming request rather than
 * a hardcoded host. The site sits behind a proxy that can mask the host as
 * localhost, and a Checkout session must never point at loopback — so a
 * loopback host falls back to the app's published URL.
 */
function requestOrigin(): string {
  try {
    const request = getRequest();
    const url = new URL(request.url);
    const forwardedHost = (request.headers.get("x-forwarded-host") ?? "").split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host") || url.host;
    const forwardedProto = (request.headers.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
    const proto =
      forwardedProto === "https" || forwardedProto === "http"
        ? forwardedProto
        : url.protocol.replace(":", "");
    if (host && !isLoopback(host)) return `${proto}://${host}`;
  } catch {
    // No request in scope — use the published URL below.
  }
  return APP_URL;
}

function formBody(fields: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === "string" && value.length > 0) params.set(name, value);
  }
  return params.toString();
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Creates a Checkout Session for the chosen plan and returns Stripe's hosted
 * page URL. Any failure — no key, a rejected key, a network error — comes back
 * as the same honest message, never a stack trace or a raw Stripe error.
 */
export const createCheckoutSessionFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): { plan: string } => {
    const raw = (input as { plan?: unknown } | null | undefined)?.plan;
    return { plan: typeof raw === "string" ? raw : "" };
  })
  .handler(async ({ data }: { data: { plan: string } }): Promise<CheckoutResult> => {
    const plan: PlanId | null =
      data?.plan === "monthly" ? "monthly" : data?.plan === "yearly" ? "yearly" : null;
    if (!plan) return { ok: false, message: PAYMENTS_OFF_MESSAGE };

    const key = secretKey();
    if (!key) return { ok: false, message: PAYMENTS_OFF_MESSAGE };

    const origin = requestOrigin();
    // Pre-fill the email only when someone is signed in. No Stripe customer
    // record is created — Checkout makes one itself when the payment completes.
    const user = await getSessionUser().catch(() => null);

    try {
      const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: formBody({
          mode: "subscription",
          "line_items[0][price]": PRICE_IDS[plan],
          "line_items[0][quantity]": "1",
          success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing`,
          customer_email: user?.email,
          client_reference_id: user ? String(user.id) : undefined,
        }),
      });

      if (!response.ok) return { ok: false, message: PAYMENTS_OFF_MESSAGE };

      const session = (await response.json()) as { url?: unknown };
      const url = typeof session.url === "string" ? session.url : "";
      if (!url.startsWith("https://")) return { ok: false, message: PAYMENTS_OFF_MESSAGE };
      return { ok: true, url };
    } catch {
      return { ok: false, message: PAYMENTS_OFF_MESSAGE };
    }
  });

export type CheckoutReceipt = {
  /** True only when Stripe says the session is complete AND paid. */
  confirmed: boolean;
  paymentStatus: string;
  amountLabel: string | null;
  email: string | null;
  planLabel: string | null;
};

const NO_RECEIPT: CheckoutReceipt = {
  confirmed: false,
  paymentStatus: "",
  amountLabel: null,
  email: null,
  planLabel: null,
};

/**
 * Reads a completed Checkout Session back from Stripe so /success can show what
 * was actually paid for.
 *
 * THIS NEVER MARKS AN ACCOUNT AS PAID. Anyone can open /success, so the page
 * only ever displays what Stripe reports about a session ID it was given.
 */
export const checkoutReceiptFn = createServerFn()
  .inputValidator((input: unknown): { sessionId: string } => {
    const raw = (input as { sessionId?: unknown } | null | undefined)?.sessionId;
    return { sessionId: typeof raw === "string" ? raw : "" };
  })
  .handler(async ({ data }: { data: { sessionId: string } }): Promise<CheckoutReceipt> => {
    const sessionId = data.sessionId.trim();
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return NO_RECEIPT;

    const key = secretKey();
    if (!key) return NO_RECEIPT;

    try {
      const response = await fetch(
        `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items`,
        { headers: { authorization: `Bearer ${key}` } },
      );
      if (!response.ok) return NO_RECEIPT;

      const session = (await response.json()) as {
        status?: unknown;
        payment_status?: unknown;
        amount_total?: unknown;
        currency?: unknown;
        customer_details?: { email?: unknown } | null;
        customer_email?: unknown;
        line_items?: { data?: Array<{ price?: { recurring?: { interval?: unknown } | null } }> };
      };

      const paymentStatus = typeof session.payment_status === "string" ? session.payment_status : "";
      const confirmed =
        session.status === "complete" &&
        (paymentStatus === "paid" || paymentStatus === "no_payment_required");

      const currency = (typeof session.currency === "string" ? session.currency : "gbp").toUpperCase();
      const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
      const amountLabel =
        amountTotal === null
          ? null
          : new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
              amountTotal / 100,
            );

      const interval = session.line_items?.data?.[0]?.price?.recurring?.interval;
      const planLabel =
        interval === "month" ? "Monthly plan" : interval === "year" ? "Yearly plan" : null;

      const email =
        (typeof session.customer_details?.email === "string"
          ? session.customer_details.email
          : typeof session.customer_email === "string"
            ? session.customer_email
            : null) ?? null;

      return { confirmed, paymentStatus, amountLabel, email, planLabel };
    } catch {
      return NO_RECEIPT;
    }
  });

/* --------------------------------------------------------------------------
 * TODO (entitlement): a webhook for `checkout.session.completed` is the only
 * thing that should ever set a "paid" flag on a user. There is no webhook
 * secret configured yet, so nothing is marked paid today — /success reads the
 * session back from Stripe and shows it, and the paid features stay off.
 * When a signing secret exists, add `POST /api/stripe/webhook` here: verify the
 * `stripe-signature` header against the raw body, then set the paid flag for
 * the user in `client_reference_id` (falling back to the session's customer
 * email) and store the Stripe subscription ID for cancellations.
 * ------------------------------------------------------------------------ */
