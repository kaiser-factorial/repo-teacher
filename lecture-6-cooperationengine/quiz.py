#!/usr/bin/env python3
"""
quiz.py — Evaluating Models and Harnesses: From Transcripts to Numbers (Lecture 6) comprehension check.

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
    "concepts": "Evaluation and Qualitative-Analysis Concepts",
    "repo": "Cooperation Engine Repository Mechanics",
}

TF_GUESS_PENALTY = -0.5
SA_FORMATTING_CREDIT = 0.75
SA_FUZZY_THRESHOLD = 0.82

# ---------------------------------------------------------------------------
# QUESTIONS — Lecture 6: Evaluating Models and Harnesses, From Transcripts to Numbers (cimcai/cooperationengine)
# type == "multiple_choice": choices (4 strings), answer (0-indexed)
# type == "true_false":      answer (True/False)
# type == "short_answer":    canonical (str), aliases (list[str], optional)
# ---------------------------------------------------------------------------
QUESTIONS = [
    # ---------------- Evaluation and Qualitative-Analysis Concepts ----------------
    {
        "id": "c1",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "A benchmark asks whether a model tends to defect in a social dilemma when it could cooperate. Compared with a test of whether the model is able to solve a task at all, what does this kind of measurement require of the way the task is presented?",
        "choices": [
            "The most favourable setup available: careful wording, several attempts, and the best one kept",
            "A separate held-back set of items that were never used while tuning the wording",
            "Ordinary, unassisted conditions, sampled once, identical for every subject",
            "A second model reading the reply against a written rubric",
        ],
        "answer": 2,
        "explanation": "A propensity measurement asks what a subject does by default, so it is run under realistic conditions and a single attempt; scores are comparable only across subjects that received the same protocol. Best-of-k elicitation is how a capability is measured, and it would erase the tendency being studied.",
    },
    {
        "id": "c2",
        "category": "concepts",
        "type": "short_answer",
        "prompt": "Two people independently code the same set of transcripts from one codebook. Name the statistic that measures their agreement after subtracting the agreement expected by chance.",
        "canonical": "Cohen's kappa",
        "aliases": ["kappa", "cohens kappa", "cohen kappa", "cohen's kappa coefficient", "kappa coefficient", "κ"],
        "explanation": "κ = (p_o − p_e) / (1 − p_e): observed agreement minus chance agreement, scaled. Raw percent agreement is inflated whenever one label dominates; the correction is what lets code counts be used as numbers.",
    },
    {
        "id": "c3",
        "category": "concepts",
        "type": "true_false",
        "prompt": "When one label accounts for most of a corpus, the raw percentage of spans two coders agree on overstates how reliable the coding is.",
        "answer": True,
        "explanation": "Two coders who each mark 90% of spans with the dominant label agree on 81% of spans by chance alone. Chance-corrected agreement subtracts that expected overlap; the raw figure does not.",
    },
    {
        "id": "c4",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "A reply reads “I refuse to ACCEPT these terms. REJECT.” The parser upper-cases the reply and tests each allowed label in the sequence ACCEPT, REJECT, HEDGE, returning the first one found. Which failure has just occurred?",
        "choices": [
            "The earlier entry in the search sequence wins regardless of which one the reply actually chose",
            "A shorter allowed word was found inside a longer unrelated word",
            "No allowed word was present, so the row was silently dropped from the denominator",
            "The grader preferred whichever candidate answer it was shown first",
        ],
        "answer": 0,
        "explanation": "This is order bias in a self-reported-label parser: both labels are present, and the search sequence rather than the reply decides. Substring hits, dropped rows and position bias in a model judge are the other three characteristic failures, and each needs a different fix.",
    },
    {
        "id": "c5",
        "category": "concepts",
        "type": "short_answer",
        "prompt": "Name the harness technique in which every model call is stored under a hash of its exact request (provider, model, messages, parameters) so that a later run can serve the stored response instead of calling the provider.",
        "canonical": "replay",
        "aliases": ["record and replay", "record/replay", "record-replay", "record replay", "replay mode", "record and replay mode"],
        "explanation": "Content-addressed capture lets the harness be re-run against recorded responses at zero cost, which separates a grader change from a model change from sampling noise. A miss should be a loud error, never a silent fallback to a paid call.",
    },
    {
        "id": "c6",
        "category": "concepts",
        "type": "true_false",
        "prompt": "When two independent coders assign different codes to the same span, the recommended resolution is a majority vote among the coders so that coding can proceed to counting.",
        "answer": False,
        "explanation": "A disagreement is a hole in the codebook's definitions. The fix is to rewrite the inclusion and exclusion rule for the codes involved and recode; voting keeps the ambiguity and hides it inside the counts.",
    },
    {
        "id": "c7",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "In thematic analysis, every code is attached to the exact quotation that licensed it. What is the primary purpose of keeping that quotation?",
        "choices": [
            "It lets an automated pattern-matcher reproduce the coding without a person",
            "It makes coding faster by reducing each transcript to its key phrases",
            "It is what the frequency count of each code is computed from",
            "It lets a second reader check whether the code was warranted",
        ],
        "answer": 3,
        "explanation": "A code is evidence, not an impression. Without the span, a code cannot be verified by anyone else, and a count of codes is a count of one reader's opinions. Speed and automation are side effects at best; the count comes from the codes, not the quotations.",
    },
    {
        "id": "c8",
        "category": "concepts",
        "type": "multiple_choice",
        "prompt": "A study reports results for nine models on six benchmarks, testing each of the 54 cells at a 5% significance threshold. With no real effects anywhere, about how many cells would be expected to appear significant by chance?",
        "choices": [
            "None — the threshold already guarantees each individual result",
            "Roughly three",
            "Roughly twenty-seven",
            "All fifty-four, because the tests are not independent",
        ],
        "answer": 1,
        "explanation": "54 × 0.05 ≈ 2.7 false positives are expected. A Bonferroni correction divides the threshold by the number of tests (0.05 / 54 ≈ 0.0009); the alternative is to label unplanned comparisons as exploratory.",
    },
    {
        "id": "c9",
        "category": "concepts",
        "type": "true_false",
        "prompt": "Showing a model-based judge each pair of candidate answers in both orders, and counting a preference only when the two orders agree, is a mitigation for verbosity bias.",
        "answer": False,
        "explanation": "Swapping the order cancels position bias — the judge's tendency to prefer whichever answer appears first or last. Verbosity bias (preferring longer answers regardless of content) is addressed with anchored rubrics and pairwise grading, not with order swaps.",
    },
    # ---------------- Cooperation Engine Repository Mechanics ----------------
    {
        "id": "r1",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Name the helper in server/routes.ts that turns a free-text reply into one of a list of allowed labels by upper-casing the reply and searching for each label in turn.",
        "canonical": "extractCategory",
        "aliases": ["extractCategory()", "extract category"],
        "explanation": "It is the benchmark dashboard's only grader: a first-match substring search whose result, if non-null, is tallied per model. Rows with no match are skipped without being counted, so parse rate is not recorded.",
    },
    {
        "id": "r2",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "In shared/metrics.ts, statDelta compares two Stats. When both have zero variance and their means differ, it reports z as Infinity. Why is that the intended behaviour rather than a bug?",
        "choices": [
            "A zero count in either group makes the standard error undefined",
            "With no spread in either group, any gap between the means is infinitely far from sampling noise",
            "The threshold argument defaults to 2, and Infinity is the sentinel for “threshold not supplied”",
            "The function divides by the smaller variance to avoid floating-point drift",
        ],
        "answer": 1,
        "explanation": "The standard error of the difference is √(var_A/n_A + var_B/n_B). If both variances are zero the observations were perfectly consistent, so a non-zero gap cannot be noise; the code returns ±Infinity for a real gap and 0 for no gap.",
    },
    {
        "id": "r3",
        "category": "repo",
        "type": "true_false",
        "prompt": "In Cooperation Engine, the label read out of a model's reply is recomputed from the stored transcript every time the benchmark dashboard is requested, rather than being saved on the run.",
        "answer": True,
        "explanation": "GET /api/benchmark-results loads every run and session and re-parses the responses on each request. Only the raw content is persisted, which means a parser change silently moves every historical rate.",
    },
    {
        "id": "r4",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Which server file wraps every provider call so that the exact request can be hashed, optionally captured as an artifact, and later served back without touching the network?",
        "canonical": "modelClient.ts",
        "aliases": ["server/modelClient.ts", "modelClient", "ModelClient", "model client"],
        "explanation": "computeRequestHash canonicalises the request (sorted keys at every depth) and SHA-256 hashes it; ModelClient.complete runs in live or replay mode. Capture is off unless RUN_ARTIFACTS_CAPTURE=1 is set.",
    },
    {
        "id": "r5",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "How does the second-stage evaluator model receive a subject model's replies in performEvaluation?",
        "choices": [
            "One turn at a time, with a running score carried between turns",
            "As a pair with another subject's replies, shown in both orders",
            "Through the arena loop, as an opponent in an iterated game",
            "All of that subject's turns concatenated into a single {{RESPONSE}} placeholder, one subject at a time",
        ],
        "answer": 3,
        "explanation": "The replies are sorted by step, joined with separators, and substituted into the evaluation prompts. There is no pairwise comparison and no order swap, and the evaluator's verdict is stored as text without any score being parsed from it.",
    },
    {
        "id": "r6",
        "category": "repo",
        "type": "true_false",
        "prompt": "As of the commit this lesson was checked against, nothing in server/routes.ts imports shared/metrics.ts; the dashboard's rates are computed by dividing two integers.",
        "answer": True,
        "explanation": "The Stat and statDelta primitives are complete and covered by fourteen tests, but only the tests call them. Wiring them into the dashboard is the still-open second phase of the run-level integration work.",
    },
    {
        "id": "r7",
        "category": "repo",
        "type": "short_answer",
        "prompt": "Name the field on a Run that tags whether the study framing shared a turn with the scenario text or sat in its own system turn.",
        "canonical": "promptStyle",
        "aliases": ["prompt_style", "prompt style", "promptStyle tag"],
        "explanation": "It defaults to \"pre-prompt\" (framing mixed in) so that existing runs form the baseline; \"separated\" is the alternative. The tag is stored per run, but no dashboard view yet splits a rate by it.",
    },
    {
        "id": "r8",
        "category": "repo",
        "type": "multiple_choice",
        "prompt": "In shared/ethicalSpace.ts, how are the “regions” of the ethical space produced?",
        "choices": [
            "By grouping reasons that appear together in the same justification into connected components",
            "By asking the subject model to name the ethical framework it used",
            "By reading them from a fixed taxonomy declared in the CONFLICTS list",
            "By having the evaluator model cluster the justifications",
        ],
        "answer": 0,
        "explanation": "Each justification yields a set of cited reasons; a union-find pass joins reasons that co-occur, and the resulting components are the regions. The file's header comment rules out asking the model, on the grounds that self-report is gameable; CONFLICTS only lists which reasons pull against each other.",
    },
    {
        "id": "r9",
        "category": "repo",
        "type": "true_false",
        "prompt": "PROVIDER_PARAMS in server/routes.ts sets temperature to zero for every provider, so two live runs of the same session are deterministic.",
        "answer": False,
        "explanation": "PROVIDER_PARAMS carries only a max-token setting per provider; temperature is never set, so every run samples at the provider's default and the harness records no noise floor.",
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
    parser = argparse.ArgumentParser(description="Lecture 6 (cimcai/cooperationengine) comprehension quiz.")
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