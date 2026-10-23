import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { LegalPage, Section } from "~/components/Footer";
import { sessionUserFn } from "~/server/actions";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide — Freedom45" },
      {
        name: "description",
        content:
          "How to set up Freedom45 in a minute, read your Estimated Freedom Date, change the return assumption, log progress and delete your data. Two minutes to read.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { user } = await sessionUserFn().catch(() => ({ user: null }));
    return { signedIn: Boolean(user) };
  },
  component: GuidePage,
});

function GuidePage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <>
      <Header signedIn={signedIn} />
      <LegalPage
        signedIn={signedIn}
        title="The two-minute guide"
        intro={<p>Everything you need to use Freedom45, in the order you will use it.</p>}
      >
        <Section heading="1. Set up (about a minute)">
          <p>
            Create an account with an email and a password. Six quick steps follow: your field and
            job, the hours you have spare each week, what you are good at, your income and spending,
            what you have saved, and the age you are aiming for (45 by default — change it if you
            like). Nothing is bank-linked, so all of it is typed in and takes about a minute. You
            can correct any of it later.
          </p>
        </Section>

        <Section heading="2. What “Path to 45” actually is">
          <p>
            It is one number and one line. From your income, spending and savings, we work out the
            pot you would need for your spending to be covered by your savings, then show the age
            your current pace reaches that pot — the <strong>Estimated Freedom Date</strong>. The line
            under it is how that pot is projected to grow, month by month, at the return you have
            chosen.
          </p>
        </Section>

        <Section heading="3. How to read the estimate">
          <p>
            It is an estimate built from your own assumptions, not a prediction and not a promise. It
            assumes your income and spending stay broadly as you entered them and that your savings
            grow at the return rate shown. Real life is messier, so treat it as a direction of travel:
            if the date moves when you change the sliders, that is the app working as intended.
          </p>
        </Section>

        <Section heading="4. Changing the return assumption">
          <p>
            Use the return slider on the dashboard. Lower it to see a cautious picture; raise it to
            see what a stronger market would do. The slider only changes the assumption on screen —
            it does not change anything you have saved. Whichever rate you pick, investments can
            fall as well as rise, and you can get back less than you put in.
          </p>
        </Section>

        <Section heading="5. Logging progress with “Update my numbers”">
          <p>
            When your pay or spending changes, open the dashboard and tap{" "}
            <strong>Update my numbers</strong>. Enter your new monthly income, monthly spending and
            current savings, and save. We store that as a snapshot, so the dashboard can show how
            your plan moves over time. A quick check every month or two is plenty — there is no
            daily logging to keep up with.
          </p>
        </Section>

        <Section heading="6. Finding a side hustle">
          <p>
            The hustles page shows examples of work that fit the hours, skills and field you gave us,
            with the honest downside of each one written on the card. Save the ones that appeal and
            they will be kept in <strong>My hustles</strong>. These are educational examples, not a
            recommendation and not a promise of income — the earnings ranges shown are wide
            illustrations for someone starting out.
          </p>
        </Section>

        <Section heading="7. Deleting everything">
          <p>
            Open <strong>Settings</strong> from the menu (the Settings tab on your phone) and tap{" "}
            <strong>Delete my data</strong>. You will be asked to confirm, because it is permanent:
            your account, profile, saved hustles, spending entries and snapshots are all removed and
            cannot be recovered. No email is needed.
          </p>
        </Section>

        <Section heading="One last thing">
          <p>
            Freedom45 gives educational estimates only and is not financial advice. The{" "}
            <Link to="/disclaimer" className="underline underline-offset-2">
              Disclaimers
            </Link>{" "}
            page explains what that means in a few short paragraphs.
          </p>
        </Section>
      </LegalPage>
    </>
  );
}
