/**
 * The copy for the consolidated /legal page.
 *
 * WHY IT LIVES HERE, NOT IN THE ROUTE FILE: the three tabs are pure text, so they
 * can be word-counted from a script (the legal posture caps each tab at 400 words)
 * and edited without touching any layout code.
 *
 * THE COMPANY DETAILS ARE REAL except the registered address and the governing
 * state, which the owner has not supplied. Those two stay marked placeholders —
 * we must not invent them. The square brackets are part of the text, so the page
 * highlights them as-is.
 */

import {
  COMPANY_NAME,
  COMPANY_TYPE,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  GOVERNING_STATE_PLACEHOLDER,
  REGISTERED_ADDRESS_PLACEHOLDER,
} from "./company";

/** Business line, rendered at the top of /legal so every tab sits under it. */
export const SOLE_TRADER_LINE = `Freedom45 is a trading name of ${COMPANY_NAME}`;

/** Where users write to us. Appears wherever we ask someone to contact us. */
export const SUPPORT_EMAIL = CONTACT_EMAIL;

/** Postal contact. The owner still has to supply the registered address. */
export const CONTACT_ADDRESS = `Registered address: [${REGISTERED_ADDRESS_PLACEHOLDER}]`;

/** Shown as a visible "Effective date" line. */
export const EFFECTIVE_DATE = "9 November 2026";

/** The draft banner, word for word. */
export const DRAFT_BANNER =
  "Pre-launch draft - registered address and governing state to be provided before taking payments on a custom domain";

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
            "These terms are governed by the laws of the State of [" +
              GOVERNING_STATE_PLACEHOLDER +
              "], United States, and any dispute will be dealt with by the state or federal courts located there.",
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
      "What we hold, where it lives, and how to get it back or delete it — under US state privacy law.",
    sections: [
      {
        heading: "Who is responsible",
        blocks: [
          p(
            `The data controller is ${COMPANY_NAME}, ${COMPANY_TYPE}. That means we decide what is collected and why, and we answer to you for it. Privacy questions, access requests and deletion requests: ${SUPPORT_EMAIL}.`,
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
            "Our hosting provider is [HOSTING PROVIDER TO BE CONFIRMED BEFORE PUBLIC LAUNCH], and your data sits in a managed PostgreSQL database run by Neon. Both act as processors on our instructions: they host and run the app and the data, and they do not use your information for their own purposes.",
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
            `Under US state privacy laws — including the California Consumer Privacy Act (CCPA) as amended by the CPRA — you can ask for a copy of your data, ask us to correct it, ask us to delete it, and ask what we hold and who we share it with. Write to ${SUPPORT_EMAIL} and we will respond within 45 days.`,
          ),
          p(
            "You do not need to email us to delete: Settings has a one-tap delete that removes every row you own and ends your session straight away. It cannot be undone.",
          ),
          p(
            "We do not sell your personal information and we do not share it for cross-context behavioural advertising. If you are unhappy with how we have handled your data you can complain to your state's attorney general, or in California to the California Privacy Protection Agency.",
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
    summary: "One address, one inbox, and the company that runs Freedom45.",
    sections: [
      {
        heading: "Email and phone",
        blocks: [
          p(`Questions about the app, your data, or a payment: ${SUPPORT_EMAIL}.`),
          p(`You can also call us on ${CONTACT_PHONE}.`),
          p("We aim to reply within a few working days."),
        ],
      },
      {
        heading: "Post",
        blocks: [p(CONTACT_ADDRESS)],
      },
      {
        heading: "The company",
        blocks: [
          p(
            `Freedom45 is a product of ${COMPANY_NAME}, ${COMPANY_TYPE}. The registered address is still to be supplied and is shown above as a marked placeholder.`,
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
