import { SIDE_HUSTLES, type HustleTag, type SideHustle } from "~/data/side-hustles";

/**
 * Pure matching logic for the side-hustle matcher. No DOM, no server imports, so
 * it can be unit-checked from a script and reused on both sides.
 */

export const FIELD_TAGS: Record<string, HustleTag[]> = {
  "Tech & engineering": ["tech", "desk"],
  Healthcare: ["health"],
  Education: ["teaching"],
  "Finance & legal": ["desk"],
  "Creative & media": ["creative", "desk"],
  "Trades & hospitality": ["trades", "hospitality"],
  "Public sector": ["desk"],
  "Sales & marketing": ["desk", "creative"],
  "Student / just graduated": [],
  Other: [],
};

export type MatcherInput = {
  /** Free hours per week the person actually has. */
  hours: number;
  skills: string[];
  /** Onboarding field label, e.g. "Healthcare". Blank is fine. */
  field: string;
  /** Free-text search. Blank is fine. */
  query?: string;
};

export type Match = {
  hustle: SideHustle;
  tier: "best" | "stretch";
  score: number;
  /** Plain-English reasons, most specific first. */
  reasons: string[];
};

const haystack = (hustle: SideHustle): string =>
  [
    hustle.title,
    hustle.summary,
    hustle.involves,
    hustle.notFor,
    hustle.income,
    hustle.fits.join(" "),
    hustle.skills.join(" "),
  ]
    .join(" ")
    .toLowerCase();

/** "writing and design" / "writing, design and coding" */
function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export type MatchResult = {
  best: Match[];
  stretch: Match[];
  /** Everything that survived the search box, in one ranked list. */
  all: Match[];
};

export function matchHustles(input: MatcherInput, dataset: SideHustle[] = SIDE_HUSTLES): MatchResult {
  const hours = Math.max(0, Number(input.hours) || 0);
  const skills = (input.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const tags = FIELD_TAGS[input.field] ?? [];
  const query = (input.query ?? "").trim().toLowerCase();

  const results: Match[] = [];

  for (const hustle of dataset) {
    if (query && !haystack(hustle).includes(query)) continue;

    const matchedSkills = skills.filter((skill) =>
      hustle.skills.some((s) => s.toLowerCase() === skill.toLowerCase()),
    );
    const fieldFit = tags.length > 0 && hustle.fits.some((tag) => tags.includes(tag));
    const openToAll = hustle.fits.includes("any");
    const ratio = hustle.hoursMin > 0 ? hours / hustle.hoursMin : 1;

    // With no skills or field to go on, "open to anyone" is the only overlap there is.
    const hasOverlap = fieldFit || matchedSkills.length > 0 || openToAll;

    // Enough hours and a reason it suits you → best fit. Enough hours but nothing
    // in common, or a squeeze on time but it does suit you → stretch.
    let tier: Match["tier"] | null = null;
    if (ratio >= 1) tier = hasOverlap ? "best" : "stretch";
    else if (ratio >= 0.5 && hasOverlap) tier = "stretch";
    if (!tier) continue;

    let score = 0;
    if (fieldFit) score += 3;
    if (openToAll) score += 1;
    score += Math.min(matchedSkills.length, 2) * 2.5;
    score += ratio >= 1 ? 3 : 1;
    if (hours >= hustle.hoursMin && hours <= hustle.hoursMax) score += 0.5;
    if (hustle.skills.length === 0 && skills.length > 0) score -= 0.25;

    const reasons: string[] = [];
    if (hours >= hustle.hoursMin) {
      reasons.push(`Needs about ${hustle.hoursMin} hrs/week — you have ${hours}.`);
    } else {
      reasons.push(`Usually wants about ${hustle.hoursMin} hrs/week — you have ${hours}, so it would be a squeeze.`);
    }
    if (matchedSkills.length) {
      reasons.push(`Uses the ${listWords(matchedSkills.map((s) => s.toLowerCase()))} you listed.`);
    }
    if (fieldFit) {
      reasons.push(`Common work for people in ${input.field}.`);
    } else if (openToAll && !matchedSkills.length) {
      reasons.push("No particular background or kit needed to start.");
    }

    results.push({ hustle, tier, score, reasons });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      a.hustle.hoursMin - b.hustle.hoursMin ||
      a.hustle.title.localeCompare(b.hustle.title),
  );

  const decorated = results.map((r) => ({
    ...r,
    reasons: r.tier === "stretch" && r.reasons.length < 2
      ? [...r.reasons, "You'd need to find a bit more time or a related skill to make it stick."]
      : r.reasons,
  }));

  return {
    best: decorated.filter((r) => r.tier === "best"),
    stretch: decorated.filter((r) => r.tier === "stretch"),
    all: decorated,
  };
}

export const ALL_SKILLS_FOR_MATCHING = Array.from(
  new Set(SIDE_HUSTLES.flatMap((h) => h.skills)),
).sort();
