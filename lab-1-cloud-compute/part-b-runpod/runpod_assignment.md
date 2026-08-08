# Lab 1 · Part B — RunPod

**Format:** hands-on walkthrough. Do the intro deck first, then Part A (Kaggle), then this.

**What you're actually learning here:** how to *operate a rented GPU box* — launch it, clone a repo
onto it, recover when code that worked locally breaks on a fresh remote machine, push your fix back, and
pull your results off before the box disappears. Same repeng demo as Part A; the platform skills are the point.

> ⚠️ **DRAFT — not yet validated on live RunPod.** Written from the repeng source + general RunPod
> knowledge, but **not run end-to-end on a pod**. Before class, do one live pass and confirm the items
> in **§ Verify before class**. (Standing course rule: never publish an exercise you only reasoned about.)

---

## Setup recap (exact values — don't paraphrase)

| Thing | Value |
|---|---|
| Pod template | **PyTorch** GPU pod, a card with **≥16 GB** (the demo trains Mistral-7B in fp16) |
| Repo | your **fork** of the lab repo *(set the real URL — see Verify #5)* |
| Install | `pip install -r part-b-runpod/requirements.txt` |
| Model | `mistralai/Mistral-7B-Instruct-v0.1` (**gated**) |
| Authenticate on the pod | `huggingface-cli login`  **or**  `export HF_TOKEN=hf_…` |
| Run | `THEME=playful_vs_serious python steer.py` |
| Outputs | `part-b-runpod/outputs/` → `generations.txt`, `control_vector.gguf`, and `suffix_lengths.png` (after the B5 fix) |

**The whole point of `steer.py`:** it runs fine on a normal machine, but breaks **twice** on a fresh pod.
Don't fix it before you've watched it break — that's the exercise.

---

## Exercises

**B1 · Launch a pod.** RunPod → **Deploy** → pick a GPU (≥16 GB) + a **PyTorch** template → open the
web terminal / Jupyter.
**Reflect:** what's the per-hour cost of the GPU you picked, and what happens to your files when you
*terminate* the pod? *(Deck slide 5.)*

**B2 · Run a notebook via Jupyter.** Open Part A's `lab1a_starter.ipynb` (or any notebook) in the pod's
Jupyter, just to confirm notebooks aren't a Kaggle-only thing.
**Reflect:** name one way this Jupyter differs from Kaggle's notebook editor. *(Deck slides 5–6.)*

**B3 · Clone the repo.** Fork the lab repo on GitHub, then on the pod:
`git clone <your-fork>` → `cd` in → `pip install -r part-b-runpod/requirements.txt`.
**Reflect:** why fork first, instead of cloning the original repo directly?

**B4 · First break — a hard crash.** Run `python part-b-runpod/steer.py`. It crashes while downloading
Mistral.
**Fix:** accept the model license on huggingface.co, then authenticate *on the pod* —
`huggingface-cli login`, or `export HF_TOKEN=hf_…` before rerunning.
**Reflect:** on Kaggle you solved this exact problem with **Secrets**. What's the RunPod equivalent, and
why is there no single universal answer across platforms? *(Callback to Part A · A6.)*

**B5 · Second break — a silent one.** Now the script runs to the end… but no plot appeared and
`outputs/` has no image. That's the headless-matplotlib bug: `plt.show()` draws to a screen that doesn't
exist on a server.
**Fix (this is the code change you'll push):** at the *top* of `steer.py`, before importing pyplot, add
```python
import matplotlib
matplotlib.use("Agg")
```
and replace `plt.show()` with `plt.savefig(OUT / "suffix_lengths.png")`.
**Reflect:** why is a *silent* failure like this more dangerous than the crash in B4?

**B6 · Push your fix back.** `git add`, `git commit -m "headless-safe plotting"`, `git push` to your fork.
**Reflect:** your fix now lives in the repo, not just on a pod that will vanish. Why does that matter
*especially* on rented, disposable hardware?

**B7 · Get your files off the box.** Download `outputs/` (`generations.txt`, `control_vector.gguf`,
`suffix_lengths.png`) to your computer — Jupyter's right-click **Download**, `runpodctl send`, or a cloud sync.
**Reflect:** name two ways to pull a file off a pod, and when you'd pick each.

**B8 · Stop the pod.** **Stop** or **Terminate** it.
**Reflect:** what's the difference between *stop* and *terminate*, and what does each do to your bill and
your files?

---

## Bonus — make it run out of memory (you asked for this one 😄)

In `load_model()`, delete `torch_dtype=torch.float16` so the model loads in fp32 (~28 GB) and watch it
**CUDA-OOM** on a modest GPU.
**Fix:** put fp16 back, pick a bigger GPU, or shard across GPUs with `device_map="auto"` (and drop the
`.to("cuda:0")`).
**Reflect:** what exactly ran out, and why does fp16 roughly halve it?

---

## Overall Reflection

You cloned a repo onto a rented machine, fixed two failures that only appear on a fresh remote box, pushed
the fix, and pulled your results back before the box disappeared. Which of those steps has **no equivalent**
in the Kaggle part — and why does that make RunPod both more powerful and more work?

---

## Cheat-sheet

| Goal | How |
|---|---|
| Authenticate | `huggingface-cli login` · or `export HF_TOKEN=hf_…` |
| Pick a theme | `THEME=formal_vs_casual python steer.py` |
| Files off the box | `runpodctl send outputs/…` · or Jupyter → right-click → Download |
| Big model / 2 GPUs | `device_map="auto"` (then don't also `.to("cuda:0")`) |
| Stop billing | **Stop** keeps the disk; **Terminate** wipes it |
| Automate the whole run | `opbdh launch ./steer.py -m … -s 5` (see Appendix) |

---

## § Verify before class (live pass on a real pod)

1. **Deploy flow + GPU names/prices** — confirm a ≥16 GB card trains Mistral-7B fp16; note the actual cost.
2. **B4** — confirm `steer.py` raises the gated-repo/token error on a fresh pod, and that `hf login` /
   `HF_TOKEN` clears it. Capture the real message for the Reflect prompt.
3. **B5** — confirm the plot is genuinely silent (no window, no file) on the pod, and that the
   `Agg` + `savefig` fix produces `suffix_lengths.png`.
4. **B6** — run the clone → edit → commit → push round-trip on the pod (SSH key vs HTTPS token for push).
5. **Repo URL** — decide the real lab repo students fork; update this file + the README.
6. **B7** — confirm the file-retrieval method (`runpodctl` install/flags, or Jupyter download).
7. **B8 / Bonus** — confirm current *stop vs terminate* + volume behavior, and that dropping fp16 actually OOMs the chosen card.

---

## Appendix · opbdh — the script lifecycle in one command (optional)

B1–B8 are the manual version: launch a pod, run the script, pull the results off, stop the pod, don't
overspend. **opbdh** (*Open the Pod Bay Door, HAL* — [github.com/lumpenspace/opbdh](https://github.com/lumpenspace/opbdh))
automates that whole lifecycle — **for scripts**. It is *not* a notebook tool, and that's exactly the point.

**Notebooks vs. scripts.** Want to poke around interactively? Use a notebook (Jupyter, B2). Want a
repeatable, cost-capped, fire-and-forget run? Use a **script + opbdh**. `steer.py` is our script version of
the repeng demo, so it's a natural opbdh target — even though the repeng repo itself is mostly notebooks.
(That's the resolution to "opbdh doesn't fit notebooks": it's not supposed to — it's the *scripts* track.)

**What one command does:** verifies your code → picks the cheapest GPU that fits your VRAM + price budget →
launches the pod → runs your script (pip-installing a sibling `requirements.txt`) → streams `logs/` and
`results/` home into `runpod_results/<run_id>/` → **deletes the pod when it finishes *or* fails**. A pulsing
HAL eye shows elapsed time and estimated spend.

**Setup (on your laptop, not the pod):**
- `pip install opbdh` — needs macOS/Linux, Python ≥ 3.11, and `ssh`/`scp` on your PATH.
- Set `RUNPOD_API_TOKEN` (provider token) and `HF_TOKEN` (for gated Mistral — the same B4 token wall,
  handled up front).
- Running `opbdh` unconfigured starts a setup wizard (provider, model, code path, VRAM, price caps).

**Run `steer.py` under opbdh:**
```bash
# dry run first — verifies + prints the plan, never contacts the provider or bills you
opbdh launch ./steer.py -m mistralai/Mistral-7B-Instruct-v0.1 -v 24 -s 5 --dry-run
# then for real (asks for confirmation unless you add -y):
opbdh launch ./steer.py -m mistralai/Mistral-7B-Instruct-v0.1 -v 24 -s 5
```
- `-m/--model` → sets `OPBDH_MODEL_ID`, which `steer.py` reads.
- `-v/--vram-gb 24` → minimum GPU VRAM (Mistral-7B fp16 is ~14 GB + headroom).
- `-s/--max-spend 5` → hard guard: stop if estimated spend crosses $5. `-d/--max-dollars-per-hour` caps the rate.
- `steer.py` writes to `OPBDH_RESULTS_DIR`, so `generations.txt`, `control_vector.gguf`, and (after the B5
  fix) `suffix_lengths.png` sync home automatically.

**How it maps to the manual steps:**

| Manual step | opbdh does it for you |
|---|---|
| B1 launch a pod | picks the cheapest fitting GPU + launches |
| B3 clone + `pip install -r` | ships your code + pip-installs the sibling `requirements.txt` |
| B4 authenticate | reads `HF_TOKEN` from your env |
| B7 pull files off the box | syncs `results/` + `logs/` → `runpod_results/<run_id>/` |
| B8 stop the pod | deletes the pod on finish *or* failure |
| watching the meter | price caps + max-spend guard + the HAL spend readout |

**Reflect:** which of B1–B8 does opbdh remove entirely, and which does it *not* replace? (Hint: the silent
B5 matplotlib bug — auto-sync brings `results/` home, but does that help if the code never wrote a file?
And who still has to `git push` the fix?)

> ⚠️ **Verify before class (opbdh):** confirm the exact flags against the current README; that repeng
> installs on the pod via the sibling `requirements.txt`; the right `--vram-gb` for Mistral-7B; that
> `OPBDH_RESULTS_DIR` / `OPBDH_MODEL_ID` behave as assumed; RunPod token setup; and decide whether this is
> required or a stretch appendix for your cohort.
