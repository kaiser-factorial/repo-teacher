# Quiz Structure (`quiz.py`)

Standard library only — `argparse`, `difflib`, `json`, `re`, `sys`, `datetime`, `pathlib`. No installs required, so the person can just run `python3 quiz.py` wherever they put it.

## Why three question types, not just multiple choice

An earlier all-multiple-choice quiz for a tool-specific lesson scored misleadingly well on repo-mechanics questions — asking "which function does X" as 4-way multiple choice let the person recognize the right-shaped name without actually knowing it, especially when function names have distinctive/guessable naming patterns. Converting those into short-answer (type the function/file/field name) fixed this. Keep the mix:

- **multiple_choice** — for conceptual/reasoning questions where four options genuinely test understanding (not just pattern-matching a name).
- **true_false** — for testing a specific, statable claim. Include a third option, "Don't know," alongside True/False.
- **short_answer** — for anything with one correct, nameable answer that would be too easy to recognize in a 4-way list (function names, file names, specific terms, abbreviations).

Aim for a roughly even split across all three types, and roughly even split across the quiz's 2 categories (e.g. "background concepts" vs. "repo-specific mechanics" for a tool lesson; "architecture" vs. "training/tooling/interpretability" for the foundations lesson). 16-18 questions total works well.

## Scoring rules

