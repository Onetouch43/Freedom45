import type { SVGProps } from "react";

/**
 * The app's one icon set — inline SVG, drawn on a 24x24 grid with a 1.75 stroke,
 * inheriting `currentColor`. No icon font, no CDN, no package: a handful of tiny
 * paths so the whole set costs a few hundred bytes gzipped and never blocks paint.
 *
 * Rules of the house: legible at 20–24px, one visual weight, decorative by default
 * (`aria-hidden`) because every icon in the app sits next to a text label.
 */
type IconProps = { size?: number; className?: string } & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

function base({ size = 22, className = "", ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    className: `shrink-0 ${className}`,
    ...rest,
  };
}

/** Dashboard — a gauge/speedometer: "what pace am I on". */
export function IconGauge(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="15" r="1.4" />
      <path d="M4 18h3M17 18h3" />
    </svg>
  );
}

/** Side hustles — a bolt: work that adds money in the hours you already have. */
export function IconBolt(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13.5 3 5 13.5h5.5L10 21l8.5-10.5H13L13.5 3Z" />
    </svg>
  );
}

/** Spending — a wallet. Reserved for the spending screen as it lands. */
export function IconWallet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1.2" />
    </svg>
  );
}

/** Library — an open book. Reserved for the investment library. */
export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.5C10.5 5.2 8.5 4.7 4 5v13c4.5-.3 6.5.2 8 1.5 1.5-1.3 3.5-1.8 8-1.5V5c-4.5-.3-6.5.2-8 1.5Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

/** Settings — sliders. Reserved for the settings screen. */
export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

/** Done / saved. */
export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

/** A tick in a circle — used for match reasons. */
export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16.5 9" />
    </svg>
  );
}

/** Forward / next step. */
export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Progress over time. */
export function IconTrendUp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 17 9.5 11l3.5 3L20 7" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

/** Assumptions / explanation. */
export function IconInfo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Free hours. */
export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Money. */
export function IconCoin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8.5h-3.2a2.1 2.1 0 0 0 0 4.2h.9a2.1 2.1 0 0 1 0 4.2H9" />
      <path d="M12 6.6v10.8" />
    </svg>
  );
}

/** How quickly a hustle can start earning. */
export function IconRocket(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13.5 4.5c3.5.5 6 3 6.5 6.5-3.2 3.2-6.4 4.6-9 5.5l-6-6c.9-2.6 2.3-5.8 8.5-6Z" />
      <circle cx="14.8" cy="9.2" r="1.5" />
      <path d="M8.5 15.5 6 18M5.5 13.5 3 16M10 19.5 7.5 22" />
    </svg>
  );
}

/** The freedom target. */
export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Filter / tune the shortlist. */
export function IconFilter(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

/** A saved hustle (bookmark). */
export function IconBookmark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 4.5h11v15l-5.5-4-5.5 4v-15Z" />
    </svg>
  );
}

/** Whose plan it is — a person. */
export function IconUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
    </svg>
  );
}

/** Search. */
export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

/** Question / help. */
export function IconHelp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.7" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The nav and section icon mapping in one place, so a new destination is one
 * line here plus one entry in `NAV_DESTINATIONS` (Header.tsx).
 */
export const ICONS = {
  dashboard: IconGauge,
  hustles: IconBolt,
  spending: IconWallet,
  library: IconBook,
  settings: IconSettings,
} as const;

export type IconKey = keyof typeof ICONS;
