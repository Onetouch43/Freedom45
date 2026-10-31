/**
 * The live published deployment.
 *
 * THE APP URL IS DEFINED HERE, ONCE. Nothing else in the codebase should spell
 * out the address. When a custom domain exists, change this one string and every
 * place that shows or links the app follows.
 */
export const APP_URL = "https://81991c49de36840333070e1842232770.cto.site";

/** The address as a human reads it (no scheme), derived from APP_URL. */
export const APP_URL_LABEL = APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
