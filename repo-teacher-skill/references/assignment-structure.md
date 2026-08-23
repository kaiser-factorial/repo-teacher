# Assignment Structure (`<tool>_assignment.md`)

A markdown worksheet of hands-on exercises for practicing the tool directly, tied back to lecture concepts. Written in plain markdown (not a slide deck, not code) so it's easy to read while also using the tool side-by-side.

## Format

- **Setup recap** near the top: exact values pulled from the tool's own README/docs (URLs, model names, flags) — not paraphrased or approximated. Reproduce them verbatim, in a table if there's more than 2-3 fields. If the tool has more than one mode (e.g. two different backend "types"), explain the conceptual difference between them here, explicitly, before the exercises — don't assume it's obvious from the exercises alone (see the validation section below for why this specific gap caused real problems).
- **Numbered exercises**, each specifying: the exact tool settings to use, an exact prompt/input, and what to actually notice or compare. Reference the specific lecture/slide the exercise is testing, so the connection to material already taught is explicit rather than assumed.
- **Inline reflection**, immediately after each exercise (`**Reflect:** ...`) — not batched into a separate section at the end. Immediate reflection while the exercise is fresh produces better answers than a end-of-document list the person has to scroll back to reconstruct context for.
- **One "Overall Reflection"** at the very end — a single, broader synthesis question, distinct from the per-exercise ones. Not a numbered list; this is meant to be the one place where the person steps back from individual exercises and says what actually changed for them.
- **A settings cheat-sheet table** if the tool has tunable parameters worth summarizing by goal (e.g. "fast sanity check" vs. "deep single-branch exploration" → different recommended values).
- Drop any instruction to "bring this to discussion" or similar unless the course context actually has a discussion component — don't assume one exists.

## Mandatory: validate every exercise against real tool mechanics before finalizing

This is the most important section in this reference file. **A published assignment in this series already shipped with a real, substantive bug from skipping this step** — worth reading the full story before writing a new assignment, so the failure mode is recognizable in advance rather than after a person hits it.

### What happened

The first LogitLoom assignment told the person to type sentence-fragment prompts — `2 + 2 =`, `My favorite color is` — directly into the tool's **chat-mode** prompt box, with the implicit assumption that the model would complete the fragment the way a base/completion model does. It doesn't: a chat-mode prompt box is sent as a user message, and the model responds *to* it rather than continuing it. The exercises were designed by reasoning abstractly from general LLM knowledge ("fragments are a natural completion prompt") rather than checking how *this specific tool's chat mode* actually handles input. The bug was only caught when the person actually ran the exercises and got confused by the mismatch between expected and actual behavior — not during drafting.

The fix that emerged from that conversation is now the standing rule below.

### The checklist

Before an exercise ships, for anything the exercise assumes about how the tool processes input:

1. **Trace the assumption to the tool's actual request-building code**, if source is available — not just the README's prose description of a field. A "prompt" box, a "prefill" box, a "system" box, etc. may each map to something different (a user message, a raw string concatenation, a specific API parameter) depending on the tool's mode, and READMEs often describe the *intent* of a feature without spelling out the exact mechanical behavior in every mode.
2. **If the tool has multiple modes** (chat vs. base/completion, sync vs. async, etc.), write out — explicitly, before drafting exercises — what a given input field means differently in each mode. Don't reuse the same style of prompt across modes without checking whether the framing needs to change (e.g. "ask a question" for chat mode vs. "write a fragment to continue" for completion mode are genuinely different instructions, not interchangeable phrasing of the same idea).
3. **Actually run the exercise once against the live tool**, if there's any way to do so, before publishing it. This is the single most reliable check and should be preferred over steps 1-2 whenever feasible — reasoning about source code can still miss runtime behavior (e.g. a provider silently changing how it handles a request server-side).
4. If you can't run it live (no access, requires a paid API key you don't have, etc.), say so explicitly to the person you're handing the assignment to, rather than presenting untested exercises with the same confidence as tested ones.

### When the tool's canonical example is a bad exercise

Running an exercise live doesn't only catch *errors*. Sometimes it works exactly as documented and is still the wrong thing to hand a class.

*What happened*: a lesson's exercises used the repository's own headline example — the demo from its README and blog post, the obvious choice. Executed on the small model the assignment recommends, it did two things the author's setup never showed. Its positive direction code-switched into another language partway up the strength range, muddling the very thing the exercise asks the student to observe. Its negative direction pulled the model off-task into a distressed, refusing register, and at the strengths the exercise prescribes it produced unprompted content about suicide in response to a question about television.

Neither is a bug, in the tool or the exercise. Both are real properties of the technique, and genuinely worth teaching. But a worked example that a student runs repeatedly, on their own machine, is the wrong place to meet them cold.

The failure mode to avoid is either extreme: silently keeping it (a student hits distressing output with no warning, from coursework) or silently dropping it (the lesson quietly omits a real property of the tool, and the student's own experiments later contradict the materials).

**What to do instead:**
1. **Validate a replacement before switching.** Don't swap to an untested example to dodge the problem — you'll just trade a known issue for an unknown one. Run two or three candidates and pick on evidence. A neutral axis that degrades symmetrically usually makes a *better* first measurement anyway, because the student can read the effect without confounds.
2. **Prefer a replacement the tool's own materials sanction**, if one exists — a second example from the same notebooks keeps you inside what the maintainer has demonstrated.
3. **Make the original an explicit, later, optional exercise**, with a one-paragraph heads-up describing concretely what it produces and an alternative for anyone who'd rather not. Concrete beats euphemistic here: the student can make an informed choice from "it produced X" and cannot from "output may be upsetting."
4. **Say why the swap happened**, in the assignment's setup section. A student who notices the materials differ from the tool's own README should find the reason waiting for them rather than concluding the lesson is sloppy.
5. **Tell the course maintainer it happened.** This is a judgment call about their classroom, and it belongs in front of them, not buried in a diff.

### A related pattern worth watching for generally

Tool behavior that depends on a third-party API can change out from under both the tool and the assignment without any code change on either side — a provider renaming a model, changing what a `/models` endpoint returns, or altering default request-handling behavior can silently break something that worked when the assignment was written. If an assignment exercise stops behaving as described, that's a legitimate thing to flag back to the skill/course maintainer (and potentially to the tool's own maintainer, if it's a real upstream compatibility break) rather than assuming the assignment itself was always wrong. Distinguishing "this was never tested properly" from "this used to work and an external dependency moved" is worth doing explicitly when debugging a broken exercise, since the fix looks different for each (rewrite the exercise vs. flag/wait for an upstream fix and note the caveat in the assignment in the meantime).
