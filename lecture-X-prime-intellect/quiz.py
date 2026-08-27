#!/usr/bin/env python3
"""
quiz.py — Lecture 4: Prime Intellect comprehension check.

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
    "rl": "Background: reinforcement learning after pretraining",
    "platform": "Prime Intellect: platform and library mechanics",
}

TF_GUESS_PENALTY = -0.5
SA_FORMATTING_CREDIT = 0.75
SA_FUZZY_THRESHOLD = 0.82

# ---------------------------------------------------------------------------
# QUESTIONS
# type == "multiple_choice": choices (4 strings), answer (0-indexed)
# type == "true_false":      answer (True/False)
# type == "short_answer":    canonical (str), aliases (list[str], optional)
# ---------------------------------------------------------------------------
QUESTIONS = [
    # ----------------------- Category: RL background -----------------------
    {
        "id": "rl_rollout",
        "category": "rl",
        "type": "short_answer",
        "prompt": (
            "One complete attempt at a task by the model — everything from its first "
            "output through however many exchanges follow, until the episode ends — "
            "has a single-word name. What is it?"
        ),
        "canonical": "rollout",
        "aliases": ["a rollout", "rollouts"],
        "explanation": (
            "A rollout is one finished attempt. It is the unit that gets scored, and "
            "the unit that gets batched together for a weight update."
        ),
    },
    {
        "id": "rl_group",
        "category": "rl",
        "type": "multiple_choice",
        "prompt": (
            "Why do group-relative methods evaluate several rollouts of one task as a "
            "set, instead of judging each one on its own?"
        ),
        "choices": [
            "Batching them lets the trainer perform a single weight update instead of many, which is what makes the method efficient.",
            "It allows a separate value network to be fitted, predicting the return the policy should expect from each state.",
            "A bare number tells you nothing unless you know how hard the item was; siblings supply the missing point of reference.",
            "Disagreement among the set is treated as evidence the item is mislabelled, so those items can be dropped from the dataset.",
        ],
        "answer": 2,
        "explanation": (
            "0.4 is excellent on a hard item and dismal on an easy one. Comparing "
            "against siblings on the same item removes the need for a learned baseline "
            "entirely — which is precisely what GRPO drops relative to PPO. Option B "
            "describes that older value-network approach."
        ),
    },
    {
        "id": "rl_flat",
        "category": "rl",
        "type": "true_false",
        "prompt": (
            "A scoring function that returns 1.0 on almost every attempt still provides "
            "a strong learning signal, because the model is being told it succeeded."
        ),
        "answer": False,
        "explanation": (
            "False. What drives learning is variation between attempts, not the height "
            "of the score. If everything scores alike there is nothing to climb, and "
            "the same is true of a function that returns 0.0 almost every time."
        ),
    },
    {
        "id": "rl_rubric",
        "category": "rl",
        "type": "short_answer",
        "prompt": (
            "The collection of scoring functions applied to one finished attempt, taken "
            "together with the weight assigned to each, is called a what?"
        ),
        "canonical": "rubric",
        "aliases": ["a rubric", "rubrics"],
        "explanation": (
            "In verifiers this is a real class you instantiate, not just a concept — "
            "vf.Rubric, holding a list of functions and their weights."
        ),
    },
    {
        "id": "rl_proxy",
        "category": "rl",
        "type": "multiple_choice",
        "prompt": (
            "A team wants to train a model to be more helpful. Unable to measure "
            "helpfulness directly, they reward longer, more thorough-sounding replies. "
            "What goes wrong?"
        ),
        "choices": [
            "The model becomes reliably verbose without becoming more useful, because verbosity is what was actually paid for.",
            "The model produces replies of wildly inconsistent length, since the reward gives no guidance about any particular reply.",
            "Training destabilises and the model collapses to a single repeated token, as happens whenever the reward is unbounded.",
            "The model refuses more often, since refusals are short and therefore the safest way to avoid a low score.",
        ],
        "answer": 0,
        "explanation": (
            "The optimiser is faithful to what you wrote down, not to what you meant. "
            "A proxy that correlates with the goal in ordinary data usually stops "
            "correlating once something is actively pushing on it."
        ),
    },
    {
        "id": "rl_peft",
        "category": "rl",
        "type": "short_answer",
        "prompt": (
            "Name the parameter-efficient technique that freezes a model's existing "
            "weights and instead trains a small pair of matrices beside each one, whose "
            "product is added back in at inference time. The four-letter abbreviation "
            "is fine."
        ),
        "canonical": "LoRA",
        "aliases": ["lora", "low-rank adaptation", "low rank adaptation"],
        "explanation": (
            "LoRA — low-rank adaptation. Because the base never moves, the trained "
            "result is a small file, and one served copy of a model can carry many "
            "different adaptations at once."
        ),
    },
    {
        "id": "rl_frozen",
        "category": "rl",
        "type": "true_false",
        "prompt": (
            "Because the base weights are left untouched, a single loaded copy of a "
            "model can serve many separately-trained adaptations at the same time."
        ),
        "answer": True,
        "explanation": (
            "True — and this is the whole reason a shared service can meter training "
            "per token rather than renting you an entire GPU."
        ),
    },
    {
        "id": "rl_window",
        "category": "rl",
        "type": "multiple_choice",
        "prompt": (
            "Before committing budget to a long training run, you evaluate your task and "
            "the model scores 0.94. What is the problem?"
        ),
        "choices": [
            "The score is too noisy to trust, and would need many more samples before it could be relied on.",
            "The judge is almost certainly miscalibrated, since no honest scorer produces numbers that high.",
            "The task is leaking its answers to the model, which is the usual cause of a score in that range.",
            "There is almost no headroom left, so few attempts will differ from each other and there is little to learn from.",
        ],
        "answer": 3,
        "explanation": (
            "Near-ceiling scores leave nothing to optimise, the same way near-floor "
            "scores leave nothing to get traction on. Roughly 10–35% is the commonly "
            "cited target before launching a run."
        ),
    },
    {
        "id": "rl_hidden",
        "category": "rl",
        "type": "true_false",
        "prompt": (
            "For a coding task, defining correctness as “a hidden test suite passes” is "
            "a sound design, provided the model has no way to alter that suite."
        ),
        "answer": True,
        "explanation": (
            "True. You cannot string-match code, so execution against tests the model "
            "never sees is the right ground truth. The qualifier is the whole game: the "
            "design only holds while the thing being graded cannot reach the grader."
        ),
    },
    # ----------------------- Category: platform -----------------------
    {
        "id": "pf_entrypoint",
        "category": "platform",
        "type": "short_answer",
        "prompt": (
            "Every task package published to the Hub must expose one function with a "
            "specific, fixed name — the single thing the trainer and the evaluator both "
            "rely on being there. Type that function's name."
        ),
        "canonical": "load_environment",
        "aliases": ["load_environment()", "loadenvironment"],
        "explanation": (
            "def load_environment(**kwargs) -> vf.Environment. That is the entire "
            "required interface; everything else about how you build it is your choice."
        ),
    },
    {
        "id": "pf_orchestrator",
        "category": "platform",
        "type": "short_answer",
        "prompt": (
            "A training run is split across three cooperating processes. One applies the "
            "weight updates and one serves the model that generates attempts. Name the "
            "third — the one that owns the task logic, decides which problems to issue, "
            "and assembles finished work into batches."
        ),
        "canonical": "orchestrator",
        "aliases": ["the orchestrator", "orchestration"],
        "explanation": (
            "The orchestrator. Under Hosted Training each run gets its own, while the "
            "other two components are shared across many users at once."
        ),
    },
    {
        "id": "pf_pricing",
        "category": "platform",
        "type": "multiple_choice",
        "prompt": (
            "Hosted Training bills per token rather than per GPU-hour. Which property of "
            "the training method makes that billing model workable?"
        ),
        "choices": [
            "Training runs are short enough that per-hour billing would round to nothing, so a finer-grained unit is needed.",
            "The frozen base model is shared across tenants, so no one user occupies dedicated hardware for the duration.",
            "Gradients are accumulated and applied in one pass at the end, so hardware is only briefly occupied per run.",
            "The trainer runs on spot capacity that can be reclaimed at any moment, so time-based billing would be unfair.",
        ],
        "answer": 1,
        "explanation": (
            "Multi-tenancy is a direct consequence of the base weights never moving. "
            "Full-parameter training does not share that property, which is why it is a "
            "separate product on dedicated clusters."
        ),
    },
    {
        "id": "pf_sandbox_gpu",
        "category": "platform",
        "type": "true_false",
        "prompt": "Prime Sandboxes can be provisioned with a GPU attached.",
        "answer": False,
        "explanation": (
            "False — sandboxes are CPU-only. If a task needs a GPU, that is compute "
            "(pods and clusters), not a sandbox."
        ),
    },
    {
        "id": "pf_inspect",
        "category": "platform",
        "type": "short_answer",
        "prompt": (
            "Fill in the missing subcommand. To print a single file straight out of a "
            "published task package — reading its source without downloading or "
            "installing anything — you run:  prime env ______ owner/name FILE"
        ),
        "canonical": "inspect",
        "explanation": (
            "prime env inspect. Worth the muscle memory: it lets you read somebody's "
            "scoring code before you decide whether to believe a number they published."
        ),
    },
    {
        "id": "pf_hack",
        "category": "platform",
        "type": "multiple_choice",
        "prompt": (
            "In the published coding environment we read, the model's reply is parsed "
            "into filename-and-contents pairs, each of which is then written into the "
            "working copy of the exercise before the language's test command is run. "
            "Reward is 1.0 if that command exits 0. Where is the flaw?"
        ),
        "choices": [
            "The regex used for parsing can be defeated by unusual formatting, so correct solutions are sometimes discarded before ever being run.",
            "Exit status is a coarse measure, so a solution that passes the tests while being badly written scores identically to an elegant one.",
            "Nothing constrains which filenames may be written, so the model can overwrite the very tests that determine its score.",
            "The exercise is copied to a temporary directory, so any state the model builds up is discarded between attempts.",
        ],
        "answer": 2,
        "explanation": (
            "The first option describes a real weakness of the same environment, but it "
            "costs the model reward rather than handing it any. The flaw is that ground "
            "truth sits in a location the graded party can write to."
        ),
    },
    {
        "id": "pf_free_tier",
        "category": "platform",
        "type": "true_false",
        "prompt": (
            "Any model listed as free to train on Hosted Training can also be used free "
            "of charge to run an evaluation."
        ),
        "answer": False,
        "explanation": (
            "False. Training and inference are separately metered, with separate model "
            "lists. The models that are free to train are absent from the inference "
            "list, and the free inference model cannot be trained."
        ),
    },
    {
        "id": "pf_metric",
        "category": "platform",
        "type": "multiple_choice",
        "prompt": (
            "A rubric offers add_reward_func(func, weight=1.0) alongside "
            "add_metric(func, weight=0.0). What is the second one for?"
        ),
        "choices": [
            "Recording a quantity you want visible in the results without letting it influence what the model is trained toward.",
            "Registering a check that runs before the attempt begins, so unsuitable problems can be filtered out of the batch.",
            "Declaring a value the trainer should minimise rather than maximise, which a zero weight signals to the optimiser.",
            "Supplying a fallback used only when the primary function raises, so a crash does not abort the whole rollout.",
        ],
        "answer": 0,
        "explanation": (
            "Observation without incentive. Format compliance is the standard example: "
            "you very much want to know how often output failed to parse, but paying "
            "the model to format tidily teaches something different from paying it to "
            "be correct."
        ),
    },
    {
        "id": "pf_open",
        "category": "platform",
        "type": "true_false",
        "prompt": (
            "The libraries underneath the managed platform — the one defining tasks and "
            "the one running the training loop — are open source and publicly readable."
        ),
        "answer": True,
        "explanation": (
            "True. verifiers and prime-rl are both public and MIT-licensed. The hosted "
            "product is a managed wrapper around them, not a closed replacement."
        ),
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
    parser = argparse.ArgumentParser(description="Lesson comprehension quiz.")
    parser.add_argument("--mode", choices=["pre", "post"], help="skip the interactive prompt")
    parser.add_argument("--history", action="store_true", help="print past attempts and exit")
    args = parser.parse_args()

    if args.history:
        print_history_only()
        return

    print("=" * 60)
    print("  Lecture 4: Prime Intellect — Comprehension Check")
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
