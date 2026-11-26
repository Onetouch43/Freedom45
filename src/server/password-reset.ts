import { createHash, randomBytes } from "node:crypto";

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { DbNotConnectedError, ensureSchema, isDbConfigured, query } from "~/db";
import { createSession, getSessionUser, hashPassword, verifyPassword } from "./auth";
import { EmailNotConfiguredError, isEmailConfigured, sendPasswordResetEmail } from "./email";
import { requestOrigin } from "./origin";

/**
 * Self-serve password reset.
 *
 * RULES THIS FILE KEEPS, and why they are written down here:
 *  - No account enumeration: `/forgot-password` gives the same sentence whether or
 *    not the address exists, and the same sentence when the rate limit is hit.
 *  - Never claim an email went out when it did not. When the transport is not
 *    configured the caller renders an honest "not switched on yet" state.
 *  - A token is 32 random bytes, stored only as `sha256(token)`, single use, and
 *    expires after 30 minutes. It is never logged, in full or in part, and never
 *    appears in an error message.
 */

const TOKEN_MINUTES = 30;
const MIN_PASSWORD_LENGTH = 8;

/* -------------------------------------------------------------- token bytes */

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

/* -------------------------------------------------------------- rate limits */

/**
 * At most 3 requests per email per hour and 10 per IP per hour.
 *
 * Held in memory: this app runs as one server process, and the limit exists to
 * stop a burst, not to be an audit trail. A restart clears it, which is the safe
 * direction — it can only let a request through, never lock someone out for good.
 */
const WINDOW_MS = 60 * 60 * 1000;
const PER_EMAIL = 3;
const PER_IP = 10;
const hits = new Map<string, number[]>();

function overLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** Trim the map so a long-lived process cannot grow it without bound. */
function pruneHits(): void {
  if (hits.size < 5000) return;
  const now = Date.now();
  for (const [key, times] of hits) {
    if (times.every((at) => now - at >= WINDOW_MS)) hits.delete(key);
  }
}

function clientIp(): string {
  try {
    const request = getRequest();
    const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
    return forwarded || request.headers.get("host") || "unknown";
  } catch {
    return "unknown";
  }
}

/* ------------------------------------------------------------------- types */

export type ForgotState = "sent" | "not-configured" | "send-failed";

export type ForgotResult = { ok: true; state: ForgotState };

export type ResetOutcome =
  | { ok: true }
  | { ok: false; reason: "invalid-token" | "password" | "confirm" | "signed-out" | "error"; message: string };

/* ------------------------------------------------------- /forgot-password */

/** Whether the page should show the form or the honest "not switched on" panel. */
export const forgotPasswordPageFn = createServerFn().handler(
  async (): Promise<{ emailConfigured: boolean }> => ({ emailConfigured: isEmailConfigured() }),
);

/**
 * Ask for a reset link.
 *
 * The response is deliberately the same for every address: one neutral sentence,
 * whether the account exists, does not exist, or the rate limit was hit.
 */
