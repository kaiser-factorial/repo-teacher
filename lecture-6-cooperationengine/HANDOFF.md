# Lecture 6 — Evaluating Models and Harnesses (cimcai/cooperationengine) — handoff

Built 3 September 2026 in a remote sandbox (Node v22.22.2, Python 3.11, LibreOffice 24.2 with
`libreoffice-impress` installed by hand — the base image ships only `libreoffice-core`, and
`soffice --convert-to pdf` reports "source file could not be loaded" until Impress is present).

## What is here

| File | Status |
|---|---|
| `build.js` → `Cooperation_Engine_Lecture.pptx` | 35 slides. Built, validated with the pptx skill's `validate.py`, rendered through LibreOffice → PDF → PyMuPDF and every slide inspected. Two layout passes; the second fixed upward overflow on slides 1, 7, 11, 12, 16, 22, 24, 29, 30, 32, 33 and the tree spacing on 20. |
| `quiz.py` | 18 questions (7 MC, 6 T/F, 5 short-answer; 9 concepts, 9 repo). All six automated checks from `quiz-structure.md` run clean; scoring mechanics tested. |
| `cooperationengine_assignment.md` | Three parts. Parts 1–2 executed end to end (see below). Part 3 is the student's own app and is labelled as unexecuted. |
| `assignment_support/` | `part1_delta.ts`, `part1_parser.ts`, `part2_regex_coder.ts` (run from the clone root with `node --experimental-strip-types`), `transcripts_synthetic.json`, `coding_sheet.csv`, `evalkit.py` + `test_evalkit.py` (9 tests pass), `instructor/coding_instructor.csv` and `instructor/coder_regex.csv`. |

Reference clone: `vendor/cooperationengine` at commit `1571e43` (1 July 2026). Gitignored; re-clone
before rebuilding anything that cites a line count.

## Added 3 September 2026: a real transcript from the-room

`assignment_support/the_room/` packages session `2026-09-01T04-58-47` (condition `house`, 108
messages, 3 journal entries) from the course owner's `kaiser-factorial/the-room` Supabase mirror,
with a blank coding sheet for that project's three chat-room judge tasks. Chosen because it is the
newest control-batch chat session and is not one of the six sessions the project's
`calibration/calibration-set.json` already draws on. Exported by `export_session.py`, which prints
counts only. **No label was written**: the-room's judge handoff has a blindness rule (label before
any model sees an item), so there is deliberately no instructor sheet for this set. `evalkit.py
kappa` was extended to nominal columns (speech acts, orientation) for it, with a test.

## What was validated, and how

- **Shared-module tests with no install**: `node --experimental-strip-types --test shared/metrics.test.ts shared/modelTier.test.ts` → 20/20. `ethicalSpace.test.ts` imports vitest and cannot run this way; the deck and assignment say so.
- **Full vitest suite**: only after `rm package-lock.json && npm install --ignore-scripts` (the committed lockfile points twenty packages at `package-firewall.replit.local` and omits vitest — upstream PR #35). Result 34 passed / 11 skipped, identical to PR #35's own report. The lockfile was restored afterwards.
- **Every number on slides 11, 12 and 33** was computed in Python and then reproduced through the repository's own `statDelta` via `part1_delta.ts`. The PD defection comparison assumes n ≈ 183 per model (1,648 / 9); the summary does not report the split, and the slide, the script and the assignment all say it is an assumption.
- **Grader bias claims (slide 24)**: `extractCategory` and `getSessionType` were read from `routes.ts` at the commit above; `part1_parser.ts` demonstrates each failure on a copy of the function. PR #34 (open) fixes the *arena* parser only; the benchmark path is unchanged on main. Re-check both PRs before re-teaching: if #34 or #35 merges, slides 24, 32 and 34 and the assignment's setup section go stale.
- **The regex coder's output** on the four upstream fixtures and on the ten synthetic transcripts is what the assignment quotes. The instructor-vs-regex kappa report in the assignment is the actual `evalkit.py kappa` output.
- **Citations**: arXiv 2306.05685 (Zheng et al.), 2211.09110 (HELM) and 2505.23836 (Needham et al.) were opened. Landis & Koch 1977 and Cohen 1960 were confirmed through the Semantic Scholar API; the publisher pages returned 403, so the slides link the Wikipedia pages that were actually opened for the kappa formula/bands and the Braun & Clarke phases, and name the primary papers in text without a link.

## What was not validated

- Nothing in the running application. No PostgreSQL, no provider keys; `npm run dev` was never started. Slide 31 (pages and routes) is from reading `client/src/pages/` and `routes.ts`, not from clicking.
- Part 3 of the assignment, by construction.
- Exercise 2.5 (real transcripts from a chat model) was not run; it is optional and labelled.

## Decisions worth knowing

- **Lecture number 6** was the course owner's call; the README's former row 6 (distributed RL, candidate) moved to row 8.
- **Thirteen background slides** before the bridge, at the owner's request for a long general section. Qualitative analysis gets two (9, 10) because the owner named it as the gap. Lab 2 already has an "evals define done" slide; this deck's grader taxonomy (slide 6) is a different cut and does not cite it.
- **Synthetic transcripts** for the kappa exercise, labelled as such in the file and the assignment, so the agreement exercise has a fixed answer key. One (`s05`) was edited after the first regex run to contain the word "survive", so that the mention-versus-use failure actually fires.
- **The research summary is re-read, not attacked** (slide 33). Its own limitations paragraph concedes the uneven n; the slide quantifies what it conceded and says which conclusions survive.
- **Counts that will drift**: 302 commits, 3 stars, 5 forks, 9 open issues, 6 open PRs, 12 enabled of 17 chatbots, 69 templates, line counts on slide 20. All are stamped "3 September 2026" via the `CHECKED` constant at the top of `build.js`.

## Copyright ledger (one quotation per source, across all three artifacts)

- `server/routes.ts`, `shared/metrics.ts`, `shared/ethicalSpace.ts`, `server/modelClient.ts`, `server/preprompt.ts`, `shared/modelTier.ts`, `shared/schema.ts`: code excerpts on the reading slides (fair use for teaching; the assignment copies `extractCategory` into `part1_parser.ts` with attribution).
- `research-summary.md`: the phrase "cleanly separates" (slide 33 and assignment 1.2). Do not add a second quotation from it.
- Issue #18: "often indicate it is in a game-like environment" (slide 29). Do not add a second.
- The sycophancy template's "Begin with: CORRECTS / HEDGES / AGREES" (bridge row 7). The assignment refers to the life-raft template by id and location rather than quoting it.
