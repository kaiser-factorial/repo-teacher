# Lab 2 — Agent Harness Engineering

This lab separates model judgment from the runtime that makes model-driven work bounded, observable,
and testable. The hands-on vehicle is a small data-visualization agent that profiles a CSV, proposes a
constrained chart plan, validates it, renders it, grades its artifacts, and records a trace.

## Recommended order

1. Take the pre-test: `python3 quiz.py --mode pre`
2. Review `Agent_Harness_Engineering.pptx`
3. Complete `part-a-visualization-harness/visualization_harness_assignment.md`
4. Take the post-test: `python3 quiz.py --mode post`

## Files

| Path | Purpose |
|---|---|
| `Agent_Harness_Engineering.pptx` | 32-slide lab deck |
| `quiz.py` | 24-question pre/post diagnostic |
| `datasets/cafe_metrics.csv` | Synthetic 36-row café dataset |
| `part-a-visualization-harness/starter/harness.py` | Student implementation scaffold |
| `part-a-visualization-harness/instructor/harness.py` | Executed reference implementation |
| `part-a-visualization-harness/replay_cases.json` | Deterministic model proposals and held-out evals |
| `part-a-visualization-harness/tests/test_harness.py` | Eight behavioral tests |

The required assignment path uses deterministic replay proposals and does not require an API key. A
live model adapter and a slide-derived visualization skill are optional extensions after the bounded
loop passes the same eval set.
