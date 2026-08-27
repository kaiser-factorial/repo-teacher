#!/usr/bin/env python3
"""
quiz.py — Post-Training: Six Methods, One Training Loop (Lecture 4) comprehension check.

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
    "concepts": "Post-Training Concepts",
    "repo": "TRL Repository Mechanics",
}

TF_GUESS_PENALTY = -0.5
SA_FORMATTING_CREDIT = 0.75
SA_FUZZY_THRESHOLD = 0.82

# ---------------------------------------------------------------------------
# QUESTIONS — Lecture 4: Post-Training, Six Methods, One Training Loop (huggingface/trl)
# type == "multiple_choice": choices (4 strings), answer (0-indexed)
# type == "true_false":      answer (True/False)
# type == "short_answer":    canonical (str), aliases (list[str], optional)
# ---------------------------------------------------------------------------
QUESTIONS = [
    # ---------------- Post-Training Concepts ----------------
    {
        "id": "c1",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "A team replaces its learned judge with a Python function that checks whether generated code passes a test suite. What have they fundamentally changed about the training signal?",
        "choices": [
            "It now covers a wider range of desirable behaviours than before",
            "It is now computed by the model itself rather than an external system",
            "It is now ground truth rather than an approximation of it",
            "It now requires substantially more annotated data to produce",
        ],
        "answer": 2,
        "explanation": "A test suite doesn't estimate whether the code works — it determines it. There is no gap between the measurement and the thing being measured, which is exactly what a learned judge always has. The trade is coverage: this works only where correctness is mechanically checkable.",
    },
    {
        "id": "c2",
        "category": "concepts",
        "type": "true_false",
        "prompt": "The scores a reward model produces are only meaningful in comparison to other scores from that same reward model.",
        "answer": True,
        "explanation": "True. The training objective only ever sees the difference between two scores, so the absolute scale is arbitrary — adding a constant to every score leaves the loss unchanged. A score of 4.2 from one reward model and 4.2 from another mean nothing in common.",
    },
    {
        "id": "c3",
        "category": "concepts",
        "type": "short_answer",
        "prompt": "Many post-training methods keep a frozen copy of the network as it was at step zero, and penalize the policy for diverging from it. What is that frozen copy called? (two words)",
        "canonical": "reference model",
        "aliases": ["the reference model", "frozen reference model"],
        "explanation": "The reference model. The divergence penalty between policy and reference is what keeps optimization from collapsing output toward whatever the scorer happens to favour.",
    },
    {
        "id": "c4",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "Two teams train on the same number of examples. Team A's dataset contains questions paired with written answers; Team B's contains only the questions. Why is Team B's run far more expensive?",
        "choices": [
            "Their gradients must be computed at higher numerical precision",
            "Their model must produce the responses itself before anything can be scored",
            "Their dataset must be re-tokenized at the start of every epoch",
            "Their loss function requires a second backward pass through the network",
        ],
        "answer": 1,
        "explanation": "With no responses in the data, the model has to generate them during training — usually several per question, every step. Generation dominates the compute budget, and gradient work becomes the smaller cost.",
    },
    {
        "id": "c5",
        "category": "concepts",
        "type": "true_false",
        "prompt": "Off-policy post-training methods produce their training text during the run, by sampling from the model currently being updated.",
        "answer": False,
        "explanation": "False — that describes on-policy methods. Off-policy training uses text collected in advance and frozen, which is why its loop looks like ordinary supervised training and its cost is predictable.",
    },
    {
        "id": "c6",
        "category": "concepts",
        "type": "short_answer",
        "prompt": "Optimize hard enough against a learned judge and the policy starts finding responses that the judge scores highly but a person would call bad. Name this failure mode. (two words)",
        "canonical": "reward hacking",
        "aliases": ["reward gaming", "reward model hacking", "specification gaming"],
        "explanation": "Reward hacking. It follows from the judge being a finite-sample approximation: optimize far enough and you reach the region where the approximation and the thing it approximates come apart. Nearly every mechanism in this field exists to slow that down.",
    },
    {
        "id": "c7",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "What does the objective used to train a scoring network actually push toward?",
        "choices": [
            "Assigning each response an absolute quality value on a fixed scale",
            "Matching the numeric ratings human annotators assigned to each response",
            "Minimizing the variance of its outputs across the whole dataset",
            "Ranking the better response above the worse one for a given input",
        ],
        "answer": 3,
        "explanation": "It learns an ordering, nothing more. There is no target value for either response — only the requirement that the gap between them have the right sign and grow.",
    },
    {
        "id": "c8",
        "category": "concepts",
        "type": "true_false",
        "prompt": "Swapping a learned judge for a programmatic checker removes any possibility of the model gaming the objective.",
        "answer": False,
        "explanation": "False. It relocates the problem rather than solving it. A checker that tests for correctly-placed reasoning tags is satisfied by empty tags; a test-suite checker can be satisfied by code that special-cases the tests. Checkers are exploitable too — the advantage is that their failure modes are readable, because you wrote them.",
    },
    {
        "id": "c9",
        "category": "concepts",
        "type": "short_answer",
        "prompt": "A dataset record contains a prompt, one completion, and a boolean flag saying whether that completion was good. What is this data type called? (two words)",
        "canonical": "unpaired preference",
        "aliases": ["unpaired preference dataset", "unpaired feedback"],
        "explanation": "Unpaired preference. It matters because paired comparisons are expensive to collect — real feedback usually arrives as isolated thumbs up and down, with no matched alternative to compare against.",
    },

    # ---------------- TRL Repository Mechanics ----------------
    {
        "id": "r1",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Every stable trainer in TRL inherits its training loop from a shared base class and overrides a single method to define its own objective. Name that method.",
        "canonical": "compute_loss",
        "aliases": ["compute_loss()", "def compute_loss"],
        "explanation": "compute_loss(). This is the whole reading strategy for the library: there is one inherited loop, and the entire intellectual content of a method sits in that one override. Open two trainers and diff it.",
    },
    {
        "id": "r2",
        "category": "repo",
        "type": "short_answer",
        "prompt": "TRL keeps twenty-seven further methods in a directory whose contents may change or disappear in any release, patch versions included, with no deprecation cycle. Name that directory.",
        "canonical": "experimental",
        "aliases": ["trl/experimental", "trl/experimental/", "experimental/"],
        "explanation": "trl/experimental/. The stability contract is written down: maintainers explicitly do not commit to fixing issues there, and promotion into the stable API requires demonstrated adoption.",
    },
    {
        "id": "r3",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "You go looking for PPOTrainer in TRL, expecting it to be the centrepiece. What do you actually find?",
        "choices": [
            "It has been renamed but remains part of the supported public API",
            "It sits outside the stable API, and its data requirement is unlike the others'",
            "It is present but restricted to multi-node distributed configurations",
            "It has been merged into the trainer that superseded it as a config flag",
        ],
        "answer": 1,
        "explanation": "PPO lives in the volatile half of the library, and it wants pre-tokenized text where every other trainer takes an ordinary dataset. Most external tutorials still teach it as the canonical approach — a good reason to check the directory rather than trust a summary.",
    },
    {
        "id": "r4",
        "category": "repo",
        "type": "short_answer",
        "prompt": "One of the six stable classes produces a scorer rather than a text generator: what it emits per response is a single number. Name that class.",
        "canonical": "RewardTrainer",
        "aliases": ["reward trainer", "RewardTrainer()"],
        "explanation": "RewardTrainer. Its output is sometimes the product in its own right — an automatic evaluator for ranking outputs or filtering a dataset, with no policy training involved at all.",
    },
    {
        "id": "r5",
        "category": "repo",
        "type": "true_false",
        "prompt": "GRPOTrainer expects a dataset that supplies prompts and nothing else.",
        "answer": True,
        "explanation": "True — the documented type is prompt-only. That single fact implies the rest of its character: it must generate its own completions, which is why it needs a scoring function, why generation dominates its cost, and why its file is roughly twice the size of the others.",
    },
    {
        "id": "r6",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "Without reading any documentation, how can you tell from the class definitions alone which trainers sample from the model during training?",
        "choices": [
            "Only those ones declare a configuration dataclass alongside the class",
            "Only those ones inherit from the shared private base class",
            "Only those ones carry a real override of the per-step method, rather than a passthrough",
            "Only those ones define a custom data collator for their batches",
        ],
        "answer": 2,
        "explanation": "SFT, Reward, DPO and KTO wrap training_step in a thin passthrough to super(). GRPO and RLOO override the input-preparation path with genuine generation and scoring stages. The architectural distinction is legible in the class bodies before you read a word of prose.",
    },
    {
        "id": "r7",
        "category": "repo",
        "type": "true_false",
        "prompt": "KTOTrainer is documented as accepting paired-comparison data in addition to the single-completion-plus-label format it is known for.",
        "answer": True,
        "explanation": "True. The documented trainer-to-dataset table lists both for KTO. This flexibility is part of why it recently graduated into the stable API after an alignment pass against DPOTrainer.",
    },
    {
        "id": "r8",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "In practice, what most often decides which TRL trainer a team can actually use?",
        "choices": [
            "The shape their existing feedback data happens to be in",
            "Which optimizer their infrastructure team has standardized on",
            "The parameter count of the model they intend to train",
            "Whether their tokenizer supports a conversational template",
        ],
        "answer": 0,
        "explanation": "Teams rarely choose a method and then go collect matching data. They have what they have, and its format rules most of the library out immediately. The library ships converters that discard information, but none that invent it — there is no path from prompts alone to paired comparisons.",
    },
    {
        "id": "r9",
        "category": "repo",
        "type": "true_false",
        "prompt": "Each stable trainer in TRL implements its own batching, checkpointing and multi-GPU coordination rather than inheriting them.",
        "answer": False,
        "explanation": "False, and the opposite is the point. Every trainer is a thin subclass of the Transformers Trainer, so Accelerate, DeepSpeed, FSDP and PEFT all work without the trainer doing anything special. That inheritance is what makes the six implementations comparable to each other.",
    },
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
    parser = argparse.ArgumentParser(description="Lecture 4 (huggingface/trl) comprehension quiz.")
    parser.add_argument("--mode", choices=["pre", "post"], help="skip the interactive prompt")
    parser.add_argument("--history", action="store_true", help="print past attempts and exit")
    args = parser.parse_args()

    if args.history:
        print_history_only()
        return

    print("=" * 60)
    print("  POST-TRAINING: A MAP OF THE TERRITORY — Comprehension Check")
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