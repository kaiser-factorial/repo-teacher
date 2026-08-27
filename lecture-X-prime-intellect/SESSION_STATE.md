# Lecture 4 (Prime Intellect) — session state

**Last updated:** 2026-07-30. Read this before touching anything in this directory.

Lecture 4 has two workstreams. The **course unit** (deck / quiz / assignment) is essentially done.
The **AiderPolyglot fork + bug report to Prime Intellect** is the live work and is where all the
risk lives.

---

## 1 · Course unit — status

| Deliverable | State |
|---|---|
| `PrimeIntellect_Lecture.pptx` (+ `build.js`, `icons/`) | 20 slides, built and QA'd. Footer `PRIME INTELLECT · AI SEMINAR, LECTURE 4`. Seven overflow bugs found by rendering every slide and fixed. |
| `quiz.py` | 18 questions (6 each MC / TF / short answer; 9 `rl`, 9 `platform`). All four automated checks clean; engine verified at 18.00/18, −3.00/18, 14.00/18. |
| `prime_intellect_assignment.md` | Exercises 1–6 plus a tamper-detector extension. **Exercises 7+ are still stubbed** pending real numbers from the fork work. |

**Known open item:** slide 12 says v0/v1 "both are supported." `verifiers` 0.2.0 says legacy is no
longer supported. Verify against the 0.2.x release notes and correct.

---

## 2 · The AiderPolyglot workstream

Three agents run in parallel: **this session** (review, design, feedback), **Claude Code**
(implementation, sweeps, the fork), **Codex** (Octave). Handoff docs are the interface between them.

### Forks

- **Fork A** — `AiderPolyglot/forkA/`. Minimal fix to the existing environment: the reward hack and
  the path traversal share one fix; `verifiers` pinned; Rust toolchain bumped `1.75` → `1.97`. This
  is what gets submitted.
- **Fork B** — `AiderPolyglot/forkB/`. Full rewrite against the v1 Taskset/Harness API. `FORKB_SPEC.md`
  written; **build not started**, blocked on Fork A submission.
- **Fork C / Octave** — `octave_RL/OCTAVE_RL.md` is a standalone handoff for Codex with no aider
  references. `AiderPolyglot/FORKC_OCTAVE_HANDOFF.md` is the aider-side version.

### The report — `AiderPolyglot/REPORT/`

- `BUG_REPORT_reward_hack.md` — the main document. Part 0 benchmark integrity, Part I
  environment-specific findings, Part II platform-wide `verifiers` drift.
- `BENCHMARK_INTEGRITY_findings.md` — Part 0 standing alone.
- `verifiers-versioning-report.html` — Part II standing alone.
- `feedback/` — my review passes. `FINAL_PASS_before_sending.md` is the last one.
- `resources/` — sweep scripts and raw JSON. Publishing these is a large part of why the report is
  credible; keep them attached.

**As of this writing every item in `FINAL_PASS_before_sending.md` has been applied.** The
`env_response` disclosure is in (`BENCHMARK_INTEGRITY` L393), every flagged narration string is gone,
and the HTML is restructured — 3,009 visible words, down from 4,261, now leading with "What's
actually new here" and demoting the 0.1.8 material to a section explicitly marked skippable. Check
the files before writing another review pass; the last two rounds nearly reviewed a stale copy.

---

## 3 · Findings — established, with evidence

Do not re-litigate these. Each was verified against source or raw data.

1. **Reward hack.** The environment lets a submission overwrite its own test files. Benchmark
   validity, not security.
2. **Path traversal / arbitrary file write.** `file_path = temp_exercise_path / filename` with no
   containment check, from a model-controlled filename.
3. **The 0.1.8 rollout-contract break** (2025-11-19), verified from source at three tags:
   `is_completed` signature changed, `env_response` return type changed, `state["turn"]` →
   `state["trajectory"]`. Shipped in a patch bump with no shim.
4. **"v1" properly means the Taskset/Harness API at 0.1.14** (2026-05-07) — *not* 0.1.8. The
   conflation is common and it matters for third parties, less so for Prime.
5. **`prime eval run` has an undeclared coupling to `verifiers.cli`**, so a pre-0.1.8 pin breaks it
   locally. `vf-eval` works and is what environment READMEs already document.
6. **`prime lab setup` scaffolds an unbounded pin today.** One-line fix on Prime's side.
7. **Shared-install non-durability.** `prime env install` / `prime eval run` resolve into one shared
   install; a per-environment ceiling is silently reverted by the next install into the same
   workspace. Confirmed against a real published environment and a real hosted eval, both landing on
   `0.2.1`. Architecturally the most consequential finding.
