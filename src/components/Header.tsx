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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 rounded-xl pr-2 font-bold tracking-tight text-slate-900 dark:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
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
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    activeProps={{
                      className:
                        "!bg-emerald-50 !text-emerald-800 dark:!bg-emerald-400/15 dark:!text-emerald-300",
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
              className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              activeProps={{ className: "!text-emerald-700 dark:!text-emerald-400" }}
            >
              <ICONS.settings size={20} />
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <nav className="flex items-center gap-1.5" aria-label="Main">
            <Link
              to="/side-hustles"
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex dark:text-slate-300 dark:hover:bg-white/10"
            >
              <ICONS.hustles size={20} />
              Side hustles
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500"
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(15,23,42,0.06)] backdrop-blur-md sm:hidden dark:border-white/10 dark:bg-slate-950/95"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {NAV_DESTINATIONS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className="group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400"
                activeProps={{ className: "!text-emerald-700 dark:!text-emerald-400" }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-8 w-11 place-items-center rounded-full transition-colors ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300"
                          : "text-slate-500 group-hover:bg-slate-100 dark:text-slate-400 dark:group-hover:bg-white/10"
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
      className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {busy ? "…" : "Log out"}
    </button>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">{children}</div>;
}
