---
name: repo-teacher
description: Build teaching materials for an AI/ML-tooling seminar course, where each lesson covers one open-source tool/repo in depth. Use whenever the user wants to create a lecture deck, a pre/post comprehension quiz, and/or a hands-on practice assignment for a specific GitHub repo or AI tool — phrases like "make a lecture on [repo]", "teach [tool]", "quiz for [lesson]", "assignment for [repo]", or references to the repo-teacher project structure should all trigger this skill. Also use when updating/extending an existing lecture in this series (e.g. "add a slide", "fix the icons", "add a callback tag"), or when the user reports that a hands-on exercise didn't work as expected on the real tool. This skill builds two formats — **lessons** (teach one repo/tool in depth, producing a deck + quiz + assignment) and **labs** (teach a foundational platform/skill students need before exploring repos, e.g. cloud compute, git, environments, producing a deck + assignment(s) + support files, no quiz). Lab triggers include "make a lab", "cloud compute lab", "Kaggle/RunPod lab", or references to the lab directory structure.
---

# Repo Teacher

A course-building skill for a recurring format: each lesson teaches one open-source AI/ML tool by pairing standalone conceptual background with a deep dive into that tool's actual repository. Every lesson produces up to three artifacts — a slide deck, a quiz, and a hands-on assignment — stored together in one directory per tool.

This skill encodes a design system and a set of hard-won lessons from building this format live. Read the relevant reference file(s) before generating any artifact — don't rely on memory of "what a lecture/quiz/assignment generally looks like."

## Lessons vs. labs — decide first

This skill builds two formats. Figure out which one you're making before anything else:

- **Lesson** — the subject is a repo/tool we're *teaching* (LogitLoom, repeng). Produces **deck + quiz + assignment**, one directory per tool. This is the original format; everything below the "course structure" heading is about lessons.
- **Lab** — the subject is a foundational *platform or skill* students need in order to run/explore repos (cloud compute, git round-trips, environments). Produces **deck + assignment(s) + the files needed to complete them — no quiz**. If the thing you're teaching is "how to operate X so you can later run repos on it," it's a lab. **Read `references/lab-structure.md` before building one** — labs deliberately invert some lesson rules (notably: they *engineer* failures to teach recovery, rather than preventing them).

## Directory convention

```
/Projects/repo-teacher/
├── lecture-1-foundations/          # a LESSON
│   ├── AI_Tooling_Lecture1_Foundations.pptx
│   └── quiz.py
├── <tool-name>/                    # a LESSON (one dir per tool)
│   ├── <Tool>_Lecture.pptx
│   ├── quiz.py
│   └── <tool>_assignment.md
├── lab-N-<topic>/                  # a LAB (no quiz; see references/lab-structure.md)
│   ├── <Lab>_Intro.pptx            #   shared intro deck (shown first)
│   ├── build_deck.py
│   ├── datasets/                   #   files shared across parts, at the lab root
│   └── part-a-<x>/ , part-b-<y>/   #   per-part: <x>_assignment.md + files to complete it
```

`quiz.py` writes its results to `quiz_history.json` in its own directory (path-relative via `__file__`), so each tool's quiz history stays local to that tool's folder. (Labs have no quiz.)

## The course structure this serves

**Lecture 1 (Foundations)** is the only lesson that teaches general background — transformer architecture, training paradigms, the interpretability mindset, core vocabulary (residual stream, features, superposition, circuits, activation patching, SAEs, control vectors, logit lens). Every later lesson assumes this and never re-derives it.

**Every subsequent lesson** (one per tool) follows the same pattern: a little bit of tool-*specific* background that Lecture 1 didn't cover, then the tool itself. Read `references/lecture-structure.md` before building a deck — the standalone-background / explicit-bridge structure is the most important and most easily-lost part of this format.

## Before building anything: read the repo

