# Lab 1 · Part A — Kaggle

**Format:** hands-on walkthrough. Work through the intro deck (`Lab1_CloudCompute_Intro.pptx`) first,
then do this alongside the notebook `lab1a_starter.ipynb`.

**What you're actually learning here:** how to *operate Kaggle* — GPUs, Models, Datasets, Secrets,
and saving output. The modeling (a repeng control vector on Mistral-7B) is provided and deliberately
trivial; if a step feels like "just run the cell," that's on purpose.

> ⚠️ **DRAFT — not yet validated against the live platform.** These steps were written from the
> repeng source and general Kaggle knowledge, but have **not been run end-to-end on Kaggle**. Before
> using in class, do one live pass and confirm the items in **§ Verify before class** at the bottom.
> (This is the standing rule for this course: never publish an exercise you reasoned about but didn't run.)

---

## Setup recap (exact values — don't paraphrase)

| Thing | Value |
|---|---|
| Model | `mistralai/Mistral-7B-Instruct-v0.1` |
| Precision | `torch.float16` |
| repeng wrap | `ControlModel(model, list(range(-5, -18, -1)))` |
| Chat tags | `user_tag, asst_tag = "[INST]", "[/INST]"` |
| Offline install | `pip install --no-index --find-links=/kaggle/input/repeng-offline-wheels repeng` |
| Steering coeffs | `(+1.5, -1.5)` (positive must be > 0, negative < 0) |
| Save location | `/kaggle/working/control_vector.gguf` |

**A note on "instruct" mode:** Mistral-7B-**Instruct** is a chat model, so prompts are wrapped in its
`[INST] … [/INST]` template — that's why `make_dataset` and `generate_with_vector` add those tags.
You're not typing a raw fragment for the model to continue (that's base-model behavior); you're sending
a formatted instruction turn.

---

## Exercises

Each step has a **Reflect** prompt — answer it in a scratch cell or a notes file while it's fresh.

**A1 · Account & fork.** Create a Kaggle account and **verify your phone** (required to unlock GPU +
internet). Fork `lab1a_starter.ipynb`.
**Reflect:** why might a free platform gate GPUs behind phone verification? *(Deck slide 4.)*

**A2 · Turn on the GPU.** Settings → Accelerator → **GPU T4 ×2** (or P100). Run the check cell.
**Reflect:** what did `torch.cuda.get_device_name(0)` report, and how much memory does that GPU have?

**A3 · Add a model from Kaggle Models.** Sidebar → **Add Input → Models** → search *Mistral 7B
Instruct* → add. Set `MODEL_PATH` to the mounted `/kaggle/input/…` path and run the load-and-generate cell.
**Reflect:** you didn't `pip install` or download anything for this — where did the weights come from,
and what does mounting under `/kaggle/input/` mean for your disk/quota? *(Deck slide 4.)*

**A4 · Install repeng — offline.** Add the **repeng-offline-wheels** Dataset, then run the
`--no-index --find-links` install. Confirm `import repeng` works.
**Reflect:** the internet is off. Explain, in one sentence, how the install still succeeded.

**A5 · Break it on purpose.** Run the cell that pulls `mistralai/Mistral-7B-Instruct-v0.1` straight
from Hugging Face. It **should fail**.
**Reflect:** copy the error. What exactly is it complaining about — a network problem, a permissions
problem, or a missing credential? *(Deck slide 9 — the license heads-up.)*

**A6 · Fix it with Kaggle Secrets.** On Hugging Face, open the Mistral page and **accept the license**;
create an access token. In Kaggle: **Add-ons → Secrets**, add `HF_TOKEN`, attach it, and run the login cell.
**Reflect:** why is a Secret better than pasting your token into a code cell — especially in a notebook
you might make public or share?

