# Lab 1 — Cloud Compute (Kaggle + RunPod): Structure Proposal

**Status:** draft for review. Nothing is built yet — react to / edit this, then I'll build.
**Vehicle:** repeng (the reason students need compute). Lab content is deliberately trivial —
code is provided; the student's job is to *operate the platform*, not to figure out the ML.

---

## 0. Framing

- **Lab, not lesson.** Teaches the *platforms*. The repeng *lesson* (lecture-3) can then assume
  students know how to get a model running somewhere.
- **One lab, two parts** — Part A (Kaggle), Part B (RunPod). The comparison is the point, so they
  share one intro deck and one set of datasets.
- **No quiz.** Deliverable = intro deck (ppt, shown first) + `assignment.md` per part + the files
  needed to complete them.
- Each part's mini-project ends in **something the student can't skip past**: a saved/committed
  output (Part A) and a file pulled back off the box (Part B).

---

## 1. Directory layout

```
/Projects/repo-teacher/
└── lab-1-cloud-compute/
    ├── Lab1_CloudCompute_Intro.pptx        # SHARED intro deck (covers both parts)
    ├── README.md                            # what the lab is, how A & B fit, suggested order
    ├── datasets/                            # SHARED — 3 same-structure contrast datasets
    │   ├── playful_vs_serious.json          #   each = list of {"positive","negative"} pairs
    │   ├── formal_vs_casual.json
    │   └── optimistic_vs_pessimistic.json
    ├── part-a-kaggle/
    │   ├── kaggle_assignment.md
    │   ├── lab1a_starter.ipynb              # the notebook students FORK
    │   └── lab1a_allinone.ipynb            # the IMPORTABLE notebook (demo: import, not just fork)
    └── part-b-runpod/
        ├── runpod_assignment.md
        ├── steer.py                         # runs fine locally, BREAKS on RunPod (twice, on purpose)
        └── requirements.txt
```

- **Shared at root:** intro deck, README, and `datasets/`. Reusing the same 3 contrast datasets
  across both parts reinforces the "same structure, pick your theme" idea and keeps A and B parallel.
