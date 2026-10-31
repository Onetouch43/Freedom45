/**
 * The copy for the consolidated /legal page.
 *
 * WHY IT LIVES HERE, NOT IN THE ROUTE FILE: the three tabs are pure text, so they
 * can be word-counted from a script (the legal posture caps each tab at 400 words)
 * and edited without touching any layout code.
 *
 * THE PLACEHOLDERS ARE EXACT STRINGS. They are the only company detail we have,
 * and we must not invent any more: no made-up name, number, address or email.
 * The square brackets are part of the text — the page highlights them as-is.
 */

/** Business line, rendered at the top of /legal so every tab sits under it. */
export const SOLE_TRADER_LINE =
  "Freedom45 is a trading name of [SOLE TRADER NAME TO BE CONFIRMED BEFORE PUBLIC LAUNCH]";

/** Where users write to us. Appears wherever we ask someone to contact us. */
export const SUPPORT_EMAIL = "[SUPPORT EMAIL TO BE CONFIRMED]";

/** Postal contact. The owner intends to use a virtual office address. */
export const CONTACT_ADDRESS =
  "[CONTACT ADDRESS TO BE CONFIRMED - user will use a virtual office address]";

/** Shown as a visible "Effective date" line. */
export const EFFECTIVE_DATE = "30 October 2026";

/** The draft banner, word for word. */
export const DRAFT_BANNER =
  "Pre-launch draft - company details to be confirmed before taking payments on custom domain";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "bullets"; items: string[] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalTabId = "terms" | "privacy" | "contact";

export type LegalTab = {
  id: LegalTabId;
  /** Tab label. Short enough for three tabs on a 360px phone. */
  label: string;
  /** Page heading shown inside the tab. */
  title: string;
  /** One line under the heading, so the tab is readable on its own. */
  summary: string;
  sections: LegalSection[];
};

const p = (text: string): LegalBlock => ({ kind: "p", text });
const bullets = (items: string[]): LegalBlock => ({ kind: "bullets", items });

