"""Generate repeng_kaggle.ipynb — a notebook that runs unchanged on Kaggle (CPU or GPU),
Colab, or a laptop."""
import json, pathlib

def _lines(s):
    """nbformat wants each source line to keep its trailing newline."""
    return s.strip("\n").splitlines(keepends=True)

md = lambda s: {"cell_type": "markdown", "metadata": {}, "source": _lines(s)}
code = lambda s: {"cell_type": "code", "execution_count": None, "metadata": {},
                  "outputs": [], "source": _lines(s)}

cells = []

cells.append(md(r"""
# repeng on free compute — control vectors, start to finish

**AI Seminar · Lecture 3 · companion notebook**

Trains a control vector with [`repeng`](https://github.com/vgel/repeng) (Theia Vogel, MIT) and
steers a live model with it. Runs on **CPU or GPU** — the default model trains a vector in about a
minute on CPU, so the free CPU tier is enough and you do not need to spend GPU quota.

**Accelerator:** Kaggle → *Settings → Accelerator*. `None` is fine. `GPU T4 x2` lets you raise
`MODEL_NAME` to something larger.

**Internet:** Kaggle → *Settings → Internet*. If **on**, everything below downloads itself.
If **off**, see the install cell — you need the offline wheels dataset plus the model added as an
input.

Sections 6–11 are the graded exercises from `repeng_assignment.md`.
"""))

cells.append(md("## 0 · Install\n\n`pip install repeng` gets **0.4.0** from PyPI, which crashes on import under NumPy 2 (`np.float_` was removed). Every modern environment ships NumPy 2, so we install **0.5.0** — from the offline wheels if they are mounted, otherwise straight from the repository."))

cells.append(code(r'''
import importlib, os, subprocess, sys, glob

def sh(*args):
    print("$", " ".join(args))
    subprocess.run(args, check=True)

def repeng_ok():
    """0.5.0 has ControlModule.__getattr__; 0.4.0 does not and breaks on NumPy 2."""
    try:
        import repeng
        from repeng.control import ControlModule
        return hasattr(ControlModule, "__getattr__")
    except Exception:
        return False

if repeng_ok():
    print("repeng already importable")
else:
    # 1) offline wheels mounted as a Kaggle dataset (works with Internet OFF)
    wheel_dirs = [d for d in glob.glob("/kaggle/input/*") if glob.glob(os.path.join(d, "repeng-*.whl"))]
    wheel_dirs += [d for d in ["./offline-wheels", "../offline-wheels"] if glob.glob(os.path.join(d, "repeng-*.whl"))]
    if wheel_dirs:
        d = wheel_dirs[0]
        print("installing from offline wheels:", d)
        try:
            sh(sys.executable, "-m", "pip", "install", "-q", "--no-index", f"--find-links={d}", "repeng")
        except subprocess.CalledProcessError:
            # preinstalled versions can upset the resolver; take the wheels verbatim
            sh(sys.executable, "-m", "pip", "install", "-q", "--no-index",
               f"--find-links={d}", "--no-deps", "repeng", "gguf")
    else:
        print("no offline wheels found — installing from GitHub (needs Internet ON)")
        sh(sys.executable, "-m", "pip", "install", "-q", "git+https://github.com/vgel/repeng.git")

    for m in ("repeng", "repeng.control", "repeng.extract"):
        sys.modules.pop(m, None)
    importlib.invalidate_caches()

import repeng, importlib.metadata as md_
print("repeng", md_.version("repeng"), "| 0.5.0 API present:", repeng_ok())
'''))

cells.append(code(r'''
import json, math, time, contextlib, io, urllib.request
import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from repeng import ControlVector, ControlModel, DatasetEntry

print("torch", torch.__version__, "| cuda:", torch.cuda.is_available())
import transformers; print("transformers", transformers.__version__)
'''))

cells.append(md(r"""
## 1 · Configuration

`MODEL_NAME` is a small instruct model that behaves well on CPU. On a GPU session you can raise it —
`Qwen/Qwen2.5-1.5B-Instruct` is a drop-in swap, and `mistralai/Mistral-7B-Instruct-v0.1` is the
README's own example (ungated, ~15 GB in fp16, needs the GPU).

`N_RAW_SUFFIXES` is the main runtime dial. Each raw suffix expands into one training row per token
prefix, so 64 raw suffixes becomes a few hundred pairs.
"""))

