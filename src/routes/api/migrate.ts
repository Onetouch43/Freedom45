import { createFileRoute } from "@tanstack/react-router";

import { DbNotConnectedError, isDbConfigured, runMigration, TABLES } from "~/db";

/**
 * Idempotent schema migration. Safe to re-run.
 *
 *   curl -s <site>/api/migrate          # creates anything missing
 *
 * (The app also runs this lazily on the first query, so this route is mainly a
 * manual "did it work?" check — from a shell with DATABASE_URL set you can use
 * `bun run migrate` instead.)
 */
async function handle(): Promise<Response> {
  if (!isDbConfigured()) {
    return Response.json(
      {
        ok: false,
        reason: "db-not-connected",
        message: "DATABASE_URL is not set — connect a database, then run this again.",
        tables: TABLES,
      },
      { status: 503 },
    );
  }
  try {
    const result = await runMigration();
    return Response.json({ ...result, expected: TABLES });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        reason: error instanceof DbNotConnectedError ? "db-not-connected" : "error",
        message: error instanceof Error ? error.message : "migration failed",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/migrate")({
  server: {
    handlers: {
      GET: () => handle(),
      POST: () => handle(),
    },
  },
});
