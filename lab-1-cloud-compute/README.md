# Lab 1 — Cloud Compute (Kaggle & RunPod)

The course's first **lab**. Lessons teach a repo (LogitLoom, repeng); labs teach the foundational
platforms you need to *run* those repos. repeng needs a GPU most laptops don't have — so before the
repeng lesson, this lab builds the muscle for running models on borrowed hardware.

Start with the intro deck, then do the two parts in order.

```
lab-1-cloud-compute/
├── Lab1_CloudCompute_Intro.pptx   # shared intro deck — watch first
├── build_deck.py                  # reproducible build script for the deck
├── datasets/                      # SHARED — 3 same-shape theme datasets + suffix corpus
│   ├── playful_vs_serious.json
│   ├── formal_vs_casual.json
│   ├── optimistic_vs_pessimistic.json
│   ├── all_truncated_outputs.json  # suffix corpus (from repeng, credited)
│   └── README.md
├── part-a-kaggle/
│   ├── kaggle_assignment.md        # the worksheet
│   ├── lab1a_starter.ipynb         # notebook students FORK
│   └── lab1a_allinone.ipynb        # notebook students IMPORT (A9)
└── part-b-runpod/
    ├── runpod_assignment.md        # the worksheet (+ optional opbdh appendix)
    ├── steer.py                    # runs locally, breaks twice on a fresh pod (by design); opbdh-compatible
    └── requirements.txt
```

Part B ends with an optional **opbdh** appendix — automating the script-run lifecycle (launch → run →
sync results → delete pod, cost-capped) as the "scripts" counterpart to the Jupyter/notebook track.

## Order

1. **Intro deck** — what cloud compute is, and when to use Kaggle vs RunPod.
2. **Part A · Kaggle** — `part-a-kaggle/kaggle_assignment.md`.
3. **Part B · RunPod** — coming next.

## Vehicle

Both parts use **repeng** (control vectors on Mistral-7B-Instruct) as the thing you run — the reason you
need the compute. The modeling is provided and trivial; the skill being built is operating the platform.

## Status

Intro deck + both parts drafted. **Not yet validated on the live platforms** — each assignment ends with
a *§ Verify before class* checklist (exact model slugs, error messages, memory fit, secrets/UI flows, the
repo URL). Do one live pass on Kaggle and one on a RunPod pod before using with students.
