# Handoff — Lecture 4 (huggingface/trl)

**Written:** 2026-08-07, at the end of the chat session that built this lesson.
**Revised:** 2026-08-08, after a Cowork feedback pass (deck restructure, §8 below).
**For:** whoever picks this up next, human or Claude.
**Status:** all four artifacts built and shipped. One half of the assignment is unvalidated — see §5.

---

## 1 · Start here

1. **Read the `repo-teacher` SKILL.md before touching anything**, plus the relevant reference
   file (`lecture-structure.md` for the deck, `quiz-structure.md` for the quiz,
   `assignment-structure.md` for the worksheet). This is not optional politeness — the format's
   most important properties are also its most easily lost, and the references encode bugs that
   have already shipped once. The skill's location moves between sessions
   (`/mnt/skills/user/repo-teacher/`, `~/.claude/skills/repo-teacher/`) — locate it, don't
   paste a path from an old note.
2. **Check for version drift immediately.** This lesson was built against TRL `1.10.0.dev0`,
   re-verified against upstream on **2026-08-08** (HEAD `2396dfe`, dated 2026-08-07).
   ```bash
   git clone --depth 1 https://github.com/huggingface/trl.git vendor/trl
   cat vendor/trl/VERSION
   ls vendor/trl/trl/trainer/*_trainer.py
   find vendor/trl/trl/experimental -maxdepth 1 -mindepth 1 -type d | wc -l
   ```
   If the stable-trainer set or the experimental count has changed, slides 13, 20 and 21, the
   quiz's experimental-count question, and Exercise A in the notebook all need revisiting
   together.

---

## 2 · What's in this directory

| File | What it is |
|---|---|
| `TRL_Lecture.pptx` | 22-slide deck. **Not** the source of truth — `build.js` is. |
| `build.js` | Authoritative deck source. Edit here, or edit slide XML in place for small fixes. |
| `quiz.py` | 18 questions, self-scoring, stdlib only. Writes `quiz_history.json` beside itself. |
| `trl_assignment.md` | Two-part worksheet: Part 1 reading (validated), Part 2 notebook (not run). |
| `trl_lecture4_kaggle.ipynb` | The GPU half. 7 code cells, Qwen2.5-0.5B, free Kaggle tier. |
| `make_notebook.py` | Regenerates the `.ipynb`. Edit this, not the JSON. |
| `gen-icons.js` | Regenerates the 54 PNGs in `../icons/`. Verifies rendered pixel colour, not filenames. |

All four scripts resolve paths relative to `__dirname` / `__file__`, with optional
`REPO_TEACHER_ICONS` and `REPO_TEACHER_OUT` overrides. No absolute paths — don't reintroduce any.

**Slide order:** title → teaser → six standalone background slides → bridge → *what is TRL* →
*acronyms* → *use cases* → eleven repository slides → conclusion. Organizing question throughout:
*where does the training signal come from?*

---

## 3 · Findings from source worth not re-deriving

These came from reading the actual repo, not documentation. They are the spine of the lesson.

- **One loop, six losses.** Every stable trainer subclasses `_BaseTrainer` (191 lines, itself a
  subclass of the Transformers `Trainer`) and overrides `compute_loss()`. The way to read the
  library is to diff two `compute_loss` functions.
- **The on-policy split is structural.** SFT / Reward / DPO / KTO have a `training_step` that is
  a thin passthrough to `super()`. GRPO / RLOO instead override `_prepare_inputs` with a real
  `_generate_and_score_completions` path. You can tell which trainers generate without reading
  a word of prose.
- **Reward modelling is one line:**
  `loss = -nn.functional.logsigmoid(rewards_chosen - rewards_rejected).mean()`. Only the
  difference is ever learned, which is why scores aren't comparable across reward models.
- **PPO is experimental, not stable.** `trl/experimental/ppo/`. Its dataset requirement
  (pre-tokenized text) is unlike every other trainer's. KTO was recently promoted *into* stable.
  Most external material still teaches PPO as canonical.
