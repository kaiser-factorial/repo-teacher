#!/usr/bin/env python3
"""
quiz.py — LogitLoom lesson comprehension check.

Run this once BEFORE the lesson (choose "pre") and once AFTER (choose "post").
Results are stored alongside this script in quiz_history.json. When you take
the post-lesson quiz, it automatically pulls your most recent pre-lesson
attempt and shows you how your score changed.

Question types:
  - multiple_choice: pick one of four options.
  - true_false: True / False / "Don't know". Guessing wrong costs -0.5 points;
    "Don't know" costs nothing (same as leaving it blank).
  - short_answer: type the answer (a function name, file name, field name...).
    Graded with light fuzzy-matching: an answer that's semantically right but
    missing formatting (e.g. no "()" or no ".ts") still earns partial credit
    (0.75 instead of 1.0), and the feedback tells you exactly what was off.

Usage:
    python3 quiz.py            # interactive: asks pre/post, then walks the quiz
    python3 quiz.py --mode pre # skip the prompt (useful for scripting)
    python3 quiz.py --history  # just print past attempts, no new quiz

No third-party dependencies — standard library only.
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
    "background": "Background: How LLMs Generate Text",
    "repo": "The Repo: How LogitLoom Actually Works",
}

TF_GUESS_PENALTY = -0.5
SA_FORMATTING_CREDIT = 0.75  # awarded for a semantically-correct but malformed short answer
SA_FUZZY_THRESHOLD = 0.82    # difflib ratio above which a typo-y answer still gets partial credit

# ---------------------------------------------------------------------------
# Question bank
# ---------------------------------------------------------------------------
# Common fields: id, category, type, prompt, explanation
#   type == "multiple_choice": choices (4 strings), answer (0-indexed)
#   type == "true_false":      answer (True/False)
#   type == "short_answer":    canonical (str), aliases (list[str], optional)

QUESTIONS = [
    # ---------------- Background ----------------
    {
        "id": "bg1",
        "category": "background",
        "type": "multiple_choice",
        "prompt": "What is a \"logit\" in the context of an LLM predicting the next token?",
        "choices": [
            "The final probability assigned to a token after softmax",
            "A raw, unnormalized score the model assigns to each vocabulary token",
            "The log of the training loss",
            "A special token marking end-of-sequence",
        ],
        "answer": 1,
        "explanation": "Logits are raw scores; softmax turns them into a probability distribution.",
    },
    {
        "id": "bg2",
        "category": "background",
        "type": "true_false",
        "prompt": "A \"logprob\" and a \"logit\" are the same thing.",
        "answer": False,
        "explanation": "A logit is a raw pre-softmax score; a logprob is the natural log of the post-softmax probability.",
    },
    {
        "id": "bg3",
        "category": "background",
        "type": "multiple_choice",
        "prompt": "What does top-p (nucleus) sampling do?",
        "choices": [
            "Always picks the single most likely token",
            "Samples uniformly from the entire vocabulary",
            "Keeps the smallest set of top tokens whose cumulative probability passes p, then samples from that set",
            "Rescales logits by a temperature value",
        ],
        "answer": 2,
        "explanation": "This is exactly what LogitLoom's \"Top P\" / coverProb control implements.",
    },
    {
        "id": "bg4",
        "category": "background",
        "type": "true_false",
        "prompt": "Base models are trained to follow a system / user / assistant chat turn structure.",
        "answer": False,
        "explanation": "That's instruct/chat models. Base models just predict the next token of raw text — no chat formatting.",
    },
    {
        "id": "bg5",
        "category": "background",
        "type": "true_false",
        "prompt": "Base models typically need a LOWER Top-P setting than instruct models, because they tend to have more diverse next-token distributions.",
        "answer": True,
        "explanation": "More plausible continuations at each step means the tree branches wider unless P is tightened.",
    },
    {
        "id": "bg6",
        "category": "background",
        "type": "multiple_choice",
        "prompt": "What is \"prefill\" (assistant prefill) in a chat model API?",
        "choices": [
            "Precomputing embeddings for the prompt",
            "Seeding/pre-writing the start of the assistant's turn so generation continues from there",
            "A cache for repeated prompts",
            "Another name for the system prompt",
        ],
        "answer": 1,
        "explanation": "LogitLoom needs prefill support to expand non-chosen branches of a chat model's tree.",
    },
    {
        "id": "bg7",
        "category": "background",
        "type": "true_false",
        "prompt": "The \"loom\" / \"multiverse\" framing treats each generation step as producing exactly one deterministic continuation.",
        "answer": False,
        "explanation": "It's the opposite — the whole point is that a model implicitly defines many plausible continuations at each step.",
    },
    {
        "id": "bg8",
        "category": "background",
        "type": "multiple_choice",
        "prompt": "Temperature, in sampling, primarily controls:",
        "choices": [
            "How many tokens get generated",
            "How sharply or flatly logits get rescaled before softmax (confidence vs. randomness)",
            "Whether the checkpoint is base or instruct",
            "The size of the context window",
        ],
        "answer": 1,
        "explanation": "Lower temperature sharpens the distribution; higher flattens it.",
    },
    # ---------------- Repo-specific ----------------
    {
        "id": "repo1",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Type the name of the function (in logit-loom.ts) that repeatedly finds an unfinished leaf and queries the API until the tree reaches its target depth.",
        "canonical": "buildTree()",
        "aliases": ["buildTree"],
        "explanation": "buildTree() runs the query -> attach -> find-next-leaf loop.",
    },
    {
        "id": "repo2",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Type the name of the function that expands ONE clicked node one level deeper, without rebuilding the whole tree.",
        "canonical": "expandTree()",
        "aliases": ["expandTree"],
        "explanation": "This backs the \"Expand from here\" button on a node.",
    },
    {
        "id": "repo3",
        "category": "repo",
        "type": "short_answer",
        "prompt": "In the TreeOptions interface, type the name of the field that controls how many alternative next-tokens are kept at each node.",
        "canonical": "maxWidth",
        "aliases": [],
        "explanation": "depth controls how many tokens deep; coverProb is the top-p threshold; maxWidth is the branching cap.",
    },
    {
        "id": "repo4",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Type the name of the function (in api-sniffer.ts) that probes a provider's /models endpoint to auto-detect logprob and prefill support.",
        "canonical": "sniffApi()",
        "aliases": ["sniffApi"],
        "explanation": "It returns an ApiInfo object (supportsLogprobs, supportsPrefill, prefillStyle, ...).",
    },
    {
        "id": "repo5",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Type the name of the file that holds the React state layer (useTreeStore / run()) wiring UI actions to buildTree/expandTree.",
        "canonical": "tree-store.ts",
        "aliases": ["tree-store", "treestore.ts", "treestore"],
        "explanation": "tree-store.ts is the state layer between the UI and the core algorithm in logit-loom.ts.",
    },
    {
        "id": "repo6",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Type the name of the Token field that is non-null once that branch has hit a stop condition.",
        "canonical": "branchFinished",
        "aliases": [],
        "explanation": "Token = { text, logprob, prob, branchFinished, children }.",
    },
    {
        "id": "repo7",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "Why does the repo vendor its own copy of the OpenAI client (openai.ts)?",
        "choices": [
            "To add custom logging",
            "To sidestep a Bun browser-bundling issue",
            "Because OpenAI's client doesn't support chat models",
            "To avoid paying for API calls",
        ],
        "answer": 1,
        "explanation": "See vendor-openai.sh — it's a build/bundling workaround, not a feature change.",
    },
    {
        "id": "repo8",
        "category": "repo",
        "type": "true_false",
        "prompt": "LogitLoom has no backend server, so your API keys never leave your browser.",
        "answer": True,
        "explanation": "It's a single client-side web app that talks directly to the provider's API.",
    },
    {
        "id": "repo9",
        "category": "repo",
        "type": "true_false",
        "prompt": "The \"byte-split Unicode tokens\" rendering issue happens because coverProb (Top P) is set above 100.",
        "answer": False,
        "explanation": "It's a BPE/tokenization issue: some Unicode characters split across tokens as raw byte-escapes, unrelated to coverProb.",
    },
]

TOTAL_BY_CATEGORY = {}
for q in QUESTIONS:
    TOTAL_BY_CATEGORY[q["category"]] = TOTAL_BY_CATEGORY.get(q["category"], 0) + 1


# ---------------------------------------------------------------------------
# Grading
# ---------------------------------------------------------------------------

def _loose(s):
    """Lowercase and strip everything but letters/digits, for fuzzy comparison."""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def grade_short_answer(user_raw, canonical, aliases=None):
    """
    Returns (points, status, note) where:
      points: 1.0 (exact), 0.75 (semantically right but malformed / minor typo), or 0.0 (wrong)
      status: "correct" | "partial" | "incorrect"
      note: human-readable explanation of what was off, or None
    """
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

    best_ratio = max(
        difflib.SequenceMatcher(None, user_norm, cand.lower()).ratio() for cand in candidates
    )
    if best_ratio >= SA_FUZZY_THRESHOLD:
        return SA_FORMATTING_CREDIT, "partial", "close, but double-check the exact spelling/formatting"

    return 0.0, "incorrect", None


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Running the quiz
# ---------------------------------------------------------------------------

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
    print(
        f"\n   >> Section done — {label}: "
        f"{fully_correct} out of {total} fully correct, {points:.2f} points earned."
    )


# ---------------------------------------------------------------------------
# Scoring & reporting
# ---------------------------------------------------------------------------

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
        print(
            f"  - {label}: {c['fully_correct']} out of {c['total']} fully correct "
            f"({pct(c['fully_correct'], c['total'])}), {c['points']:.2f} out of {c['max_points']:.0f} points "
            f"({pct(c['points'], c['max_points'])})."
        )
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
        print(f"  Before: {pre_c} out of {pre_t} fully correct ({pct(pre_c, pre_t)}); "
              f"{pre_pts:.2f}/{pre_max:.0f} points ({pct(pre_pts, pre_max)}).")
        print(f"  After:  {post_c} out of {post_t} fully correct ({pct(post_c, post_t)}); "
              f"{post_pts:.2f}/{post_max:.0f} points ({pct(post_pts, post_max)}).")
        d_pts_pct = round(100 * post_pts / post_max) - round(100 * pre_pts / pre_max) if pre_max and post_max else 0
        sign = "+" if d_pts_pct >= 0 else ""
        print(f"  That's a change of {sign}{d_pts_pct} percentage points (by weighted score).\n")

    explicit_line(
        "Overall",
        pre_score["total_fully_correct"], pre_score["total_questions"],
        pre_score["total_points"], pre_score["max_points"],
        post_score["total_fully_correct"], post_score["total_questions"],
        post_score["total_points"], post_score["max_points"],
    )
    for cat, label in CATEGORY_LABELS.items():
        pc = pre_score["by_category"].get(cat)
        po = post_score["by_category"].get(cat)
        if not pc or not po:
            continue
        explicit_line(
            label,
            pc["fully_correct"], pc["total"], pc["points"], pc["max_points"],
            po["fully_correct"], po["total"], po["points"], po["max_points"],
        )

    pre_answers = pre_attempt["answers"]
    print("Questions that flipped from incorrect to fully-correct, or vice versa:")
    flips = 0
    for q in QUESTIONS:
        pre_rec = pre_answers.get(q["id"])
        post_rec = post_answers.get(q["id"])
        if not pre_rec or not post_rec:
            continue
        pre_correct = pre_rec["status"] == "correct"
        post_correct = post_rec["status"] == "correct"
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="LogitLoom lesson comprehension quiz.")
    parser.add_argument("--mode", choices=["pre", "post"], help="skip the interactive prompt")
    parser.add_argument("--history", action="store_true", help="print past attempts and exit")
    args = parser.parse_args()

    if args.history:
        print_history_only()
        return

    print("=" * 60)
    print("  LogitLoom Comprehension Check")
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

    attempt = {
        "mode": mode,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "answers": answers,
        "score": score,
    }
    history.append(attempt)
    save_history(history)

    print_score(score, heading=f"{mode.upper()}-Lesson Score")

    if mode == "post":
        pre_attempt = find_latest_pre(history[:-1])  # exclude the attempt we just added
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
