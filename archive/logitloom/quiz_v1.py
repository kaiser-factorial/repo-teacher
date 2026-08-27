#!/usr/bin/env python3
"""
quiz.py — LogitLoom lesson comprehension check.

Run this once BEFORE the lesson (choose "pre") and once AFTER (choose "post").
Results are stored alongside this script in quiz_history.json. When you take
the post-lesson quiz, it automatically pulls your most recent pre-lesson
attempt and shows you how your score changed.

Usage:
    python3 quiz.py            # interactive: asks pre/post, then walks the quiz
    python3 quiz.py --mode pre # skip the prompt (useful for scripting)
    python3 quiz.py --history  # just print past attempts, no new quiz

No third-party dependencies — standard library only.
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
HISTORY_PATH = SCRIPT_DIR / "quiz_history.json"

CATEGORY_LABELS = {
    "background": "Background: How LLMs Generate Text",
    "repo": "The Repo: How LogitLoom Actually Works",
}

# ---------------------------------------------------------------------------
# Question bank
# ---------------------------------------------------------------------------
# Each question: id, category ("background" | "repo"), prompt, choices (4),
# answer (0-indexed), and a one-line explanation shown after answering.

QUESTIONS = [
    # ---------------- Background ----------------
    {
        "id": "bg1",
        "category": "background",
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
        "prompt": "A \"logprob\" returned by a model API is:",
        "choices": [
            "The natural log of a token's probability",
            "The negative of the training loss for that token",
            "An index into the vocabulary",
            "Just another name for a logit",
        ],
        "answer": 0,
        "explanation": "logprob = log(probability). It's convenient because it adds instead of multiplies.",
    },
    {
        "id": "bg3",
        "category": "background",
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
        "prompt": "Which best describes a BASE model, as opposed to an instruct/chat model?",
        "choices": [
            "It's trained to follow a system/user/assistant turn structure",
            "It's trained only to predict the next token of raw text, with no chat formatting",
            "It cannot return logprobs at all",
            "It only works on images",
        ],
        "answer": 1,
        "explanation": "Base models just keep writing; prompt and prefill are simply concatenated.",
    },
    {
        "id": "bg5",
        "category": "background",
        "prompt": "Why do base models typically need a LOWER Top-P setting than instruct models when exploring their token trees?",
        "choices": [
            "They have fewer parameters",
            "They tend to have more diverse, branchier next-token distributions",
            "They don't support logprobs",
            "They always pick the same token deterministically",
        ],
        "answer": 1,
        "explanation": "More plausible continuations at each step means the tree branches wider unless P is tightened.",
    },
    {
        "id": "bg6",
        "category": "background",
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
        "prompt": "The \"loom\" / \"looming\" concept (from tools like Loom and Exoloom) is built on which idea?",
        "choices": [
            "Models should only be judged on benchmark scores",
            "At each step, a model implicitly defines many plausible continuations, not just the one sampled",
            "Fine-tuning always improves creative writing",
            "Token trees are a base64 encoding trick",
        ],
        "answer": 1,
        "explanation": "This is the \"textual multiverse\" framing LogitLoom belongs to.",
    },
    {
        "id": "bg8",
        "category": "background",
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
        "prompt": "In logit-loom.ts, what does each Token node primarily track?",
        "choices": [
            "username, timestamp, ip, session",
            "text, logprob/prob, branchFinished, children",
            "width, height, color, opacity",
            "prompt, temperature, topP, maxTokens",
        ],
        "answer": 1,
        "explanation": "That's the Token interface — the recursive shape the whole tree is built from.",
    },
    {
        "id": "repo2",
        "category": "repo",
        "prompt": "Which function repeatedly finds an unfinished leaf and queries the API until the tree hits its target depth?",
        "choices": ["sniffApi()", "buildTree()", "saveTree()", "useTreeStore()"],
        "answer": 1,
        "explanation": "buildTree() in logit-loom.ts runs the query -> attach -> find-next-leaf loop.",
    },
    {
        "id": "repo3",
        "category": "repo",
        "prompt": "What does expandTree() do differently from buildTree()?",
        "choices": [
            "It rebuilds the entire tree from scratch",
            "It expands one clicked node one level deeper, without touching the rest of the tree",
            "It deletes all children of the root",
            "It only works on base models",
        ],
        "answer": 1,
        "explanation": "This backs the \"Expand from here\" button on a node.",
    },
    {
        "id": "repo4",
        "category": "repo",
        "prompt": "In the TreeOptions interface, which field controls how many alternative next-tokens are kept at each node?",
        "choices": ["depth", "coverProb", "maxWidth", "systemPrompt"],
        "answer": 2,
        "explanation": "maxWidth is the branching factor cap; depth controls how many tokens deep; coverProb is the top-p threshold.",
    },
    {
        "id": "repo5",
        "category": "repo",
        "prompt": "What does api-sniffer.ts's sniffApi() function do?",
        "choices": [
            "Fine-tunes the model on your prompt",
            "Probes a provider's /models endpoint to auto-detect logprob and prefill support",
            "Compresses the tree for storage",
            "Renders the SVG tree diagram",
        ],
        "answer": 1,
        "explanation": "It returns an ApiInfo object (supportsLogprobs, supportsPrefill, prefillStyle, ...).",
    },
    {
        "id": "repo6",
        "category": "repo",
        "prompt": "Where does LogitLoom's UI state (the running tree, running/interrupting flags, etc.) live?",
        "choices": ["index.html", "tree-store.ts, via useTreeStore()", "openai.ts", "package.json"],
        "answer": 1,
        "explanation": "tree-store.ts is the React state layer that wires UI actions to buildTree/expandTree.",
    },
    {
        "id": "repo7",
        "category": "repo",
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
        "prompt": "What causes the \"byte-split Unicode tokens\" issue documented in query() in logit-loom.ts?",
        "choices": [
            "Tree depth set too high",
            "Some Unicode characters get split across multiple tokens as raw byte-escapes, and re-feeding that text can cause more garbled escapes",
            "An invalid API key",
            "coverProb set above 100",
        ],
        "answer": 1,
        "explanation": "The maintainer's own comment: \"tokenization continuing to suck in new and profound ways.\"",
    },
    {
        "id": "repo9",
        "category": "repo",
        "prompt": "Which backend pairing does the README recommend for exploring a BASE model?",
        "choices": [
            "OpenAI GPT-4 chat completions",
            "Anthropic Claude with prefill",
            "Hyperbolic-hosted meta-llama/Meta-Llama-3.1-405B via a completions API",
            "A local vLLM instruct checkpoint only",
        ],
        "answer": 2,
        "explanation": "DeepSeek-chat is the recommended instruct/chat pairing; Hyperbolic's 405B-base is the base-model pairing.",
    },
]

TOTAL_BY_CATEGORY = {}
for q in QUESTIONS:
    TOTAL_BY_CATEGORY[q["category"]] = TOTAL_BY_CATEGORY.get(q["category"], 0) + 1


# ---------------------------------------------------------------------------
# Helpers
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


def prompt_choice(n_choices):
    letters = "ABCD"[:n_choices]
    while True:
        raw = input(f"Your answer ({'/'.join(letters)}): ").strip().upper()
        if len(raw) == 1 and raw in letters:
            return letters.index(raw)
        if raw.isdigit() and 1 <= int(raw) <= n_choices:
            return int(raw) - 1
        print(f"  please enter one of: {', '.join(letters)}")


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

        print(f"\n{i}. {q['prompt']}")
        for j, choice in enumerate(q["choices"]):
            print(f"   {'ABCD'[j]}. {choice}")

        selected = prompt_choice(len(q["choices"]))
        correct = selected == q["answer"]
        answers[q["id"]] = {"selected": selected, "correct": correct}

        if correct:
            print("   Correct!", q["explanation"])
        else:
            print(f"   Not quite — correct answer: {'ABCD'[q['answer']]}. {q['explanation']}")

    _print_category_checkpoint(last_category, answers)
    return answers


def _print_category_checkpoint(category, answers_so_far):
    label = CATEGORY_LABELS.get(category, category)
    total = TOTAL_BY_CATEGORY[category]
    correct = sum(
        1 for q in QUESTIONS
        if q["category"] == category and answers_so_far.get(q["id"], {}).get("correct")
    )
    print(f"\n   >> Section done — {label}: you got {correct} out of {total} correct.")


def score_answers(answers):
    by_category = {cat: {"correct": 0, "total": total} for cat, total in TOTAL_BY_CATEGORY.items()}
    total_correct = 0
    for q in QUESTIONS:
        rec = answers.get(q["id"])
        if rec and rec["correct"]:
            total_correct += 1
            by_category[q["category"]]["correct"] += 1
    return {
        "total_correct": total_correct,
        "total_questions": len(QUESTIONS),
        "by_category": by_category,
    }


def pct(correct, total):
    return f"{correct}/{total} ({round(100 * correct / total)}%)" if total else "n/a"


def print_score(score, heading="Score"):
    print(f"\n--- {heading} ---")
    tc, tt = score["total_correct"], score["total_questions"]
    overall_pct = round(100 * tc / tt) if tt else 0
    print(f"You got {tc} out of {tt} questions correct overall ({overall_pct}%).")
    for cat, label in CATEGORY_LABELS.items():
        c = score["by_category"].get(cat, {"correct": 0, "total": 0})
        cat_pct = round(100 * c["correct"] / c["total"]) if c["total"] else 0
        print(f"  - You got {c['correct']} out of {c['total']} {label} questions correct ({cat_pct}%).")


def find_latest_pre(history, before_timestamp=None):
    pre_attempts = [a for a in history if a["mode"] == "pre"]
    if before_timestamp:
        pre_attempts = [a for a in pre_attempts if a["timestamp"] < before_timestamp]
    if not pre_attempts:
        return None
    return max(pre_attempts, key=lambda a: a["timestamp"])


def print_comparison(pre_attempt, post_score):
    pre_score = pre_attempt["score"]
    print("\n=== Pre -> Post Comparison ===")
    print(f"(comparing against your pre-lesson attempt from {pre_attempt['timestamp']})\n")

    def explicit_line(label, pre_c, pre_t, post_c, post_t):
        pre_pct = round(100 * pre_c / pre_t) if pre_t else 0
        post_pct = round(100 * post_c / post_t) if post_t else 0
        d = post_pct - pre_pct
        sign = "+" if d >= 0 else ""
        print(f"{label}:")
        print(f"  Before the lesson, you got {pre_c} out of {pre_t} correct ({pre_pct}%).")
        print(f"  After the lesson, you got {post_c} out of {post_t} correct ({post_pct}%).")
        print(f"  That's a change of {sign}{d} percentage points.\n")

    explicit_line(
        "Overall",
        pre_score["total_correct"], pre_score["total_questions"],
        post_score["total_correct"], post_score["total_questions"],
    )
    for cat, label in CATEGORY_LABELS.items():
        pc = pre_score["by_category"].get(cat, {"correct": 0, "total": 0})
        po = post_score["by_category"].get(cat, {"correct": 0, "total": 0})
        explicit_line(label, pc["correct"], pc["total"], po["correct"], po["total"])

    # per-question movement
    pre_answers = pre_attempt["answers"]
    print("\nQuestions that flipped:")
    flips = 0
    for q in QUESTIONS:
        pre_rec = pre_answers.get(q["id"])
        post_rec = CURRENT_POST_ANSWERS.get(q["id"])
        if not pre_rec or not post_rec:
            continue
        if pre_rec["correct"] != post_rec["correct"]:
            flips += 1
            direction = "wrong -> correct" if post_rec["correct"] else "correct -> wrong"
            print(f"  [{direction}] {q['id']}: {q['prompt']}")
    if flips == 0:
        print("  (none — same questions right/wrong as pre-lesson)")


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

CURRENT_POST_ANSWERS = {}  # populated during run_quiz() for post-mode comparison


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

    mode = args.mode or prompt_mode()
    history = load_history()

    if mode == "post" and not find_latest_pre(history):
        print("\n[note] no pre-lesson attempt found yet — this will just record a")
        print("       standalone score. Run with 'pre' beforehand next time for a comparison.\n")

    answers = run_quiz()
    global CURRENT_POST_ANSWERS
    CURRENT_POST_ANSWERS = answers
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
            print_comparison(pre_attempt, score)
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
