# Lab Structure (`lab-N-<topic>/`)

Labs are the second format this skill builds. A **lesson** teaches one repo/tool in depth; a **lab**
teaches a foundational *platform or skill* students need before they can explore certain repos. Read this
file before building any lab — the way a lab differs from a lesson is easy to lose.

## Lesson or lab? Decide first

- **Lesson** — the subject is a repo/tool we're teaching (LogitLoom, repeng). Produces **deck + quiz +
  assignment**. See `lecture-structure.md`, `quiz-structure.md`, `assignment-structure.md`.
- **Lab** — the subject is a capability students need *in order to run/explore* repos (cloud compute, git
  round-trips, environments, tokenized model access). Produces **deck + assignment(s) + the files needed
  to complete them**. **No quiz.**

If the thing you're teaching is "how to operate X so you can later run repos on it," it's a lab.

## What makes a lab different from a lesson

1. **The subject is a live platform, not a GitHub repo.** "Read the repo before building" becomes
   "operate the live platform before building." Platform UIs, quotas, and prices drift *faster* than code,
   so the "verify live before publishing" rule (from `assignment-structure.md`) is **non-negotiable** here,
   not just recommended. Every lab assignment ends with a **§ Verify before class** checklist of the exact
   things to confirm on the live platform (model slugs, error messages, memory fit, UI labels, prices,
   repo URLs). If you built the lab offline / without a live pass, say so at the top of the assignment
   (⚠️ DRAFT) and list what's unverified.
2. **The goal is operational, not conceptual.** Muscle memory ("just get it to run"), not understanding a
   tool. Content is deliberately trivial — provide the code; the student's job is operating the platform.
   If a step feels like "just run the cell," that's correct.
3. **No comprehension quiz.** Success is procedural: did it run, did you save/commit the output, did you
   push, did you recover from the break.
4. **Designed failure is a first-class exercise type** (see below) — the deliberate inversion of the
   lesson skill's "prevent the learner from hitting a confusing failure" rule.

## Directory layout

```
lab-N-<topic>/
├── <Deck>.pptx            # shared intro deck — shown FIRST, before any .md
├── build_deck.py          # reproducible deck build (kept alongside, like build.js in lessons)
├── README.md              # what the lab is, the part order, and status
├── datasets/  (or shared/) # files shared across parts, at the lab ROOT
└── part-a-<x>/            # one subdir per part
    ├── <x>_assignment.md   # the worksheet (no quiz)
    └── <files to complete it>   # notebooks, scripts, requirements.txt, …
    part-b-<y>/  …
```

- **Shared files at the lab root** (deck, shared data); **per-part files in subdirs**. Use Part A / Part B
  when a lab compares two platforms — the comparison *is* the payoff, so keep the parts parallel and share
  one deck + one dataset set.
- Keep `build_deck.py` (or `build.js`) next to the deck so it's reproducible/editable in place.

## The intro deck (labs)

- Same **Ocean Gradient** design system + build/render/QA loop as lessons (see `lecture-structure.md` — the
  palette, typography, footer/pagination, and the icon-contrast rule all carry over). Build with pptxgenjs
  when available, or python-pptx offline; **render every slide and eyeball it** either way.
- Lab-flavored = operational and *screenshottable*. For a two-platform lab, the centerpiece is a
  **"When to use X vs Y" comparison slide** (a clean table) — students screenshot it.
- Typical flow: title → *why this is a lab, not a lesson* → the landscape → one slide per platform → the
  comparison table → a preview per part → ground rules (accounts + any license/gating heads-up).
- **Deck first, then the .md worksheets** — stated learner preference.
- Platform specs (VRAM, quotas, prices) are prime spec-claims: give the number and a verified source link,
  and keep headers declarative — see SKILL.md, "Writing claims and headers."

## Assignments (labs)

- Same `assignment-structure.md` conventions: setup recap with **verbatim** values, numbered exercises with
  exact settings/inputs, an inline **Reflect** after each, one **Overall Reflection**, and a cheat-sheet.
- Exercises are *platform actions*, ordered by execution flow. Mark UI actions distinctly (e.g. a
  🛠 **DO IN THE UI** tag) versus code the student runs.
- Reference the intro-deck slide each exercise ties back to.
- End with the mandatory **§ Verify before class** checklist.

## Designed failure — a first-class lab exercise type (the inversion)

Lessons treat bugs as the enemy: `assignment-structure.md` is all about *preventing* the learner from
hitting a confusing failure. Labs deliberately **engineer** failures to teach recovery. This is the single
biggest thing labs do that the lesson skill argues against — stay conscious of the inversion.

Rules for a planted break:

1. **Reproducible** — it fails the same way every time on the target platform.
2. **Fails exactly as described** — the error (or silent symptom) matches what the assignment says.
3. **Resolves via the exact fix taught** — and the fix is a real, transferable skill.
4. **Confirmed live** — run **both** the break and the fix on the real platform before publishing. You
   cannot reason a break into correctness (this is the load-bearing lesson from the whole project).

Useful patterns:

- **Two flavors, on purpose.** A **hard crash** (loud, halts execution — e.g. a gated-model/token error)
  and a **silent failure** (no error, wrong/absent output — e.g. `plt.show()` on a headless box). The
  silent one is usually the *more valuable* teaching moment precisely because it's sneaky.
- **Cross-platform callbacks.** The same underlying problem solved the *platform-native* way on each
  platform (an HF token via **Kaggle Secrets** in one part, via an **env var / CLI login** in another)
  teaches "this class of problem is platform-specific" — reinforcement, not repetition.
- **Fix = the artifact they push.** When a break's fix is a code edit (e.g. add `matplotlib.use("Agg")` +
  `savefig`), let *that* be the change students commit and push in a git round-trip exercise.
- **Mark stretch breaks as BONUS** so they don't bloat the required path.

## Vehicle

A lab can borrow a repo we teach as its **vehicle** — the thing students actually run — while the lab
itself teaches the platform (e.g. Lab 1 uses repeng on Mistral-7B to give students something to run on
Kaggle/RunPod). Keep the vehicle's content trivial and fully provided; the platform is the subject.

## Offline vs online, as a teachable contrast

Platforms differ in ways worth surfacing: e.g. one may have **no internet** (install from uploaded
wheels/datasets — the reason to pre-build an offline wheel set) while another has **open internet** (plain
`pip install`). Letting students feel that difference is itself part of the lesson.

## Iterating / codifying

Same as lessons: fix in place rather than rebuilding, and **codify newly-discovered failure modes as rules
here** as they come up in real use.
