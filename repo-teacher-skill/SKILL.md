---
name: repo-teacher
description: "Build teaching materials for an AI/ML-tooling seminar course. Two formats: lessons (one open-source repo/tool taught in depth, producing a deck + quiz + assignment) and labs (a foundational platform or skill students need before exploring repos — cloud compute, git, environments — producing a deck + assignment(s) + support files, no quiz). Use whenever the user wants a lecture deck, a pre/post comprehension quiz, or a hands-on assignment for a specific GitHub repo or AI tool: \"make a lecture on [repo]\", \"teach [tool]\", \"quiz for [lesson]\", \"assignment for [repo]\", \"make a lab\", \"cloud compute lab\", \"Kaggle/RunPod lab\", or any reference to the repo-teacher project or lab directory structure. Also use when updating or extending an existing lecture or lab (\"add a slide\", \"fix the icons\", \"renumber the slides\", \"add a callback tag\"), or when the user reports that a hands-on exercise didn't work as expected on the real tool."
---

# Repo Teacher

**Last updated: 2026-08-08** — added the install-path verification step, the companion-notebook artifact, the measured-number provenance rules, and two new quiz content checks (pre-test integrity, vocabulary hedging) from the Lecture 3 (repeng) build and review. Bump this line whenever you change anything in this skill; the pre-package check enforces that it exists and parses.

A course-building skill for a recurring format: each lesson teaches one open-source AI/ML tool by pairing standalone conceptual background with a deep dive into that tool's actual repository. Every lesson produces up to three artifacts — a slide deck, a quiz, and a hands-on assignment — stored together in one directory per tool.

This skill encodes a design system and a set of hard-won lessons from building this format live. Read the relevant reference file(s) before generating any artifact — don't rely on memory of "what a lecture/quiz/assignment generally looks like."

## Lessons vs. labs — decide first

This skill builds two formats. Figure out which one you're making before anything else:

- **Lesson** — the subject is a repo/tool we're *teaching* (LogitLoom, repeng, TRL). Produces **deck + quiz + assignment**, one directory per tool. This is the original format; everything below the "course structure" heading is about lessons.
- **Lab** — the subject is a foundational *platform or skill* students need in order to run/explore repos (cloud compute, git round-trips, environments). Produces **deck + assignment(s) + the files needed to complete them — no quiz**. If the thing you're teaching is "how to operate X so you can later run repos on it," it's a lab. **Read `references/lab-structure.md` before building one** — labs deliberately invert some lesson rules (notably: they *engineer* failures to teach recovery, rather than preventing them).

## Directory convention

```
/Projects/repo-teacher/
├── lecture-<n>-<topic>/             # a LESSON
│   ├── <Tool>_Lecture.pptx
│   ├── build.js
│   ├── quiz.py
│   ├── <tool>_assignment.md
│   └── HANDOFF.md                   #   optional; state for the next session
├── lab-N-<topic>/                   # a LAB (no quiz; see references/lab-structure.md)
│   ├── <Lab>_Intro.pptx             #   shared intro deck (shown first)
│   ├── build_deck.py
│   ├── datasets/                    #   files shared across parts, at the lab root
│   └── part-a-<x>/ , part-b-<y>/    #   per-part: <x>_assignment.md + files to complete it
├── icons/                           # shared PNG icon set — committed
└── vendor/                          # cloned reference repos — gitignored
```

The `lecture-<n>-<topic>` prefix is load-bearing: a bare `trl/` or `repeng/` at the root would collide with a cloned reference repo of the same name, and a `.gitignore` rule written for one would silently swallow the other. **Clone reference repos into `vendor/`, never at the root.**

`quiz.py` writes its results to `quiz_history.json` in its own directory (path-relative via `__file__`), so each tool's quiz history stays local to that tool's folder. (Labs have no quiz.)

**No absolute paths in any build script.** Resolve icons and output from `__dirname` / `__file__`, with an optional environment override. A hardcoded `/home/…` or `/tmp/…` path works in the session that wrote it and silently breaks every rebuild afterwards — this has already happened in two lesson directories.

## The course structure this serves

**Lecture 1 (Foundations)** is the only lesson that teaches general background — transformer architecture (tokenization → embeddings/position → self-attention → residual stream → MLP/LayerNorm, in that order), training paradigms (pretraining / fine-tuning / post-training alignment), and the interpretability mindset (hypothesize → intervene → observe → revise). Every later lesson assumes this and never re-derives it.

