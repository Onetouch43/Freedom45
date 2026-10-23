import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import {
  Bullets,
  CONTACT_EMAIL_PLACEHOLDER,
  LegalPage,
  Placeholder,
  Section,
} from "~/components/Footer";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Freedom45" },
      {
        name: "description",
        content:
          "Why Freedom45 exists: budgeting apps say where money went, investing apps say what to buy — nothing answers what you need to do this month to be free of the 9–5 by about 45.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: AboutPage,
});

function AboutPage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <>
      <Header signedIn={signedIn} />
      <LegalPage
        title="About Freedom45"
        signedIn={signedIn}
        intro={
          <p>
            Freedom45 exists to answer one question that no other app answers: what do I need to do
            this month to be free of the 9–5 by about 45?
          </p>
        }
      >
        <Section heading="Why we built it">
          <p>
            Budgeting apps tell you where your money went. Investing apps tell you what to buy.
            Neither tells you what your current pace actually adds up to, or what would move it.
            That gap is the whole reason this exists.
          </p>
          <p>
            So we built one screen that answers it: the age your current income, spending and savings
            reach financial independence, and what happens to that age when you change the
            assumptions.
          </p>
        </Section>

        <Section heading="Who it is for">
          <p>
            UK graduates and early-career professionals, usually 22–35, in their first or second
            proper job — often with student debt, often helping family, and with little idea whether
            their current pace gets them anywhere. Everything is in pounds and describes UK
            arrangements.
          </p>
        </Section>

        <Section heading="What we are not">
          <Bullets
            items={[
              "Not a bank or a broker — we never hold, move or invest your money.",
              "Not authorised or regulated by the Financial Conduct Authority, and we give no financial advice.",
              "Not gurus. We do not have a secret strategy or a hot tip, and we will not pretend to.",
              "Not bank-linked. There is no bank login, and every figure in the app is typed in by you.",
            ]}
          />
        </Section>

        <Section heading="The rules we hold ourselves to">
          <Bullets
            items={[
              "Every money screen carries the same disclaimer, in the owner's exact wording.",
              "Results are called an Estimated Freedom Date, never a guaranteed one, and the assumptions are shown next to the number.",
              "Side hustles are educational examples with the honest downsides written on them — never a promise of income.",
              "We collect the minimum, never sell data, and let you delete everything in one tap.",
            ]}
          />
        </Section>

        <Section heading="Built for the UK">
          <p>
            Pounds, UK wrappers (ISAs, workplace and personal pensions), UK regulation and UK
            consumer rights. It is a deliberately UK product; the app says so rather than pretending
            to travel.
          </p>
        </Section>

        <Section heading="Contact">
          <p>
            Questions, corrections or a problem with your data:{" "}
            <Placeholder>{CONTACT_EMAIL_PLACEHOLDER}</Placeholder>.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Freedom45 provides educational estimates only — see the{" "}
            <a className="underline underline-offset-2" href="/disclaimer">Disclaimers</a>.
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
