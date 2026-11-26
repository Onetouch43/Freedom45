import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, ErrorNote, Label } from "~/components/ui";
import { resetPasswordFn, resetTokenStateFn } from "~/server/password-reset";

/**
 * The page the emailed link lands on: `?token=...`.
 *
 * The token is checked on the server before anything is shown, and again when the
 * form is submitted — one honest message if it is missing, already used or past
 * its 30 minutes, and a way straight back to asking for a new one. On success the
 * person is signed in, so they land on their plan rather than a dead page.
 */
export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Choose a new password — Freedom45" }] }),
  beforeLoad: async ({ search }) => {
    const state = await resetTokenStateFn({ data: { token: search.token } }).catch(() => ({
      valid: false,
    }));
    return { valid: state.valid };
  },
  component: ResetPassword,
});

function ResetPassword() {
  const { valid } = Route.useRouteContext();
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const resetPassword = useServerFn(resetPasswordFn);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [dead, setDead] = useState(!valid);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await resetPassword({ data: { token, password, confirm } });
      if (result.ok) {
        await navigate({ to: "/dashboard", replace: true });
      } else if (result.reason === "invalid-token") {
        setDead(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-page">
      <Header />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-2xl font-black tracking-tight text-body">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-muted">
          Use at least 8 characters. You&rsquo;ll be signed in straight away.
        </p>

        {dead ? (
          <Card className="mt-5">
            <h2 className="text-base font-semibold text-body">
              This reset link isn&rsquo;t valid any more
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              It may have been used already, or more than 30 minutes have passed. Links work once and
              expire, so ask for a fresh one.
            </p>
            <Link
              to="/forgot-password"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-accent-fill px-4 py-3 text-base font-semibold text-on-accent hover:bg-accent-fill-hover"
            >
              Ask for a new link
            </Link>
          </Card>
        ) : (
          <Card className="mt-5">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="at least 8 characters"
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  placeholder="type it again"
                />
              </div>
              <ErrorNote>{error}</ErrorNote>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Saving…" : "Save new password"}
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
