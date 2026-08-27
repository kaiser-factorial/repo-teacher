# Lecture 4 — Prime Intellect: Hands-On Assignment

Work through these alongside the deck. Each exercise names the slide it's testing, so you can flip
back when something doesn't line up.

**A note on cost before you start.** Most of this is free or costs fractions of a cent. Two
exercises spend real money and are marked **[costs money]** with an estimate. Nothing here requires
a training run.

**A note on trust.** Exercises marked **[untested]** were written from reading source and docs, not
from running them end to end. If one behaves differently than described, that's worth reporting —
it's the same failure mode this lecture is about.

---

## Setup

Everything below assumes these exact values.

| What | Value |
|---|---|
| Install uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Install the CLI | `uv tool install prime` |
| Authenticate | `prime login` |
| Verify | `prime --version` — these exercises were written against `0.6.21` |
| Inference endpoint | `https://api.pinference.ai/api/v1` |
| Environment under study | `primeintellect/aiderpolyglot@latest` |
| Starter environment | `primeintellect/alphabet-sort` |

**Two things that are separately metered, and separately listed.** Training and inference are
different products with different model lists and different prices. `prime train models` shows what
you can train; `prime inference models` shows what you can run an evaluation against. They overlap
but are not the same set — which Exercise 1 has you confirm for yourself, because it will otherwise
bite you later.

You do **not** need a Modal account for Exercises 1–6. Exercise 5 evaluates a Modal-backed
environment; see the note there.

---

## Exercise 1 — Two model lists, and why it matters

*Tests: Slide 9 (what Prime Intellect is), Slide 10 (the products)*

Run both:

```bash
prime train models
prime inference models
```

`prime inference models` is long. Rather than reading it all, answer three specific questions:

1. Pick any model that appears on the **training** list. Does it appear on the **inference** list,
   spelled identically?
2. Find the models priced at `$0` on each list. Are any of them on *both* lists?
3. `Qwen/Qwen3.5-35B-A3B` (capitalised) and `qwen/qwen3.5-35b-a3b` (lowercase) — do both appear on
   the inference list, and at the same price?

**Reflect:** Suppose you wanted to measure a model's baseline on a task, train it, then measure it
again to see whether training helped. What constraint do these two lists place on which model you
can choose? What would go wrong if you picked your model by scanning only one of the lists?

---

## Exercise 2 — Read an environment before you run it

*Tests: Slide 13 (what an environment is), Slide 17 (the CLI)*

You can read any published environment's source without installing it:

```bash
prime env inspect primeintellect/aiderpolyglot@latest
prime env inspect primeintellect/aiderpolyglot@latest README.md
prime env inspect primeintellect/aiderpolyglot@latest AiderPolyglot.py
```

The first command lists files; the other two print them. The whole environment is one ~200-line
Python module.

Read `AiderPolyglot.py` and locate each piece of the contract from Slide 13:

- the required entry point (Slide 13 names it — find it here)
- the dataset, and where its problems come from
- the class the environment subclasses, and what that subclass adds
- the rubric, and the function it wraps
- the exact line that decides whether an attempt scored 1.0 or 0.0

Write down the last one verbatim. It's one line, and the rest of this assignment turns on it.

**Reflect:** The model never sees the exercise's test files — `_get_template_files` strips them out.
Given that, what exactly is this environment claiming to measure when it reports a reward of 1.0?
State it as a sentence beginning "A reward of 1.0 means…". Be precise; this matters in Exercise 6.

---

## Exercise 3 — Documentation drift

*Tests: Slide 12 (the v0/v1 note), Slide 19 (limitations)*

You now have both `README.md` and `AiderPolyglot.py` in front of you. They disagree.

**There are at least six places where the README contradicts the source. Find four.** For each,
record: what the README says, what the source does, and — the interesting part — **which one you
think should change.**

That last column is the point. Don't assume the source is always right or the docs are always
right; some of these are documentation that fell behind working code, and at least one is a README
describing a better design than what was implemented.

Places worth looking: default argument values, the container images table, the test-runner column,
the exercise counts, and how the README describes the parser versus what the `parser` attribute
actually is.

**Reflect:** Pick the one discrepancy you'd fix first and say why. If you were relying on this
README to decide whether to use this environment in your own work, which of the four would have
misled you most expensively?

---

## Exercise 4 — Watch the loop work, cheaply

*Tests: Slide 3 (the RL loop), Slide 15 (the three processes), Slide 16 (the dials)*

Before touching the complicated environment, run the simple one.

```bash
prime env install primeintellect/alphabet-sort
prime eval run alphabet-sort -m <a model from BOTH lists in Ex. 1> -n 5 -r 1
```

Then open the rollout viewer:

```bash
prime eval tui
```

Find a single rollout and read it turn by turn: the prompt the environment issued, what the model
replied, how the environment responded, and the reward at the end.

Note the reward. Then run it again with `-r 3` instead of `-r 1` and note how the numbers are
reported differently.

**Reflect:** Slide 3 said what matters isn't the raw score but how attempts compare *to each other*
on the same problem. Looking at your `-r 3` output — where would that comparison happen, and what
would it have to compare? Which flag in Slide 16's config controls how many attempts get grouped
this way?

---

## Exercise 5 — Baselines are per-task, not per-model — [costs money] [untested]

*Tests: Slide 7 (the difficulty window), Slide 16 (check the baseline first)*