cells.append(code(r'''
MODEL_NAME     = "Qwen/Qwen2.5-0.5B-Instruct"
N_RAW_SUFFIXES = 64        # 32 = fast sanity check · 64 = default · 128+ = sharper vector, slower
BATCH_SIZE     = 32        # lower this if you run out of memory

# The concept to extract. One template, one persona on each side.
TEMPLATE           = "Write in an extremely {persona} style."
POSITIVE_PERSONAS  = ["formal and academic"]
NEGATIVE_PERSONAS  = ["casual and chatty"]

# Alternatives worth trying later (both from the repository's own notebooks):
#   TEMPLATE = "Act as if you're extremely {persona}."
#   POSITIVE_PERSONAS, NEGATIVE_PERSONAS = ["happy", "joyous"], ["sad", "depressed"]
#   POSITIVE_PERSONAS = ["lazy, giving bare-minimum short responses on a task"]
#   NEGATIVE_PERSONAS = ["hardworking, going above and beyond on a task"]

USE_GPU = torch.cuda.is_available()
DEVICE  = "cuda" if USE_GPU else "cpu"
DTYPE   = torch.float16 if USE_GPU else torch.float32
print(f"device={DEVICE} dtype={DTYPE}")
'''))

cells.append(md("## 2 · Load the model\n\n`ControlModel` **mutates the model you hand it** — it swaps the chosen decoder blocks for wrappers in place. Re-running this cell reloads from scratch, which is the safe way to start over."))

cells.append(code(r'''
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
if tokenizer.pad_token_id is None:
    tokenizer.pad_token_id = tokenizer.eos_token_id

base_model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, dtype=DTYPE).to(DEVICE)
N_LAYERS   = base_model.config.num_hidden_layers
print(f"{MODEL_NAME}: {N_LAYERS} layers, hidden size {base_model.config.hidden_size}")
'''))

cells.append(md(r"""
### Choosing the layer band

The README wraps `list(range(-5, -18, -1))`. That was chosen for Mistral-7B's **32** layers, where it
means layers 15–27 — **47%–84%** of the way through the network. Negative indices resolve against
*this* model's layer count, so the same literal expression lands somewhere else on a model of a
different depth.

We compute the band that matches Mistral's **depth fraction** instead of copying its integers.
"""))

cells.append(code(r'''
MISTRAL_LAYERS, MISTRAL_BAND = 32, (15, 27)   # what range(-5, -18, -1) means on the README's model

lo = round(MISTRAL_BAND[0] / MISTRAL_LAYERS * N_LAYERS)
hi = round(MISTRAL_BAND[1] / MISTRAL_LAYERS * N_LAYERS)
CONTROL_LAYERS = list(range(hi, lo - 1, -1))

naive = sorted(i if i >= 0 else N_LAYERS + i for i in range(-5, -18, -1))
print(f"README expression on {N_LAYERS} layers -> {naive[0]}..{naive[-1]}"
      f"  ({naive[0]/N_LAYERS:.0%}..{naive[-1]/N_LAYERS:.0%} of depth)")
print(f"depth-matched band       -> {lo}..{hi}"
      f"  ({lo/N_LAYERS:.0%}..{hi/N_LAYERS:.0%} of depth)   <- we use this")

model = ControlModel(base_model, CONTROL_LAYERS)
print("wrapped layers:", sorted(model.layer_ids))
'''))

cells.append(md(r"""
## 3 · Speak the model's dialect

This is the step that most often goes wrong. The repository's `make_dataset()` (in
`notebooks/experiments.ipynb`, **not** the README) wraps every pair in Mistral's `[INST] … [/INST]`
markers and puts the shared ending **after** the assistant marker — so each training string is a
*partial reply*, not a bare sentence.

Copy those markers onto a model from another family and nothing errors: they simply tokenise as
ordinary text and the turn structure vanishes. `chat()` below asks the tokenizer for whatever markers
*this* model was trained on, so it stays correct if you swap `MODEL_NAME`.

Run the cell and read the output carefully — the string that comes back is **longer than what you put
in**.
"""))