8. **Hub exposure sweep.** All 1,398 public environments. 429 currently failing their integration
   Action, 362 of those with an unbounded `verifiers` pin. The sweep runs a falsification test
   against its own headline (96.8% vs 94.7% — "not a signal"), finds a sharper floor-based cut,
   argues against that too (57.9%), then checks whether "passing" just means stale. Action logs
   returned HTTP 403 and that is stated. This is the single strongest thing in the report.
9. **Parser truncation.** `FILE_PATTERN` silently truncates any submission containing its own code
   fence. Cite **by mechanism, not by count** — only 1 of 225 references trips it, so a count invites
   "corner case," when idiomatic Rust doc comments make it routine.
10. **Skip markers.** Rust and Java run one test each under `#[ignore]` / `@Disabled`. A deliberately
    constructed solution wrong on 6 of 14 real tests scores 1.0.
11. **`go/counter`** is a free 1.0 — its test file is `// Define your tests here`. This is the
    *reverse* of a failure, which is why a pure failure-hunting sweep misses it.
12. **`python/paasio` leaks its test file** — a hole in Fork A's fix.
13. **Turn double-increment** gives `floor(max_turns / 2)` tested attempts.
14. **Multi-file exercises: 49 of 225 (22%)** under the glob. `go/counter` has seven files.

---

## 4 · Correction ledger — do not reintroduce

Every one of these was a claim of mine that turned out to be wrong. They came back more than once.

| Claim | Reality |
|---|---|
| "77 of the 211 passes" | 77 is the Rust+Java exercise *total*. The single-test figure moved 77 → 63 → 61 → **58** (61 − 2 Check-A failures − 1 already counted as non-discriminating). 58 is measured and reconciled. |
| "Revert the `rust:1.97` bump as scope creep" | Wrong on merits — `rust:1.75` can't compile references using `LazyLock` (needs 1.80+). Reapplied. |
| "Move `state["turn"] += 1` below the allowlist check" | Withdrawn. Code traced the real 0.1.7 rollout loop: it buys one wasted completion and changes no reward. |
| "C++ is the only multi-file case" | 49 of 225. |
| "aider's `percent_cases_well_formed` measures filenames" | It measures *edit format* (`diff` vs `whole`), and AiderPolyglot never used aider's edit formats. |
| "Cut the versioning report 74%" | Retracted. That cut would have deleted the falsification analysis, which is the best material. |
| "The HTML is ready, no notes" | Retracted. It was judged on internal quality without asking who each section was *for*. |

**The pattern worth remembering:** my errors cluster in confident structural judgments made without
re-reading the artefact. The fix is to read the thing, then judge.

---

## 5 · Constraints — these persist

- **The path traversal is reported as a benchmark-validity / security finding, NOT as RCE.** Do not
  claim remote code execution.
- **Do not demonstrate the escalation.** An inert marker file proves the primitive. Writing a
  `sitecustomize.py` that executes — especially against hosted infrastructure — is unauthorised
  testing.
- **Report to Prime before or simultaneously with publishing any public fork.**
- **Publication order:** private push → Actions check → finalise report → send → public only after
  they respond.
- Corina does not paste API keys into chat. Live testing runs on her machine.
- claude.ai artifact URLs are blocked by site permissions. Don't route around it — ask for the file.

---

## 6 · Editorial standard for anything sent to Prime

Corina's framing, which should govern every review pass:

> Reread these documents in the mindset of a maintainer with a rigorous, no-bullshit approach who's
> also got a lot of other things they need to take care of.

Operationally:

- **Sort by audience, not by length.** The question is "does the recipient already know this?" A
  length-driven cut and an audience-driven cut remove opposite things.
- **Delete sentences describing what the investigation did; keep sentences describing what is true.**
  The exception is *limitations* — process narration goes, epistemic hedging stays. These are easy to
  confuse and pull in opposite directions.
- **Flag anything without explicit evidence**, including claims true only under very specific
  conditions rather than the actual runtime environment, and claims that have never faced an
  attempted falsification.
- Hedges that are load-bearing ("we didn't spend the follow-up sandbox time to confirm", "one
  exercise, not a census") are protected. A condensing pass must not eat them.

---

## 7 · Open items

1. Fork A submission — private push, Actions check, then send the report.
2. Fork B build (spec written, blocked on 1).
3. Fork C / Octave with Codex.
4. Assignment exercises 7+, awaiting real numbers.
5. Deck slide 12 v0/v1 support claim.
6. `prime-intellect` skill is updated and packaged (`versioning.md`, `env-design.md`, revised
   `SKILL.md`). Any new platform learnings should go back into it.

**Note on memory:** the claude.ai project knowledge `memory.md` is read-only from here and is stale —
it predates Lecture 4 entirely. This file is the working state. If the project-level memory should
reflect Lecture 4, that has to be updated in claude.ai directly.
