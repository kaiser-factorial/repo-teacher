# AI Tooling Seminar

A master's-level seminar course. Each lecture opens one open-source AI / interpretability
repository and teaches it **from its source code** — not from its README, not from tutorials,
not from what a language model remembers about it.

Every lesson ships as three coordinated artifacts:

| Artifact | File | Purpose |
|---|---|---|
| Lecture deck | `*.pptx` | 15–20 slides: standalone background, explicit bridge, then the repo itself |
| Comprehension quiz | `quiz.py` | Self-scoring pre/post check, run from the terminal |
| Hands-on assignment | `*_assignment.md` | Exercises validated against the live tool |

---

## Roadmap

| # | Topic | Repo | Status |
|---|---|---|---|
| 1 | Foundations | — | Built |
| 2 | LogitLoom | [`vgel/logitloom`](https://github.com/vgel/logitloom) | Built |
| 3 | repeng | [`vgel/repeng`](https://github.com/vgel/repeng) | Planned |
| 4 | Post-training: a map of the territory | [`huggingface/trl`](https://github.com/huggingface/trl) | Built |
| 5 | Reinforcement learning, deep dive | [`huggingface/trl`](https://github.com/huggingface/trl) (`grpo_trainer.py`) | Planned |
| 6 | Distributed RL *(candidate)* | `verifiers` / `prime-rl` | Candidate |

Lecture 1 is the only lesson that teaches general background — transformer architecture,
the three training stages, and the interpretability mindset. Every later lesson assumes it
and never re-derives it.

---

## Layout

Lesson directories are named `lecture-<n>-<tool>`. That prefix is load-bearing: a bare
`trl/` or `repeng/` would collide with a cloned reference repo of the same name, and a
`.gitignore` rule written for one would silently swallow the other.

```
.
├── lecture-1-foundations/
│   ├── AI_Tooling_Lecture1_Foundations.pptx
│   ├── build.js                    # authoritative source for the deck
│   └── quiz.py
├── lecture-2-logitloom/
│   ├── LogitLoom_Lecture.pptx
│   ├── build.js
│   ├── quiz.py
│   └── logitloom_assignment.md
├── lecture-4-trl/
│   ├── TRL_Lecture.pptx
│   ├── build.js
│   ├── quiz.py
│   ├── trl_assignment.md
│   ├── trl_lecture4_kaggle.ipynb   # the GPU half, runs on Kaggle
│   ├── make_notebook.py            # regenerates the .ipynb
│   └── gen-icons.js                # regenerates icons/
├── icons/                          # shared PNG icon set (see note below)
├── vendor/                         # cloned reference repos — gitignored
└── README.md
```

`quiz.py` resolves `quiz_history.json` relative to `__file__`, so each lesson keeps its own
score history locally. Those history files are gitignored — they're personal progress data,
not course material.

**Clone reference repos into `vendor/`, never at the repo root.** `vendor/` is gitignored as
a whole, which keeps upstream source available for reading without a root-level pattern that
could shadow a lesson folder.

**Commit `icons/`.** The build scripts read PNGs from an icon directory at an absolute path.
If that directory isn't in the repo, a deck cannot be rebuilt without regenerating the entire
icon set first — which has already cost one session the ability to rebuild in place. They're
small. Keep them. `gen-icons.js` reproduces them deterministically if they're ever lost, and
verifies rendered pixel colour rather than trusting filenames.

---

## Running a quiz

```bash
python3 lecture-1-foundations/quiz.py
```

No dependencies beyond the standard library. Take it once before the lecture and once after;
the script tracks both and reports the delta.

## Rebuilding a deck

Decks are generated programmatically with [`pptxgenjs`](https://gitbrent.github.io/PptxGenJS/),
against a shared "Ocean Gradient" design system (navy `0B2942`, deep blue `065A82`,
teal `1C7293`; Cambria titles, Calibri body, Courier New for code citations).

```bash
node build.js
python3 rezip.py Deck.pptx                    # normalize compression
soffice --headless --convert-to pdf Deck.pptx
pdftoppm -jpeg -r 150 Deck.pdf slide
```

**Then look at every rendered slide.** The visual QA pass is not optional — several defects in
this project were invisible to text extraction and only surfaced in the images.

For a small correction to an existing deck, edit `ppt/slides/slideN.xml` in place rather than
re-running the build. The build scripts are long and hand-tuned, and a rebuild silently discards
any fix made after the script was last saved.

---

## Conventions that are load-bearing

- **Source over README.** Slide content, quiz answers, and assignment steps cite real function
  names and real file paths, read from the actual repository at build time.
- **Standalone background, then an explicit bridge.** Background slides must make sense in
  isolation — no tool name, no tool-specific examples. A bridge slide then states, one row per
  concept, exactly how each shows up in the tool.
- **Back-reference pills.** Tool-specific slides carry `← Background · Slide N, [Concept]` pills
  wherever they implement something taught earlier.
- **Cross-artifact consistency.** A correction in one artifact usually needs to propagate to the
  other two. Check all three.
- **Accuracy over brevity.** If something is genuinely valuable, it stays, even if the slide
  gets denser.
- **Verify before publishing an exercise.** Reasoning about how an API *should* behave is not
  sufficient grounds to ship an assignment step. Trace it to the request-building code, or run it.

## Known traps

- **`↩` (U+21A9) renders as a tofu box** through LibreOffice with Calibri. Use `←` (U+2190).
  Text extraction won't catch this — only a visual pass will.
- **Icon contrast.** The `_teal` icon variant renders dark navy. It belongs on light circles
  only; on a navy or teal circle it's nearly invisible. Check the rendered pixel color, not
  the filename.
- **`LINE` shape direction.** Set `flipV: true` exactly when `x1 > x2`. The y-relationship is
  irrelevant. A naive `flipV: y2 < y1` looks right until a child branches left of its parent.
- **Provider drift.** Third-party API behavior moves underneath tools that depend on it —
  logprobs going placeholder, model names vanishing from `/models`, provider sniffers going
  stale. Re-verify before teaching a setup, and use a "Known Current Issue" slide when a live
  bug is worth showing students.
- **"RAFT" is a three-way acronym collision.** *Reward rAnked FineTuning*
  ([Dong et al. 2023](https://arxiv.org/abs/2304.06767)) is the alignment method;
  *Retrieval Augmented Fine-Tuning* (Zhang et al. 2024) adapts models for domain RAG; and
  [`lumpenspace/raft`](https://github.com/lumpenspace/raft) is a third, unrelated method for
  emulating a specific human via SFT + retrieval. Lecture 1 linked the wrong one for a while.
  Always resolve the referent before using an ambiguous acronym on a slide.

---

## The `repo-teacher` skill

Course materials are generated through a Claude skill at `repo-teacher/`, which encodes the
deck structure, quiz-hardening checks, assignment validation rules, and the design system.
Read `SKILL.md` and the relevant reference file **before** building anything — the format's
most important properties are also its most easily lost.

Quiz hardening checks the skill enforces: keyword echo in multiple choice, cross-question
answer leakage, mashable camelCase fragments scattered through a stem, answer-position
clustering across both MC and true/false, and stale provider-specific content.