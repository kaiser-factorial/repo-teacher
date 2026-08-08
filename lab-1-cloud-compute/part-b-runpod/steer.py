#!/usr/bin/env python3
"""
steer.py — a tiny repeng steering demo for Lab 1 Part B (RunPod).

Trains a control vector on Mistral-7B, generates baseline vs. steered text, and
saves a data-histogram + the results to ./outputs/.

>>> This script runs fine on a normal dev machine, but on a FRESH RunPod pod it
    will break TWICE, on purpose. Work through runpod_assignment.md — the fixes
    are documented there. Don't "fix" it before you've seen it break.

Two planted breaks:
  * BREAK 1 (silent) — the histogram uses plt.show(), which draws nothing on a
    headless box. You get no plot and no file, and it's easy to miss.
  * BREAK 2 (hard crash) — Mistral-7B is GATED on Hugging Face, so the download
    fails on a fresh pod with no token.

Bonus break (opt-in): see the torch_dtype line in load_model().

Runs two ways:
  * Manually:  THEME=playful_vs_serious python steer.py
  * Under opbdh (see the assignment appendix): opbdh sets OPBDH_MODEL_ID and
    OPBDH_RESULTS_DIR, which this script honors so results sync home. Defaults
    below preserve the manual flow (and both planted breaks) unchanged.
"""
import json
import os
from pathlib import Path

import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "datasets"          # shared themes live at the lab root
# Under opbdh, write to OPBDH_RESULTS_DIR so outputs sync home; else ./outputs.
OUT = Path(os.environ.get("OPBDH_RESULTS_DIR", str(HERE / "outputs")))
OUT.mkdir(parents=True, exist_ok=True)

THEME = os.environ.get("THEME", "playful_vs_serious")
# opbdh passes the model via OPBDH_MODEL_ID (--model); default keeps the manual demo.
MODEL = os.environ.get("OPBDH_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.1")   # gated on HF — see BREAK 2
USER_TAG, ASST_TAG = "[INST]", "[/INST]"


def peek_at_data():
    """Quick look at the suffix corpus before we train."""
    suffixes = json.load(open(DATA / "all_truncated_outputs.json"))
    lengths = [len(s) for s in suffixes]
    plt.figure()
    plt.hist(lengths, bins=20)
    plt.title(f"suffix char-lengths — {THEME}")
    plt.xlabel("characters")
    plt.ylabel("count")
    # BREAK 1: on a headless pod this shows nothing and saves nothing.
    # Fix (assignment B5): switch matplotlib to the "Agg" backend at the top of
    # the file and replace this with plt.savefig(OUT / "suffix_lengths.png").
    plt.show()
    return suffixes


def load_model():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from repeng import ControlModel

    # BREAK 2: this line hits Hugging Face for a GATED repo. On a fresh pod with
    # no token it raises a gated-repo / 401 error. Fix (assignment B4): authenticate
    # on the pod — `huggingface-cli login`, or set the HF_TOKEN env var — after
    # accepting the model license on huggingface.co.
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    tokenizer.pad_token_id = 0

    # BONUS break (opt-in): delete `torch_dtype=torch.float16` to load in fp32
    # (~28 GB) and watch it CUDA-OOM on a modest GPU. Fix: put fp16 back, or pick
    # a bigger GPU. (See assignment "Bonus".)
    model = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float16).to("cuda:0")
    model = ControlModel(model, list(range(-5, -18, -1)))
    return model, tokenizer


def make_dataset(tokenizer, theme, suffixes):
    from repeng import DatasetEntry
    truncated = [
        tokenizer.convert_tokens_to_string(tokens[:i])
        for tokens in (tokenizer.tokenize(s) for s in suffixes[:128])
        for i in range(1, len(tokens))
    ]
    ds = []
    for suffix in truncated:
        for pos, neg in zip(theme["positive_personas"], theme["negative_personas"]):
            ds.append(DatasetEntry(
                positive=f"{USER_TAG} {theme['template'].format(persona=pos)} {ASST_TAG} {suffix}",
                negative=f"{USER_TAG} {theme['template'].format(persona=neg)} {ASST_TAG} {suffix}",
            ))
    return ds


def main():
    from repeng import ControlVector

    theme = json.load(open(DATA / f"{THEME}.json"))
    suffixes = peek_at_data()

    model, tokenizer = load_model()
    dataset = make_dataset(tokenizer, theme, suffixes)
    model.reset()
    vector = ControlVector.train(model, tokenizer, dataset)

    prompt = f"{USER_TAG} {theme['suggested_prompt']} {ASST_TAG}"
    ids = tokenizer(prompt, return_tensors="pt").to(model.device)
    gen = dict(pad_token_id=tokenizer.eos_token_id, do_sample=False,
               max_new_tokens=100, repetition_penalty=1.1)

    out_lines = []
    model.reset()
    out_lines.append("== baseline ==\n" + tokenizer.decode(model.generate(**ids, **gen)[0], skip_special_tokens=True))
    model.set_control(vector, 1.5)
    out_lines.append("== + control ==\n" + tokenizer.decode(model.generate(**ids, **gen)[0], skip_special_tokens=True))
    model.set_control(vector, -1.5)
    out_lines.append("== - control ==\n" + tokenizer.decode(model.generate(**ids, **gen)[0], skip_special_tokens=True))
    model.reset()

    (OUT / "generations.txt").write_text("\n\n".join(out_lines))
    vector.export_gguf(str(OUT / "control_vector.gguf"))
    print("Wrote:", [p.name for p in OUT.iterdir()])


if __name__ == "__main__":
    main()
