import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, ErrorNote, Label } from "~/components/ui";
import { CONTACT_EMAIL } from "~/lib/company";
import { forgotPasswordPageFn, requestPasswordResetFn } from "~/server/password-reset";

/**
 * "Forgot your password" — one email field and one button.
 *
 * Two honest states only. Either email is switched on, in which case every address
 * gets the SAME sentence (so the page cannot be used to discover who has an
 * account), or email is not switched on, in which case the page says so plainly
 * and points at the contact address instead of pretending a message was sent.
 */
export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — Freedom45" }] }),
  beforeLoad: async () => {
    const state = await forgotPasswordPageFn().catch(() => ({ emailConfigured: false }));
    return { emailConfigured: state.emailConfigured };
  },
  component: ForgotPassword,
});

const NEUTRAL = "If an account exists for that address, a reset link is on its way.";

function ForgotPassword() {
  const { emailConfigured } = Route.useRouteContext();
  const requestReset = useServerFn(requestPasswordResetFn);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [off, setOff] = useState(!emailConfigured);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    try {
      const result = await requestReset({ data: { email } });
      if (result.state === "not-configured") {
        setOff(true);
      } else if (result.state === "send-failed") {
        setFailed(true);
      } else {
        setSent(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-page">
      <Header />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-2xl font-black tracking-tight text-body">Reset your password</h1>
        <p className="mt-1.5 text-sm text-muted">
          We&rsquo;ll email you a link to choose a new one. The link works once and expires in 30
          minutes.
        </p>

        {off ? (
          <Card className="mt-5">
            <h2 className="text-base font-semibold text-body">
              Automatic reset isn&rsquo;t switched on yet
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              We can&rsquo;t send email from the app yet, so no reset link can go out. Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Password%20reset%20request`}
                className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 break-words"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              from the address on your account and we&rsquo;ll reset it for you.
            </p>
          </Card>
        ) : sent ? (
          <Card className="mt-5">
            <h2 className="text-base font-semibold text-body">{NEUTRAL}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              It expires in 30 minutes and can be used once. If it doesn&rsquo;t arrive, check your
              spam folder, or email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 break-words"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Card>
        ) : (
          <Card className="mt-5">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="you@example.com"
                />
              </div>
              {failed ? (
                <ErrorNote>
                  That email didn&rsquo;t send. Please try again in a few minutes, or email{" "}
                  {CONTACT_EMAIL}.
                </ErrorNote>
              ) : null}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </Card>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/login" className="font-semibold text-accent">
            Back to log in
          </Link>
        </p>
      </main>
      <Footer signedIn={false} />
    </div>
  );
}
