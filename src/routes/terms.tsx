import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Bullets, LegalPage, Placeholder, Section } from "~/components/Footer";
import {
  COMPANY_NAME,
  COMPANY_TYPE,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  GOVERNING_STATE_PLACEHOLDER,
  REGISTERED_ADDRESS_PLACEHOLDER,
} from "~/lib/company";
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

const LAST_UPDATED = "9 November 2026";

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
            Freedom45 is provided by {COMPANY_NAME}, {COMPANY_TYPE}, of{" "}
            <Placeholder>{REGISTERED_ADDRESS_PLACEHOLDER}</Placeholder> ("we", "us"). You can reach
            us at{" "}
            <a className="underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            or {CONTACT_PHONE}.
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
            You must be 18 or over and using Freedom45 for yourself. The app works in pounds sterling
            and describes UK arrangements, so the figures will not match arrangements elsewhere. If
            you are under 18, please do not use it.
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
            The paid tier is <strong>£6 per month or £59 per year</strong>, and includes Family Mode,
            scenarios and what-if sliders, PDF export, the full investment library and no ads. The
            price and what it includes are shown on the{" "}
            <a className="underline underline-offset-2" href="/pricing">pricing page</a> before you
            pay.
          </p>
          <p>
            Payments are processed by Stripe on Stripe's own payment page. We never see or store your
            card details, and we never hold your money. Subscriptions renew automatically until you
            cancel; you can cancel at any time and keep access to the paid features until the end of
            the period you have already paid for. If you cancel, nothing further is charged.
          </p>
          <p>
            <strong>Paying does not buy financial advice.</strong> The paid tier buys software
            features only. It does not make us your adviser and does not create a fiduciary
            relationship.
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
            excluded under the law of the State of{" "}
            <Placeholder>{GOVERNING_STATE_PLACEHOLDER}</Placeholder>, United States — including
            liability for death or personal injury caused by negligence, or for fraud.
          </p>
        </Section>

        <Section heading="11. Governing law">
          <p>
            These terms are governed by the laws of the State of{" "}
            <Placeholder>{GOVERNING_STATE_PLACEHOLDER}</Placeholder>, United States, without regard
            to its conflict-of-law rules, and the state and federal courts located there have
            exclusive jurisdiction over any dispute about them.
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