Its vocabulary field guide teaches 8 terms, verbatim: **Feature, Superposition, Circuit, Activation patching, Probing, Sparse autoencoder (SAE), Logit lens, Control/steering vector.** Note that **residual stream** is *not* one of these 8 — it's taught earlier, as its own dedicated step in the architecture walkthrough, not as a field-guide card. Don't rely on a paraphrased summary (including the one above) for exact wording or for which term lives where — read `references/lecture-1-foundations-build.js` directly, it's the actual build script and is authoritative. This file is also the reference for the shared design system constants (colors, `kicker`/`title`/`iconChip` helpers) and confirms the footer format `TOOL NAME · AI SEMINAR, LECTURE N`.

**The course roadmap lives in the repo's own `README.md`**, as a table. That is the live source for which lesson number a new build gets, and for the footer's `LECTURE N`. Lecture 1's closing roadmap slide is a *snapshot* from when that deck was built and has already gone stale once — read the README, and if the two disagree, the README wins and the slide needs updating.

**Every subsequent lesson** (one per tool) follows the same pattern: a little bit of tool-*specific* background that Lecture 1 didn't cover, then the tool itself. Read `references/lecture-structure.md` before building a deck — the standalone-background / explicit-bridge structure is the most important and most easily-lost part of this format.

## Before building anything: read the repo