cells.append(code(r'''
def chat(user_message: str, assistant_prefill: str = "") -> str:
    """Wrap a user turn in THIS model's own markers, optionally prefilling the reply."""
    s = tokenizer.apply_chat_template(
        [{"role": "user", "content": user_message}],
        tokenize=False, add_generation_prompt=True,
    )
    return s + assistant_prefill

print("correct wrapper for this model:")
print(repr(chat("Give me a one-sentence pitch for a TV show.", "I")))
print()
print("what copying the README's markers would give instead:")
print(repr("[INST] Give me a one-sentence pitch for a TV show. [/INST] I"))
'''))

cells.append(md(r"""
> **The default system turn.** Qwen's template inserts `You are Qwen, created by Alibaba Cloud…`
> when you don't supply a system message — text you never wrote, now in every training string. That
> is *acceptable* only because **training strings and inference prompts both go through the same
> function**. It is not harmless: a vector trained with that system turn present is measurably not
> the same vector as one trained without it (Exercise 3 puts a number on it). The rule to take away
> is not "always use `apply_chat_template`" — it is **"whatever you wrap training in, wrap inference
> in identically."**
"""))

cells.append(md("## 4 · Build the contrast dataset\n\nEach raw suffix is expanded into every token-prefix of itself — one sentence becomes a dozen training rows for free. Both sides of a pair get the *same* suffix, so the persona is the only thing that differs."))

cells.append(code(r'''
FALLBACK_SUFFIXES = [
    "I", "I think", "That", "That is", "Well", "Well, the", "It", "It seems", "Here", "Here is",
    "You", "You could", "The", "The thing", "Sure", "Sure, I", "Let", "Let me", "One", "One way",
    "This", "This looks", "There", "There are", "My", "My first", "We", "We should", "So", "So the",
    "Honestly", "Honestly, the", "Right", "Right now", "Actually", "Actually, I", "Maybe",
    "Maybe we", "Look", "Look at", "First", "First of all", "Okay", "Okay, so", "Yes", "Yes, and",
    "Imagine", "Imagine a", "Picture", "Picture this", "Consider", "Consider what", "Once",
    "Once you", "Every", "Every time", "Nothing", "Nothing about", "Something", "Something in",
    "Today", "Today I", "Tomorrow", "Tomorrow we", "Everyone", "Everyone knows", "Nobody",
    "Nobody really", "Sometimes", "Sometimes it", "Often", "Often the", "Rarely", "Rarely does",
    "Between", "Between us", "After", "After all", "Before", "Before we", "Because", "Because of",
    "Although", "Although it", "Whenever", "Whenever I", "Since", "Since then", "While", "While the",
]

def load_raw_suffixes():
    """Prefer the repository's own suffix list; fall back to a built-in one when offline."""
    for p in ("./data/all_truncated_outputs.json",
              "../notebooks/data/all_truncated_outputs.json",
              "/kaggle/input/repeng-data/all_truncated_outputs.json"):
        try:
            with open(p) as f:
                print("suffixes from", p)
                return json.load(f)
        except OSError:
            pass
    try:
        url = ("https://raw.githubusercontent.com/vgel/repeng/main/"
               "notebooks/data/all_truncated_outputs.json")
        with urllib.request.urlopen(url, timeout=10) as r:
            print("suffixes downloaded from the repository")
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"offline ({type(e).__name__}) — using the built-in fallback list")
        return FALLBACK_SUFFIXES

raw_suffixes = load_raw_suffixes()[:N_RAW_SUFFIXES]

suffixes = [
    tokenizer.convert_tokens_to_string(toks[:i])
    for toks in (tokenizer.tokenize(s) for s in raw_suffixes)
    for i in range(1, len(toks))
] or list(raw_suffixes)          # single-token suffixes produce no prefixes

def make_dataset(template, positive_personas, negative_personas, suffix_list):
    out = []
    for suffix in suffix_list:
        for pos, neg in zip(positive_personas, negative_personas):
            out.append(DatasetEntry(
                positive=chat(template.format(persona=pos), suffix),
                negative=chat(template.format(persona=neg), suffix),
            ))
    return out

concept_dataset = make_dataset(TEMPLATE, POSITIVE_PERSONAS, NEGATIVE_PERSONAS, suffixes)
print(f"\n{len(raw_suffixes)} raw -> {len(suffixes)} truncated -> {len(concept_dataset)} pairs")
print("\nexample positive:\n", repr(concept_dataset[3].positive))
print("\nexample negative:\n", repr(concept_dataset[3].negative))
'''))

