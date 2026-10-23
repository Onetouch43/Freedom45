import type { ProjectionPoint } from "~/lib/projection";
import { money } from "~/lib/format";

const W = 340;
const H = 180;
const PAD_X = 28;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;

/**
 * Simple inline SVG line chart — no chart library. Shows the projected balance
 * year by year, the illustrative target balance, and the target age.
 */
export function PathChart({
  points,
  fiNumber,
  targetAge,
  fiAge,
  currency,
}: {
  points: ProjectionPoint[];
  fiNumber: number;
  targetAge: number;
  fiAge: number | null;
  currency: string;
}) {
  if (points.length < 2) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Add your numbers to see the curve.</p>;
  }

  const minAge = points[0].age;
  const maxAge = points[points.length - 1].age;
  const span = Math.max(1, maxAge - minAge);
  const maxBalance = Math.max(fiNumber, ...points.map((p) => p.balance));
  const yMax = Math.max(1, maxBalance * 1.08);

  const x = (age: number) => PAD_X + ((age - minAge) / span) * (W - PAD_X - 8);
  const y = (value: number) => H - PAD_BOTTOM - (value / yMax) * (H - PAD_TOP - PAD_BOTTOM);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.age).toFixed(1)},${y(p.balance).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(maxAge).toFixed(1)},${y(0).toFixed(1)} L${x(minAge).toFixed(1)},${y(0).toFixed(1)} Z`;

  const fiY = y(fiNumber);
  const showFiLine = fiNumber <= maxBalance * 1.06;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Projected balance by age">
      <defs>
        <linearGradient id="f45fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* baseline + gridline at the target balance */}
      <line x1={PAD_X} y1={y(0)} x2={W - 8} y2={y(0)} stroke="currentColor" strokeWidth="0.7" opacity="0.25" />
      {showFiLine ? (
        <>
          <line
            x1={PAD_X}
            y1={fiY}
            x2={W - 8}
            y2={fiY}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text x={PAD_X} y={fiY - 3} fontSize="7.5" fill="#b45309">
            target {money(fiNumber, currency)}
          </text>
        </>
      ) : null}

      {/* target age marker */}
      {targetAge >= minAge && targetAge <= maxAge ? (
        <>
          <line
            x1={x(targetAge)}
            y1={PAD_TOP}
            x2={x(targetAge)}
            y2={y(0)}
            stroke="currentColor"
            strokeWidth="0.7"
            strokeDasharray="2 2"
            opacity="0.4"
          />
          <text x={x(targetAge) + 2} y={PAD_TOP + 7} fontSize="7.5" fill="currentColor" opacity="0.6">
            age {Math.round(targetAge)}
          </text>
        </>
      ) : null}

      <path d={area} fill="url(#f45fill)" />
      <path d={line} fill="none" stroke="#059669" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {fiAge !== null && fiAge >= minAge && fiAge <= maxAge ? (
        <circle cx={x(fiAge)} cy={y(fiNumber)} r="3" fill="#059669" stroke="#fff" strokeWidth="1.2" />
      ) : null}

      {/* axis labels */}
      <text x={PAD_X} y={H - 7} fontSize="8" fill="currentColor" opacity="0.55">
        age {Math.round(minAge)}
      </text>
      <text x={W - 8} y={H - 7} fontSize="8" fill="currentColor" opacity="0.55" textAnchor="end">
        age {Math.round(maxAge)}
      </text>
      <text x={PAD_X} y={PAD_TOP - 4} fontSize="8" fill="currentColor" opacity="0.55">
        {money(yMax, currency)}
      </text>
    </svg>
  );
}
