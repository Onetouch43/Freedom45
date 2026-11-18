import { createServerFn } from "@tanstack/react-start";

import { ensureSchema, isDbConfigured, query } from "~/db";
import { getSessionUser } from "./auth";

/**
 * Entitlement — what "paid" means, and the only two ways an account ever becomes
 * paid.
 *
 * A user is paid when `profiles.paid_until` is in the future. Nothing else counts.
 * In particular a URL parameter, a session ID on its own, or anything the browser
 * claims is never enough: the two routes to `paid_until` are
 *
 *   1. `claimPurchaseFn` — /success. The session is read back from Stripe with the
 *      secret key, Stripe must say it is complete and paid (or its subscription
 *      active), and the paying email must match the signed-in account.
 *   2. `restorePurchaseFn` — the "Restore my purchase" button on /pricing. Stripe
 *      is asked for this account's active subscriptions by email.
 *
 * Both are idempotent: a period is never stacked twice for the same window, because
 * the new date is `greatest(existing, now + one period)`.
 *
 * TEST MODE ONLY. The key is read from the environment on the server at call time
 * and is never written down, returned or logged.
 */

const STRIPE_API = "https://api.stripe.com/v1";

/** The one message a free account gets when it asks for a paid tool. */
export const PAID_REQUIRED_MESSAGE =
  "Family Mode and the what-if sliders are part of the paid plan (£6 a month or £59 a year). Everything else on your account still works.";

function secretKey(): string | null {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  return key.length > 0 ? key : null;
}

/* ------------------------------------------------------------------ reading */

export type Entitlement = {
  signedIn: boolean;
  paid: boolean;
  /** ISO timestamp, or null when the account has never been paid. */
  paidUntil: string | null;
};

const FREE: Entitlement = { signedIn: false, paid: false, paidUntil: null };

function paidFrom(paidUntil: unknown): boolean {
  if (!paidUntil) return false;
  const at = new Date(String(paidUntil)).getTime();
  return Number.isFinite(at) && at > Date.now();
}

/** The account's entitlement, straight from the profile row. Never cached. */
export async function entitlementFor(userId: number): Promise<Entitlement> {
  if (!isDbConfigured()) return { signedIn: true, paid: false, paidUntil: null };
  try {
    await ensureSchema();
    const rows = await query<{ paid_until: unknown }>(
      `select paid_until from profiles where user_id = $1`,
      [userId],
    );
    const paidUntil = rows[0]?.paid_until ? String(rows[0].paid_until) : null;
    return { signedIn: true, paid: paidFrom(paidUntil), paidUntil };
  } catch {
    return { signedIn: true, paid: false, paidUntil: null };
  }
}

/** True when `profiles.paid_until` is in the future. The single gate rule. */
export async function isPaidUser(userId: number): Promise<boolean> {
  return (await entitlementFor(userId)).paid;
}

/**
 * The current entitlement for the browser. Used by /pricing to show what the
 * account already has, and by the paid panels to decide what to render.
 */
export const entitlementFn = createServerFn().handler(async (): Promise<Entitlement> => {
  const user = await getSessionUser();
  if (!user) return FREE;
  return entitlementFor(user.id);
});

/* ------------------------------------------------------------------ writing */

type Period = "month" | "year";

/**
 * Set `paid_until` to `greatest(existing, now + one period)` and remember the
 * Stripe customer. Called ONLY after Stripe has confirmed a payment for this
 * account; never from a client-supplied flag.
 */
async function grantPaid(
  userId: number,
  period: Period,
  customerId: string | null,
): Promise<string | null> {
  const interval = period === "year" ? "1 year" : "1 month";
  const rows = await query<{ paid_until: unknown }>(
    `update profiles
        set paid_until = greatest(coalesce(paid_until, now()), now() + $2::interval),
            stripe_customer_id = coalesce($3, stripe_customer_id),
            updated_at = now()
      where user_id = $1
      returning paid_until`,
    [userId, interval, customerId],
  );
  const value = rows[0]?.paid_until;
  return value ? String(value) : null;
}

/* ------------------------------------------------------------------- stripe */

