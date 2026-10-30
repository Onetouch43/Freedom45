import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Bullets, DISCLAIMER_TEXT, LegalPage, Section } from "~/components/Footer";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimers — Freedom45" },
      {
        name: "description",
        content:
          "Freedom45 gives educational estimates only. It is not financial, investment or tax advice and we are not authorised or regulated by the Financial Conduct Authority.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: DisclaimerPage,
});

function DisclaimerPage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <>
      <Header signedIn={signedIn} />
      <LegalPage
        signedIn={signedIn}
        title="Disclaimers"
        intro={
          <p className="rounded-xl border border-warn/40 bg-warn-fill/12 p-3 text-sm font-medium text-warn">
            {DISCLAIMER_TEXT}
          </p>
        }
      >
        <Section heading="We are not regulated, and we do not give advice">
          <p>
            Freedom45 is not authorised or regulated by the Financial Conduct Authority (FCA), and
            nothing in this app is a personal recommendation. We do not tell you what to buy, sell,
            save, invest in or do with your money. We are not financial advisers, and we do not act
            as a fiduciary for you.
          </p>
        </Section>

        <Section heading="The numbers are illustrations, not predictions">
          <p>
            Every projection you see — including your Estimated Freedom Date — is an illustration
            calculated from figures you type in yourself. It is not a forecast, a promise, or an
            expectation of what will happen. Change one of your inputs, or the return assumption,
            and the answer moves; that is the whole idea.
          </p>
          <p>
            The assumptions we use are shown on screen next to the number, and the pages that
            explain them are dated. If an assumption does not describe your life, the projection
            will not describe your life either.
          </p>
        </Section>

        <Section heading="Investing can lose money">
          <p>
            Investments can fall as well as rise. You can get back less than you put in, and past
            performance does not guarantee future results. Any return figure in the app is an
            assumption you can change, not something we expect or promise.
          </p>
        </Section>

        <Section heading="We cannot promise anyone reaches freedom at 45">
          <p>
            The age in the app's name is an aim, not an outcome. Whether you reach financial
            independence at 45 — or at all — depends on things nobody can control: your income over
            time, your spending, the cost of living, investment performance, health, family, and
            decisions you make. We cannot promise any of it.
          </p>
        </Section>

        <Section heading="Side hustles are examples, not earnings">
          <p>
            The side-hustle matcher suggests examples of work other people do, with the honest
            downsides included. Any income range shown is a wide illustration for someone starting
            out, not a forecast for you. Nothing in the matcher guarantees or promises income.
          </p>
        </Section>

        <Section heading="Speak to a professional before deciding">
          <p>
            If you are making a financial decision — investing, pensions, tax, debt, buying a
            property — speak to a suitably qualified professional who can look at your full
            circumstances. A free starting point is MoneyHelper, the government-backed advice
            service.
          </p>
        </Section>

        <Section heading="Information in the app changes">
          <p>
            Any general information we publish (for example in the investment library) is checked
            against public sources at the date shown on it. Rules and rates change; always check the
            current position with the source we link to before relying on it.
          </p>
        </Section>

        <Section heading="Where to read more">
          <p>
            The <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a>{" "}
            explains what we store, the{" "}
            <a className="underline underline-offset-2" href="/terms">Terms of Service</a> explain
            the rules of using Freedom45, and the{" "}
            <a className="underline underline-offset-2" href="/guide">Guide</a> explains how to read
            the numbers.
          </p>
          <Bullets
            items={[
              "Freedom45 never holds, moves or invests your money.",
              "We never ask for your bank login.",
              "Results are labelled an “Estimated Freedom Date”, never a guaranteed one.",
            ]}
          />
        </Section>
      </LegalPage>
    </>
  );
}