- **multiple_choice**: correct = 1.0 point, incorrect = 0.0. No penalty (a 4-way guess isn't worth penalizing the same as a confident wrong answer elsewhere).
- **true_false**: correct = 1.0, **incorrect = -0.5** (a real guessing penalty — otherwise a coin flip is free EV), **"Don't know" = 0.0** (no penalty, same as leaving it blank; this is what makes honest uncertainty the rational choice over guessing).
- **short_answer**: fuzzy-graded, not exact-string-only.
  - Exact match (case-insensitive) against the canonical answer or any listed alias → **1.0**
  - Semantically right but malformed — missing a `()`, missing a file extension, differs only in punctuation/spacing/case in a way that isn't the exact-match check above — → **0.75**, and the feedback names *specifically* what was off (not just "close, try again"). Also catches near-miss typos via `difflib.SequenceMatcher` ratio above a threshold (~0.82 worked well).
  - Otherwise → **0.0**, show the correct answer.

## Writing good multiple-choice distractors

A quiz can have the right *engine* (scoring, penalties, fuzzy grading) and still be too easy, if the wrong answers aren't actually doing their job. Two distinct failure modes showed up in practice, on the same quiz, within a single review pass — check for both every time:

**1. Keyword echo.** The correct answer restates a distinctive word from the question stem, letting someone pattern-match without understanding anything. E.g. asking about a "**sparse** autoencoder" with a correct answer that says "...a **sparse** set of features..." — the word "sparse" alone gives it away. Fix by rewording the correct answer to convey the same meaning without reusing the term (e.g. "a mostly-inactive basis" instead of "a sparse set").

**2. Throwaway distractors.** Wrong answers that are obviously unrelated to the topic — e.g. "generating synthetic training images" as a distractor for a question about interpretability techniques. These get eliminated by genre alone, without needing any real understanding. Fix by replacing them with **genuinely confusable near-misses**: another real, adjacent concept that a half-informed person would plausibly mix up with the correct one. Reliable patterns for generating these:
   - **Swap the role**: describe what a *different, related* component actually does (e.g., for "what does the MLP block do," make a distractor that accurately describes what attention does instead).
   - **Real technique, wrong specificity**: a real, adjacent method that's genuinely different from the one being asked about (e.g., for "what's a sparse autoencoder for," a distractor describing PCA-style dimensionality *reduction* — the literal opposite move, and a real, easy mix-up).
   - **Right domain, wrong stage**: a real fact that's true of the same system but at a different point in a pipeline/sequence (e.g., for "what's the pretraining objective," a distractor describing masked-language-modeling — real, just the wrong *stage/architecture family* for the question asked).

A useful sanity check while drafting: **every choice in a question should be the same grammatical/logical category as the others.** If a question asks "what problem does X solve," every choice — right and wrong — should describe a problem (something bad that happens without X), not a mix of problems and unrelated actions/capabilities. A structural mismatch is its own kind of giveaway, separate from content — a test-taker can sometimes spot the right answer just from noticing it's the only one phrased the way the question expects.

### Automated check: keyword echo within a question

Run this after drafting every multiple_choice question, before shipping:

```python
import re

def keywords(s):
    return set(re.findall(r'[a-z]{5,}', s.lower())) - {'which', 'their', 'other', 'about', 'there', 'these', 'those'}

for q in QUESTIONS:
    if q['type'] != 'multiple_choice':
        continue
    prompt_kw = keywords(q['prompt'])
    correct_kw = keywords(q['choices'][q['answer']])
    overlap = prompt_kw & correct_kw
    other_overlaps = [len(prompt_kw & keywords(c)) for i, c in enumerate(q['choices']) if i != q['answer']]
    if overlap and len(overlap) > max(other_overlaps, default=0):
        print(f"CHECK {q['id']}: correct answer shares {overlap} with the question stem, more than any distractor does")
```

No output = clean. Any hit means the correct answer is more lexically similar to the stem than the wrong answers are — almost always fixable by rewording the correct answer, not by changing the stem.

## Checking for cross-question answer leakage

A distinct, order-dependent problem: a **short-answer** question's canonical answer can accidentally appear, spelled out, in the text of an **earlier** question elsewhere in the same quiz — handing away the answer before the person is asked to recall it themselves. This is different from keyword echo (which is a question revealing its own answer within its own choices); this is one question revealing a *different* question's answer, and it only matters in one direction: a reveal that happens **after** the short-answer question is harmless (the person's already committed their answer by then), but a reveal **before** it defeats the point of asking.

*Concrete example this actually caught*: a true/false question stated "...RLHF/DPO typically happen after pretraining..." immediately before a short-answer question asking the person to type the abbreviation "RLHF." Fix was simply reordering the two questions — the short-answer version needs to come first.

### Automated check: order-aware leakage scan

```python
sa_questions = [(i, q) for i, q in enumerate(QUESTIONS) if q['type'] == 'short_answer']
GENERIC = {'value', 'values'}  # exclude common English words that will false-positive

for pos, sa in sa_questions:
    terms = [t for t in [sa['canonical']] + sa.get('aliases', []) if t.lower() not in GENERIC]
    for j, q in enumerate(QUESTIONS):
        if q['id'] == sa['id'] or j >= pos:
            continue  # only earlier questions can leak into this one
        haystack = q['prompt'] + (' ' + ' '.join(q['choices']) if q['type'] == 'multiple_choice' else '')
        for term in terms:
            if term.lower() in haystack.lower():
                print(f"LEAK: '{term}' (answer to Q{pos+1} {sa['id']}) already appears in Q{j+1} {q['id']}, asked earlier")
```

Maintain a small `GENERIC` exclusion set as needed — very common words (e.g. "value") will false-positive against unrelated questions that happen to use them in passing; a real leak is a distinctive technical term, not ordinary vocabulary. When the scan finds a real hit, reorder the two questions (short-answer first) rather than rewording either one — the terms are supposed to match exactly, that's not the bug; the sequence is.

## Checking for mashable short-answer fragments

A third failure mode, distinct from both keyword echo and leakage: a short-answer's canonical term can be assembled from pieces that are separately present in the question's own stem, even when the whole term never appears verbatim. This is easy to miss because a literal substring search for the answer comes back clean — the giveaway is compositional, not literal.

*Concrete examples this actually caught, all in the same quiz*: a question that put "Assistant prefill" in quotation marks as the setup for asking which message role prefill supplies (answer: "assistant" — the word was sitting right there in the stem); a question asking for the function that "builds a brand-new tree from scratch" (answer: `buildTree` — both "build" and "tree" present, just not adjacent); a question asking what powers "Expand from here" that also mentioned "rebuilding the whole tree" (answer: `expandTree` — same issue, "Expand" from the UI-button name plus "tree" from a different clause). None of these repeat the answer as a contiguous string, so a naive substring check misses all three.

### Automated check: mashable-fragment scan

```python
import re

def camel_parts(s):
    s = re.sub(r'\(\)|\.ts|-', ' ', s)  # strip common suffixes/separators first
    parts = re.sub(r'([a-z])([A-Z])', r'\1 \2', s).lower().split()  # split camelCase
    return [p for p in parts if len(p) >= 3]

for q in QUESTIONS:
    if q['type'] != 'short_answer':
        continue
    parts = camel_parts(q['canonical'])
    prompt_lower = q['prompt'].lower()
    present = [p for p in parts if p in prompt_lower]
    if parts and len(present) == len(parts):
        print(f"MASHABLE {q['id']}: every component of '{q['canonical']}' ({parts}) already appears in the stem")
```

No output = clean. A hit doesn't necessarily mean every appearance is adjacent or quoted — the check flags it even when the parts are scattered across unrelated clauses, because a test-taker doesn't need them adjacent to notice and combine them. Fix by rewording the stem to describe the mechanism without naming the pieces (e.g. describe what the function *does* rather than quoting the UI label or feature name it's named after).

## Checking for answer-position clustering

A fourth, purely mechanical failure mode: drafting questions one at a time tends to put the correct answer in the same place every time, even though no single question looks wrong in isolation.

- **Multiple choice**: writing "correct choice, then three distractors" as a drafting habit means index 0 — answer "A" — silently becomes the answer to nearly everything. A 26-question quiz built exactly this way shipped with 5 of its first 6 multiple-choice answers on "A" before this was caught.
- **True/false**: drafting every question as "here's a plausible-sounding misconception — true or false?" tends to make every answer `False`. A quiz with all-`False` true/false questions is gameable — always guess "False" — no matter how good the individual questions are.

### Automated check: answer-distribution scan

```python
from collections import Counter

mc_letters = Counter("ABCD"[q['answer']] for q in QUESTIONS if q['type'] == 'multiple_choice')
tf_values = Counter(q['answer'] for q in QUESTIONS if q['type'] == 'true_false')
print("MC answer letters:", mc_letters)
print("TF answer values:", tf_values)
```

No hard threshold here — just eyeball it. If one MC letter or one TF value dominates (more than roughly half the questions of that type), reorder a few choices (for MC — reordering doesn't change question difficulty, just which index is correct) or restate a few true_false prompts as their logical converse ("X is true" instead of "X is not the case") until the spread looks reasonable.

## Checking that the quiz still works as a *pre*-test

The four checks above all ask "can this be answered without understanding?" This one asks something
different: **the quiz is taken twice, and the first sitting happens before the lecture exists in the person's head.** An explanation that points at an artifact they haven't encountered yet — an upstream issue number, a slide number, a notebook section, "as we saw earlier" — reads as a non-sequitur on the pre-test and teaches nothing, which is the one job an explanation has on a wrong answer.

This is easy to introduce precisely *because* you write the quiz after the deck, with the deck fresh in mind. Ending an explanation with "— the heart of issue #77" feels natural while you're holding the whole lesson in working memory. It isn't: the pre-test taker has never heard of issue #77.

*Concrete example this caught*: a PCA-centring question whose explanation ended "…that is exactly what gets deleted before the search even begins — the heart of issue #77," and a true/false explanation ending "Open issue #78." Both were factually correct, and both were noise on a first sitting.

The fix is never to delete the substance — it's to state it without the pointer. "It is an open, unfixed bug rather than a design choice" carries the same weight as "Open issue #78" and survives being read cold. Save the issue numbers for the deck and the assignment, where the reader has context by construction.

### Automated check: pre-test integrity scan

```python
import re

PAT = re.compile(
    r'issue\s*#\d+|#\d{2,}|slide\s*\d+|section\s*\d+|as we saw|earlier in the (lecture|deck)',
    re.I,
)

for q in QUESTIONS:
    for field in ('prompt', 'explanation'):
        hits = PAT.findall(q.get(field, ''))
        if hits:
            print(f"PRE-TEST REF {q['id']} ({field}): {hits}")
```

No output = clean. This scans `prompt` as well as `explanation` — a stem that says "the bug described on slide 21" isn't merely unhelpful pre-lecture, it's unanswerable.

## Checking for vocabulary hedging

A quieter failure: reaching for an informal stand-in when the course has already taught the precise term. It reads as talking down to the audience, and in a seminar where an earlier lecture spent real time establishing a vocabulary, it actively undercuts that work.

*Concrete example this caught*: a quiz that said "whichever of the two opposite **arrows** this kind of analysis hands back" and "collapses to a single **arrow** per layer" — in a course whose foundations lecture had already taught **vector** as one of its eight field-guide terms. The same word had also reached a slide in the deck, which is why this sweep is worth running over slide text and not only the quiz.

The fix is usually a straight swap, and often an upgrade in precision at the same time: "the two opposite arrows" became "the two opposite **unit vectors**" — the taught term, plus a fact the background slide had made a point of (PCA returns unit length).

### Automated check: hedge-word scan

```python
HEDGE = re.compile(r'\barrows?\b|\bthingy?\b|\bblobs?\b|\bstuff\b', re.I)

for q in QUESTIONS:
    for field in ('prompt', 'explanation'):
        if HEDGE.search(q.get(field, '')):
            print(f"HEDGE {q['id']} ({field})")
    if q['type'] == 'multiple_choice' and HEDGE.search(' '.join(q['choices'])):
        print(f"HEDGE {q['id']} (choices)")
```

The word list isn't universal — it means "informal stand-ins for terms *this course* has already taught." Before shipping a lesson, glance at the earlier lectures' vocabulary and add any term whose casual synonym you catch yourself reaching for. `lecture-1-foundations-build.js` is the authoritative list of what's already been taught.

Run all six checks together as a standard pre-delivery step, alongside the scoring-mechanics test in "Testing before delivery" below.



Every score readout — mid-quiz section checkpoints, end-of-quiz summary, and the pre/post comparison — should spell out **"X out of Y ... (Z%)"** rather than just a bare percentage or a vague "well done." This was a specific, repeated refinement request in this project. Report both a "fully correct" count (status == "correct" only) and a weighted-points total (accounts for partial credit and penalties) side by side — they tell different stories (a lucky true/false guess and a penalized wrong guess should not look the same in the final tally).

## File structure & CLI

- Results append to `quiz_history.json` **in the script's own directory** (`Path(__file__).resolve().parent`), not the current working directory — so it travels with the script if the folder gets moved, and works regardless of where the person runs it from.
- `--mode pre|post` skips the interactive prompt (useful for scripting/testing).
- `--history` just prints past attempts and exits, no new quiz.
- On `post`, automatically find the most recent `pre` attempt in history and print a before/after comparison (overall + per-category), plus a list of which specific questions flipped from incorrect to fully-correct or vice versa.
- If `post` is run with no prior `pre` attempt found, say so and just record a standalone score — don't error out.

## Code template

This is a working skeleton — the actual engine (grading functions, `run_quiz`, scoring, comparison, `main`) rarely needs to change between lessons; usually only `CATEGORY_LABELS` and the `QUESTIONS` list need to be swapped out. Copy this whole file, then replace just those two things for a new lesson.

```python
#!/usr/bin/env python3
"""
quiz.py — [Lesson Name] comprehension check.

Run once BEFORE the lesson (choose "pre") and once AFTER (choose "post").
Results are stored alongside this script in quiz_history.json. Taking the
post-lesson quiz automatically pulls the most recent pre-lesson attempt and
shows how the score changed.

Question types:
  - multiple_choice: pick one of four options.
  - true_false: True / False / "Don't know". Wrong guesses cost -0.5 points;
    "Don't know" costs nothing.
  - short_answer: typed answer, fuzzy-graded (0.75 partial credit for a
    semantically-correct but malformed answer, with a note on what was off).

Usage:
    python3 quiz.py            # interactive
    python3 quiz.py --mode pre # skip the prompt
    python3 quiz.py --history  # print past attempts, no new quiz
"""

import argparse
import difflib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
HISTORY_PATH = SCRIPT_DIR / "quiz_history.json"

CATEGORY_LABELS = {
    "cat_a": "REPLACE ME: first category label",
    "cat_b": "REPLACE ME: second category label",
}

TF_GUESS_PENALTY = -0.5
SA_FORMATTING_CREDIT = 0.75
SA_FUZZY_THRESHOLD = 0.82

# ---------------------------------------------------------------------------
# QUESTIONS — replace with lesson-specific content.
# type == "multiple_choice": choices (4 strings), answer (0-indexed)
# type == "true_false":      answer (True/False)
# type == "short_answer":    canonical (str), aliases (list[str], optional)
# ---------------------------------------------------------------------------
QUESTIONS = [
    {
        "id": "cat_a1",
        "category": "cat_a",
        "type": "multiple_choice",
        "prompt": "REPLACE ME",
        "choices": ["REPLACE", "ME", "WITH", "OPTIONS"],
        "answer": 0,
        "explanation": "REPLACE ME",
    },
    # ... more questions ...
]

TOTAL_BY_CATEGORY = {}
for q in QUESTIONS:
    TOTAL_BY_CATEGORY[q["category"]] = TOTAL_BY_CATEGORY.get(q["category"], 0) + 1


def _loose(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def grade_short_answer(user_raw, canonical, aliases=None):
    aliases = aliases or []
    candidates = [canonical] + aliases
    user = user_raw.strip()
    if not user:
        return 0.0, "incorrect", None
    user_norm = user.lower()
    for cand in candidates:
        if user_norm == cand.lower():
            return 1.0, "correct", None
    user_loose = _loose(user)
    for cand in candidates:
        if user_loose == _loose(cand):
            issues = []
            if cand.endswith("()") and not user.endswith("()"):
                issues.append('missing the trailing "()"')
            for ext in (".ts", ".tsx", ".py", ".json", ".html"):
                if cand.lower().endswith(ext) and not user.lower().endswith(ext):
                    issues.append(f'missing the "{ext}" file extension')
            if not issues:
                issues.append("differs only in capitalization/spacing from the exact name")
            return SA_FORMATTING_CREDIT, "partial", "; ".join(issues)
    best_ratio = max(difflib.SequenceMatcher(None, user_norm, c.lower()).ratio() for c in candidates)
    if best_ratio >= SA_FUZZY_THRESHOLD:
        return SA_FORMATTING_CREDIT, "partial", "close, but double-check the exact spelling/formatting"
    return 0.0, "incorrect", None


def load_history():
    if not HISTORY_PATH.exists():
        return []
    try:
        with open(HISTORY_PATH, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        print(f"[warning] couldn't read {HISTORY_PATH}, starting fresh.")
        return []


def save_history(history):
    with open(HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)


def prompt_mode():
    while True:
        raw = input("Is this a PRE-lesson or POST-lesson check-in? [pre/post]: ").strip().lower()
        if raw in ("pre", "post"):
            return raw
        print("  please type 'pre' or 'post'.")


def prompt_letter_choice(labels):
    letters = "ABCD"[: len(labels)]
    while True:
        raw = input(f"Your answer ({'/'.join(letters)}): ").strip().upper()
        if len(raw) == 1 and raw in letters:
            return letters.index(raw)
        if raw.isdigit() and 1 <= int(raw) <= len(labels):
            return int(raw) - 1
        print(f"  please enter one of: {', '.join(letters)}")


def ask_multiple_choice(q):
    for j, choice in enumerate(q["choices"]):
        print(f"   {'ABCD'[j]}. {choice}")
    selected = prompt_letter_choice(q["choices"])
    correct = selected == q["answer"]
    if correct:
        print("   Correct!", q["explanation"])
        return {"type": "multiple_choice", "points": 1.0, "status": "correct", "selected": selected}
    print(f"   Not quite — correct answer: {'ABCD'[q['answer']]}. {q['explanation']}")
    return {"type": "multiple_choice", "points": 0.0, "status": "incorrect", "selected": selected}


def ask_true_false(q):
    print("   A. True")
    print("   B. False")
    print("   C. Don't know / not sure")
    selected = prompt_letter_choice(["True", "False", "Don't know"])
    truth = q["answer"]
    if selected == 2:
        answer_word = "True" if truth else "False"
        print(f"   Skipped — no points gained or lost. (Correct answer: {answer_word}.) {q['explanation']}")
        return {"type": "true_false", "points": 0.0, "status": "skipped", "selected": selected}
    guessed_true = selected == 0
    if guessed_true == truth:
        print("   Correct!", q["explanation"])
        return {"type": "true_false", "points": 1.0, "status": "correct", "selected": selected}
    answer_word = "True" if truth else "False"
    print(f"   Incorrect ({TF_GUESS_PENALTY} point guessing penalty). Correct answer: {answer_word}. {q['explanation']}")
    return {"type": "true_false", "points": TF_GUESS_PENALTY, "status": "incorrect", "selected": selected}


def ask_short_answer(q):
    user_raw = input("   Your answer: ")
    points, status, note = grade_short_answer(user_raw, q["canonical"], q.get("aliases"))
    if status == "correct":
        print("   Correct!", q["explanation"])
    elif status == "partial":
        print(f"   Correct idea, but: {note}. (Docked {1.0 - points:.2f} point for formatting.)")
        print("  ", q["explanation"])
    else:
        shown = user_raw.strip() or "(blank)"
        print(f"   Not quite (you wrote: \"{shown}\") — correct answer: {q['canonical']}. {q['explanation']}")
    return {"type": "short_answer", "points": points, "status": status, "selected": user_raw.strip()}


ASKERS = {
    "multiple_choice": ask_multiple_choice,
    "true_false": ask_true_false,
    "short_answer": ask_short_answer,
}


def run_quiz():
    answers = {}
    last_category = None
    print()
    for i, q in enumerate(QUESTIONS, 1):
        if q["category"] != last_category:
            if last_category is not None:
                _print_category_checkpoint(last_category, answers)
            label = CATEGORY_LABELS.get(q["category"], q["category"])
            print(f"\n== {label} ==")
            last_category = q["category"]
        print(f"\n{i}. [{q['type'].replace('_', ' ')}] {q['prompt']}")
        answers[q["id"]] = ASKERS[q["type"]](q)
    _print_category_checkpoint(last_category, answers)
    return answers


def _print_category_checkpoint(category, answers_so_far):
    label = CATEGORY_LABELS.get(category, category)
    total = TOTAL_BY_CATEGORY[category]
    cat_qs = [q for q in QUESTIONS if q["category"] == category]
    points = sum(answers_so_far.get(q["id"], {}).get("points", 0.0) for q in cat_qs)
    fully_correct = sum(1 for q in cat_qs if answers_so_far.get(q["id"], {}).get("status") == "correct")
    print(f"\n   >> Section done — {label}: {fully_correct} out of {total} fully correct, {points:.2f} points earned.")


def score_answers(answers):
    by_category = {
        cat: {"points": 0.0, "max_points": float(total), "fully_correct": 0,
              "partial": 0, "incorrect": 0, "skipped": 0, "total": total}
        for cat, total in TOTAL_BY_CATEGORY.items()
    }
    total_points = 0.0
    total_fully_correct = 0
    for q in QUESTIONS:
        rec = answers.get(q["id"])
        if not rec:
            continue
        cat = by_category[q["category"]]
        cat["points"] += rec["points"]
        total_points += rec["points"]
        if rec["status"] == "correct":
            cat["fully_correct"] += 1
            total_fully_correct += 1
        elif rec["status"] == "partial":
            cat["partial"] += 1
        elif rec["status"] == "skipped":
            cat["skipped"] += 1
        else:
            cat["incorrect"] += 1
    return {
        "total_points": total_points,
        "max_points": float(len(QUESTIONS)),
        "total_fully_correct": total_fully_correct,
        "total_questions": len(QUESTIONS),
        "by_category": by_category,
    }


def pct(value, total):
    if not total:
        return "0%"
    return f"{round(100 * value / total)}%"


def print_score(score, heading="Score"):
    print(f"\n--- {heading} ---")
    tfc, tt = score["total_fully_correct"], score["total_questions"]
    tp, tmax = score["total_points"], score["max_points"]
    print(f"You got {tfc} out of {tt} questions fully correct ({pct(tfc, tt)}).")
    print(f"After partial credit and guessing penalties, you earned {tp:.2f} out of {tmax:.0f} points ({pct(tp, tmax)}).")
    for cat, label in CATEGORY_LABELS.items():
        c = score["by_category"].get(cat)
        if not c:
            continue
        print(f"  - {label}: {c['fully_correct']} out of {c['total']} fully correct ({pct(c['fully_correct'], c['total'])}), "
              f"{c['points']:.2f} out of {c['max_points']:.0f} points ({pct(c['points'], c['max_points'])}).")
        extras = []
        if c["partial"]:
            extras.append(f"{c['partial']} partial-credit (formatting)")
        if c["incorrect"]:
            extras.append(f"{c['incorrect']} incorrect")
        if c["skipped"]:
            extras.append(f"{c['skipped']} skipped/don't-know")
        if extras:
            print(f"      ({'; '.join(extras)})")


def find_latest_pre(history, before_timestamp=None):
    pre_attempts = [a for a in history if a["mode"] == "pre"]
    if before_timestamp:
        pre_attempts = [a for a in pre_attempts if a["timestamp"] < before_timestamp]
    if not pre_attempts:
        return None
    return max(pre_attempts, key=lambda a: a["timestamp"])


def print_comparison(pre_attempt, post_score, post_answers):
    pre_score = pre_attempt["score"]
    print("\n=== Pre -> Post Comparison ===")
    print(f"(comparing against your pre-lesson attempt from {pre_attempt['timestamp']})\n")

    def explicit_line(label, pre_c, pre_t, pre_pts, pre_max, post_c, post_t, post_pts, post_max):
        print(f"{label}:")
        print(f"  Before: {pre_c} out of {pre_t} fully correct ({pct(pre_c, pre_t)}); {pre_pts:.2f}/{pre_max:.0f} points ({pct(pre_pts, pre_max)}).")
        print(f"  After:  {post_c} out of {post_t} fully correct ({pct(post_c, post_t)}); {post_pts:.2f}/{post_max:.0f} points ({pct(post_pts, post_max)}).")
        d = round(100 * post_pts / post_max) - round(100 * pre_pts / pre_max) if pre_max and post_max else 0
        sign = "+" if d >= 0 else ""
        print(f"  That's a change of {sign}{d} percentage points (by weighted score).\n")

    explicit_line("Overall", pre_score["total_fully_correct"], pre_score["total_questions"],
                   pre_score["total_points"], pre_score["max_points"],
                   post_score["total_fully_correct"], post_score["total_questions"],
                   post_score["total_points"], post_score["max_points"])
    for cat, label in CATEGORY_LABELS.items():
        pc, po = pre_score["by_category"].get(cat), post_score["by_category"].get(cat)
        if not pc or not po:
            continue
        explicit_line(label, pc["fully_correct"], pc["total"], pc["points"], pc["max_points"],
                       po["fully_correct"], po["total"], po["points"], po["max_points"])

    pre_answers = pre_attempt["answers"]
    print("Questions that flipped from incorrect to fully-correct, or vice versa:")
    flips = 0
    for q in QUESTIONS:
        pre_rec, post_rec = pre_answers.get(q["id"]), post_answers.get(q["id"])
        if not pre_rec or not post_rec:
            continue
        pre_correct, post_correct = pre_rec["status"] == "correct", post_rec["status"] == "correct"
        if pre_correct != post_correct:
            flips += 1
            direction = "-> fully correct" if post_correct else "-> no longer fully correct"
            print(f"  [{direction}] {q['id']}: {q['prompt']}")
    if flips == 0:
        print("  (none — same set of questions fully correct as pre-lesson)")


def print_history_only():
    history = load_history()
    if not history:
        print(f"No history yet at {HISTORY_PATH}")
        return
    print(f"History file: {HISTORY_PATH}\n")
    for attempt in history:
        print_score(attempt["score"], heading=f"{attempt['mode'].upper()} @ {attempt['timestamp']}")


def main():
    parser = argparse.ArgumentParser(description="Lesson comprehension quiz.")
    parser.add_argument("--mode", choices=["pre", "post"], help="skip the interactive prompt")
    parser.add_argument("--history", action="store_true", help="print past attempts and exit")
    args = parser.parse_args()

    if args.history:
        print_history_only()
        return

    print("=" * 60)
    print("  REPLACE ME: Lesson Name — Comprehension Check")
    print("=" * 60)
    print("Question types: multiple-choice, true/false (wrong guesses cost")
    print("-0.5 pts, 'don't know' costs nothing), and short answer (typed).")

    mode = args.mode or prompt_mode()
    history = load_history()
    if mode == "post" and not find_latest_pre(history):
        print("\n[note] no pre-lesson attempt found yet — this will just record a")
        print("       standalone score. Run with 'pre' beforehand next time for a comparison.\n")

    answers = run_quiz()
    score = score_answers(answers)
    attempt = {"mode": mode, "timestamp": datetime.now().isoformat(timespec="seconds"), "answers": answers, "score": score}
    history.append(attempt)
    save_history(history)

    print_score(score, heading=f"{mode.upper()}-Lesson Score")
    if mode == "post":
        pre_attempt = find_latest_pre(history[:-1])
        if pre_attempt:
            print_comparison(pre_attempt, score, answers)
        else:
            print("\n(no pre-lesson attempt to compare against)")
    else:
        print(f"\nSaved to {HISTORY_PATH}.")
        print("Take this quiz again with 'post' after the lesson to see your improvement.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nQuiz interrupted — nothing was saved.")
        sys.exit(1)
```

## Testing before delivery

Two separate kinds of testing are needed — engine correctness and content quality. Both matter; a quiz can score perfectly on the first and still be too easy because of the second.

1. **Engine correctness**: generate a scripted answer sequence (all-wrong, all-correct, and a mixed one with at least one true/false guess-wrong and one short-answer near-miss) and pipe it through `python3 quiz.py --mode pre < answers.txt` / `--mode post`. Confirm: the penalty math is right, partial credit triggers on a deliberately-malformed answer, and the pre/post comparison prints sensibly.
2. **Content quality**: run all six automated checks — keyword echo, cross-question leakage, mashable short-answer fragments, answer-position clustering, pre-test integrity, and vocabulary hedging — against the final `QUESTIONS` list. Clean output on all six, plus a manual skim for throwaway distractors and problem/action (or similarly mismatched) phrasing within each question, before considering the quiz done.

Checks 1–4 ask whether a question can be answered without understanding it. Checks 5–6 ask whether it can be *read* — whether it works on the pre-lesson sitting, and whether it uses the vocabulary the course has already built. Both kinds have shipped past a careful review pass in this project, which is why they're scripted rather than left to a skim.

Delete the test `quiz_history.json` before handing off the final file.