For a tool-specific lesson, don't write slide content, quiz questions, or assignment exercises from a README skim alone. Actually fetch and read:
- The README (setup instructions, recommended configs — reuse exact values, don't paraphrase URLs/model names/flags)
- The core source file(s) implementing the main algorithm (for real function names, real data structures, real control-flow — cite these exactly in the deck)
- The actual GitHub file listing, in its real order (for the repository-structure slide — see `references/lecture-structure.md`)
- Open issues, if any (useful for the limitations slide, and for knowing if a known bug is already tracked)
- **The example notebooks / demo scripts, if the repo has them.** READMEs routinely elide the interesting part. In one lesson the README's example showed `def make_dataset(...): ...` with a literal ellipsis and a pointer to the notebooks — and the elided body held the single most consequential detail in the library: that training strings are wrapped in the model's own chat markers, with the shared suffix in the *assistant* position. Anything a README replaces with `...` or "see the examples" is by construction the part the author found too fiddly to inline, which is exactly where the teachable material is.

If the tool depends on a third-party API whose behavior matters (rate limits, which models support which features, endpoint shapes), verify current behavior — don't assume docs read weeks/months ago are still accurate. Provider APIs drift; tools built against them can silently break. This isn't optional color, it's the single most common source of errors in this project so far (see the validation section below).

### Verify the install path the student will actually type

Separately from whether the *code* works: check that the tool's published distribution channel installs and imports, in an environment resembling the student's. Don't infer this from the README's `pip install <tool>` line — run it.

A lesson in this series found the package on PyPI was a full minor version behind the repository *and* raised `AttributeError` at import against a current dependency (a NumPy 2 removal the released version still referenced in a type annotation). The obvious install instruction was 100% broken for every student on every platform, and nothing in the README, the source, or the issue *titles* said so. It surfaced only from typing `pip install` into a clean environment.

Before writing the setup slide or the assignment's setup recap:
- Install the tool the way the README says, in a fresh environment, and `import` it.
- Compare the published version against the repository's latest tag or changelog. Skew is common and usually undocumented.
- If they differ, diff the two and find what the student would be missing — that difference is often a real limitations-slide item, not just a packaging footnote.
- Prefer a guard that tests for a *capability* (does this attribute exist?) over one that trusts a version string, since a stale copy may already be sitting in a hosted image.

**Verify an acronym's expansion against the paper, not the repo's own docs.** A repository can get its own vocabulary wrong. TRL's `docs/source/paper_index.md` heads the DPO section "Direct **Policy** Optimization"; the paper it links to on the very next line, and every other doc in the same repo, says "Direct **Preference** Optimization". Resolve every expansion to the primary source before it goes on a slide. (Separately: "RAFT" is a three-way acronym collision — *Reward rAnked FineTuning* (Dong et al. 2023, arXiv 2304.06767), *Retrieval Augmented Fine-Tuning* (Zhang et al. 2024), and `lumpenspace/raft`. Lecture 1 linked the wrong one for a while. Always resolve the referent before using an ambiguous acronym.)

## Writing claims and headers

Content-quality rules for every artifact (lesson or lab, deck or assignment).

### Every sentence should be a claim, not a mood

**The test: could a student disagree with this sentence on the evidence?** If the sentence's job is to make them *feel* something about the material rather than to state something about it, cut it or replace it with the checkable version. This is the single most common note the course owner gives on a draft deck, and it has fired on every deck so far.

Real examples, all flagged in review:

| Cut | Because | Replaced with |
|---|---|---|
| "the differences stop being folklore and become something you can read" | "folklore" isn't checkable; it's an attitude | "the differences can be inspected directly, with everything else held constant" |
| "unfoolable in the way a learned judge can be fooled" | checkable, and **false** — a badly written verifier is gameable | "substantially more robust to reward hacking … not immune: a loosely specified check can be satisfied without solving the task" |
| "Reading it is genuinely hard" | a claim about the *reader*, not the repo | "The algorithm is buried in infrastructure" |
| "The most common real use, and the least glamorous" | glamour is not a property of a training method | (cut the clause) |

Two specific corollaries:

- **Never editorialize about the student.** No claims about what will be hard, confusing, tedious, or impressive. Describe the artifact; let the difficulty be the student's own discovery. This reads as condescending even when it's accurate.
- **No unhedged immunity claims.** Any assertion that something *can't* be gamed, broken, fooled, or hacked must name the residual failure mode in the same breath. This is a factual-accuracy rule, not a stylistic one: it is exactly the class of claim a student later finds to be false, at which point the whole deck's credibility is in question.

### Be specific, and cite it

- Replace vague claims with the concrete number and the mechanism behind it. "Most laptops can't run Mistral-7B" → "Mistral-7B is ~7.24B parameters (~14.5 GB in fp16), needing far more GPU memory (VRAM) than a typical laptop GPU's 4–8 GB." Name *which* spec matters — VRAM, RAM, params, price, quota — and give the figure.
- Cite spec/facts with a link to a primary source (model card, platform docs, the repo). Only include a URL you actually opened and confirmed — in a browser, or via an authoritative API (e.g. the Hugging Face Hub) — never from memory. A hallucinated citation is worse than none. In decks, hyperlink the specific term (the model name → its model card); in assignments, link inline.
- Describe tools/platforms as *leaning*, not as opposites. Real options overlap; a clean binary ("X is fast, Y is slow"; "opposite ends") is usually both presumptuous and inaccurate. State the sharp differences precisely and name where they overlap.
- **Date-stamp anything volatile, and re-verify it on the day you stamp it.** Issue counts, version numbers, file line counts, "N methods in this directory", "at the time of writing". Write the actual date on the slide ("86 issues were open on 8 August 2026, when this deck was last checked against the repository") rather than a floating "currently". A dated number that turns out stale is a lesson about drift; an undated one is just wrong. Re-running the count is usually one command — do it rather than copying the previous figure forward.
- **A slide that tells students to distrust external descriptions must include itself.** "Treat any external description of what this library supports as a claim about one version" is stronger, not weaker, when it continues "— including this slide, last checked on <date>."

### No elliptical clauses

A subordinate clause that gestures at an alternative without naming it will not land. "That is what a reward model is for — **or you skip it, which is what the direct methods do**" drew a flat "I don't understand" in review: *skip what, and what happens instead?* The test is whether a reader who has never met the alternative could reconstruct it from this sentence alone. If not, name the mechanism, even at the cost of a longer sentence. Accuracy over brevity is already the house rule; it applies to clauses, not just to slide counts.

### Headers are declarative, denotative, and not conversational

- **Declarative:** a header states the takeaway; it doesn't pose a question or narrate. "Why This Is a Lab, Not a Lesson" → "This Is a Lab, Not a Lesson." "When to Use Which" → "Match the Platform to the Job." "What You'll Do on Kaggle" → "Four Steps to a Saved Model." Proper-noun section labels (a platform's name) are fine as-is.
- **Denotative:** it must also say what is *on the slide*. This is a separate failure from the one above, and the more common one — an evocative title is perfectly declarative and still useless. "A Map of the Territory", "One Sentence, Held in Reserve", "The Anchor", "What to Carry Forward", "A Verifiable Reward, in Four Lines" were all flagged in a single review pass. **Test: reading only the titles as a table of contents, would a student know what each slide contains?** If the title is doing literary work, it is not doing its job.
- **When a slide is a reading of one source file, the file path is the title.** `reward_trainer.py` beats "A Reward Model, in One Line". Set it in the monospace face and move the function name into the path tag.
- Closing slides are called "Conclusion", not something evocative.
- **One deliberate exception, and only one:** an in-slide callout whose entire purpose is to voice a reader's objection and then answer it may be phrased as a question — that *is* its content ("So isn't it stopping the model from learning?" heading a band that answers it). This never applies to the slide title, which stays declarative even when the slide is built around an objection. "The Anchor Prices Change, It Doesn't Forbid It" is the title; the question lives in the band below it. See the missing-motivation diagnostic under "Iterating on an existing lesson".

## The artifacts

Read the matching reference file before building each one:

- **Lecture deck** → `references/lecture-structure.md` (slide flow, design system, the rendering bugs, back- and forward-reference tags)
- **Quiz** *(lessons only)* → `references/quiz-structure.md` (question types, scoring rules, file structure — this one includes a working code template and the automated leakage/echo/mashable-fragment checks)
- **Assignment** → `references/assignment-structure.md` (exercise format, and the mandatory validation step)
- **Lab** *(deck + assignment(s), no quiz)* → `references/lab-structure.md` (lesson-vs-lab decision, dir layout, the intro-deck + comparison slide, and designed-failure as a first-class exercise type). The deck still follows `lecture-structure.md`'s design system and the assignment still follows `assignment-structure.md`'s conventions — `lab-structure.md` layers the lab-specific differences on top.
- **Companion notebook** *(optional; add it when the tool is a library rather than an app)* — no UI and no CLI means the assignment has nowhere to send the student, and prose instructions for building an environment are where a library exercise dies. When you add one it changes the assignment's job: the notebook holds the runnable cells, the assignment holds the exact settings, the measured results and the reflection questions. Four things make the difference between a notebook that helps and one that misleads:
  - **Execute it end to end before shipping, and fix what breaks.** An untested notebook is worse than none, because it looks authoritative. Same rule as the assignment's live-validation step, same reason.
  - **Put every knob in one config cell at the top** — model name, dataset size, the subject being studied. That's what lets an exercise say "change exactly one thing and re-run" and mean it, and it's what makes swapping the subject a two-line edit rather than a hunt through cells.
  - **Detect the environment rather than assuming one** (accelerator present or not, network available or not, dependency already installed or not). A notebook that runs unchanged on a free hosted tier *and* a laptop removes "it doesn't work on mine" from the lesson entirely.
  - **Number its sections and have the assignment cite them** ("run section 7") — the same explicit-pointer habit as the deck's back-reference pills, applied across artifacts. Note that this makes section numbers a renumbering dependency exactly like slide numbers; see "Cross-artifact consistency".

## The most important lesson learned so far

The first assignment draft in this series contained a real, substantive bug: exercises told the user to type sentence-fragment prompts like `2 + 2 =` and `My favorite color is` directly into a **chat-mode** prompt box, on the unstated assumption that a chat model would complete the fragment the way a base model does. It doesn't — a chat-mode prompt box is a user message, and the model responds to it rather than continuing it. This was caught by the user testing the assignment live, not by anything in the drafting process.

**The fix, now load-bearing for every assignment in this skill:** before finalizing any exercise that prescribes a specific prompt or setting, trace the assumption to how the tool's *actual* request-building code handles it (read the source, not just the README's description), or — better — run the exercise once against the live tool yourself if you have the means to. Treat "I reasoned about how this API should behave" as insufficient justification for a published exercise on its own. `references/assignment-structure.md` has the full checklist.

