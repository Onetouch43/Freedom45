/**
 * The business's real details, in one place.
 *
 * Owner-supplied: name, company type, contact email and phone. The registered
 * address has NOT been supplied, so it stays a visible placeholder everywhere an
 * address is required — we do not invent one. The governing state is the same:
 * a marked placeholder until the owner names it.
 *
 * WHAT MUST NEVER APPEAR HERE: the company's EIN. It is for Stripe and tax only
 * and must not be written into the app, its content, its comments or its tests.
 */
export const COMPANY_NAME = "Futures AI Global LLC";

/** How the company is described in prose. */
export const COMPANY_TYPE = "a limited liability company registered in the United States";

/** Where users write to us. */
export const CONTACT_EMAIL = "info@futuresaiglobal.com";

/** Owner-supplied contact number, in international format. */
export const CONTACT_PHONE = "+1 (267) 242-7615";

/** Not supplied yet — rendered inside <Placeholder> so it is obviously missing. */
export const REGISTERED_ADDRESS_PLACEHOLDER = "Registered address to be provided";

/** Not supplied yet — the US state whose law governs the terms. */
export const GOVERNING_STATE_PLACEHOLDER = "STATE TO BE CONFIRMED";
