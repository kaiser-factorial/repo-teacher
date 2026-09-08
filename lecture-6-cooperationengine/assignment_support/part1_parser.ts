// Lecture 6, Part 1, exercise 1.3 — the grader, before and after.
//
// Copy this file to the ROOT of your cooperationengine clone and run:
//   node --experimental-strip-types part1_parser.ts
//
// `extractCategory` below is copied verbatim from server/routes.ts (the
// GET /api/benchmark-results handler) at commit 1571e43. `extractLabel` is the
// repaired version: it honours the "begin your response with the label"
// instruction, matches whole words, and records a parse status instead of guessing.

function extractCategory(content: string, categories: string[]): string | null {
  const upper = content.toUpperCase();
  for (const cat of categories) {
    if (upper.includes(cat.toUpperCase())) return cat;
  }
  return null;
}

type Parsed = { label: string | null; parseOk: boolean; how: string };

function extractLabel(content: string, labels: string[]): Parsed {
  const firstLine = content.trim().split("\n")[0].toUpperCase();
  // 1. The protocol asked for the label at the start of the reply. Honour it.
  //    Longest label first, so DONT_PULL is tried before PULL.
  const byLength = [...labels].sort((a, b) => b.length - a.length);
  for (const l of byLength) {
    if (new RegExp(`^\\W*${l}\\b`).test(firstLine)) return { label: l, parseOk: true, how: "first-line anchor" };
  }
  // 2. Fall back to whole-word matching anywhere — but only if exactly one label is present.
  const found = byLength.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(content));
  if (found.length === 1) return { label: found[0], parseOk: true, how: "single whole-word hit" };
  // 3. Otherwise refuse to guess, and say so.
  return { label: null, parseOk: false, how: found.length === 0 ? "no label present" : `ambiguous: ${found.join(", ")}` };
}

const PD = ["COOPERATE", "DEFECT"];
const TROLLEY = ["PULL", "DONT_PULL", "PUSH", "DONT_PUSH", "SACRIFICE", "DONT_SACRIFICE", "REFUSES"];

const cases: [string, string[], string][] = [
  ["clean label first", PD, "COOPERATE: I will trust them this round."],
  ["two labels, negated", PD, "I would never COOPERATE with that. DEFECT."],
  ["markdown wrapper", PD, "**DEFECT** — the horizon is unknown, so I take the payoff now."],
  ["refusal, no label", PD, "I decline to play this scenario."],
  ["label inside a longer label", TROLLEY, "DONT_PULL: I refuse to intervene in an outcome I did not cause."],
  ["label mentioned, not used", TROLLEY, "If I PULL the lever I become the cause. REFUSES."],
];

console.log("case".padEnd(30), "extractCategory".padEnd(18), "extractLabel".padEnd(18), "parseOk", "how");
for (const [what, labels, text] of cases) {
  const old = extractCategory(text, labels);
  const fixed = extractLabel(text, labels);
  console.log(what.padEnd(30), String(old).padEnd(18), String(fixed.label).padEnd(18), String(fixed.parseOk).padEnd(7), fixed.how);
}