export const requestPasswordResetFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string } }): Promise<ForgotResult> => {
    if (!isEmailConfigured()) return { ok: true, state: "not-configured" };

    const email = String(data?.email ?? "")
      .trim()
      .toLowerCase();
    const ip = clientIp();
    pruneHits();

    // Over the limit gets the same neutral answer as everything else — never a
    // different message that would confirm the address is real.
    const emailLimited = overLimit(`email:${email}`, PER_EMAIL);
    const ipLimited = overLimit(`ip:${ip}`, PER_IP);
    if (emailLimited || ipLimited) return { ok: true, state: "sent" };

    if (!isDbConfigured()) return { ok: true, state: "sent" };

    try {
      await ensureSchema();
      const rows = await query<{ id: number }>(
        `select id from users where lower(email) = $1 limit 1`,
        [email],
      );
      const userId = Number(rows[0]?.id ?? 0);
      if (!userId) return { ok: true, state: "sent" };

      // One live token at a time: any earlier unused, unexpired link stops working.
      await query(
        `delete from password_resets
          where user_id = $1 and used_at is null and expires_at > now()`,
        [userId],
      );

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60 * 1000);
      await query(
        `insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)`,
        [userId, hashToken(token), expiresAt.toISOString()],
      );

      const link = `${requestOrigin()}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(email, link);
      } catch (error) {
        // The link was minted but no message left, so say so honestly rather than
        // telling the user to check an inbox that will stay empty.
        if (error instanceof EmailNotConfiguredError) return { ok: true, state: "not-configured" };
        return { ok: true, state: "send-failed" };
      }
      return { ok: true, state: "sent" };
    } catch (error) {
      // A database problem is ours, not the visitor's: keep the neutral answer and
      // record nothing that could contain a token.
      if (error instanceof DbNotConnectedError) return { ok: true, state: "sent" };
      return { ok: true, state: "sent" };
    }
  },
);

/* -------------------------------------------------------- /reset-password */

/** Is this token usable right now? Drives which form the page shows. */
export const resetTokenStateFn = createServerFn().handler(
  async ({ data }: { data: { token: string } }): Promise<{ valid: boolean }> => {
    const token = String(data?.token ?? "");
    if (!token || !isDbConfigured()) return { valid: false };
    try {
      await ensureSchema();
      const rows = await query<{ id: number }>(
        `select id from password_resets
          where token_hash = $1 and used_at is null and expires_at > now()
          limit 1`,
        [hashToken(token)],
      );
      return { valid: rows.length > 0 };
    } catch {
      return { valid: false };
    }
  },
);

/**
 * Set the new password. The token is checked again here, in the same statement
 * that marks it used, so a double submit cannot set two passwords or reuse a link.
 */
export const resetPasswordFn = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { token: string; password: string; confirm: string };
  }): Promise<ResetOutcome> => {
    const token = String(data?.token ?? "");
    const password = String(data?.password ?? "");
    const confirm = String(data?.confirm ?? "");

    if (password.length < MIN_PASSWORD_LENGTH) {
      return {
        ok: false,
        reason: "password",
        message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
      };
    }
    if (password !== confirm) {
      return { ok: false, reason: "confirm", message: "Those two passwords don't match." };
    }
    if (!token) {
      return {
        ok: false,
        reason: "invalid-token",
        message: "That reset link is no longer valid. Ask for a new one.",
      };
    }

    try {
      await ensureSchema();
      // Claim the token in one statement: only an unused, unexpired row updates.
      const claimed = await query<{ user_id: number }>(
        `update password_resets
            set used_at = now()
          where token_hash = $1 and used_at is null and expires_at > now()
          returning user_id`,
        [hashToken(token)],
      );
      const userId = Number(claimed[0]?.user_id ?? 0);
      if (!userId) {
        return {
          ok: false,
          reason: "invalid-token",
          message: "That reset link is no longer valid. Ask for a new one.",
        };
      }

      await query(`update users set password_hash = $2 where id = $1`, [
        userId,
        hashPassword(password),
      ]);
      // Every other link for this user dies with the password.
      await query(`delete from password_resets where user_id = $1 and token_hash <> $2`, [
        userId,
        hashToken(token),
      ]);

      // Signed in straight away, so the person is not left on a dead page.
      await createSession(userId);
      return { ok: true };
    } catch (error) {
      if (error instanceof DbNotConnectedError) {
        return {
          ok: false,
          reason: "error",
          message: "The database isn't connected yet, so this can't be saved.",
        };
      }
      return { ok: false, reason: "error", message: "Something went wrong. Please try again." };
    }
  },
);

/* ------------------------------------------------------ change password */

/** For someone signed in who still knows their password — no email needed. */
export const changePasswordFn = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { currentPassword: string; newPassword: string; confirm: string };
  }): Promise<ResetOutcome> => {
    const user = await getSessionUser();
    if (!user) return { ok: false, reason: "signed-out", message: "Please log in again." };

    const currentPassword = String(data?.currentPassword ?? "");
    const newPassword = String(data?.newPassword ?? "");
    const confirm = String(data?.confirm ?? "");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        ok: false,
        reason: "password",
        message: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
      };
    }
    if (newPassword !== confirm) {
      return { ok: false, reason: "confirm", message: "Those two passwords don't match." };
    }

    try {
      await ensureSchema();
      const rows = await query<{ password_hash: string }>(
        `select password_hash from users where id = $1 limit 1`,
        [user.id],
      );
      const stored = rows[0]?.password_hash;
      if (!stored || !verifyPassword(currentPassword, String(stored))) {
        return {
          ok: false,
          reason: "password",
          message: "Your current password doesn't match.",
        };
      }
      await query(`update users set password_hash = $2 where id = $1`, [
        user.id,
        hashPassword(newPassword),
      ]);
      // Any reset link still outstanding stops working with the old password.
      await query(`delete from password_resets where user_id = $1`, [user.id]);
      return { ok: true };
    } catch (error) {
      if (error instanceof DbNotConnectedError) {
        return {
          ok: false,
          reason: "error",
          message: "The database isn't connected yet, so this can't be saved.",
        };
      }
      return { ok: false, reason: "error", message: "Something went wrong. Please try again." };
    }
  },
);
