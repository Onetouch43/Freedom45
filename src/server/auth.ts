import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, getRequestProtocol, setCookie } from "@tanstack/react-start/server";

import { isDbConfigured, query } from "~/db";

/**
 * Hand-rolled auth: email + password, scrypt hashes, an opaque session token in
 * an HttpOnly cookie, and the session row checked server-side on every request.
 * No third-party auth service.
 */

export const SESSION_COOKIE = "f45_session";
const SESSION_DAYS = 30;
const KEY_LENGTH = 64;

/**
 * Used only to key the stored session-token hash. `SESSION_SECRET` wins when the
 * owner sets it; otherwise a stable in-repo fallback keeps sessions working with
 * zero setup (the token itself is still 256 bits of entropy).
 */
const sessionSecret = (): string =>
  process.env.SESSION_SECRET ?? "freedom45-local-fallback-secret-v1";

export type SessionUser = { id: number; email: string };

/* ---------------------------------------------------------------- passwords */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = String(stored).split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ----------------------------------------------------------------- sessions */

/** What we store in the database — never the raw cookie value. */
const tokenHash = (token: string): string =>
  createHmac("sha256", sessionSecret()).update(token).digest("hex");

function readCookie(name: string): string | undefined {
  try {
    return getCookie(name);
  } catch {
    return undefined;
  }
}

function isHttps(): boolean {
  try {
    return getRequestProtocol({ xForwardedProto: true }) === "https";
  } catch {
    return false;
  }
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(`insert into sessions (token, user_id, expires_at) values ($1, $2, $3)`, [
    tokenHash(token),
    userId,
    expiresAt.toISOString(),
  ]);
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps(),
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const token = readCookie(SESSION_COOKIE);
  if (token && isDbConfigured()) {
    try {
      await query(`delete from sessions where token = $1`, [tokenHash(token)]);
    } catch {
      // Logging out must never fail because of the database.
    }
  }
  try {
    deleteCookie(SESSION_COOKIE, { path: "/" });
  } catch {
    // ignored
  }
}

/**
 * The signed-in user, or null. Returns null WITHOUT touching the database when
 * there is no session cookie, so logged-out redirects still work before a
 * database is connected.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = readCookie(SESSION_COOKIE);
  if (!token) return null;
  if (!isDbConfigured()) return null;
  try {
    const rows = await query<{ id: number | string; email: string }>(
      `select u.id, u.email
         from sessions s
         join users u on u.id = s.user_id
        where s.token = $1 and s.expires_at > now()`,
      [tokenHash(token)],
    );
    const row = rows[0];
    return row ? { id: Number(row.id), email: String(row.email) } : null;
  } catch {
    return null;
  }
}
