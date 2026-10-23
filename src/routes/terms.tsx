import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import {
  Bullets,
  COMPANY_ADDRESS_PLACEHOLDER,
  COMPANY_NAME_PLACEHOLDER,
  COMPANY_NUMBER_PLACEHOLDER,
  LegalPage,
  Placeholder,
  Section,
} from "~/components/Footer";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Freedom45" },
      {
        name: "description",
        content:
          "The rules for using Freedom45: an educational calculator and tracker, not a financial adviser, bank or broker.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: TermsPage,
});

const LAST_UPDATED = "21 October 2026";

function TermsPage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <>
      <Header signedIn={signedIn} />
      <LegalPage
        signedIn={signedIn}
        title="Terms of Service"
        intro={
          <p>
            These are the rules for using Freedom45. Plain English, no traps. Last updated{" "}
            {LAST_UPDATED}.
          </p>
        }
      >
        <Section heading="1. Who we are and what this service is">
          <p>
            Freedom45 is provided by <Placeholder>{COMPANY_NAME_PLACEHOLDER}</Placeholder>, company
            number <Placeholder>{COMPANY_NUMBER_PLACEHOLDER}</Placeholder>, registered address{" "}
            <Placeholder>{COMPANY_ADDRESS_PLACEHOLDER}</Placeholder> ("we", "us").
          </p>
          <p>Freedom45 is an educational calculator and tracker. It is:</p>
          <Bullets
            items={[
              "not a financial adviser, and not a fiduciary — we do not act in your interests as an adviser would;",
              "not a bank, a broker, an investment platform or a pension provider;",
              "not a place where money is held, moved, invested or transferred — we never touch your money, and we cannot buy or sell anything on your behalf.",
            ]}
          />
          <p>
            We do not connect to your bank, and we never ask for your bank login. Everything the app
            works with is typed in by you.
          </p>
        </Section>

        <Section heading="2. Who can use it">
          <p>
            You must be 18 or over and using Freedom45 for yourself, from the UK. The app works in
            pounds sterling and describes UK arrangements. If you are under 18, please do not use it.
          </p>
        </Section>

        <Section heading="3. Your account">
          <Bullets
            items={[
              "Give accurate information — the calculation is only as good as the figures you type in.",
              "One account per person. Do not share an account or your password.",
              "Keep your login details safe; you are responsible for activity under your account.",
              "Tell us if you think someone else has accessed your account.",
            ]}
          />
        </Section>

        <Section heading="4. Acceptable use">
          <p>Please do not:</p>
          <Bullets
            items={[
              "break the law, or use Freedom45 to help someone else break it;",
              "try to access other people's accounts or data, or probe the service for weaknesses;",
              "scrape, copy or resell the app or its content, or use it to build a competing product;",
              "upload malicious code, spam other users, or overload the service;",
              "type another person's personal or financial details into the app.",
            ]}
          />
          <p>We may suspend or close an account that breaks these rules.</p>
        </Section>

        <Section heading="5. Free tier and paid tier">
          <p>
            The free tier includes the financial-independence calculator, your Path to 45
            projection, and a basic tracker, with no ads. It is free and you can use it without
            entering any payment details.
          </p>
          <p>
            A paid tier is planned at <strong>£6 per month or £59 per year</strong>, intended to
            include Family Mode, scenarios and what-if sliders, PDF export, the full investment
            library and no ads.{" "}
            <strong>
              It is not yet available and cannot be purchased — nothing in the app takes payment
              today.
            </strong>{" "}
            When it becomes available, the price, what it includes and how to cancel will be shown
            before you pay, and these terms will be updated.
          </p>
        </Section>

        <Section heading="6. Nothing here is advice">
          <p>
            All content in Freedom45 is general information and illustration. It is not financial,
            investment, tax or legal advice, and it is not tailored to your circumstances. Decisions
            you make about your money are your own. Before acting on anything you see in the app,
            consider speaking to a suitably qualified professional. See the{" "}
            <a className="underline underline-offset-2" href="/disclaimer">Disclaimers</a> for the
            full statement.
          </p>
        </Section>

        <Section heading="7. Our content">
          <p>
            The app, its design, its side-hustle database and its written content belong to us (or
            are used with permission). We grant you a personal, non-transferable licence to use
            Freedom45 for your own non-commercial purposes. Do not copy, republish or redistribute
            it without our written permission.
          </p>
        </Section>

        <Section heading="8. Changes to the service and to these terms">
          <p>
            We may add, change or remove features as the app develops. We may update these terms;
            the date at the top shows the current version. If a change is material — something that
            affects your rights or your data — we will tell you by email before it takes effect. If
            you do not agree, you can delete your account at any time in{" "}
            <a className="underline underline-offset-2" href="/settings">Settings</a>.
          </p>
        </Section>

        <Section heading="9. Availability and data loss">
          <p>
            We aim to keep Freedom45 running, but we do not promise uninterrupted availability. The
            service may be down for maintenance, and data may be lost if something goes wrong.
            Please keep your own record of any figures that matter to you.
          </p>
        </Section>

        <Section heading="10. Limitation of liability">
          <p>
            To the extent the law allows, we are not liable for financial decisions you make, for
            losses arising from those decisions, or for any indirect or consequential loss connected
            with your use of Freedom45. The estimates in the app are illustrations, and you are
            responsible for checking them before relying on them.
          </p>
          <p>
            Nothing in these terms limits or excludes any liability that cannot be limited or
            excluded under the law of England and Wales — including liability for death or personal
            injury caused by negligence, or for fraud.
          </p>
        </Section>

        <Section heading="11. Governing law">
          <p>
            These terms are governed by the law of England and Wales, and the courts of England and
            Wales have exclusive jurisdiction over any dispute about them.
          </p>
        </Section>

        <Section heading="12. Deleting your account">
          <p>
            You can delete your account and everything in it at any time, in one tap, from{" "}
            <a className="underline underline-offset-2" href="/settings">Settings</a>. Deletion is
            permanent and cannot be undone. Our{" "}
            <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a> explains
            what this removes.
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
