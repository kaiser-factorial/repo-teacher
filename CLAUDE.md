# repo-teacher — project instructions

A master's-level AI/ML tooling seminar. Each lecture covers one open-source tool in depth and ships
three deliverables: a `.pptx` deck, a `quiz.py` comprehension check, and an assignment markdown.
Some lessons add a fourth: a Kaggle notebook for the parts that need a GPU.

Use the **`repo-teacher` skill** for any lecture build or edit. It owns the deck design system
(Ocean Gradient palette, icon chips, path tags, back-reference pills), the mandatory render-and-QA
loop, and the quiz's automated leakage checks.

## Layout

```
lecture-<n>-<topic>/
  <Name>_Lecture.pptx   build.js   quiz.py   <name>_assignment.md
icons/                  shared PNG icon set — committed, do not delete
vendor/                 cloned reference repos — gitignored
```

The `lecture-<n>-<topic>` prefix is load-bearing: a bare `trl/` or `repeng/` at the root would
collide with a cloned reference repo of the same name, and a `.gitignore` rule written for one
would silently swallow the other.

Lessons on disk: **1** foundations · **2** logitloom · **3** repeng · **4** trl ·
**X** prime-intellect (built, but not numbered in the current sequence).

## Read this before touching a lesson

| Working on | Read first |
|---|---|
| Lecture 4 — trl | `lecture-4-trl/HANDOFF.md`. Records what was validated, what wasn't (the notebook has never run on a GPU), and one fact the deck withholds on purpose. |
| Lecture 3 — repeng | The `lecture-3-repeng-findings.md` doc in the claude.ai project. Every number in that lesson has a stated reference environment; design decisions there must not be silently reverted. |
| prime-intellect | `lecture-X-prime-intellect/SESSION_STATE.md`. That unit grew a second workstream — a fork of `primeintellect/aiderpolyglot` and a bug report to Prime Intellect — with its own findings, constraints, and a ledger of corrections that must not be reintroduced. |

## Conventions that have bitten before

- Back-reference pills use `←` (U+2190). `↩` renders as tofu.
- Dark navy icons on dark navy circles are invisible — set explicit contrast.
- Render every slide and look at it. Overflow bugs do not show up any other way.
- No forward-references to later lectures in foundational slides; no "already covered" labels.
- Frame RLHF/DPO as *examples* of post-training, not the full set.
- Inserting or moving a slide means renumbering every `addSlideNumber()` call after it **and**
  every in-deck "see slide N" reference, back-reference pill, and `(slide N)` tag in the
  assignment. Grep for them; they do not announce themselves.

## Paths

Build scripts resolve icons and output relative to `__dirname` / `__file__`, with an optional
`REPO_TEACHER_ICONS` / `REPO_TEACHER_OUT` override. Decks get rebuilt from more than one machine
and inside sandboxes with different home directories — don't reintroduce an absolute path.

## Working norms

Corina catches real errors and expects substantive engagement, not agreement. When she pushes back,
re-derive from source rather than restating. Verify claims — including my own — against raw data
before they go in a document. Retractions are cheap; a wrong number in a sent document is not.
