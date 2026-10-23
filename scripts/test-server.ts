/**
 * Throwaway server for LOCAL end-to-end testing only — never part of the live site.
 *
 * It serves the same built output as `serve.ts` (dist/client + dist/server),
 * but on a spare port (PORT env, default 3100) and WITHOUT taking over port 3000,
 * so a test run can point `DATABASE_URL` at a scratch Postgres while the live
 * site stays untouched.
 *
 *   cd /home/team/shared/site
 *   bun run build
 *   DATABASE_URL=postgres://postgres@127.0.0.1:55432/f45_test \
 *     setsid nohup bun run scripts/test-server.ts > /tmp/f45-test-server.log 2>&1 &
 *
 * Kill it with: `lsof -t -iTCP:3100 -sTCP:LISTEN | xargs -r kill`
 */
import handler from "../dist/server/server.js";

const PORT = Number(process.env.PORT ?? 3100);
const HOST = process.env.HOST ?? "127.0.0.1";
const CLIENT_DIR = `${import.meta.dir}/../dist/client`;

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: 255,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname !== "/") {
      const file = Bun.file(`${CLIENT_DIR}${url.pathname}`);
      if (await file.exists()) return new Response(file);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the built entry default-exports a Bun fetch handler.
    return (handler as { fetch: (r: Request) => Response | Promise<Response> }).fetch(req);
  },
});

console.log(`test server on http://${HOST}:${String(server.port)} (db: ${process.env.DATABASE_URL ? "configured" : "NOT configured"})`);
