// Lecture 6, Part 1, exercise 1.2 — point the repository's own statDelta at the
// numbers in its research summary.
//
// Copy this file to the ROOT of your cooperationengine clone and run:
//   node --experimental-strip-types part1_delta.ts
// No npm install, no database, no API key. Node 22.6 or newer.

import { aggregateStat, statDelta, type MetricName } from "./shared/metrics.ts";

// A rate is the mean of a 0/1 column; k successes out of n is k ones and n−k zeros.
function bernoulli(k: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i < k ? 1 : 0));
}

const cases: [string, number, number, number, number][] = [
  // research-summary.md, "Deception assistance": "occasionally assist (~2 of 16)" vs "most willing (~5 of 16)"
  ["deception  2/16 vs 5/16", 2, 16, 5, 16],
  // "never assist" vs "most willing"
  ["deception  0/16 vs 5/16", 0, 16, 5, 16],
  // "Prisoner's Dilemma": GPT-5 3.5% vs Gemini Flash 6.1% defection. n per model is not
  // reported; 1,648 decisions / 9 models ≈ 183 each is an assumption, stated as such.
  ["PD defect  3.5% vs 6.1% at n≈183", Math.round(0.035 * 183), 183, Math.round(0.061 * 183), 183],
];

const name: MetricName = { name: "rate" };
for (const [label, kA, nA, kB, nB] of cases) {
  const a = aggregateStat(name, bernoulli(kA, nA));
  const b = aggregateStat(name, bernoulli(kB, nB));
  const d = statDelta(a, b); // threshold defaults to 2
  console.log(
    label.padEnd(36),
    `Δ=${d.meanDelta.toFixed(4)}  SE=${d.stderr.toFixed(4)}  z=${d.z.toFixed(2)}  significant=${d.significant}`,
  );
}
