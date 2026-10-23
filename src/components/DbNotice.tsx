import { Card } from "~/components/ui";

/**
 * Shown instead of a crash when DATABASE_URL is not set yet. The site builds,
 * publishes and serves with no database — this is what visitors see on the
 * screens that need one.
 */
export function DbNotice({ what = "accounts and plans" }: { what?: string }) {
  return (
    <Card className="border-dashed">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        The database isn&apos;t connected yet
      </h2>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
        Freedom45 stores your plan in a Postgres database. Until the connection string is added,
        {" "}{what} can&apos;t be saved and this page has nothing to show. Everything else on the site
        works — the moment the database is connected, this screen fills in on its own.
      </p>
      <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11px] text-slate-700 dark:bg-white/10 dark:text-slate-200">
        curl -s /api/migrate
      </p>
    </Card>
  );
}