For a tool-specific lesson, don't write slide content, quiz questions, or assignment exercises from a README skim alone. Actually fetch and read:
- The README (setup instructions, recommended configs — reuse exact values, don't paraphrase URLs/model names/flags)
- The core source file(s) implementing the main algorithm (for real function names, real data structures, real control-flow — cite these exactly in the deck)
- The actual GitHub file listing, in its real order (for the repository-structure slide — see `references/lecture-structure.md`)
- Open issues, if any (useful for the limitations slide, and for knowing if a known bug is already tracked)

If the tool depends on a third-party API whose behavior matters (rate limits, which models support which features, endpoint shapes), verify current behavior — don't assume docs read weeks/months ago are still accurate. Provider APIs drift; tools built against them can silently break. This isn't optional color, it's the single most common source of errors in this project so far (see the validation section below).

## Writing claims and headers

Two content-quality rules for every artifact (lesson or lab, deck or assignment):

**Be specific, and cite it.**
- Replace vague claims with the concrete number and the mechanism behind it. "Most laptops can't run Mistral-7B" → "Mistral-7B is ~7.24B parameters (~14.5 GB in fp16), needing far more GPU memory (VRAM) than a typical laptop GPU's 4–8 GB." Name *which* spec matters — VRAM, RAM, params, price, quota — and give the figure.
- Cite spec/facts with a link to a primary source (model card, platform docs, the repo). Only include a URL you actually opened and confirmed — in a browser, or via an authoritative API (e.g. the Hugging Face Hub) — never from memory. A hallucinated citation is worse than none. In decks, hyperlink the specific term (the model name → its model card); in assignments, link inline.
- Describe tools/platforms as *leaning*, not as opposites. Real options overlap; a clean binary ("X is fast, Y is slow"; "opposite ends") is usually both presumptuous and inaccurate. State the sharp differences precisely and name where they overlap.

**Headers are declarative, not conversational.**
- A slide/section header states the takeaway; it doesn't pose a question or narrate. "Why This Is a Lab, Not a Lesson" → "This Is a Lab, Not a Lesson." "When to Use Which" → "Match the Platform to the Job." "What You'll Do on Kaggle" → "Four Steps to a Saved Model." Proper-noun section labels (a platform's name) are fine as-is.

## The artifacts

Read the matching reference file before building each one:

- **Lecture deck** → `references/lecture-structure.md` (slide flow, design system, the icon-contrast bug, back-reference tags)
- **Quiz** *(lessons only)* → `references/quiz-structure.md` (question types, scoring rules, file structure — this one includes a working code template)
- **Assignment** → `references/assignment-structure.md` (exercise format, and the mandatory validation step)
- **Lab** *(deck + assignment(s), no quiz)* → `references/lab-structure.md` (lesson-vs-lab decision, dir layout, the intro-deck + comparison slide, and designed-failure as a first-class exercise type). The deck still follows `lecture-structure.md`'s design system and the assignment still follows `assignment-structure.md`'s conventions — `lab-structure.md` layers the lab-specific differences on top.

## The most important lesson learned so far

The first assignment draft in this series contained a real, substantive bug: exercises told the user to type sentence-fragment prompts like `2 + 2 =` and `My favorite color is` directly into a **chat-mode** prompt box, on the unstated assumption that a chat model would complete the fragment the way a base model does. It doesn't — a chat-mode prompt box is a user message, and the model responds to it rather than continuing it. This was caught by the user testing the assignment live, not by anything in the drafting process.

**The fix, now load-bearing for every assignment in this skill:** before finalizing any exercise that prescribes a specific prompt or setting, trace the assumption to how the tool's *actual* request-building code handles it (read the source, not just the README's description), or — better — run the exercise once against the live tool yourself if you have the means to. Treat "I reasoned about how this API should behave" as insufficient justification for a published exercise on its own. `references/assignment-structure.md` has the full checklist.

## Iterating on an existing lesson

If the user reports something's wrong with an already-built deck/quiz/assignment (a broken exercise, a factual error, an icon that's hard to see, a slide that needs restructuring), fix it directly in place rather than rebuilding from scratch — these are long, hand-tuned files and a full rebuild risks losing unrelated fixes made in earlier passes. Re-render and visually inspect any slide you touch (see the QA step in `references/lecture-structure.md`) before considering the fix done.