type StripeSession = {
  id?: unknown;
  status?: unknown;
  payment_status?: unknown;
  customer?: unknown;
  customer_email?: unknown;
  client_reference_id?: unknown;
  subscription?: unknown;
  customer_details?: { email?: unknown } | null;
  line_items?: {
    data?: Array<{ price?: { recurring?: { interval?: unknown } | null } | null }>;
  };
};

type StripeSubscription = {
  id?: unknown;
  status?: unknown;
  customer?: unknown;
  items?: {
    data?: Array<{ price?: { recurring?: { interval?: unknown } | null } | null }>;
  };
};

async function stripeGet(path: string): Promise<Record<string, unknown> | null> {
  const key = secretKey();
  if (!key) return null;
  try {
    const response = await fetch(`${STRIPE_API}${path}`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as Record<string, unknown>;
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

function intervalOf(session: StripeSession): Period | null {
  const interval = session.line_items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "month") return "month";
  if (interval === "year") return "year";
  return null;
}

function intervalOfSubscription(sub: StripeSubscription): Period | null {
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "month") return "month";
  if (interval === "year") return "year";
  return null;
}

function emailOfSession(session: StripeSession): string | null {
  const details = session.customer_details?.email;
  if (typeof details === "string" && details.trim()) return details.trim();
  const fallback = session.customer_email;
  return typeof fallback === "string" && fallback.trim() ? fallback.trim() : null;
}

function customerIdOf(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("cus_")) return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.startsWith("cus_")) return id;
  }
  return null;
}

/* ------------------------------------------------------------ /success claim */

export type ClaimStatus =
  | "granted"
  | "already-paid"
  | "not-signed-in"
  | "email-mismatch"
  | "not-paid"
  | "unavailable";

export type ClaimResult = {
  status: ClaimStatus;
  message: string;
  paid: boolean;
  paidUntil: string | null;
  /** The email Stripe says paid, when it said one — shown to the visitor. */
  payingEmail: string | null;
  planLabel: string | null;
};

/**
 * /success — verify the Checkout Session with Stripe, then mark this account paid.
 *
 * Refuses in every case where the visitor and the payer are not provably the same
 * person: not signed in, or a session whose paying email is not the account's.
 */
export const claimPurchaseFn = createServerFn()
  .inputValidator((input: unknown): { sessionId: string } => {
    const raw = (input as { sessionId?: unknown } | null | undefined)?.sessionId;
    return { sessionId: typeof raw === "string" ? raw : "" };
  })
  .handler(async ({ data }: { data: { sessionId: string } }): Promise<ClaimResult> => {
    const sessionId = data.sessionId.trim();
    const user = await getSessionUser();
    const base = { paid: false, paidUntil: null as string | null, payingEmail: null as string | null };

    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return { ...base, status: "unavailable", message: "We couldn't find that payment.", planLabel: null };
    }

    const body = await stripeGet(
      `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items&expand[]=subscription`,
    );
    if (!body) {
      return {
        ...base,
        status: "unavailable",
        message:
          "We couldn't read that payment back from Stripe just now. If you were charged, Stripe's receipt email is your confirmation — you can also press \"Restore my purchase\" on the pricing page.",
        planLabel: null,
      };
    }

    const session = body as StripeSession;
    const paymentStatus = typeof session.payment_status === "string" ? session.payment_status : "";
    const subscription =
      session.subscription && typeof session.subscription === "object"
        ? (session.subscription as StripeSubscription)
        : null;
    const subscriptionStatus =
      subscription && typeof subscription.status === "string" ? subscription.status : "";
    const subscriptionActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
    const complete = session.status === "complete";
    const settled =
      complete && (paymentStatus === "paid" || paymentStatus === "no_payment_required" || subscriptionActive);

    const payingEmail = emailOfSession(session);
    const planLabel =
      intervalOf(session) === "year"
        ? "Yearly plan"
        : intervalOf(session) === "month"
          ? "Monthly plan"
          : null;

    if (!settled) {
      return {
        ...base,
        status: "not-paid",
        message:
          "Stripe doesn't show that payment as complete yet. If you have just paid, wait a moment and reload this page — your plan is tied to your account, not to this page.",
        payingEmail,
        planLabel,
      };
    }

    if (!user) {
      return {
        ...base,
        status: "not-signed-in",
        message: payingEmail
          ? `You're not signed in. Sign in with the email you paid with (${payingEmail}), then open this page again — or press "Restore my purchase" on the pricing page.`
          : "You're not signed in. Sign in with the email you paid with, then press \"Restore my purchase\" on the pricing page.",
        payingEmail,
        planLabel,
      };
    }

    const clientRef = typeof session.client_reference_id === "string" ? session.client_reference_id : "";
    const emailMatches =
      Boolean(payingEmail) && payingEmail!.toLowerCase() === user.email.trim().toLowerCase();
    // The client_reference_id is set by our own checkout function, server-side, to
    // the signed-in user's id — so it binds the session to this account as firmly
    // as the email does.
    const referenceMatches = clientRef === String(user.id);

    if (!emailMatches && !referenceMatches) {
      return {
        ...base,
        status: "email-mismatch",
        message: payingEmail
          ? `That payment was made with ${payingEmail}, but you're signed in as ${user.email}. Sign in with the email you paid with, then press "Restore my purchase" on the pricing page.`
          : `That payment doesn't match the account you're signed in as (${user.email}). Sign in with the email you paid with, then press "Restore my purchase" on the pricing page.`,
        payingEmail,
        planLabel,
      };
    }

    const current = await entitlementFor(user.id);
    if (current.paid) {
      return {
        status: "already-paid",
        message: "Your paid plan is already on for this account.",
        paid: true,
        paidUntil: current.paidUntil,
        payingEmail,
        planLabel,
      };
    }

    const period: Period = intervalOf(session) ?? "month";
    const paidUntil = await grantPaid(user.id, period, customerIdOf(session.customer));
    return {
      status: "granted",
      message: `Your paid plan is on. It runs until ${formatDay(paidUntil)}.`,
      paid: paidFrom(paidUntil),
      paidUntil,
      payingEmail,
      planLabel,
    };
  });