**Before you run this:** `aiderpolyglot` executes candidate solutions in a **Modal** sandbox — a
third-party service, not Prime. You'll need a Modal account (`pip install modal && modal setup`).
Cost is small but real: a short-lived container per attempt, plus inference tokens. Keep `-n` at 2
or 3.

The point of this exercise is a comparison, so run it three times.

```bash
# 1. Naive — exactly what the README's Quickstart implies
prime eval run AiderPolyglot -m <your model> -n 3

# 2. Python only
prime eval run AiderPolyglot -m <your model> -n 3 -a '{"language": "python"}'

# 3. Go only
prime eval run AiderPolyglot -m <your model> -n 3 -a '{"language": "go"}'
```

Record all three rewards. Then answer: **what did run 1 actually evaluate?** The answer is in the
source you read in Exercise 2, not in the README — and if you did Exercise 3 properly you already
know.

Now open `prime eval tui` and read one *failed* Python rollout and one *failed* Go rollout. They
fail differently. Note how.

**Reflect:** Slide 7 said both a benchmark and a training task need scores that land somewhere in
the middle — roughly 5–50% for a benchmark, 10–35% before spending on training. Do any of your three
numbers land there? If your model scored 0.0 on everything, what have you actually learned — and
what would you change first: the model, the task, or the number of turns?

---

## Exercise 6 — Find what the reward really measures

*Tests: Slide 5 (gaming the reward), Slide 14 (anatomy), Slide 19 (limitations)*

This is the main exercise. Nothing new to run — go back to `AiderPolyglot.py`.

Re-read two things together: `load_exercises_dataset`, specifically `_get_template_files`, and then
`_test_solution`, specifically the loop that writes the model's files to disk.

**Part A — the general critique.** Write three or four sentences on the reward design. Is a binary
pass/fail the right choice here? What information does it throw away? Exercise 5 gave you a hint —
if a model gets partway there, how would you know from the reward alone?

**Part B — the specific one.** Somewhere in the path between "the model produced text" and "reward
is 1.0," there is a way for a model to score 1.0 on an exercise it has not solved. It requires no
exotic trick — just the code doing exactly what it's written to do.

Find it. Write down: the exact filename a model would need to emit, what it would put inside, and
which line of `_test_solution` allows it. Then state, in one sentence, what would have to change to
close it.

Don't look at Slide 19 until you've written an answer.

**Reflect:** Slide 5 listed three ways a reward gets gamed: measuring a proxy, reaching the scorer,
and degenerate strategies. Which one is this, and what makes it that one rather than the others? The
prompt in this environment explicitly asks the model not to do it. Why isn't that sufficient?

---

## Extension — Two defences, and what still gets past them

*Tests: Slide 5 (the defensive question), Slide 19*

For anyone who finished Exercise 6 and wants the harder version.

Two ways to fix what you found in 6B, neither of which is the obvious filename check:

- **Restore.** Let the model write whatever it wants, then overwrite the test files from a pristine
  copy before running anything. The write still happens; it just stops mattering.
- **Penalise.** Hash the test files before and after. If they changed, add a scoring function that
  returns a large negative. Nothing is prevented; the hack just stops paying.

**Part A.** These do different jobs. One removes the *incentive*; the other creates a *gradient
pointing away*. Say which is which, and why "the model tries it, it doesn't work, so it stops" isn't
actually how this plays out with only the first one.

**Part B.** Combine them. Now find what still gets through. Concretely: is there a file a model
could add — not modify, *add* — that would change the outcome of `python3 -m pytest -xvs` while
leaving every existing test file's hash untouched?

**Part C.** Fix your own fix. What would the integrity check have to compare, instead of the test
files' hashes, to catch what you found in Part B? And once you've written that down: what does your
answer require you to already know?

**Reflect:** Part C tends to land somewhere uncomfortable. Having got there — what's the general
rule about which kinds of defences can be worked around and which can't? Try stating it in one
sentence, without reference to this environment.

---

## Still to come

Exercises 7 onward — running against a fixed fork, swapping the sandbox backend, and a short
training run — depend on work that's still in progress. They'll be added once there are real
numbers to build them from rather than predicted ones.

---

## Settings cheat-sheet

| Goal | Command shape | Notes |
|---|---|---|
| Just check it runs | `prime eval run <env> -m <model> -n 3 -r 1` | Cheapest useful signal |
| Baseline before training | `prime eval run <env> -m <model> -n 20 -r 3` | Multiple rollouts per problem; want 10–35% |
| Compare two task variants | Same `-m`, same `-n`, change only `-a` | Change one thing at a time |
| Read what actually happened | `prime eval tui` | Worth more than the aggregate number |
| Avoid rate limits | add `-c 2` | Lower concurrency |
| Read source without installing | `prime env inspect <owner>/<name> FILE` | Works on any published environment |

---

## Overall Reflection

You spent this assignment reading one small environment far more carefully than anyone normally
reads a benchmark they're about to trust — its docs, its source, its actual behaviour, and finally
its failure mode. The reward-hack in Exercise 6 was published, by the platform's own team, and sat
there in a benchmark people ran.

Think about the last time you saw a model's score on a benchmark — a leaderboard, a paper, a launch
post. What would you now want to know before believing it, that you wouldn't have thought to ask
before today? And is that a reasonable thing to demand of every number you encounter, or does it
imply something uncomfortable about how many of them are worth believing at all?
