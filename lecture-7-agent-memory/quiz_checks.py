#!/usr/bin/env python3
"""Content hardening and scoring-engine checks for the lesson quiz."""

from __future__ import annotations

import re
from collections import Counter

import quiz


def words(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z][A-Za-z0-9_-]+", text)
        if len(token) >= 5
    }


def check_keyword_echo() -> None:
    for q in quiz.QUESTIONS:
        if q["type"] != "multiple_choice":
            continue
        stem = words(q["prompt"])
        overlaps = [len(stem & words(choice)) for choice in q["choices"]]
        correct = overlaps[q["answer"]]
        wrong = [value for i, value in enumerate(overlaps) if i != q["answer"]]
        assert correct - max(wrong) < 3, (q["id"], overlaps)


def check_cross_question_leakage() -> None:
    seen = ""
    for q in quiz.QUESTIONS:
        if q["type"] == "short_answer":
            answer = re.sub(r"[^a-z0-9 ]", "", q["canonical"].lower()).strip()
            if len(answer) >= 5:
                assert answer not in seen, (q["id"], answer)
        seen += " " + q["prompt"].lower()
        if q["type"] == "multiple_choice":
            seen += " " + " ".join(q["choices"]).lower()


def check_mashable_fragments() -> None:
    for q in quiz.QUESTIONS:
        if q["type"] != "short_answer":
            continue
        fragments = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", q["canonical"])
        fragments = [part.lower() for part in fragments if len(part) >= 3]
        prompt = q["prompt"].lower()
        assert not (len(fragments) > 1 and all(part in prompt for part in fragments)), (
            q["id"], fragments
        )


def check_answer_distribution() -> None:
    mc = Counter(q["answer"] for q in quiz.QUESTIONS if q["type"] == "multiple_choice")
    tf = Counter(q["answer"] for q in quiz.QUESTIONS if q["type"] == "true_false")
    assert mc == Counter({0: 2, 1: 2, 2: 2, 3: 2}), mc
    assert tf == Counter({True: 4, False: 4}), tf


def check_pretest_integrity() -> None:
    forbidden = ("as taught in", "according to the lecture", "slide ", "the deck says")
    for q in quiz.QUESTIONS:
        prompt = q["prompt"].lower()
        assert not any(phrase in prompt for phrase in forbidden), q["id"]


def check_hedges() -> None:
    forbidden = ("all of the above", "none of the above", "obviously", "clearly the")
    for q in quiz.QUESTIONS:
        if q["type"] == "multiple_choice":
            joined = " ".join(q["choices"]).lower()
            assert not any(phrase in joined for phrase in forbidden), q["id"]


def record(q: dict, correct: bool) -> dict:
    if correct:
        return {"type": q["type"], "points": 1.0, "status": "correct", "selected": "check"}
    points = quiz.TF_GUESS_PENALTY if q["type"] == "true_false" else 0.0
    return {"type": q["type"], "points": points, "status": "incorrect", "selected": "check"}


def check_scoring_engine() -> None:
    all_correct = {q["id"]: record(q, True) for q in quiz.QUESTIONS}
    all_wrong = {q["id"]: record(q, False) for q in quiz.QUESTIONS}
    mixed = {q["id"]: record(q, i % 2 == 0) for i, q in enumerate(quiz.QUESTIONS)}

    perfect = quiz.score_answers(all_correct)
    zero = quiz.score_answers(all_wrong)
    middle = quiz.score_answers(mixed)
    assert perfect["total_fully_correct"] == 24 and perfect["total_points"] == 24
    assert zero["total_fully_correct"] == 0 and zero["total_points"] == -4
    assert middle["total_fully_correct"] == 12


if __name__ == "__main__":
    checks = [
        check_keyword_echo,
        check_cross_question_leakage,
        check_mashable_fragments,
        check_answer_distribution,
        check_pretest_integrity,
        check_hedges,
        check_scoring_engine,
    ]
    for check in checks:
        check()
        print(f"PASS: {check.__name__}")
