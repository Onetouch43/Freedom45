/** Quick scenario check for the side-hustle matcher: bun run scripts/check-matcher.ts */
import { matchHustles } from "~/lib/matcher";
import { SIDE_HUSTLES } from "~/data/side-hustles";

const profiles = [
  { label: "Nurse, 5 hrs/week (Healthcare, no extra skills)", input: { hours: 5, field: "Healthcare", skills: [] } },
  { label: "Nurse, 5 hrs/week (Healthcare + Fitness coaching)", input: { hours: 5, field: "Healthcare", skills: ["Fitness coaching"] } },
  { label: "Designer, 12 hrs/week (Creative & media, Design + Social media + Photography)", input: { hours: 12, field: "Creative & media", skills: ["Design", "Social media", "Photography"] } },
  { label: "Designer, 2 hrs/week, search 'writing'", input: { hours: 2, field: "Creative & media", skills: ["Design"], query: "writing" } },
];

console.log("dataset size:", SIDE_HUSTLES.length);
for (const { label, input } of profiles) {
  const r = matchHustles(input);
  console.log(`\n=== ${label}`);
  console.log(`best (${r.best.length}): ${r.best.map((m) => m.hustle.key).join(", ")}`);
  console.log(`stretch (${r.stretch.length}): ${r.stretch.map((m) => m.hustle.key).join(", ")}`);
  for (const m of r.best.slice(0, 3)) console.log(`  - ${m.hustle.key}: ${m.reasons.join(" | ")}`);
  if (!r.best.length && r.stretch.length) console.log(`  first stretch reasons: ${r.stretch[0].reasons.join(" | ")}`);
  if (!r.all.length) console.log(`  EMPTY (empty state shown)`);
}
