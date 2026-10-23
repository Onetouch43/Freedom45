/**
 * Explicit migration runner: `bun run migrate` (needs DATABASE_URL in the env).
 *
 *   DATABASE_URL=postgres://... bun run migrate
 *
 * Creates the Freedom45 tables if they don't exist and prints what's there.
 * Idempotent — run it as often as you like. The running app also does this
 * automatically before its first query, so this is mostly for setup/debugging.
 */
import { isDbConfigured, runMigration, TABLES } from "../src/db";

if (!isDbConfigured()) {
  console.error("DATABASE_URL is not set — nothing to migrate. Connect a database first.");
  process.exit(1);
}

try {
  const result = await runMigration();
  console.log(`created/verified ${String(result.tables.length)}/${String(TABLES.length)} tables:`);
  for (const table of TABLES) {
    console.log(`  ${result.tables.includes(table) ? "✓" : "✗"} ${table}`);
  }
  process.exit(result.tables.length === TABLES.length ? 0 : 1);
} catch (error) {
  console.error("migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
