# repeng — Hands-On Assignment

**AI Seminar · Lecture 3 · companion to `Repeng_Lecture.pptx` and `repeng_kaggle.ipynb`**

You will train control vectors on a live model, then break them on purpose. Every exercise below was
executed end to end before this sheet was written — the numbers quoted as "measured" are real
outputs, not predictions. Where something was **not** verified, it says so.

Work in `repeng_kaggle.ipynb`. It runs unchanged on Kaggle (CPU **or** GPU), Colab, or a laptop.

---

## Setup recap

### Exact values

| Setting | Value | Why this one |
|---|---|---|
| Library version | **0.5.0** | The version on GitHub. Not what `pip install repeng` gives you — see below. |
| Install, internet **on** | `pip install git+https://github.com/vgel/repeng.git` | Fetches 0.5.0 directly. |
| Install, internet **off** | `pip install --no-index --find-links=/kaggle/input/<your-dataset-slug> repeng` | Uses the bundled offline wheels. |
| Fallback if the resolver complains | `pip install --no-index --find-links=<dir> --no-deps repeng gguf` | Takes the wheels verbatim and trusts the preinstalled dependencies. |
| Model | `Qwen/Qwen2.5-0.5B-Instruct` | Ungated, ~1 GB, 24 layers, hidden size 896. |
| Accelerator | **None (CPU) is enough** | Kaggle → *Settings → Accelerator*. GPU only matters if you scale the model up. |
| Concept | `"Write in an extremely {persona} style."` · `formal and academic` vs `casual and chatty` | See "why this concept" below. |
| `method` | `"pca_center"` | The non-default. Reasons in Exercise 6. |
| `batch_size` | `32` | Training-time forward-pass batch. Lower it if memory is tight; it does not change the vector. |
| `N_RAW_SUFFIXES` | `64` | The runtime dial. Cheat-sheet at the end. |
| Layer band | `11–20`, computed from Mistral's depth fraction | Not the README's literal range. Exercise 4. |
| Generation | `do_sample=False`, `max_new_tokens=45`, `repetition_penalty=1.1`, `pad_token_id=tokenizer.eos_token_id` | Greedy decoding, so any change you see comes from the vector and not from sampling noise. |

### Three things that look like details and are not

**1. `pip install repeng` is broken, and this is not a Kaggle problem.**
PyPI's newest release is **0.4.0** (December 2024); GitHub is on **0.5.0** (September 2025). 0.4.0
does not merely lag — it fails at *import* on NumPy 2:

```
AttributeError: `np.float_` was removed in the NumPy 2.0 release. Use `np.float64` instead.
  repeng/extract.py:230  def __mul__(self, other: int | float | np.int_ | np.float_)
```