export const LEGAL_TABS: LegalTab[] = [
  {
    id: "terms",
    label: "Terms",
    title: "Terms of use",
    summary: "The rules for using Freedom45, in plain English.",
    sections: [
      {
        heading: "What Freedom45 is",
        blocks: [
          p(
            "Freedom45 is a planning tool. You type in your income, spending and savings, and it estimates when that pace could make you financially independent.",
          ),
          p(
            "That is financial education, not financial advice. We do not tell you what to do with your money, we do not recommend any product, and we are not authorised or regulated by the Financial Conduct Authority. Every figure is an illustration built from assumptions you provide.",
          ),
        ],
      },
      {
        heading: "Your data is your own",
        blocks: [
          p(
            "The numbers you type in belong to you. We store them so we can do the sums and show your plan back to you, and that is the only thing we use them for. We never sell them, never share them for advertising, and never use them to push a product at you.",
          ),
          p(
            "You can delete everything in one tap in Settings, at any time.",
          ),
        ],
      },
      {
        heading: "No guarantee of returns",
        blocks: [
          p(
            "Investments can fall as well as rise, and you can get back less than you put in. Past performance does not guarantee future results. We cannot promise you will reach financial independence at 45, or at any age: the Estimated Freedom Date is an estimate, not a forecast.",
          ),
        ],
      },
      {
        heading: "The paid plan",
        blocks: [
          p(
            "The free tier covers the FI calculator, the Path to 45 projection and a basic spending tracker. The paid plan is £6 a month or £59 a year, in pounds sterling, and adds Family Mode, what-if scenarios, PDF export and the full investment library.",
          ),
          p(
            "You can cancel at any time and keep access until the end of the period you have paid for. We show you the price before any payment is taken.",
          ),
        ],
      },
      {
        heading: "Using the app",
        blocks: [
          p(
            "You must be 18 or over. Keep your login to yourself and do not type another person's financial details into the app.",
          ),
        ],
      },
      {
        heading: "Changes and the law",
        blocks: [
          p(
            "We may update these terms. The effective date above shows which version is current; if you keep using Freedom45, the new version applies.",
          ),
          p(
            "These terms are governed by the law of the part of the UK you live in, and any dispute will be dealt with by the courts of that part of the UK.",
          ),
        ],
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    title: "Privacy notice",
    summary:
      "What we hold, where it lives, and how to get it back or delete it — under UK GDPR.",
    sections: [
      {
        heading: "Who is responsible",
        blocks: [
          p(
            `The data controller is the sole trader named above. That means we decide what is collected and why, and we answer to you for it. Privacy questions, access requests and deletion requests: ${SUPPORT_EMAIL}.`,
          ),
        ],
      },
      {
        heading: "What we collect",
        blocks: [
          p(
            "Two things only. Your email address and a hash of your password (we never store the password itself), and the inputs you type in for your calculations:",
          ),
          bullets([
            "Your profession, free hours and skills.",
            "Monthly income, monthly spending and current savings.",
            "Your target age, weekly check-ins and the side hustles you save.",
            "Any spending entries you add by hand.",
          ]),
          p(
            "That is the whole list, and every item is something you chose to type in. No bank login, no bank connection, no card details, no ID documents, no advertising trackers. If you leave a field blank we do not invent a value for it.",
          ),
        ],
      },
      {
        heading: "Where it is stored",
        blocks: [
          p(
            "Our hosting provider is Vercel, and your data sits in a managed PostgreSQL database run by Neon. Both act as processors on our instructions: they host and run the app and the data, and they do not use your information for their own purposes.",
          ),
          p(
            "We never sell your data — not to anyone, ever. We do not share it for advertising, and there are no ad networks or cross-site trackers in the app.",
          ),
        ],
      },
      {
        heading: "Your rights",
        blocks: [
          p(
            `Under UK GDPR you can ask for a copy of your data, ask us to correct it, ask us to delete it, or object to how we use it. Write to ${SUPPORT_EMAIL} and we will respond within one month.`,
          ),
          p(
            "You do not need to email us to delete: Settings has a one-tap delete that removes every row you own and ends your session straight away. It cannot be undone.",
          ),
          p(
            "If you are unhappy with how we have handled your data you can complain to the Information Commissioner's Office at ico.org.uk.",
          ),
        ],
      },
      {
        heading: "How long we keep it",
        blocks: [
          p(
            "Until you delete it. Deleting removes your rows immediately; our database provider's short-term backups may hold an older copy for a few days before it ages out.",
          ),
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    title: "Contact us",
    summary: "One address, one inbox, and what happens when the business incorporates.",
    sections: [
      {
        heading: "Email",
        blocks: [
          p(`Questions about the app, your data, or a payment: ${SUPPORT_EMAIL}.`),
          p("We aim to reply within a few working days."),
        ],
      },
      {
        heading: "Post",
        blocks: [p(CONTACT_ADDRESS)],
      },
      {
        heading: "When we incorporate",
        blocks: [
          p(
            "Freedom45 is a sole trader business today. On incorporation this page will be updated with the limited company's name, company number and registered office address, and the trading name line above will name the company instead. Nothing else on this page changes.",
          ),
        ],
      },
      {
        heading: "Read more",
        blocks: [
          p(
            "The full disclaimer explains what our estimates are and are not. The Guide explains how to read the numbers. Our spending, saving and investing pages are general information, never a recommendation.",
          ),
        ],
      },
    ],
  },
];

/**
 * Word count for one tab, counting the heading, summary and every paragraph and
 * bullet. Used by the build-time check that keeps each tab under 400 words.
 */
export function countTabWords(tab: LegalTab): number {
  const text: string[] = [tab.title, tab.summary];
  for (const section of tab.sections) {
    text.push(section.heading);
    for (const block of section.blocks) {
      if (block.kind === "p") text.push(block.text);
      else text.push(...block.items);
    }
  }
  return text.join(" ").trim().split(/\s+/).filter(Boolean).length;
}
