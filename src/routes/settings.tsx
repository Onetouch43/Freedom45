import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Footer, LEGAL_LINKS } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Button, Card, Disclaimer, ErrorNote, Label } from "~/components/ui";
import { deleteAccountFn, logoutFn, sessionUserFn } from "~/server/actions";
import { changePasswordFn } from "~/server/password-reset";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Freedom45" }] }),
  beforeLoad: async () => {
    const { user, dbConnected } = await sessionUserFn().catch(() => ({
      user: null,
      dbConnected: false,
    }));
    if (!user) throw redirect({ to: "/login" });
    return { signedIn: true, dbConnected, email: user.email };
  },
  component: Settings,
});

const LEGAL_COPY: Record<string, string> = {
  "/pricing": "Free tier and the £6/month or £59/year paid plan.",
  "/disclaimer": "What we are, what we are not, and how to read the estimates.",
  "/privacy": "Exactly what we store, and what we never collect.",
  "/terms": "The rules for using Freedom45.",
  "/guide": "The two-minute guide to the app.",
  "/about": "Why Freedom45 exists.",
};

function Settings() {
  const navigate = useNavigate();
  const { signedIn, email } = Route.useRouteContext();
  const logout = useServerFn(logoutFn);
  const deleteAccount = useServerFn(deleteAccountFn);
  const changePassword = useServerFn(changePasswordFn);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSaved(false);
    try {
      const result = await changePassword({
        data: { currentPassword, newPassword, confirm: confirmPassword },
      });
      if (result.ok) {
        setPasswordSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.message);
      }
    } catch {
      setPasswordError("Couldn't reach the server. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch {
      // the redirect below is what matters
    } finally {
      setBusy(false);
      await navigate({ to: "/", replace: true });
    }
  }

  async function deleteEverything() {
    setBusy(true);
    setError("");
    try {
      const result = await deleteAccount();
      if (result.ok) {
        await navigate({ to: "/", replace: true });
      } else {
        setError(result.message);
      }
    } catch {
      setError("Couldn't delete your data. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-page">
      <Header signedIn={signedIn} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-body">Settings</h1>

        <Card>
          <h2 className="text-base font-semibold text-body">
            Legal and information
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {LEGAL_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-14 items-center justify-between gap-3 py-2 text-body"
                >
                  <span>
                    <span className="block text-[15px] font-semibold">{item.label}</span>
                    <span className="block text-xs text-muted">
                      {LEGAL_COPY[item.to]}
                    </span>
                  </span>
                  <span aria-hidden className="text-faint">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-body">Account</h2>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="font-semibold break-all text-body">{email}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Signing out keeps your plan; you can log back in whenever you like.
          </p>
          <Button type="button" variant="light" onClick={() => void signOut()} className="mt-3 w-full" disabled={busy}>
            {busy ? "…" : "Log out"}
          </Button>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-body">Change password</h2>
          <p className="mt-1 text-sm text-muted">
            If you know your current password, change it here — no email needed. Forgotten it? Use{" "}
            <Link to="/forgot-password" className="font-semibold text-accent">
              reset your password
            </Link>
            .
          </p>
          <form onSubmit={submitPassword} className="mt-3 space-y-3">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <input
                id="current-password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="at least 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-3 text-base text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                placeholder="type it again"
              />
            </div>
            {passwordSaved ? (
              <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
                Password changed. Use it next time you log in.
              </p>
            ) : null}
            <ErrorNote>{passwordError}</ErrorNote>
            <Button type="submit" variant="light" disabled={savingPassword} className="w-full">
              {savingPassword ? "Saving…" : "Change password"}
            </Button>
          </form>
        </Card>

        <Card className="border-danger/35">
          <h2 className="text-base font-semibold text-danger">Delete my data</h2>
          <p className="mt-1 text-sm text-muted">
            Deletes your account and everything in it: your email and password hash, your profile,
            your saved side hustles, your spending entries and every snapshot. <strong>This is permanent
            and cannot be undone.</strong> No email is needed.
          </p>

          <ErrorNote>{error}</ErrorNote>

          {confirming ? (
            <div className="mt-3 space-y-2">
              <p className="rounded-xl bg-danger-fill/14 p-3 text-sm font-medium text-danger">
                Delete everything now? Your plan will be gone immediately and we cannot restore it.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteEverything()}
                  className="flex-1 !bg-danger-fill hover:!bg-danger-fill"
                >
                  {busy ? "Deleting…" : "Yes, delete everything"}
                </Button>
                <Button
                  type="button"
                  variant="light"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                  className="flex-1"
                >
                  Keep my data
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="light"
              onClick={() => setConfirming(true)}
              className="mt-3 w-full !text-danger"
            >
              Delete my data
            </Button>
          )}
        </Card>

        <Disclaimer compact />
      </main>
      <Footer signedIn />
    </div>
  );
}