**A7 · Train a control vector.** Add one **theme** dataset (`playful_vs_serious`, `formal_vs_casual`,
or `optimistic_vs_pessimistic` — your pick; they're the same shape) plus `all_truncated_outputs.json`.
Run the training cell, then the generate cell.
**Reflect:** compare the `+ control` and `- control` outputs to the baseline. In a sentence, what did the
vector do to the model's voice? *(This is the repeng lesson in miniature.)*

**A8 · Save your output.** Run the `export_gguf` cell, then **Save Version → Save & Run All (Commit)**.
Find `control_vector.gguf` under the notebook's **Output** tab.
**Reflect:** what's the difference between a file sitting in `/kaggle/working` during a session and one
that shows up under **Output** after a commit?

**A9 · Import, don't fork.** **File → Import Notebook** and upload `lab1a_allinone.ipynb`.
**Reflect:** when would you *import* a notebook rather than *fork* one?

---

## Troubleshooting: CUDA out of memory (single T4)

We use **one T4** by default (multi-GPU on Kaggle is finicky — that's the Bonus, not the default).
Mistral-7B in fp16 is ~14 GB against a 16 GB card, so it can tip over. If it OOMs, in order:

1. **8-bit Mistral — the "smaller Mistral" move.** `load_in_8bit=True, device_map={"": 0}`
   (needs `bitsandbytes`) → ~7 GB, *same weights*, comfortably on one T4. There isn't a smaller *dense*
   Mistral-Instruct to switch to — the 7B is the floor of that line — so quantizing it is how you shrink
   "Mistral" itself.
2. **A different small model.** `Qwen/Qwen2.5-1.5B-Instruct` or `TinyLlama/TinyLlama-1.1B-Chat-v1.0`
   (~2–3 GB fp16, ungated). Their chat template isn't `[INST] … [/INST]`, so set `user_tag`/`asst_tag` to
   that model's format (or build prompts with `tokenizer.apply_chat_template`). Milder steering, but the
   lab is about the platform, not vector quality.
3. **Fewer suffixes.** Lower `output_suffixes[:256]` to `[:128]` or `[:64]` — less memory, faster, weaker vector.

This is a real thing you'll hit running big models on modest hardware — worth seeing once.

## Bonus — get both T4s working (`device_map="auto"`)

Kaggle's **GPU T4 ×2** is 32 GB total. Try loading Mistral across both with `device_map="auto"` (and
drop the `.to("cuda:0")`).
**Heads-up (this is why it's a bonus):** multi-GPU on Kaggle is genuinely fiddly, and repeng adds its
control vector to hidden states on specific layers — with a sharded model those layers live on different
GPUs, so the control tensor has to match each layer's device. If it fights you, that's expected; fall
back to 8-bit on one card.
**Reflect:** did sharding actually help, or cause more device-mismatch trouble than it solved?

---

## Overall Reflection

You just ran a 7-billion-parameter model without owning a GPU. Describe the full path a model and its
dependencies took to get into your notebook — Kaggle Models, an offline wheel Dataset, and a Hugging Face
download gated behind a token — and name the one step you'd be most likely to forget if you did this again
from scratch.

---

## Settings cheat-sheet

| Goal | Setting |
|---|---|
| Fast lab run | `output_suffixes[:256]`, `max_new_tokens=100` |
| Stronger steering | raise coeffs toward `(+2.2, -2.2)` |
| OOM on one T4 | 8-bit Mistral: `load_in_8bit=True, device_map={"": 0}` (the "smaller Mistral") |
| Want lighter/faster | smaller model, e.g. `Qwen/Qwen2.5-1.5B-Instruct` |
| Use both T4s (bonus) | `device_map="auto"` (drop `.to("cuda:0")`) — finicky on Kaggle |
| Persist output | export to `/kaggle/working/`, then **Commit** |

---

## § Verify before class (live pass — do these once on Kaggle)

1. **Kaggle Models slug/path** for Mistral-7B-Instruct — confirm the exact `/kaggle/input/…` path and
   fix `MODEL_PATH` in both notebooks.
2. **The A5 error** — confirm it actually raises a gated-repo / auth error (capture the real message for
   the Reflect prompt), and that A6's Secrets fix clears it.
3. **Memory** — does fp16 Mistral-7B actually load *and train* on a single T4? If not, confirm the 8-bit
   fallback works, and (separately) test whether the 2×T4 `device_map` bonus is usable this term. Update
   the troubleshooting note with what actually happened.
4. **Secrets UI labels** — confirm the current menu path (Add-ons → Secrets) and the attach step.
5. **Save Version / Output tab** — confirm `control_vector.gguf` appears after a commit.
6. **Dataset naming** — decide the real slugs for the wheels dataset (`repeng-offline-wheels`) and the
   themes dataset (`repeng-lab-themes`) and make them match the notebook paths.