cells.append(md("## 5 · Train the vector\n\n`ControlVector.train()` computes a direction for **every** layer, not only the wrapped ones — so one trained vector can be re-aimed at any depth later without retraining."))

cells.append(code(r'''
t0 = time.time()
concept_vector = ControlVector.train(
    model, tokenizer, concept_dataset, method="pca_center", batch_size=BATCH_SIZE,
)
print(f"\ntrained in {time.time() - t0:.1f}s on {DEVICE}")
print(f"directions for {len(concept_vector.directions)} layers "
      f"({min(concept_vector.directions)}..{max(concept_vector.directions)}), "
      f"each shape {concept_vector.directions[min(concept_vector.directions)].shape}")
print("model_type:", concept_vector.model_type)
'''))

cells.append(md(r"""
> **A note on the concept we chose, and the one we didn't.** The repository's headline example is
> `"happy"` / `"sad"`. It steers cleanly, but on an *instruction-tuned* model its negative end does
> not write gloomier pitches — it pulls the model out of the task entirely and into a
> distressed-or-refusing register, and at larger magnitudes it surfaces upsetting content unprompted.
> On this particular model the positive end also code-switches into Chinese, which muddles the thing
> you are trying to observe.
>
> Neither of those is a bug; both are real, reportable properties of the technique. But they make a
> poor first measurement, so the default here is a formality axis instead: it stays in English, stays
> on task, and degrades symmetrically. Run `"happy"` / `"sad"` afterwards if you want to see the
> messier behaviour — the swap is two lines in the config cell.
"""))

cells.append(code(r'''
PROMPT = "Give me a one-sentence pitch for a TV show."

def generate(vector, coeff, prompt=PROMPT, max_new_tokens=45, **control_kwargs):
    model.reset()
    if vector is not None:
        model.set_control(vector, coeff, **control_kwargs)
    ids = tokenizer(chat(prompt), return_tensors="pt").to(model.device)
    out = model.generate(**ids, do_sample=False, max_new_tokens=max_new_tokens,
                         repetition_penalty=1.1, pad_token_id=tokenizer.eos_token_id)
    model.reset()
    return tokenizer.decode(out.squeeze()[ids["input_ids"].shape[1]:],
                            skip_special_tokens=True).strip()

def sweep(vector, strengths, **kw):
    for c in strengths:
        tag = "baseline" if c == 0 else f"{c:+.1f}"
        print(f"--- {tag} " + "-" * (58 - len(tag)))
        print(generate(None if c == 0 else vector, c, **kw), "\n")

sweep(concept_vector, [-2.0, -1.0, 0.0, 1.0, 2.0])
'''))

cells.append(md(r"""
## 6 · Exercise — find the usable strength band

The gap between "no visible effect" and "fluency collapses" is narrow and model-specific. Push past
it and you get the failure mode the author's blog post describes: repetition, then word salad.

Widen the sweep until you can name the number where each side breaks.
"""))

cells.append(code(r'''
sweep(concept_vector, [-3.0, 3.0])

# Same magnitude, but rescaled back to the original activation length.
print("=" * 66)
print("normalize=True at +3.0")
print("=" * 66)
print(generate(concept_vector, 3.0, normalize=True))
'''))

cells.append(md(r"""
## 7 · Exercise — break it with the wrong dialect

The mistake this guards against: copying the repository's `[INST] … [/INST]` markers onto a model
from another family. Nothing raises. The markers just tokenise as ordinary text, the turn structure
disappears, and the vector you get is trained on a different thing than you think.

We train a second vector on the same personas and the same suffixes, wrapped the wrong way, then
compare — by output *and* by cosine similarity. Watch the **baseline** row especially: strength 0
means no vector at all, so anything odd there is the prompt format alone.
"""))

