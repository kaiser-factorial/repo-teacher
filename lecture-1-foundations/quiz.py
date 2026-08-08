#!/usr/bin/env python3
"""
quiz.py — Lecture 1 (Foundations) comprehension check.

Run this once BEFORE the lesson (choose "pre") and once AFTER (choose "post").
Results are stored alongside this script in quiz_history.json. When you take
the post-lesson quiz, it automatically pulls your most recent pre-lesson
attempt and shows you how your score changed.

Question types:
  - multiple_choice: pick one of four options.
  - true_false: True / False / "Don't know". Guessing wrong costs -0.5 points;
    "Don't know" costs nothing (same as leaving it blank).
  - short_answer: type the answer (a term, abbreviation, or concept name).
    Graded with light fuzzy-matching: an answer that's semantically right but
    missing formatting (e.g. spelled out instead of abbreviated) still earns
    partial credit (0.75 instead of 1.0), and the feedback tells you exactly
    what was off.

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
    "architecture": "Transformer Architecture",
    "practice": "Training, Tooling & Interpretability",
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
    # ---------------- Transformer Architecture ----------------
    {
        "id": "arch1",
        "category": "architecture",
        "type": "multiple_choice",
        "prompt": "What is the primary purpose of the attention mechanism in a transformer?",
        "choices": [
            "To learn one fixed representation per token that never changes based on context",
            "To let each token combine information from other tokens, weighted dynamically by relevance",
            "To apply an identical, context-independent transformation to every token in parallel",
            "To let each token look only at the single token immediately before it",
        ],
        "answer": 1,
        "explanation": "Attention is a dynamic, content-based weighting of information across the whole sequence — unlike a fixed embedding lookup, a uniform per-token transform, or a strict one-back lookback.",
    },
    {
        "id": "arch2",
        "category": "architecture",
        "type": "short_answer",
        "prompt": "Self-attention computes three vectors per token: query, key, and ___. Type the missing one.",
        "canonical": "value",
        "aliases": ["values", "value vector"],
        "explanation": "Query asks \"what am I looking for,\" key answers \"what do I offer,\" and value is the content actually passed along.",
    },
    {
        "id": "arch3",
        "category": "architecture",
        "type": "true_false",
        "prompt": "Different attention heads can specialize in different kinds of relationships (e.g. one for syntax, another for coreference).",
        "answer": True,
        "explanation": "This is exactly why multi-head attention runs several attention computations in parallel with different learned projections.",
    },
    {
        "id": "arch4",
        "category": "architecture",
        "type": "multiple_choice",
        "prompt": "What problem does positional encoding solve?",
        "choices": [
            "Attention is permutation-invariant, so without it the model can't tell token order apart",
            "Deep stacks of layers suffer from vanishing gradients, so without it training would be unstable",
            "The vocabulary is too large to fit in memory, so without it rare words couldn't be represented",
            "Attention scores would grow too large as sequences lengthen, so without it softmax would saturate",
        ],
        "answer": 0,
        "explanation": "Without positional information, \"dog bites man\" and \"man bites dog\" would look identical to attention. The other three are real transformer problems too \u2014 just solved by residual connections/LayerNorm, subword tokenization, and attention's \u221adk scaling, respectively, not positional encoding.",
    },
    {
        "id": "arch5",
        "category": "architecture",
        "type": "short_answer",
        "prompt": "Type the name for the persistent per-token vector that every attention and MLP block reads from and adds back into, layer after layer.",
        "canonical": "residual stream",
        "aliases": ["residual", "the residual stream"],
        "explanation": "It's the shared channel that carries information all the way from the embedding layer to the final logits.",
    },
    {
        "id": "arch6",
        "category": "architecture",
        "type": "true_false",
        "prompt": "The residual stream is completely overwritten at each layer, discarding everything earlier layers wrote into it.",
        "answer": False,
        "explanation": "Layers add their output into the stream; they don't overwrite it. Information accumulates rather than getting replaced.",
    },
    {
        "id": "arch7",
        "category": "architecture",
        "type": "multiple_choice",
        "prompt": "Which best describes the role of an MLP (feedforward) block inside a transformer layer?",
        "choices": [
            "It mixes information across different token positions",
            "It processes each token position independently with a nonlinear transformation",
            "It computes attention scores between every pair of tokens",
            "It stores and injects the positional encoding for each token",
        ],
        "answer": 1,
        "explanation": "Unlike attention, the MLP has no cross-token mixing \u2014 it's a per-position transformation, often where factual knowledge appears to live. Computing attention scores and injecting position info are both separate components' jobs.",
    },
    {
        "id": "arch8",
        "category": "architecture",
        "type": "short_answer",
        "prompt": "Type the name of the tokenization algorithm that repeatedly merges the most frequent adjacent pair of symbols into a new token.",
        "canonical": "byte pair encoding",
        "aliases": ["bpe", "byte-pair encoding"],
        "explanation": "BPE balances vocabulary size against sequence length by building subword tokens from frequent character/byte pairs.",
    },
    {
        "id": "arch9",
        "category": "architecture",
        "type": "multiple_choice",
        "prompt": "What function converts final logits into a probability distribution over the vocabulary?",
        "choices": ["ReLU", "Sigmoid", "Softmax", "LayerNorm"],
        "answer": 2,
        "explanation": "Softmax exponentiates and normalizes the logits so they sum to 1.",
    },
    # ---------------- Training, Tooling & Interpretability ----------------
    {
        "id": "prac1",
        "category": "practice",
        "type": "multiple_choice",
        "prompt": "What is the training objective used to pretrain a base LLM?",
        "choices": [
            "Self-supervised next-token prediction on a large text corpus",
            "Human preference comparisons via a reward model",
            "Supervised classification of labeled instruction/response pairs",
            "Masked language modeling: predicting randomly hidden words in a sentence",
        ],
        "answer": 0,
        "explanation": "Pretraining is what produces a base model: no chat structure, just next-token prediction at scale. Masked-word prediction is a real pretraining objective too (BERT-style) — just not the one used for GPT-style base LLMs.",
    },
    {
        "id": "prac3",
        "category": "practice",
        "type": "short_answer",
        "prompt": "Type the common abbreviation for the alignment technique that trains a model using human preference comparisons, typically via a reward model.",
        "canonical": "RLHF",
        "aliases": ["reinforcement learning from human feedback"],
        "explanation": "RLHF: train a reward model on human preference data, then optimize the policy (the LLM) against it.",
    },
    {
        "id": "prac2",
        "category": "practice",
        "type": "true_false",
        "prompt": "Fine-tuning and RLHF/DPO typically happen after pretraining, using far less data than pretraining used.",
        "answer": True,
        "explanation": "Pretraining uses huge broad corpora; fine-tuning and alignment stages use much smaller, curated datasets.",
    },
    {
        "id": "prac4",
        "category": "practice",
        "type": "true_false",
        "prompt": "Interpretability research is primarily concerned with improving a model's raw accuracy on benchmarks.",
        "answer": False,
        "explanation": "Interpretability is about understanding the mechanism behind a behavior, not directly optimizing benchmark scores.",
    },
    {
        "id": "prac5",
        "category": "practice",
        "type": "multiple_choice",
        "prompt": "What does activation patching (causal tracing) let researchers do?",
        "choices": [
            "Substitute a specific internal value from one forward pass into another, then observe whether the output changes",
            "Train a simple linear classifier on internal values to see if a concept is decodable from them",
            "Record which tokens the model attended to most strongly during generation",
            "Compress a model for faster inference",
        ],
        "answer": 0,
        "explanation": "Patching turns a correlational observation into causal evidence by directly intervening on internal computation \u2014 unlike probing (training a classifier) or just reading off attention weights, both of which are observational, not interventional.",
    },
    {
        "id": "prac6",
        "category": "practice",
        "type": "short_answer",
        "prompt": "Type the term for the phenomenon where a single neuron or dimension appears to represent several unrelated concepts at once.",
        "canonical": "superposition",
        "aliases": [],
        "explanation": "Superposition happens when a model packs more features than it has dimensions, forcing them to share directions.",
    },
    {
        "id": "prac7",
        "category": "practice",
        "type": "true_false",
        "prompt": "A \"feature,\" in interpretability, usually refers to a human-interpretable direction in activation space \u2014 not necessarily a single neuron.",
        "answer": True,
        "explanation": "Because of superposition, features are often spread across many neurons rather than aligned with just one.",
    },
    {
        "id": "prac8",
        "category": "practice",
        "type": "multiple_choice",
        "prompt": "At a high level, what is a sparse autoencoder (SAE) used for in interpretability?",
        "choices": [
            "Learning an expanded, mostly-inactive basis that untangles a layer's activations into more individually-meaningful directions",
            "Reducing a layer's activations to a small number of directions that capture the most variance",
            "Directly relabeling each neuron with the single human concept it appears to represent",
            "Fine-tuning the base model so its outputs become more predictable and less varied",
        ],
        "answer": 0,
        "explanation": "SAEs learn an overcomplete (expanded, not reduced) basis where most entries are zero for a given input, untangling superposed features \u2014 the opposite move from PCA-style dimensionality reduction, and a step beyond assuming any one neuron = one concept.",
    },
    {
        "id": "prac9",
        "category": "practice",
        "type": "short_answer",
        "prompt": "Type the name of the lightweight research library many interpretability researchers use to load models and easily hook into their internal activations.",
        "canonical": "TransformerLens",
        "aliases": ["transformer lens", "transformerlens"],
        "explanation": "TransformerLens is purpose-built for interpretability workflows \u2014 easy hooks for reading and editing activations mid-forward-pass.",
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
    parser = argparse.ArgumentParser(description="Lecture 1 (Foundations) comprehension quiz.")
    parser.add_argument("--mode", choices=["pre", "post"], help="skip the interactive prompt")
    parser.add_argument("--history", action="store_true", help="print past attempts and exit")
    args = parser.parse_args()

    if args.history:
        print_history_only()
        return

    print("=" * 60)
    print("  Lecture 1: Foundations \u2014 Comprehension Check")
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