- **`GRPOConfig.beta` defaults to `0.0`** — the reference model isn't loaded at all.
  `DPOConfig.beta` defaults to `0.1`. The help text says so outright and cites DeepSeek-R1.
  **This is withheld from slide 8 deliberately**: it's Exercise F in the notebook, and the
  assignment's overall reflection is built on the disagreement. Confirmed as a deliberate choice
  on 2026-08-08. Slide 8 was rewritten in that pass, but only to *soften* the overclaim ("the
  standard defense" → "the most common defense"; "nothing stops it from collapsing" → "nothing
  in the loss bounds the drift"). If you decide to state it outright, Exercise F and the
  assignment's closing reflection both need rewriting — don't change one without the other.
- **TRL's own docs mis-expand DPO.** `docs/source/paper_index.md` heads the DPO section "Direct
  **Policy** Optimization"; the paper it links to on the next line is "Direct **Preference**
  Optimization", and every other doc in the repo agrees with the paper. Slide 11 uses this as its
  worked example of why an expansion is not a citation.

### Line counts, verified 2026-08-08

`base_trainer.py` 191 · `reward_trainer.py` 809 · `kto_trainer.py` 1,807 ·
`dpo_trainer.py` 1,815 · `rloo_trainer.py` 1,832 · `sft_trainer.py` 1,868 ·
`grpo_trainer.py` 3,404. Stable trainers: 6. Experimental directories: 27. Open issues: 86.

---

## 4 · Open items, roughly in priority order

1. **Run the notebook and report back.** This is the highest-value next action. See §5.
2. **Lecture 5 — GRPO deep dive.** Same repo, one level down: `grpo_trainer.py` (~3,400 lines),
   policy gradients, group-relative advantage, why the value network disappeared. The deck's
   closing slide already promises this.
3. **Possible skill update.** Lessons from this build that may belong in `repo-teacher`:
   the "validate statically when you can't execute" pattern, the edit-script failure in §6, and
   the background-slide/tool-name tension in §8.
4. **Lecture 6 candidate:** `verifiers` / `prime-rl` — distributed RL, natural successor to 5.
   There's a `prime-intellect` skill already available from an earlier detour, and a built but
   unnumbered `lecture-X-prime-intellect/` unit with its own `SESSION_STATE.md`.

Lecture 3 (repeng) **has** been built — an earlier version of this handoff said it hadn't. Its
findings live in the `lecture-3-repeng-findings.md` doc in the claude.ai project.

---

## 5 · What was NOT validated — read this before trusting the notebook

**The notebook has never been executed on a GPU.** What *was* done:

- Every constructor signature read from source (`SFTTrainer`, `RewardTrainer`, `DPOTrainer`,
  `GRPOTrainer`).
- Every config kwarg cross-checked against TRL's own `tests/` directory.
- All three Hub datasets confirmed to exist (`trl-lib/Capybara`,
  `trl-lib/ultrafeedback_binarized`, `trl-lib/kto-mix-14k`).
- All 7 code cells parsed with `ast`.
- `report_to` changed from `[]` to `'none'` because that's what TRL's tests actually use.

What could still break: OOM on a 16 GB card, dtype issues on T4 (Turing handles bf16 poorly),
Kaggle image conflicts during `pip install`, generation being slower than expected without vLLM.

**When something fails, distinguish two cases** — the fix differs:
- *Never worked* → the exercise was wrong when written. Fix the exercise.
- *Worked, then stopped* → upstream moved. Check `VERSION` and `MIGRATION.md`, note the caveat,
  consider a "Known Current Issue" slide (an established pattern in this deck format).

**The GRPO constraint most likely to bite:** the generation batch is
`steps_per_generation × per_device_train_batch_size`, where `steps_per_generation` falls back to
`gradient_accumulation_steps` when unset. It must be evenly divisible by `num_generations`. The
notebook uses 1 × 4 = 4 with `num_generations=4` — one prompt, four completions, which is exactly
one GRPO group.

---

## 6 · Gotchas that already cost time

- **An edit script reported success on changes it never wrote.** A Python heredoc applied four
  string substitutions to an in-memory buffer, printed `ok` for each, then raised before the
  `write()` call. The fixes were silently lost and only caught on re-render. **Write the file
  before reporting success, or report after writing.**
- **Re-render after every edit, and look at the images.** Three real defects in this deck —
  two footer collisions and a pill overlapping a title — were invisible to text extraction.
- **A body text box that overflows its height grows *upward* too.** `body()` boxes are
  vertically centred by default, so a two-line paragraph that becomes three lines rises into the
  slide title rather than only dropping. Three slides hit this in the 2026-08-08 pass. If a
  title looks crowded, count the lines in the paragraph under it.
- **`.gitignore` root patterns can shadow lesson directories.** A `/trl/` rule intended for a
  cloned reference repo would have silently swallowed a `trl/` lesson folder. Fixed by naming
  lessons `lecture-<n>-<tool>` and confining clones to `vendor/`. Don't reintroduce bare root
  patterns named after tools.
- **"RAFT" is a three-way acronym collision.** Lecture 1 linked the wrong one for a while.
  Resolved: slide 11 of Lecture 1 now says KTO, linked to arXiv 2402.01306.

---

## 7 · Verification commands

```bash
# deck renders and validates
node build.js
python3 <pptx-skill>/scripts/office/validate.py TRL_Lecture.pptx
soffice --headless --convert-to pdf TRL_Lecture.pptx && pdftoppm -jpeg -r 100 TRL_Lecture.pdf s
# then LOOK at every s-NN.jpg

# quiz engine, non-interactive
python3 quiz.py --history

# notebook regenerates and parses
python3 make_notebook.py
python3 -c "import json,ast; nb=json.load(open('trl_lecture4_kaggle.ipynb')); \
  [ast.parse('\n'.join(l for l in c['source'].split('\n') if not l.strip().startswith('!'))) \
   for c in nb['cells'] if c['cell_type']=='code']; print('cells parse')"

# no absolute paths crept back in
grep -rn "/home/\|/Users/\|/tmp/" build.js gen-icons.js make_notebook.py quiz.py
```

Delete any `quiz_history.json` generated during testing before committing — it's gitignored,
but worth checking.

---

## 8 · The 2026-08-08 feedback pass (deck went 21 → 22 slides)

Corina reviewed the deck and the changes below were applied. **The slide numbering changed**,
which is the thing most likely to be silently broken by a future edit.

**Reordering.** Use cases moved from 19 to 12 (motivate before the deep dive). A new acronym
slide was inserted at 11. Everything from the old 11 onward shifted. Old → new:
11→13, 12→14, 13→15, 14→16, 15→17, 16→18, 17→19, 18→20, 19→12, 20→21, 21→22.
The `(slide N)` tags in `trl_assignment.md` and the in-deck "see slide N" references were
remapped in the same pass; back-reference pills point only at background slides 3–8 and were
unaffected.

**Renames.** Deck title "A Map of the Territory" → "Six Methods, One Training Loop" (propagated
to `pres.title`, the assignment header, `quiz.py`'s docstring, and the repo README roadmap).
Slide 2 → "What TRL Is, in One Paragraph". Slide 4 → "Reward Models — Fitting a Judge to
Comparisons". Slide 5 → "Feedback Data Formats". Slide 8 → "The Anchor: Why Penalize the Model
for Changing?". Slide 17 → `reward_trainer.py`. Slide 18 → "Verifiable Rewards". Slide 22 →
"Conclusion".

**Decisions worth not re-litigating:**

- **Slide 5 deliberately does not name trainer classes.** Corina asked for the trainer→format
  mapping on the data-format slide. It is a *background* slide, and the format's core rule is
  that background slides carry no tool-specific content — this exact violation is a bug the
  skill records as already shipped once. The compromise: slide 5 names generic method
  *families* ("reward modeling, direct preference methods"); slide 16 carries the concrete
  trainer classes, which is the mapping slide she was asking whether existed.
- **Slide 5 says "Formats", not "Structures".** Her wording was "Feedback Data Structures";
  "formats" was used instead because TRL's own doc is `dataset_formats.md` and "data structures"
  reads as heaps-and-tries to a CS audience. Flagged to her at the time; revert if she prefers.
- **Verifiers are framed as *more robust to* reward hacking, not immune.** Slides 3, 7 and 18
  now agree on this, with slide 7 carrying a footnote that forward-references slide 18.
- **Slide 15's row fills encode the signal source** (blue = demonstration, green = judgment,
  purple = verifier/RM) with a key beneath. This replaced the old "last two are shaded"
  note — don't reintroduce the note without removing the key.
- **"Reading it is genuinely hard" was cut** from Limitations. The substance stayed, reframed to
  describe the code ("The algorithm is buried in infrastructure") rather than the reader.