cells.append(code(r'''
def chat_mistral(user_message, assistant_prefill=""):
    """Mistral's markers, applied to whatever model is loaded. Deliberately wrong here."""
    return f"[INST] {user_message} [/INST] {assistant_prefill}"

wrong_dataset = [
    DatasetEntry(positive=chat_mistral(TEMPLATE.format(persona=p), s),
                 negative=chat_mistral(TEMPLATE.format(persona=n), s))
    for s in suffixes for p, n in zip(POSITIVE_PERSONAS, NEGATIVE_PERSONAS)
]
print("wrong-form training string:\n ", repr(wrong_dataset[3].positive), "\n")

wrong_vector = ControlVector.train(model, tokenizer, wrong_dataset,
                                   method="pca_center", batch_size=BATCH_SIZE)

def generate_raw(prompt_str, vector, coeff, max_new_tokens=40):
    model.reset()
    if vector is not None:
        model.set_control(vector, coeff)
    ids = tokenizer(prompt_str, return_tensors="pt").to(model.device)
    out = model.generate(**ids, do_sample=False, max_new_tokens=max_new_tokens,
                         repetition_penalty=1.1, pad_token_id=tokenizer.eos_token_id)
    model.reset()
    return tokenizer.decode(out.squeeze()[ids["input_ids"].shape[1]:],
                            skip_special_tokens=True).strip()

wrong_prompt = chat_mistral(PROMPT)
for c in (-1.5, 0.0, 1.5):
    tag = "baseline" if c == 0 else f"{c:+.1f}"
    print(f"--- wrong markers, {tag} " + "-" * (44 - len(tag)))
    print(generate_raw(wrong_prompt, None if c == 0 else wrong_vector, c), "\n")

mid = sorted(model.layer_ids)[len(model.layer_ids) // 2]
a, b = concept_vector.directions[mid], wrong_vector.directions[mid]
print(f"cosine(correct markers, wrong markers) at layer {mid}: "
      f"{float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))):+.3f}")
'''))

cells.append(md(r"""
## 8 · Exercise — layer targeting

`ControlVector.train()` already gave us every layer. `ControlModel` decides which ones are actually
touched — so we can re-aim the *same* vector at different bands with no retraining.

Watch for two separate things: whether the band steers *at all*, and whether it stays fluent while
doing it.
"""))

cells.append(code(r'''
def rewrap(inner, layer_ids):
    return ControlModel(inner, list(layer_ids))

inner = model.unwrap()          # give back the untouched model

BANDS = {
    "depth-matched": CONTROL_LAYERS,
    "README range, copied": [i if i >= 0 else N_LAYERS + i for i in range(-5, -18, -1)],
    "early only": range(1, N_LAYERS // 3),
    "late only": range(2 * N_LAYERS // 3, N_LAYERS),
    "all layers": range(1, N_LAYERS),
    "single mid layer": [N_LAYERS // 2],
}

for name, ids in BANDS.items():
    ids = [i for i in ids]
    model = rewrap(inner, ids)
    print("=" * 70)
    print(f"{name}  ->  layers {min(model.layer_ids)}..{max(model.layer_ids)} "
          f"(n={len(model.layer_ids)})")
    print("=" * 70)
    for c in (-1.5, 1.5):
        print(f"  [{c:+.1f}]  {generate(concept_vector, c, max_new_tokens=32)}")
    print()
    inner = model.unwrap()

model = rewrap(inner, CONTROL_LAYERS)   # restore the default band
print("restored:", sorted(model.layer_ids))
'''))

cells.append(md(r"""
## 9 · Exercise — is training reproducible?

Open issue [#78](https://github.com/vgel/repeng/issues/78) reports that `ControlVector.train()` is
non-deterministic: `read_representations()` calls `PCA(n_components=1, whiten=False)`, and
scikit-learn's default `svd_solver="auto"` selects the **randomised** solver at the matrix shapes
transformer activations produce — with no seed.

Train the same dataset twice and check for yourself. Record both numbers: whether the arrays are
*bit-identical*, and the *cosine similarity* per layer. They answer different questions.
"""))

