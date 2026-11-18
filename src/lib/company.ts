/**
 * The business's real details, in one place.
 *
 * Every detail below is owner-supplied: name, company type, contact email and
 * phone, registered address, and the jurisdiction whose law governs the terms.
 * Nothing here is a placeholder any more — there is nothing left to invent.
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

/** The owner-supplied registered address, formatted for the US. */
export const REGISTERED_ADDRESS = "2472 Cornwall Road, Chambersburg, PA 17202, USA";

/** The same address as lines, for the places that print it as a block. */
export const REGISTERED_ADDRESS_LINES = [
  "2472 Cornwall Road",
  "Chambersburg, PA 17202",
  "USA",
] as const;

/**
 * Owner-supplied: the LLC is formed in Pennsylvania, and the law of that
 * Commonwealth governs the terms. Pennsylvania is a Commonwealth, not a State,
 * and it has no comprehensive consumer-privacy statute — so the privacy notice
 * rests on our own promises, not on Pennsylvania law protecting you.
 */
export const GOVERNING_LAW = "the Commonwealth of Pennsylvania, United States";
