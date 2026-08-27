# Lecture 4 Assignment — Post-Training: Six Methods, One Training Loop

**Repo:** [`huggingface/trl`](https://github.com/huggingface/trl) · **Lecture:** 4 · **Companion notebook:** `trl_lecture4_kaggle.ipynb`

This assignment has two halves.

**Part 1 (Reading)** is done at a terminal with the repository cloned. No GPU, no installs
beyond `git`. Every exercise here was checked against the actual source while this worksheet
was written — the answers are in the repo, and they were verified to be there.

**Part 2 (Running)** is the Kaggle notebook. It trains four of the six stable trainers on a
0.5B model, on free GPU time.

> **A note on what was and wasn't tested.** Part 1 was validated directly: every file path,
> function name, config field and default named below was read out of the source. Part 2 was
> validated *statically* — constructor signatures, config fields, dataset existence on the Hub
> — but **was not executed on a GPU** before being handed to you. If a notebook cell fails, that
> is worth reporting rather than working around. This distinction matters and is the reason
> Part 1 comes first.

---

## Setup recap

Clone the repository. You are reading it, not installing it, for Part 1.

```bash
git clone --depth 1 https://github.com/huggingface/trl.git
cd trl
```

| Field | Value |
|---|---|
| Version this assignment was written against | `1.10.0.dev0` (see `VERSION`) |
| Licence | Apache 2.0 |
| Stable trainers | `trl/trainer/` — six |
| Experimental methods | `trl/experimental/` — roughly twenty-five |
| Built-in reward functions | `trl/rewards/` |
| Trainer→dataset-type table | `docs/source/dataset_formats.md` |
| Method→paper index | `docs/source/paper_index.md` |
| Breaking changes, v0→v1 | `MIGRATION.md` |

**Check your version first.** Run `cat VERSION`. If it differs from `1.10.0.dev0`, some
specifics below may have moved. That is not a defect in the assignment — it is the subject of
slide 20, and noticing it is part of the exercise.

---

# Part 1 — Reading

### Exercise 1 · Count the stable trainers *(slide 15)*

```bash
ls trl/trainer/*_trainer.py
```

Ignore `base_trainer.py`. List the six that remain, and next to each write the dataset type it
expects — get that from `docs/source/dataset_formats.md`, not from memory.

**Reflect:** two of the six expect the same dataset type as each other, and two more expect a
type that contains no model output at all. Which are which, and what does that second group
have to do before it can compute any loss?

---

### Exercise 2 · Find the shared spine *(slide 14)*

```bash
grep -n "^class .*Trainer" trl/trainer/*_trainer.py
```

Every stable trainer subclasses the same private base. Open `trl/trainer/base_trainer.py` and
find what *that* subclasses.

**Reflect:** the file is under 200 lines. Given that batching, checkpointing, logging and
distributed coordination all work, where is that code actually coming from — and what does
that tell you about how much of TRL is TRL?

---

### Exercise 3 · Read a loss *(slide 17)*

Open `trl/trainer/reward_trainer.py` and find `compute_loss`. Copy out the two lines that
compute `loss`.

Then answer, from the code alone:

1. What is the shape of `outputs.logits` before `squeeze(-1)`, and why is that squeeze there?
2. What does `torch.chunk(..., chunks=2)` split, and what does that imply about how the
   batch was assembled?
3. There is an optional `margin` term. What does subtracting it change about what counts as
   "good enough"?

**Reflect:** the loss never references an absolute target. Given that, what would happen if you
added 1000 to every score the model produces — and what does that tell you about comparing
reward-model outputs across two separate training runs?

---

### Exercise 4 · Diff two objectives *(slide 14)*

Open `dpo_trainer.py` and `kto_trainer.py` side by side. Both handle a "judgment" signal. Find
each one's data collator class — the names are the giveaway.

**Reflect:** the two collator names differ by one word. That word is the entire practical
difference between the two methods from a data-collection standpoint. What is it, and why would
a team with real user feedback often find one of these much easier to satisfy than the other?

---

### Exercise 5 · Find the generation *(slide 19)*

```bash
grep -n "def training_step" trl/trainer/*_trainer.py
grep -n "_generate_and_score_completions\|def _prepare_inputs" trl/trainer/grpo_trainer.py
```

Four trainers have a `training_step` that is a thin passthrough to `super()`. Two do something
else with their inputs entirely.

**Reflect:** you can determine which trainers are on-policy purely from these overrides,
without reading a single line of documentation. Why does that structural fact fall out of the
algorithm rather than being an arbitrary implementation choice?

---

### Exercise 6 · Read a complete reward function *(slide 18)*

Open `trl/rewards/format_rewards.py`. Read `think_format_reward` in full — it is four lines of
body.

Then list the other reward functions the package exports:

```bash
grep -n "\"" trl/rewards/__init__.py | grep -i reward
```

**Reflect:** `think_format_reward` returns 1.0 for correctly-placed tags and 0.0 otherwise. It
does not look at whether the reasoning inside the tags is any good, or whether the final answer
is correct. Write down two concrete ways a model could score 1.0 on this function while getting
worse at the task. This is the exploitability point from slide 18, made specific.

---

### Exercise 7 · Locate PPO *(slide 20)*

```bash
ls trl/experimental/
grep -n "PPOTrainer" docs/source/dataset_formats.md
```

**Reflect:** PPO is the algorithm most external material still presents as *the* way to do
RLHF. Find its dataset requirement in that table and compare it to every other row. What does
being the only trainer with that requirement suggest about when it was written relative to the
rest of the library — and what does its directory tell you about its status now?

---

### Exercise 8 · Read the stability contract *(slide 20)*

Open `docs/source/experimental_overview.md`. Read the promotion path and the FAQ.

**Reflect:** the maintainers state plainly that they may not fix issues in `experimental`. Why
is publishing volatile code inside the shipped package a better choice than keeping it on a
branch? Their own answer is in the FAQ — decide whether you find it convincing.

---

# Part 2 — Running

Open `trl_lecture4_kaggle.ipynb` on [kaggle.com/code](https://www.kaggle.com/code). In the
sidebar set **Accelerator** to `GPU T4 x2` or `GPU P100`, and **Internet** to `On`.

The notebook contains six exercises, each with its own inline reflection:

| | Exercise | What it demonstrates |
|---|---|---|
| **A** | Check the lecture against the installed library | Version drift, live |
| **B** | SFT on `trl-lib/Capybara` | Learning from a demonstration |
| **C** | `RewardTrainer` on `trl-lib/ultrafeedback_binarized` | Training a judge; `accuracy` and `margin` |
| **D** | DPO on the *same* data | Same signal, no judge, reference model instead |
| **E** | GRPO with `think_format_reward` | A verifier, prompt-only data, no preference collection |
| **F** | The `beta` default | Reading a default that the lecture didn't tell you about |

Exercise F is the one to slow down on. It contains a fact this lecture deliberately left for
you to find in the source rather than stating on a slide.

---

## Settings cheat-sheet

For your own experiments after the notebook. All assume Qwen2.5-0.5B on a single 16 GB GPU.

| Goal | Trainer | Key settings | Roughly |
|---|---|---|---|
| Fastest sanity check that anything runs | `SFTTrainer` | `max_steps=10`, `per_device_train_batch_size=2`, `max_length=512` | 1–2 min |
| See a judge's accuracy actually move | `RewardTrainer` | `max_steps=50`, `per_device_train_batch_size=2` | 3–5 min |
| Feel the reference-model memory cost | `DPOTrainer` | `beta=0.1`, `per_device_train_batch_size=2` | 3–5 min |
| Watch a verifiable reward climb | `GRPOTrainer` | `num_generations=4`, `per_device_train_batch_size=4`, `max_completion_length=96`, `use_vllm=False` | 10–20 min |
| Make the anchor visible in the logs | `GRPOTrainer` | as above plus `beta=0.04` | 10–20 min |

**The one constraint that will bite you:** for GRPO and RLOO, the generation batch
(`steps_per_generation × per_device_train_batch_size`, where `steps_per_generation` falls back
to `gradient_accumulation_steps`) must be evenly divisible by `num_generations`. If you change
one of these, change the others to match or the trainer will refuse to start.

---

## Overall reflection

Across both halves you have seen the same set of methods twice: once as source you read, once
as processes you ran. Those two views disagree in at least one place — the lecture presented
the KL anchor as standard practice, and the default in `GRPOConfig` says otherwise.

**Write a paragraph.** When a lecture, a library's documentation, and a library's actual
defaults disagree, which do you trust, and what does that imply about how you should approach
the next tool this course opens up? Be specific about what you would check first.
