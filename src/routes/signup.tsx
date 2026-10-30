import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { DbNotice } from "~/components/DbNotice";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, ErrorNote, Label } from "~/components/ui";
import { sessionUserFn, signupFn } from "~/server/actions";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your Freedom45 account" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn();
    if (user) throw redirect({ to: "/dashboard" });
    return { dbConnected };
  },
  component: Signup,
});

function Signup() {
  const { dbConnected } = Route.useRouteContext();
  const navigate = useNavigate();
  const signup = useServerFn(signupFn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signup({ data: { email, password } });
      if (result.ok) {
        await navigate({ to: "/onboarding", replace: true });
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
        <h1 className="text-2xl font-black tracking-tight text-body">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Email and password — that&apos;s it. You&apos;ll be on your Path to 45 in about a minute.
        </p>

        <Card className="mt-5">
          <form onSubmit={submit} className="space-y-4">
            {!dbConnected ? <DbNotice what="accounts and plans" /> : null}
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
            <div>
              <Label htmlFor="password">Password</Label>
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
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent">
            Log in
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-muted">
          Your details stay yours. Freedom45 gives general information about money — not financial
          advice.
        </p>
      </main>
    <Footer signedIn={false} />
    </div>
  );
}
