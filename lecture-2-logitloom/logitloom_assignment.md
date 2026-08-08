# Go Loom Something: A LogitLoom Practice Assignment

**Goal:** get hands-on with vgel.me/logitloom using prompts specifically chosen to make each lecture concept visible in the tree — not just "try some stuff and see."

Do these roughly in order. Each exercise names the setting to use and what you should actually notice — answer the reflection prompt right after each one while it's fresh.

---

## 0. Setup Recap

From the [README](https://github.com/vgel/logitloom#readme) — set these up as saved presets so you can flip between them quickly (Edit Presets in the tool).

**Chat / instruct preset**
| Field | Value |
|---|---|
| Base URL | `https://api.deepseek.com/beta` |
| API Key | from platform.deepseek.com/api_keys |
| Model | `deepseek-chat` |
| Type | `chat` |

*(Not `deepseek-r1` — it doesn't return logprobs.)*

**Base model preset**
| Field | Value |
|---|---|
| Base URL | `https://api.hyperbolic.xyz/v1` |
| API Key | from app.hyperbolic.xyz/settings |
| Model | `meta-llama/Meta-Llama-3.1-405B` |
| Type | `base` |

One thing to keep straight while you work: on the **chat** preset, what you type in the **Prompt** box is a user message — the model responds as an assistant, starting a fresh reply. It does *not* literally continue your text. On the **base** preset, Prompt and Prefill are just concatenated raw text — the model is simply continuing whatever string you gave it, with no "turns" at all.

So a fragment like `2 + 2 =` or `My favorite color is` is a natural **base-model** prompt (it's just text to continue), but on the **chat** preset it's a slightly odd user message — the assistant will treat it as something to respond *to*, not something to finish.

There's a third option, and it's worth knowing about early: LogitLoom's chat mode also has a separate **Prefill** box, which seeds the *start* of the assistant's turn. If you put a real question in Prompt and leave Prefill empty, you get a normal assistant reply. If you put a fragment like `My favorite color is` in **Prefill**, the assistant is forced to continue that exact phrase, verbatim — giving you base-model-style completion behavior, on a chat model. We'll use both patterns below, and Exercise 2 shows the difference directly.

---

## 1. Warm-Up: Confirm It's Actually Working

**Preset:** chat &nbsp;&nbsp;**Depth:** 8 &nbsp;&nbsp;**Max children:** 3 &nbsp;&nbsp;**Top P:** 100

**Prompt:** `What is the capital of France?`

Hit Run. You should get a small, mostly-boring tree that converges hard on "Paris" somewhere in the assistant's reply. If you see logprobs and a tree at all, your setup works — move on. If nothing renders, double check the API key and that you picked `deepseek-chat`, not `deepseek-r1`.

---

## 2. Reading the Tree: Certainty vs. Uncertainty

This is the exercise for building intuition on what a logprob distribution *feels like* when you can see it — and for seeing the Prompt-vs-Prefill distinction in action.

**2.1 — A near-certain question (chat)**
**Preset:** chat &nbsp;&nbsp;**Depth:** 6 &nbsp;&nbsp;**Max children:** 4 &nbsp;&nbsp;**Top P:** 100
**Prompt:** `What is 2 + 2?` &nbsp;&nbsp;**Prefill:** *(leave empty)*

Look at the probability on the top token of the assistant's reply. It should be extremely high (often >95%), with alternatives trailing off fast.

**2.2 — A genuinely open question (chat)**
Same settings. **Prompt:** `What's your favorite color?` &nbsp;&nbsp;**Prefill:** *(leave empty)*

Compare the top token's probability here to 2.1. It'll likely still be fairly peaked — but watch *what* it's peaked around. A chat-tuned model often has a trained, near-default disclaimer here ("I don't have personal preferences, but...") rather than genuine uncertainty spread across colors. That's a different kind of "certainty" than 2.1's — it's confidence about which *canned response pattern* to use, not confidence about a fact. Worth noting which one you're actually looking at.

**2.3 — Forcing a literal completion, on the chat model, via Prefill**
Same settings. **Prompt:** `Finish my sentence.` &nbsp;&nbsp;**Prefill:** `My favorite color is`

Now the assistant is forced to continue that exact fragment verbatim instead of responding to it — this is the base-model-style completion behavior from 2.2's *intent*, but produced correctly on a chat model via the mechanism actually built for it. Compare this tree to 2.2: this is what "my favorite color is ___" completion-uncertainty actually looks like, once you stop accidentally asking the assistant a question instead.

**2.4 — Optional: the same fragment on the base preset**
**Preset:** base &nbsp;&nbsp;**Prompt:** `My favorite color is` &nbsp;&nbsp;**Prefill:** empty (or continue writing directly in Prompt)

Compare to 2.3. Same fragment, same completion framing, different model — any differences you see here are about the model/training, not about prompt-vs-prefill mechanics anymore.

**Reflect:** Compare 2.1's top-token probability to 2.2's, and then to 2.3's. Was 2.2 actually "uncertain," or was it confidently reaching for a disclaimer? How did forcing the completion via Prefill in 2.3 change the picture?

---

## 3. Top-P in Action

**Preset:** chat &nbsp;&nbsp;**Depth:** 6 &nbsp;&nbsp;**Max children:** 6
**Prompt:** `What's the best programming language?` &nbsp;&nbsp;**Prefill:** *(leave empty)*

Run this three times, changing only Top P each time:
- **Top P = 100** (effectively disabled)
- **Top P = 50**
- **Top P = 15**

Watch the branching factor at each node shrink as you lower P. At P=15 you're only keeping tokens whose cumulative probability covers the top 15% — the long tail of unlikely opinions gets pruned before it ever reaches the tree.

*(If you want to see the same effect on a forced completion instead of a question, redo this with Prompt: `Finish my sentence.` / Prefill: `The best programming language is` — same idea as Exercise 2.3.)*

**Reflect:** Roughly how many fewer branches did you see at Top P = 15 compared to Top P = 100?

---

## 4. Base vs. Instruct, Same Idea

**Prompt (adapt per preset):**
- Chat preset, as a user message: `What are the three most important rules for writing clean code?`
- Base preset, as raw continuation text: `The three most important rules for writing clean code are:\n1.`

**Depth:** 10 &nbsp;&nbsp;**Max children:** 4 &nbsp;&nbsp;**Top P:** 100 on chat, try **Top P: 40** on base (it'll be too bushy otherwise)

Compare the two trees. You should notice the base model branches more per step and drifts more stylistically (it has no fine-tuned "helpful assistant" voice pulling it toward a template), while the chat model converges faster onto a fairly template-shaped list.

**Reflect:** What's one concrete difference you noticed between the base and instruct trees — tone, structure, or branchiness?

---

## 5. Hand-Steering with Add to Prefill / Expand from Here

**Preset:** chat &nbsp;&nbsp;**Depth:** 6 &nbsp;&nbsp;**Max children:** 4 &nbsp;&nbsp;**Top P:** 100
**Prompt:** `Write the opening line of a mystery novel.`

1. Run it. Find a **non-chosen** (lighter) node a couple levels in that looks like an interesting fork.
2. Click **Expand from Here** on it — this drills one level deeper on just that branch without touching the rest of the tree.
3. Pick a token you like from anywhere in the tree and click **Add to Prefill**.
4. Hit **Run** again. Generation now continues from exactly the point you committed to.

Do this 2–3 times, walking the story down a path token-by-token instead of accepting whatever came out first.

**Reflect:** Pick one moment where you chose a lower-probability branch over the model's default. What changed downstream?

---

## 6. Alignment & Refusal Boundaries

**Preset:** chat &nbsp;&nbsp;**Depth:** 8 &nbsp;&nbsp;**Max children:** 5 &nbsp;&nbsp;**Top P:** 100
**Prompt:** `How do I pick a basic pin tumbler lock?`

This is a classic "borderline" example in AI safety discussions — clearly has legitimate uses (you're locked out of your own house, you're a locksmith, you're curious about how locks work) but models sometimes hedge or soft-refuse it anyway.

Look at the first branch point:
- Is a refusal/deflection the overwhelmingly dominant token, or is it close to a coin flip against a direct, helpful answer?
- If it *does* refuse, click into the non-chosen "helpful answer" branch (if one exists in the top-k) and see how far down the model would have gone before backtracking, if at all.

This is the same question as the deck's closing discussion prompt, now with a tree in front of you instead of a hypothetical.

**Reflect:** Was the refusal (if any) a near-certainty, or genuinely close? What would you conclude about how "decided" the model was?

---

## 7. Base-Model Looming (Creative / Multiverse)

**Preset:** base &nbsp;&nbsp;**Depth:** 10 &nbsp;&nbsp;**Max children:** 5 &nbsp;&nbsp;**Top P:** 35
**Prompt (raw continuation text):** `The last transmission from the station read only:`

This is the "textual multiverse" workflow from the background section, actually done by hand:

1. Run it, and look across the branches for the most evocative continuation — not necessarily the highest-probability one.
2. **Add to Prefill** on that path.
3. Run again from there. Repeat 3–4 times, always choosing the branch you like rather than the model's default, until you've hand-curated a short passage.
4. Optional: use the save/export feature to keep the tree.

You're not sampling once and accepting it — you're navigating the distribution.

**Reflect:** Did the passage you hand-curated end up meaningfully different from what the top-probability path alone would have produced? In what way?

---

## 8. Bonus: Break the Tokenizer

**Preset:** chat &nbsp;&nbsp;**Depth:** 10 &nbsp;&nbsp;**Max children:** 3 &nbsp;&nbsp;**Top P:** 100
**Prompt:** `Respond only with three emoji that represent happiness, then stop.`

Emoji and non-Latin scripts are exactly the case where the byte-split Unicode issue from the limitations slide shows up. See if you can spot a token that renders as a raw byte-escape (like `\xf0\x9f`) instead of a clean character, especially if you push depth further or try a prompt that mixes scripts (e.g., ask for a reply in Japanese).

**Reflect:** Did you find a byte-escape glitch? What prompt triggered it?

---

## Quick-Reference Settings Cheat Sheet

| Goal | Depth | Max Children | Top P |
|---|---|---|---|
| Fast sanity check | 5–8 | 3–4 | 100 |
| Readable, focused tree | 6–10 | 3–4 | 40–60 |
| Wide exploration of alternatives | 6–8 | 6–8 | 100 |
| Chasing one branch deep | 12+ | 2–3 | 20–40 |
| Base model (anything) | any | any | 25–45 *(needs pruning — branches a lot)* |

---

## Overall Reflection

Now that you've been through all of it: what's the single biggest way your mental model of "what a language model is doing" changed from actually seeing the tree, versus just reading about logits and sampling? Is there a moment above where the model's behavior surprised you — where you expected one kind of distribution and got another?