/* ------------------------------------------------------- restore my purchase */

export type RestoreResult = {
  ok: boolean;
  message: string;
  paid: boolean;
  paidUntil: string | null;
};

/**
 * "Restore my purchase" — the safety net for anyone who paid and closed the tab
 * before /success could run.
 *
 * Looks up this account's email in Stripe, then asks for that customer's
 * subscriptions. Only an active or trialing subscription grants access.
 */
export const restorePurchaseFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<RestoreResult> => {
    const user = await getSessionUser();
    if (!user) {
      return {
        ok: false,
        message: "Sign in first, then press this again.",
        paid: false,
        paidUntil: null,
      };
    }

    const current = await entitlementFor(user.id);
    if (current.paid) {
      return {
        ok: true,
        message: "Your paid plan is already on for this account.",
        paid: true,
        paidUntil: current.paidUntil,
      };
    }

    if (!secretKey()) {
      return {
        ok: false,
        message: "Payments aren't switched on yet — please try again shortly.",
        paid: false,
        paidUntil: null,
      };
    }

    const email = user.email.trim().toLowerCase();
    const customers = await stripeGet(
      `/customers?email=${encodeURIComponent(email)}&limit=10`,
    );
    const customerList = Array.isArray(customers?.data)
      ? (customers!.data as Array<{ id?: unknown }>)
      : [];

    for (const customer of customerList) {
      const customerId = typeof customer.id === "string" ? customer.id : "";
      if (!customerId.startsWith("cus_")) continue;
      const subs = await stripeGet(
        `/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=10`,
      );
      const list = Array.isArray(subs?.data) ? (subs!.data as StripeSubscription[]) : [];
      const active = list.find(
        (sub) => sub.status === "active" || sub.status === "trialing",
      );
      if (!active) continue;
      const period: Period = intervalOfSubscription(active) ?? "month";
      const paidUntil = await grantPaid(user.id, period, customerId);
      return {
        ok: true,
        message: `Found your subscription — your paid plan is on until ${formatDay(paidUntil)}.`,
        paid: paidFrom(paidUntil),
        paidUntil,
      };
    }

    return {
      ok: false,
      message: `No active subscription found for ${user.email}. If you paid with a different email, sign in with that one and press this again. If you think this is wrong, email info@futuresaiglobal.com with the address Stripe sent your receipt to.`,
      paid: false,
      paidUntil: null,
    };
  },
);

/** A calm, unambiguous date for a confirmation line. Never a countdown. */
function formatDay(value: string | null): string {
  if (!value) return "the end of your paid period";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "the end of your paid period";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
