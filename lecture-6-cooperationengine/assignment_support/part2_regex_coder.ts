// Lecture 6, Part 2 — run the repository's automated coder over a set of
// justifications and print every code with the span that licensed it.
//
// Copy this file to the ROOT of your cooperationengine clone, put the transcripts
// JSON beside it, and run:
//   node --experimental-strip-types part2_regex_coder.ts transcripts_synthetic.json
//   node --experimental-strip-types part2_regex_coder.ts transcripts_synthetic.json --csv > coder_regex.csv
//
// The JSON is a list of { id, content } objects — the same shape shared/ethicalSpace.ts takes.

import { readFileSync } from "node:fs";
import { extractCitedReasons, deriveEthicalSpace } from "./shared/ethicalSpace.ts";

const CODES = [
  "maximize_welfare",
  "self_continuation",
  "protect_vulnerable",
  "duty_over_consequences",
  "equal_worth",
  "virtue_character",
  "reciprocity",
];

const file = process.argv[2];
if (!file) {
  console.error("usage: node --experimental-strip-types part2_regex_coder.ts <transcripts.json> [--csv]");
  process.exit(1);
}
const items: { id: string; content: string }[] = JSON.parse(readFileSync(file, "utf8"));
const csv = process.argv.includes("--csv");

if (csv) {
  console.log(["id", ...CODES].join(","));
  for (const j of items) {
    const present = new Set(extractCitedReasons(j.content).map((r) => r.reason));
    console.log([j.id, ...CODES.map((c) => (present.has(c) ? "1" : "0"))].join(","));
  }
} else {
  for (const j of items) {
    console.log(`\n${j.id}: ${j.content}`);
    const reasons = extractCitedReasons(j.content);
    if (reasons.length === 0) console.log("   (no code)");
    for (const r of reasons) console.log(`   ${r.reason.padEnd(24)} ← "${r.evidence}"`);
  }
  const space = deriveEthicalSpace(items);
  console.log("\nregions  :", JSON.stringify(space.regions));
  console.log("tensions :", JSON.stringify(space.tensions));
  console.log("reasons  :", space.reasons.join(", "));
}
