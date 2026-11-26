/**
 * The one seam between the app and an email provider.
 *
 * Nothing else in the app talks to a mail service. Today the business can send no
 * email at all, so this module's only honest behaviour is to say so: it throws
 * `EmailNotConfiguredError` and every caller renders the "not switched on yet"
 * state instead of pretending a message went out.
 *
 * TURNING EMAIL ON IS ONE SETTING, NOT A CODE CHANGE: set `RESEND_API_KEY` (and
 * `EMAIL_FROM`, the verified sender) in the environment. The reset flow picks it
 * up on the next request — the provider call below is the only thing that starts
 * running.
 *
 * NEVER log a token: the link passed in here contains a live reset token, so this
 * module must not print it, echo it in an error, or include it in a thrown
 * message. Errors raised here carry the provider's own status only.
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("email-not-configured");
    this.name = "EmailNotConfiguredError";
  }
}

/** The verified sender. Only used once the API key exists. */
const fromAddress = (): string =>
  process.env.EMAIL_FROM ?? "Freedom45 <noreply@futuresaiglobal.com>";

/** True when both the provider key and a sender are set. Safe to call anywhere. */
export const isEmailConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM);

/**
 * Send the password-reset link. Plain, short, no urgency — it says what it is,
 * gives the link, says the link expires in 30 minutes, and tells anyone who did
 * not ask for it to ignore the message.
 *
 * Throws `EmailNotConfiguredError` when email is not set up; throws a plain Error
 * when the provider refuses the message (the caller must then NOT claim it sent).
 */
export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = fromAddress();
  if (!apiKey || !process.env.EMAIL_FROM) throw new EmailNotConfiguredError();

  const text = [
    "Someone asked to reset the password for your Freedom45 account.",
    "",
    "Open this link to choose a new password:",
    link,
    "",
    "The link works once and expires in 30 minutes.",
    "",
    "If this wasn't you, ignore this email — your password stays as it is.",
    "",
    "Freedom45 — Futures AI Global LLC",
    "Educational estimates only. Not financial, investment, or tax advice.",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Freedom45 password",
      text,
    }),
  });

  if (!response.ok) {
    // Status only — never the body (it can echo the recipient) and never the link.
    throw new Error(`email-provider-rejected:${response.status}`);
  }
}