**When you genuinely cannot execute, validate statically and say so.** For a lesson whose hands-on half needs a GPU: read every constructor signature from source, cross-check every config kwarg against the repo's own `tests/`, confirm every Hub dataset exists, and `ast`-parse every cell. Then state plainly, in the assignment itself, which half was executed and which was only checked statically. An untested exercise presented with the same confidence as a tested one is the failure; an untested exercise labelled as such is a reasonable thing to ship.

## Iterating on an existing lesson

If the user reports something's wrong with an already-built deck/quiz/assignment (a broken exercise, a factual error, an icon that's hard to see, a slide that needs restructuring), fix it directly in place rather than rebuilding from scratch — these are long, hand-tuned files and a full rebuild risks losing unrelated fixes made in earlier passes. Re-render and visually inspect any slide you touch (see the QA step in `references/lecture-structure.md`) before considering the fix done.

**"I don't understand this slide" is usually a missing-motivation failure, not a wording failure.** Before rewording anything, check whether the slide states *why* the mechanism exists or only *what* it does. A slide describing a KL anchor drew "why wouldn't you want it to drift, isn't that the whole point of training?" — the slide explained the penalty in full and never addressed the obvious objection to having one. No amount of rephrasing would have fixed that. **The repair pattern: find the unasked question, make it a heading on the slide, and answer it there.** If the objection is good enough that the reviewer raised it, it is good enough to put in print.

