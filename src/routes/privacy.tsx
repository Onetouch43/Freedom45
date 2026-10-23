import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import {
  Bullets,
  COMPANY_ADDRESS_PLACEHOLDER,
  COMPANY_NAME_PLACEHOLDER,
  LegalPage,
  Placeholder,
  PRIVACY_EMAIL_PLACEHOLDER,
  Section,
} from "~/components/Footer";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Freedom45" },
      {
        name: "description",
        content:
          "Exactly what Freedom45 stores (only what you type in), what it never collects, and how to delete everything in one tap.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: PrivacyPage,
});

const LAST_UPDATED = "21 October 2026";

function PrivacyPage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <>
      <Header signedIn={signedIn} />
      <LegalPage
        signedIn={signedIn}
        title="Privacy Policy"
        intro={
          <p>
            Short version: we hold the numbers you type in so we can calculate your plan and let
            you come back to it. We never sell your data, we never ask for a bank login, and you can
            delete everything in one tap. Last updated {LAST_UPDATED}.
          </p>
        }
      >
        <Section heading="Who is responsible">
          <p>
            Freedom45 is run by <Placeholder>{COMPANY_NAME_PLACEHOLDER}</Placeholder> of{" "}
            <Placeholder>{COMPANY_ADDRESS_PLACEHOLDER}</Placeholder>. We are the data controller for
            the information described here. Privacy questions and requests:{" "}
            <Placeholder>{PRIVACY_EMAIL_PLACEHOLDER}</Placeholder>.
          </p>
        </Section>

        <Section heading="What we collect — everything is typed in by you">
          <Bullets
            items={[
              "Your email address and a hash of your password (we never store the password itself).",
              "Your age confirmation, and the date you agreed to these terms.",
              "Your profession and field of work.",
              "The free hours you have each week, and the skills you pick from our list.",
              "Your monthly income, monthly spending and current savings, as you type them.",
              "Your target age (default 45), and the date you last updated your numbers.",
              "The side hustles you save from the matcher.",
              "Your check-in snapshots — the income, spending and savings figures you record over time.",
              "Any spending entries you add by hand.",
            ]}
          />
          <p>
            That is the whole list. Everything in it is information you chose to type in. If you
            leave a field blank, we do not invent a value for it.
          </p>
        </Section>

        <Section heading="What we do not collect">
          <Bullets
            items={[
              "No bank logins and no bank account connections — there is no bank linking in Freedom45 at all.",
              "No bank or card transactions. We never see your real transactions, only what you type.",
              "No ID documents, no passport or driving licence, no proof of address.",
              "No payment details — the free tier asks for none. If a paid plan is offered later, payments would be handled by a payment provider and we would not store your card details.",
              "No advertising or cross-site tracking. We have no ad networks, no social pixels and no analytics that profile you across other websites.",
              "No data about anyone else. Please do not type another person's financial details into the app.",
            ]}
          />
        </Section>

        <Section heading="Why we hold it">
          <Bullets
            items={[
              "To run the calculation you asked for — your Estimated Freedom Date, your progress and your hustle matches.",
              "To let you sign back in and see your plan where you left it.",
              "To keep the app safe and working (for example, keeping your session valid).",
            ]}
          />
          <p>
            Our lawful basis under UK GDPR is the contract you enter into with us by using the
            service, and our legitimate interest in keeping the app secure. We do not use your
            figures for marketing, and we do not sell or rent your data to anyone, ever.
          </p>
        </Section>

        <Section heading="Where your data lives">
          <p>
            Your data is stored in a managed Postgres database provided as hosted infrastructure.
            Connections to it, and to this website, are encrypted in transit (HTTPS). Only the app
            can reach the database; it is not a public service. Some hosting providers may process
            data outside the UK — where that happens, the provider's standard contractual safeguards
            apply.
          </p>
        </Section>

        <Section heading="Cookies">
          <p>
            We set one cookie: a session cookie that keeps you logged in. It is HttpOnly, has the
            SameSite=Lax attribute, and lasts up to 30 days, or until you log out. We use no
            analytics cookies and no advertising cookies, so there is no cookie banner to dismiss.
          </p>
        </Section>

        <Section heading="Minimal collection and age">
          <p>
            We ask only for what a calculation needs, and nothing else. Freedom45 is for people aged
            18 and over. We ask you to confirm your age before we save anything, and we do not
            knowingly hold data on anyone under 18 — if you think we have, contact us and we will
            delete it.
          </p>
        </Section>

        <Section heading="How long we keep it">
          <p>
            While your account exists. When you delete your account, your user record and everything
            attached to it — profile, sessions, side-hustle saves, spending entries and snapshots —
            is deleted straight away and cannot be recovered. We keep no backup copy that we can
            restore your plan from.
          </p>
        </Section>

        <Section heading="Your rights">
          <p>Under UK GDPR you can ask us to:</p>
          <Bullets
            items={[
              "give you a copy of the information we hold about you (access);",
              "correct anything that is wrong (rectification);",
              "delete everything (erasure) — the one-tap Delete my data button does this immediately;",
              "restrict or object to how we use it;",
              "give you your data in a portable format.",
            ]}
          />
          <p>
            You do not need to email us to delete your data: open{" "}
            <a className="underline underline-offset-2" href="/settings">Settings</a> and tap{" "}
            <strong>Delete my data</strong>. If you cannot sign in, email{" "}
            <Placeholder>{PRIVACY_EMAIL_PLACEHOLDER}</Placeholder> and we will handle it for you. We
            answer requests within one month.
          </p>
        </Section>

        <Section heading="Complaints">
          <p>
            If you are unhappy with how we handle your information, please tell us first so we can
            put it right. You also have the right to complain to the UK information regulator, the
            Information Commissioner's Office (ICO), at{" "}
            <a
              className="underline underline-offset-2"
              href="https://ico.org.uk"
              rel="noreferrer noopener"
              target="_blank"
            >
              https://ico.org.uk
            </a>
            .
          </p>
        </Section>

        <Section heading="Changes to this policy">
          <p>
            If we change how we handle your data in a meaningful way, we will tell you by email
            before the change takes effect. The date at the top of this page always shows the
            current version.
          </p>
        </Section>

        <Section heading="Not financial advice">
          <p>
            Reading this policy tells you nothing about whether any financial product is right for
            you. Freedom45 provides educational estimates only and is not financial, investment or
            tax advice — see the <a className="underline underline-offset-2" href="/disclaimer">Disclaimers</a>.
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
