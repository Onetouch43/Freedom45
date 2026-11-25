import { Link } from "@tanstack/react-router";

import { IconInfo, IconTarget, IconBolt } from "~/components/icons";
import { Card } from "~/components/ui";

/**
 * The single, calm panel a FREE account sees in place of a paid tool.
 *
 * One honest block: what the paid tier unlocks, the price, and a link to the
 * pricing page. No countdown, no "upgrade now", no greyed-out controls that
 * pretend to work. Paid accounts never see this.
 */
export function PaidPanel({
  feature,
  title,
  intro,
}: {
  /** Which paid tool is behind the gate — only changes the wording. */
  feature: "family" | "what-if";
  title: string;
  intro: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-fill/12 text-accent">
          {feature === "family" ? <IconTarget size={18} /> : <IconBolt size={18} />}
        </span>
        <div>
          <h2 className="text-base font-bold text-body">{title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{intro}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-page p-3">
        <p className="text-sm font-semibold text-body">The paid plan is £6 a month, or £59 a year.</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-body">
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">✓</span>
            <span>
              <strong className="font-semibold">Family Mode</strong> — Personal FI and Family FI
              side by side, with a partner and children in the household.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">✓</span>
            <span>
              <strong className="font-semibold">What-if sliders</strong> — move income, spending and
              side-hustle figures and see both dates move, and keep the version you like.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-accent">✓</span>
            <span>No ads.</span>
          </li>
        </ul>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-faint">
        <span className="mt-0.5 text-muted">
          <IconInfo size={14} />
        </span>
        <span>
          Everything on the free tier stays free: the FI calculator, your Path to 45 projection, the
          weekly check-in, the spending tracker, and the whole investment library.
        </span>
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <Link
          to="/pricing"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent-fill px-4 text-base font-semibold text-on-accent transition-colors hover:bg-accent-fill-hover"
        >
          See the paid plan
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-surface-2 px-4 text-base font-semibold text-body transition-colors hover:border-line-strong hover:bg-surface"
        >
          Keep using the free tier
        </Link>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-faint">
        Already paid? Open{" "}
        <Link to="/pricing" className="underline underline-offset-2">
          Pricing
        </Link>{" "}
        and press “Restore my purchase” — it switches the paid tools on for the account you are
        signed in as.
      </p>
    </Card>
  );
}