**A reported bug is also a prompt to check the same class of bug elsewhere.** One wrong line count ("about 1,800 for each of the others" — one of them was 809) surfaced during a routine re-verification, not from the review note that started it. When you re-open a deck, re-run every count it asserts.

## Cross-artifact consistency

The three deliverables aren't independent — a fact discovered or a fix made in one of them almost always needs to propagate to the other two, and it's easy to update the one you're looking at and forget the rest:

- **A live bug or API-drift discovery** found while building or fixing one artifact usually affects all three: the deck's setup/backend slide, the assignment's setup recap and any exercise that depends on the affected behavior, and occasionally a quiz question that references the old, now-wrong configuration. Check all three whenever one needs a correction like this, not just the one where it was noticed.
- **A changed deck title propagates further than you think**: `pres.title` in the build script, the build script's header comment, the assignment's `# ` heading, the quiz's module docstring *and* its `# QUESTIONS —` banner comment, the notebook's first markdown cell, and the roadmap table in the repo README. Grep for the old string across the whole repo before declaring the rename done.
- **Every measured number must name the configuration it came from, and the assignment's numbers must come from the artifact the student will actually run.** Exploratory scratch scripts drift from the shipped notebook in ways that look cosmetic and aren't. In one lesson a scratch script built its prompts by hand while the notebook used the tokenizer's chat template — which silently injected a default system message — and the two produced visibly different output at identical settings. The assignment had already been written from the scratch numbers; every table had to be rebuilt. So: once the runnable artifact exists, re-derive the assignment's tables *from its output*. And when a slide cites a figure, say what produced it ("measured on X, one Y vector, ±1.5") — an unlabelled number invites exactly that mismatch, and a labelled one stays true after a later lesson changes the default.
- **A number that only reproduces under one configuration is a weaker claim than it looks.** If a qualitative *ordering* matters enough to put on a slide, try to replicate it on a second subject before generalising — two runs' worth of the same finding is a different sentence than one. Where it doesn't replicate (the effect size, or even the sign, depends on the subject), say so in the assignment rather than quietly shipping the friendlier run.
- **Inserting, moving or removing a slide renumbers three things**, not one: every `addSlideNumber()` call after the change, every in-deck "see slide N" sentence, and every `*(slide N)*` tag in the assignment. If the lesson has a companion notebook, its section numbers are a fourth. Back-reference pills usually survive untouched because they point at background slides near the front — verify rather than assume. Do the remap in one deterministic pass (script it) rather than by hand; a half-remapped deck looks fine and teaches the wrong slide.
- **The closing slide routes students to the other two artifacts.** Name the quiz invocation (`quiz.py --mode post`) and the assignment, with a one-line description of each half. The deck is the only artifact a student is guaranteed to see; if it doesn't send them onward, the other two may not get opened.
- **Copyright's "one quote per source" limit applies across the whole lesson, not per document.** If the deck already uses its one allowed direct quote from the tool's README, the assignment and quiz can't add a second one from that same README — paraphrase there instead. Keep a tally of which sources have already been quoted once, across all three files, before adding a new quotation anywhere. (A short quotation used as the *object* of a factual correction — e.g. quoting a doc heading in order to show it's wrong — is a separate thing from expository quotation; note it in the ledger either way.)

## Keeping this skill from forking

