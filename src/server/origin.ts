import { getRequest } from "@tanstack/react-start/server";

import { APP_URL } from "~/lib/site";

/**
 * The origin to put in a link that leaves the app (an email, a return address).
 *
 * DERIVED FROM THE REQUEST, NOT PINNED TO ONE ADDRESS: `x-forwarded-proto` plus
 * `x-forwarded-host` (falling back to `host`), so buying a custom domain needs no
 * code change — the link follows whatever address the visitor actually used.
 *
 * `APP_URL` is the fallback, and it is used whenever the request does not carry a
 * host a person could open: no request in scope, a loopback address, or the
 * platform's internal name that the proxy rewrites the host header to. A link
 * built from one of those would be dead in the recipient's inbox.
 */
export function requestOrigin(): string {
  try {
    const request = getRequest();
    const url = new URL(request.url);
    const first = (value: string | null): string => (value ?? "").split(",")[0]?.trim() ?? "";

    const host = first(request.headers.get("x-forwarded-host")) || first(request.headers.get("host")) || url.host;
    const protoHeader = first(request.headers.get("x-forwarded-proto"));
    const proto =
      protoHeader === "https" || protoHeader === "http"
        ? protoHeader
        : url.protocol.replace(":", "") || "https";

    const hostname = host.split(":")[0]?.toLowerCase() ?? "";
    if (hostname && isOpenableHost(hostname)) return `${proto}://${host}`;
  } catch {
    // No request in scope — the published address below is the answer.
  }
  return APP_URL;
}

/** A host a person on the internet could actually reach. */
function isOpenableHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") return false;
  if (hostname === "0.0.0.0") return false;
  // The platform's internal preview names, and anything only this machine resolves.
  if (/\.bl\.run$/.test(hostname) || /\.internal$/.test(hostname) || /\.local$/.test(hostname)) {
    return false;
  }
  if (/^127\./.test(hostname)) return false;
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
  return true;
}