cells.append(code(r'''
from sklearn.decomposition import PCA

# which solver does scikit-learn actually choose here?
probe = PCA(n_components=1, whiten=False).fit(
    np.random.randn(len(concept_dataset), base_model.config.hidden_size).astype(np.float32))
print("svd_solver chosen for our matrix shape:", probe._fit_svd_solver)

a = ControlVector.train(model, tokenizer, concept_dataset, method="pca_center", batch_size=BATCH_SIZE)
b = ControlVector.train(model, tokenizer, concept_dataset, method="pca_center", batch_size=BATCH_SIZE)

identical = all(np.array_equal(a.directions[k], b.directions[k]) for k in a.directions)
cos = {k: float(np.dot(a.directions[k], b.directions[k]) /
                (np.linalg.norm(a.directions[k]) * np.linalg.norm(b.directions[k])))
       for k in sorted(a.directions)}

print("\nbit-identical across runs:", identical)
print(f"cosine similarity  min={min(cos.values()):.4f}  max={max(cos.values()):.4f}")
worst = sorted(cos.items(), key=lambda kv: kv[1])[:5]
print("five least-stable layers:", [(k, round(v, 4)) for k, v in worst])
'''))

cells.append(md(r"""
## 10 · Exercise — `pca_diff` vs `pca_center`

The default is `pca_diff`, which fits PCA on pair *differences*. `pca_center` instead removes each
pair's midpoint and keeps both sides. Issue [#77](https://github.com/vgel/repeng/issues/77) argues
`pca_diff` can return a concept-independent axis when one side of every pair is held constant.

Ours varies on both sides, so this is the friendly case — and the two methods **still** disagree.
"""))

cells.append(code(r'''
diff_vector = ControlVector.train(model, tokenizer, concept_dataset,
                                  method="pca_diff", batch_size=BATCH_SIZE)

cos = {k: float(np.dot(concept_vector.directions[k], diff_vector.directions[k]) /
                (np.linalg.norm(concept_vector.directions[k]) *
                 np.linalg.norm(diff_vector.directions[k])))
       for k in sorted(concept_vector.directions)}
print("cosine(pca_center, pca_diff) at the wrapped layers:")
for k in sorted(model.layer_ids):
    print(f"  layer {k:>3}: {cos[k]:+.3f}")
print(f"\nacross all layers: min={min(cos.values()):+.3f} max={max(cos.values()):+.3f}")

print("\n" + "=" * 66 + "\npca_diff, same strengths\n" + "=" * 66)
sweep(diff_vector, [-1.5, 1.5])
'''))

cells.append(md("## 11 · Vector arithmetic and export\n\nControl vectors add, subtract, negate and scale. `export_gguf()` writes a file `llama.cpp` can apply to a quantised model, so the training environment and the serving environment don't have to match."))

cells.append(code(r'''
second_vector = ControlVector.train(
    model, tokenizer,
    make_dataset("Act as if you're extremely {persona}.",
                 ["lazy, giving bare-minimum short responses on a task"],
                 ["hardworking, going above and beyond on a task"], suffixes),
    method="pca_center", batch_size=BATCH_SIZE,
)

print("concept alone      :", generate(concept_vector, 1.5, max_new_tokens=32), "\n")
print("concept + second   :", generate(concept_vector + second_vector, 1.5, max_new_tokens=32), "\n")
print("concept - second   :", generate(concept_vector - second_vector, 1.5, max_new_tokens=32), "\n")
print("(v + v) / 2 == v  ->", ((concept_vector + concept_vector) / 2) == concept_vector)

out_path = "concept.gguf"
concept_vector.export_gguf(out_path)
reloaded = ControlVector.import_gguf(out_path)
print(f"\nexported {os.path.getsize(out_path):,} bytes; round-trip equal:",
      reloaded == concept_vector, "| model_hint:", reloaded.model_type)
'''))

cells.append(md(r"""
## 12 · Your turn

Change **one** thing at a time and note what happens:

1. A different concept — swap the personas in `make_dataset`. Try one that isn't an emotion
   (`"formal"` / `"casual"`, `"concrete"` / `"abstract"`).
2. `N_RAW_SUFFIXES` — does a bigger dataset give a cleaner vector, or just a slower run?
3. A degenerate dataset — make the positive persona identical to the negative one. What does the
   vector do, and what *should* it do?
4. `operator=` on `set_control` — the default is addition. Try
   `operator=lambda cur, ctl: cur - ctl` and predict the result before you run it.

Answers go in `repeng_assignment.md`.
"""))

nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11"},
    },
    "nbformat": 4, "nbformat_minor": 5,
}
pathlib.Path("repeng_kaggle.ipynb").write_text(json.dumps(nb, indent=1))
print("wrote repeng_kaggle.ipynb with", len(cells), "cells")