Every current environment ships NumPy 2, so the published package will not import anywhere. Tracked
upstream as [issue #76](https://github.com/vgel/repeng/issues/76). Beyond the NumPy fix, 0.5.0 also
adds the layer-discovery search that handles Qwen, Gemma and Llama, plus attribute forwarding on the
wrapper. The notebook's install cell checks for a 0.5.0-only *attribute* rather than trusting a
version string, because a stale 0.4.0 sitting in the base image would otherwise be used silently.

**2. Two install paths, two different failure modes.**

| Path | Needs | Fails when |
|---|---|---|
| **Internet ON** (`git+https://…`) | Kaggle → Settings → Internet enabled (requires phone verification on your account) | Your account isn't verified, or you're in a competition that forbids internet |
| **Internet OFF** (offline wheels) | The wheels uploaded as a Kaggle Dataset **and** the model added as a notebook input | You forget the model — repeng installs fine, then `from_pretrained` tries to reach Hugging Face and hangs |

With internet off you need the model locally too. `qwen-lm/qwen2.5` exists on Kaggle Models with
Transformers-format variations, but **the exact variation slug for the 0.5B instruct build was not
verified while writing this sheet** — check it on the model page before relying on the offline path,
and fall back to internet-on if it isn't there.

**3. Why a formality axis and not the repository's happy/sad example.**
The repo's headline example works, but on this model it makes a poor *first* measurement, for two
reasons that only showed up on a real run: the positive end code-switches into Chinese, and the
negative end doesn't write gloomier pitches — it leaves the task entirely for a distressed or
refusing register, surfacing upsetting content unprompted at larger magnitudes. Both are genuine,
reportable properties of steering an instruction-tuned model, and Exercise 8 invites you to go look
at them deliberately. They are just bad conditions for learning to read a strength sweep. The
formality axis stays in English, stays on task, and degrades symmetrically.

### What was and wasn't tested

Everything below ran on **Qwen2.5-0.5B-Instruct, CPU, float32, transformers 5.14.1, repeng 0.5.0**,
in a 2-core container. Your text should be close but need not match character for character — see
Exercise 5 for exactly why. Two things are **untested** and flagged again where they matter: the GPU
path, and any model larger than 0.5B.

---

## Exercise 1 — Get a vector, and confirm it does something

*Lecture reference: slides 14 (training walkthrough) and 20 (setup).*

Run the notebook top to bottom through **section 5**. Change nothing yet.

Record: the reported training time, the number of layers that got a direction, and the number of
layers you actually wrapped.

Measured: **60.6 s**, **23** directions (layers 1–23), **10** wrapped layers (11–20), 125 training
pairs from 64 raw suffixes.

**What to notice.** The direction count and the wrapped count are different numbers, and the gap is
not an accident. That asymmetry is what makes Exercise 4 cost nothing.

**Reflect:** Before running it, what did you expect `train()` to compute directions for? If you
expected only the wrapped layers, what does the real behaviour tell you about where repeng draws the
line between *extracting* a representation and *using* one?

---

## Exercise 2 — Find the strength band, from both ends

*Lecture reference: slide 16 (`coeff`); the failure mode on slide 21.*

Run **sections 5 and 6**. Prompt throughout: `"Give me a one-sentence pitch for a TV show."`

Measured:

| Strength | What came out | Verdict |
|---|---|---|
| −3.0 | *"Hey ya! I got so much fun on my day? What's up? I gotta have a new chick in the house? yaaah!"* | Broken — casual register has eaten the grammar |
| −2.0 | *"Hey everyone! What's so fun about being super duper cool? I got this new job at the mall…"* | Fluent, but no longer pitching anything |
| −1.0 | *"Hey everyone! What's up? I'm so excited to be on the big screen with you! We got some new episodes coming out soon…"* | **Usable** — casual *and* on task |
| 0.0 | *"Discover the hidden world of extraordinary stories and characters through an immersive, interactive series…"* | Baseline |
| +1.0 | *"An immersive and critically acclaimed television series that explores the intersection of historical, cultural, and contemporary narratives…"* | **Usable** — formal and on task |
| +2.0 | *"The creation and dissemination of the aforementioned text is hereby acknowledged. Given the complexity and sensitivity of the task, it is inappropriate to…"* | Legalese; task abandoned |
| +3.0 | *"The submission herein specifically acknowledges the infringement and subsequent violation of the aforementioned legal entity…"* | Legal boilerplate, no pitch at all |

The usable band is roughly **−1 to +1**, and it is narrower than it looks: at ±2 the model is still
producing perfectly grammatical English, just answering a different question. Fluency is not the
thing that breaks first.

Now re-run **+3.0 with `normalize=True`**. Measured, it produced more legal boilerplate
(*"The submission herein shall ascertain the submission in accordance with the stipulated criteria…"*)
— **no rescue**. `normalize` controls the activation's *length*; what has gone wrong at ±3 is its
*direction*.

**Reflect:** The failure mode here is task abandonment while fluency is intact. If you were
monitoring a steered model in production and could only log one automatic metric, would perplexity
catch this? Name a metric that would.

---

## Exercise 3 — Break it with the wrong dialect

*Lecture reference: slide 18; background slide 6 (chat templates).*

This is the exercise that matters most, because it is the mistake that costs people days.

The repository's real `make_dataset()` lives in `notebooks/experiments.ipynb`, not the README, and
wraps every training string in Mistral's `[INST] … [/INST]` markers with the shared ending placed
*after* the assistant marker. Copy that verbatim onto a Qwen model and nothing raises.

Run **section 7**, which trains a second vector on identical personas and identical suffixes, wrapped
the wrong way.

Measured:

- Training string: `'[INST] Write in an extremely formal and academic style. [/INST] Hmm'`
- **Baseline, no vector at all**: `[INSTRUCTION] Your pitch should be concise… [/INST] [EXPLORE] The
  show will explore the history of technology in` — the model is emitting the markers as content,
  because to it they *are* content.
- At −1.5 the reply came back with `[INST]` spliced through the middle of it.
- Cosine between the wrong-marker and correct-marker vectors at layer 16: **+0.701**.

For comparison, on a separate concept pair, the cosine between "hand-built markers with no system
turn" and "whatever `apply_chat_template` produces by default" — which silently inserts
`You are Qwen, created by Alibaba Cloud…` — was **0.95**. Close, but not the same vector. Even the
*right* markers give you a different direction depending on what else the template put in.

**Reflect:** Nothing errored, and the wrong-marker vector still *steered* — the outputs did change
with strength. If you had only checked "does the strength dial do something," you'd have shipped it.
What is the cheapest check you could add to a training script that would catch this **before**
generating any text at all?

---

## Exercise 4 — Aim the same vector at different depths

*Lecture reference: slide 17 (layer targeting); background slide 7 (depth as a band).*

Run **section 8**. It re-wraps the model for each band and reuses the Exercise 1 vector — no
retraining, because you already have a direction for every layer.

First, on paper: work out what `list(range(-5, -18, -1))` resolves to on a 24-layer model and what
fraction of the depth that is. Compare with the 47%–84% band it means on Mistral-7B's 32 layers.
(Answer in the notebook output: **7–19, i.e. 29%–79%**. The depth-matched band is **11–20**.)

Measured, one vector, ±1.5 throughout:

| Band | Layers | −1.5 | +1.5 |
|---|---|---|---|
| **depth-matched** | 11–20 | casual **and still pitching a show** | formal and still on topic |
| late only | 16–23 | on task, but the shift reads as genre not register | on task, formal-ish |
| README range, copied | 7–19 | casual, drifting off task | derails into meta-commentary about the prompt |
| early only | 1–7 | barely moved from baseline | **refuses**: *"I will not provide a one-sentence pitch as I am an AI system…"* |
| all layers | 1–23 | degraded: *"Wanna come play with ya?!???!?"* | legal boilerplate, task gone |
| single mid layer | 12 | near-indistinguishable from baseline | near-indistinguishable from baseline |

Two things are worth sitting with. **"All layers" is worse than a ten-layer band at the same
coefficient** — more coverage is not more control. And the **early band produced an outright refusal
on the positive side** while barely moving on the negative side: a band can be not just weak but
*asymmetrically* weird.

**Reflect:** Write down what the "all layers" row implies about the relationship between `coeff` and
the number of wrapped layers. If you had to expose exactly *one* strength control to a user of your
own tool, which would you pick, and what would you give up?

---

## Exercise 5 — Is any of this reproducible?

*Lecture reference: slide 21; [issue #78](https://github.com/vgel/repeng/issues/78).*

Run **section 9**. It prints which SVD solver scikit-learn actually selected, then trains the same
dataset twice and compares.

Measured:

- Solver selected: **`randomized`**. `read_representations()` calls `PCA(n_components=1,
  whiten=False)`; the default `svd_solver="auto"` picks the randomised algorithm at the matrix shapes
  transformer activations produce. No `random_state` is set anywhere in the library.
- Bit-identical across two runs: **False**.
- Cosine per layer: **1.0000 at every one of the 23 layers**, to four decimal places.

**Read the second and third results together.** The arrays genuinely differ, and yet the direction is
stable to four decimals. Issue #78 reports that on *weak* concepts the direction itself diverges,
with cosine as low as 0.5. **That divergence was not reproduced here** — not on this model, this
concept, or this dataset size. That does not make the report wrong; it means the reference setup
isn't a case that exhibits it.

So this exercise has an open part. Try to build a dataset where the two runs *do* disagree.
Suggestions: drop `N_RAW_SUFFIXES` to 4; or use a persona pair that is barely an opposition at all
(`"a person"` vs `"an individual"`). Record the lowest cosine you achieve and what produced it. A
negative result is a real result — write it down either way.

**Reflect:** "Not bit-identical, but cosine 1.0000" — does that matter for your work? Name one
situation where it clearly doesn't and one where it clearly does. Then say which of the two you think
describes most published work using this technique.

---

## Exercise 6 — The two methods disagree

*Lecture reference: slide 16 (`method`); background slide 4 (PCA centres its input);
[issue #77](https://github.com/vgel/repeng/issues/77).*

Run **section 10**, which trains the same dataset with the default `pca_diff` and compares against
the `pca_center` vector you already have.

Measured, per-layer cosine between the two:

- Across all 23 layers: **+0.152 to +0.838**.
- Within the wrapped band, layers 11–20: **+0.246 to +0.762** — lowest at layer 16, highest at 14.

Both vectors steer, both produce sensible output, and neither is the same direction as the other.

> On a *different* concept pair (happy/sad) the same comparison ranged from **−0.937 to +0.920** —
> i.e. at some depths the two methods pointed in nearly *opposite* directions. So how much the two
> methods disagree is itself concept-dependent. Do not generalise from one run.

Now connect this to background slide 4. PCA subtracts the mean before it looks for spread. `pca_diff`
hands it a matrix of pair *differences*, so the average difference — where a cleanly separated
concept actually lives — is removed before the search starts. `pca_center` removes each pair's own
midpoint and keeps both sides, so the between-group structure survives. Our dataset varies on both
sides, the friendly case; issue #77 describes the hostile one, where one side of every pair is held
constant.

**Reflect:** Given the above, why do you think `pca_diff` is still the default? Argue the maintainer's
side before you argue against it.

---

## Exercise 7 — Compose and export

*Lecture reference: slide 19.*

Run **section 11**. Confirm three things yourself: that `concept + second` produces output visibly
unlike either alone, that `(v + v) / 2 == v` returns `True`, and that a GGUF round trip compares
equal.

Measured: the export was **83,616 bytes**, `import_gguf` returned a vector comparing **equal**, and
the stored `model_hint` was `qwen2`. Note also that `concept + second` (formality plus a laziness
vector) produced *task refusal* — `"The provided text contains no information relevant to the task…"`
— which neither component does on its own at that strength.

Then try `concept - second` and predict the result before you look.

**Reflect:** Addition here is elementwise on per-layer arrays, with no check that the two concepts are
independent — and you just saw the sum do something neither addend does. What could go wrong when you
add two vectors whose directions are highly correlated, and how would you detect it *before*
generating anything?

---

## Exercise 8 — Your own concept, and two controls that should fail

*Lecture reference: slides 3 and 13.*

**(a)** Design a contrast pair for a concept of your own — something that isn't a writing register.
Train it and find its usable strength band the way you did in Exercise 2.

**(b)** Run a deliberate negative control: build a dataset where the positive and negative personas
are **identical strings**. Train it. Apply it at ±2.0. Write down what you expected and what happened.

**(c)** Now go look at the messy case the notebook's default avoids. Swap the config to the
repository's own `"happy"` / `"joyous"` vs `"sad"` / `"depressed"` and re-run the strength sweep and
the band sweep.

> **Before you do (c):** on this model the negative end of that vector pulls the model out of the task
> and into a distressed or refusing register — at −1.5 on the depth-matched band it produced a pitch
> about *"mental health issues that can lead to suicide"*, unprompted, from a question about TV shows.
> The positive end code-switches into Chinese from +1.0 onward. Both are expected. If you'd rather not
> generate that material, skip (c) and answer the reflection from the transcript above instead.

**Reflect:** A negative control that "looks fine" is a problem, not a relief. If the degenerate vector
in (b) still changed the output, what does that tell you about how much of the steering you observed
in your *real* vectors is attributable to the concept you named? And in (c): the happy/sad vector
changed the model's *language* and its *safety posture*, neither of which is "emotion." What is that
vector actually a direction for?

---

## Settings cheat-sheet

| Goal | `N_RAW_SUFFIXES` | `method` | Band | Notes |
|---|---|---|---|---|
| Fast sanity check | 32 | `pca_center` | depth-matched | ~65 pairs, about 30 s on CPU |
| Default working setup | 64 | `pca_center` | depth-matched | 125 pairs, **60.6 s measured** on 2 CPU cores |
| Sharper vector | 128+ | `pca_center` | depth-matched | ~250 pairs, about 120 s; scales roughly linearly in pairs |
| Two personas per side | 64 | `pca_center` | depth-matched | Doubles the pairs and the time — 250 pairs took 126 s |
| Reproducing the repo's defaults | 64 | `pca_diff` | `range(-5, -18, -1)` | For comparison only; Exercises 4 and 6 show why neither is best here |
| Subtle effect, maximum fluency | 64 | `pca_center` | single mid layer | Weakest steering, least collateral damage |
| Deliberately over-steering | 64 | `pca_center` | all layers | To see the failure mode on purpose |

*CPU timings are from a 2-core container running float32. A Kaggle CPU session has more cores and
should be faster. GPU timings were not measured.*

---

## Overall Reflection

Across these exercises the same nominal concept changed meaning three separate ways without you ever
changing the concept: by rewrapping the prompts (Ex. 3), by moving the layer band (Ex. 4), and by
switching the PCA method (Ex. 6). Each is a knob the library exposes, and each has a default the
reference setup had to override.

Write a paragraph on what you now think a control vector is *evidence of*. Not what it does — what
its existence licenses you to claim about the model. Be specific about which of the three
sensitivities above most weakens that claim, and what a stronger version of the experiment would have
to look like to survive it.