- **The wheel we already built** lives in `lecture-3-repeng/offline-wheels/`. Part A has students
  upload those as a Kaggle *Dataset*; I'd **reference** them from the assignment rather than
  duplicate the binaries here (see open decision #4).

---

## 2. Intro deck outline (shared, ~9 slides)

Uses the series design system (Ocean Gradient, pptxgenjs, render-every-slide QA, icon-contrast rule).
Lab-flavored = operational and screenshottable rather than conceptual.

1. **Title** — "Lab 1: Cloud Compute for Running Models" + one-line why (repeng needs a GPU most
   laptops don't have).
2. **Why this is a lab, not a lesson** — you need somewhere to actually run models; this builds the
   platform muscle so the repeng lesson can assume it.
3. **The landscape** — what "cloud compute for ML" means: ephemeral notebooks vs. rented boxes,
   free vs. paid, shared vs. yours-to-manage.
4. **Kaggle in one slide** — what you get (free T4×2 / P100, Notebooks, Datasets, Models, Secrets);
   limits (session time cap, non-persistent env, no root).
5. **RunPod in one slide** — rent a GPU pod, Jupyter or SSH, bring your own env; limits (costs money,
   you manage setup, remember to shut it down).
6. **"When to use which"** — the screenshottable side-by-side (your request). Quick experiment /
   free / share a notebook → Kaggle. Big model / long run / your own repo & scripts / full control →
   RunPod.
7. **Part A preview (Kaggle)** — 4-beat: add a model → install repeng offline → hit + fix a token
   error → train + save a control vector.
8. **Part B preview (RunPod)** — 4-beat: launch a pod → clone a repo → fix what breaks → push back &
   pull files off.
9. **Ground rules** — accounts to create, and the HF-license heads-up ("you'll be asked to accept a
   model license — that's normal and worth understanding").

---

## 3. Part A — Kaggle (`kaggle_assignment.md`)

Numbered exercises, each with an inline **Reflect**. All code provided; student runs + observes.

- **A1. Account + fork.** Create a Kaggle account, verify phone (required for GPU + internet), fork
  `lab1a_starter.ipynb`.
- **A2. Turn on the GPU.** Enable the accelerator; confirm with `torch.cuda.is_available()`.
- **A3. Add Mistral-7B from Kaggle Models.** Sidebar → Add Input → Models. Load
  `Mistral-7B-Instruct` (hosted on Kaggle, license handled in-platform — it "just works"), generate
  one line. *Teaches:* the Models sidebar + the `/kaggle/input/...` path.
- **A4. Install repeng offline.** Add the repeng `offline-wheels` Dataset, then
  `!pip install --no-index --find-links=/kaggle/input/<slug> repeng`. *Teaches:* Datasets as file
  delivery + offline install (no internet needed).
- **A5. Get the SAME model from HF → deliberate failure #1.** Try to pull `mistralai/Mistral-7B-Instruct`
  straight from HF; get the gated-repo / missing-token error. *Teaches (the key contrast):* same model,
  two sources — Kaggle Models is frictionless, HF needs auth. *Reflect:* read what the error is telling you.
- **A6. Fix with Kaggle Secrets.** Accept the license on HF (the "it's a Thing" moment), mint an HF
  token, add it as Secret `HF_TOKEN`, attach to the notebook, re-run → works. *Teaches:* Secrets, and
  why you never hardcode a token in a shared notebook.
- **A7. Train a control vector.** Pick one of the 3 `datasets/` themes, build a `list[DatasetEntry]`,
  `ControlVector.train(model, tokenizer, dataset)`, then generate unsteered vs. steered with
  `model.set_control(vector, strength)`. Trivial; code provided. *Ties to:* repeng lesson.
- **A8. Save output.** `vector.export_gguf("control_vector.gguf")`, then **Save Version (Commit)** →
  find the file in the notebook's Output tab. *Teaches:* committing/saving Kaggle output + persistence.
- **A9. Import vs. fork.** Open `lab1a_allinone.ipynb` and **File → Import Notebook** into Kaggle, to
  show forking isn't the only path in.
- **Overall Reflection.**

---

## 4. Part B — RunPod (`runpod_assignment.md`)

Goal: operate a rented GPU pod, round-trip a repo, and recover from environment breakage.

- **B1. Launch a pod.** Create account, add credit, pick a GPU + a PyTorch template, open Jupyter.
- **B2. Run the same notebook.** Re-run Part A's starter notebook via Jupyter — reinforces that a
  notebook is portable across platforms.
- **B3. Clone a repo.** Fork the course repo (or a provided minimal repo) on GitHub, `git clone` onto
  the pod.
- **B4. Run `steer.py` as a script → deliberate break #1.** It runs fine on a normal machine but
  fails on RunPod. *Reflect:* read the traceback, apply the fix.
- **B5. Deliberate break #2** (your "break it twice"). A *different* class of failure, so they learn
  two distinct recovery patterns — not the same fix twice.
- **B6. Round-trip.** Make a small change, `git commit` + `git push` back to their fork.
- **B7. Get files off the box.** Produce an output file, then download it (Jupyter download /
  `runpodctl send` / cloud sync) — your explicit ask.
- **B8. Shut it down.** Stop/terminate the pod. Cost hygiene is a real lesson.
- **Overall Reflection.**

---

## 5. Open decisions (need your call before I build)

1. **Model choices — LOCKED: Mistral-7B-Instruct**, used as the same-model-two-sources spine
   (Kaggle Models in A3, gated HF pull in A5). To verify against the **live catalog** at Part A build:
   exact Kaggle Models slug + Instruct variant, current HF gating behavior, and fp16 memory fit on
   Kaggle's GPUs.
2. **Dataset themes.** I proposed playful/serious, formal/casual, optimistic/pessimistic — all safe,
   all identical `{positive, negative}` structure so students just pick a vibe. Swap any?
3. **The two RunPod breaks.** You said "break it twice." Want me to choose the two most instructive
   (two genuinely different failure classes — e.g. a device/dtype assumption vs. a path/persistence
   or missing-env-var issue), or do you have specific ones in mind (e.g. an `mps`/device break you've
   personally hit)?
4. **Wheel handling for Part A.** Reference the `lecture-3-repeng/offline-wheels/` from the
   assignment (no duplication), or copy them into `part-a-kaggle/`?
5. **Part B repo.** Use a dedicated minimal repo for the round-trip, or a subfolder of repo-teacher?

---

## 6. Notes for when we update the skill (later, per your plan)

This build will surface the conventions that become `references/lab-structure.md`: the lab dir shape
(shared root + per-part subdirs, no quiz), the intro-deck-first rule, the "when to use X vs Y" slide
as a lab staple, and — the big one — **designed failure as a first-class exercise type**, with its own
validation rule (every deliberate break must be reproducible, fail exactly as described, and resolve
via the exact fix taught, all confirmed by running it live on the real platform).
