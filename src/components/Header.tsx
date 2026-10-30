import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { ICONS, IconGauge, type IconKey } from "~/components/icons";
import { logoutFn } from "~/server/actions";

/**
 * Navigation, mobile first.
 *
 * On a phone the signed-in nav is a bottom tab bar: thumb-reachable, icon-led,
 * with a short label under each icon and a 56px tap target. On wider screens the
 * same destinations sit in the header as icon + label pills.
 *
 * Adding a destination is one entry in `NAV_DESTINATIONS` — nothing else. It is
 * deliberately a list of pages that exist today: Dashboard / Hustles / Settings.
 * The legal pages live in the footer only, so the tab bar stays uncluttered.
 */
type Destination = {
  to: "/dashboard" | "/side-hustles" | "/spending" | "/family" | "/investments";
  label: string;
  shortLabel: string;
  icon: IconKey;
};

/** The five thumb-reachable tabs. Settings stays a small icon in the header. */
export const NAV_DESTINATIONS: Destination[] = [
  { to: "/dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: "dashboard" },
  { to: "/side-hustles", label: "Hustles", shortLabel: "Hustles", icon: "hustles" },
  { to: "/spending", label: "Spending", shortLabel: "Spending", icon: "spending" },
  { to: "/family", label: "Family", shortLabel: "Family", icon: "family" },
  { to: "/investments", label: "Investments", shortLabel: "Invest", icon: "investments" },
];

export function Header({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
    <header className="sticky top-0 z-20 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 rounded-xl pr-2 font-bold tracking-tight text-body"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-fill text-on-accent">
            <IconGauge size={19} strokeWidth={2} />
          </span>
          <span className="text-[15px]">Freedom45</span>
        </Link>

        {signedIn ? (
          <div className="flex items-center gap-1">
            {/* Wider screens: the same destinations as pills in the header. */}
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {NAV_DESTINATIONS.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-body"
                    activeProps={{
                      className:
                        "!bg-accent-fill/12 !text-accent  ",
                    }}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              to="/settings"
              aria-label="Settings"
              className="grid min-h-11 min-w-11 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-body"
              activeProps={{ className: "!text-accent " }}
            >
              <ICONS.settings size={20} />
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <nav className="flex items-center gap-1.5" aria-label="Main">
            <Link
              to="/side-hustles"
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-2 sm:inline-flex"
            >
              <ICONS.hustles size={20} />
              Side hustles
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-2"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-accent-fill px-3.5 text-sm font-semibold text-on-accent hover:bg-accent-fill-hover"
            >
              Start free
            </Link>
          </nav>
        )}
      </div>
    </header>
    {signedIn ? <BottomNav /> : null}
    </>
  );
}

/**
 * The phone tab bar. Rendered by `Header` so every signed-in page gets it, and
 * hidden from `sm` upwards where the header nav takes over.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-9 z-30 mx-2 rounded-card border border-line bg-surface/95 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] backdrop-blur-md sm:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {NAV_DESTINATIONS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className="group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[11px] leading-tight font-semibold text-faint"
                activeProps={{ className: "!text-accent" }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-8 w-11 place-items-center rounded-full transition-colors ${
                        isActive
                          ? "bg-accent-fill/20 text-accent"
                          : "text-faint group-hover:bg-surface-2 group-hover:text-muted"
                      }`}
                    >
                      <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                    </span>
                    <span className="max-w-full truncate">{item.shortLabel}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  const logout = useServerFn(logoutFn);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void logout()
          .catch(() => undefined)
          .then(() => navigate({ to: "/", replace: true }))
          .finally(() => setBusy(false));
      }}
      className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-body disabled:opacity-50"
    >
      {busy ? "…" : "Log out"}
    </button>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-page">{children}</div>;
}