This skill exists in two places: the checked-in source at `repo-teacher-skill/` in the course repo, and whatever copy is loaded into a given session. They have already diverged in both directions once — a session built a deck against a loaded copy that was missing the "Writing claims and headers" rules, and broke one of them. **The checked-in copy in the repo is the source of truth.** When you learn something worth encoding, write it there and repackage the `.skill` bundle from that tree; don't edit a session-local copy and assume it will survive. If you notice the two disagree, reconcile before adding anything new.

### Pre-package check — run this before handing over a `.skill`

Two real failures motivate it. The `description` field has a **1024-character limit**, and appending the labs paragraph to the original lessons text silently pushed it to 1115 — the bundle then failed to import with no indication of which field was at fault. Separately, the bundle omitted `references/lecture-1-foundations-build.js` for months while SKILL.md instructed the reader to consult that file as authoritative, so a fresh install was told to read something it didn't have.

Both are mechanical. **Check the packaged zip, not the source tree** — the point is to catch what packaging dropped.

```python
# python3 check_skill.py repo-teacher.skill
import datetime, re, sys, zipfile

z = zipfile.ZipFile(sys.argv[1])
names = z.namelist()
root = names[0].split("/")[0]
text = z.read(f"{root}/SKILL.md").decode()
ok = True

def fail(msg):
    global ok
    ok = False
    print("FAIL:", msg)

if not text.startswith("---\n"):
    fail("SKILL.md has no YAML frontmatter")
fm = text.split("---")[1]

m = re.search(r"^\*\*Last updated: (\d{4}-\d{2}-\d{2})\*\*", text, re.M)
if not m:
    fail("no '**Last updated: YYYY-MM-DD**' line under the H1")
else:
    try:
        stamp = datetime.date.fromisoformat(m.group(1))
        print(f"  last updated: {stamp}")
    except ValueError:
        fail(f"unparseable date: {m.group(1)}")

for field, limit in (("name", 64), ("description", 1024)):
    m = re.search(rf"^{field}: (.*)$", fm, re.M)
    if not m:
        fail(f"frontmatter missing '{field}'")
        continue
    n = len(m.group(1))
    print(f"  {field}: {n}/{limit}")
    if n > limit:
        fail(f"'{field}' is {n} chars, limit {limit}")

# every references/… path SKILL.md mentions must actually be in the bundle
for ref in sorted(set(re.findall(r"references/[\w.-]+", text))):
    if f"{root}/{ref}" not in names:
        fail(f"SKILL.md cites {ref} but it is not in the bundle")

# and nothing in the bundle should be orphaned
for n in names:
    base = n.split("/", 1)[-1]
    if base.startswith("references/") and base not in text:
        print(f"  note: {base} is bundled but never referenced from SKILL.md")

print("PASS" if ok else "FAILED")
sys.exit(0 if ok else 1)
```

The orphan note is deliberately not a failure — a reference file can be legitimately unreferenced for a release or two — but an unexplained orphan usually means a rename happened in one place and not the other, which is how `build1.js` and `lecture-1-foundations-build.js` ended up as the same file under two names.

## Reviewing a sibling build

Sometimes the user provides a second, independently-built version of the same tool's materials — built in a different session, without access to this one. Treat this as a peer-review opportunity, not a replacement:

- **Diff systematically for content gaps in both directions**: what did the other version teach that this one didn't (and vice versa)? A tool's own name is a good place to check first — if the name has a component this version never explained (e.g. a tool called "LogitLoom" whose deck never actually defined "logit"), that's a real gap worth closing.
- **Independently verify any factual or attribution claim before adopting it** — a name, a historical claim, a "this technique originated with X" attribution. The other draft can be wrong (or hallucinated) just as easily as this one; don't add a claim to the shared materials without checking it the same way any other repo fact would be checked.
- **Don't let adoption overwrite fixes unique to this version.** If this version already incorporated a live bug report or a fact-check the other version couldn't have known about (built earlier, or without that information), preserve it — merge the other version's good ideas around it rather than reverting to a now-outdated state.
- **Re-run this skill's own QA on anything adopted.** The other version may have its own undetected bugs (a keyword-echo miss, a rendering glitch, a mashable short-answer). Adopting its content doesn't mean adopting its bugs — check adopted material against this skill's checks the same as anything written from scratch.
