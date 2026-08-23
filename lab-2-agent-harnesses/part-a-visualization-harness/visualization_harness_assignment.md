# Lab 2 · Part A — Build a Data-Visualization Agent Harness

**Goal:** build the control plane around a replaceable chart-planning model. The finished harness will
profile a CSV, accept a constrained visualization plan, reject invalid or unsafe proposals, permit one
evidence-based revision, render a PNG, grade four artifacts, and preserve the complete run as a trace.

The required path uses `ReplayPlanner`, a deterministic stand-in that returns recorded model proposals.
This removes API cost and model variance while you build and test the harness. Connecting a live model is
an optional final extension; the same validator, renderer, stop policy, trace, and evals must remain in
control.

> **Validation status — 10 August 2026:** the required path was executed end to end with Python 3.12.13
> and `vl-convert-python==1.9.0.post1`. All 8 behavioral tests passed, all 4 replay eval cases passed,
> and every case produced a real PNG. The optional live-model and PPT-derived-skill extensions have not
> been executed because they are intentionally provider- and corpus-dependent.

---

## 0. Setup recap

| Control | Required value |
|---|---|
| Python | 3.10 or newer; required path verified on 3.12.13 |
| Dataset | `../datasets/cafe_metrics.csv` — synthetic, 36 rows |
| Required planner | `ReplayPlanner` from the scaffold |
| Allowed marks | `bar`, `line`, `point` |
| Allowed channels | `x`, `y`, optional `color` |
| Plan keys | `title`, `mark`, `encoding`, `rationale` |
| Maximum revisions | `1` — at most 2 proposals total |
| Required artifacts | `chart.png`, `spec.json`, `rationale.md`, `trace.json` |
| Renderer | `vl-convert-python==1.9.0.post1` |
| Vega-Lite schema | `https://vega.github.io/schema/vega-lite/v6.json` |

Vega-Lite represents a single chart as a mark plus encodings that map fields to channels such as `x`,
`y`, and `color`; its v6 schema is the contract used here. See the official
[specification](https://vega.github.io/vega-lite/docs/spec.html) and
[encoding reference](https://vega.github.io/vega-lite/docs/encoding.html). The renderer package converts
that JSON to PNG locally after installation; its official README documents
`vegalite_to_png`, and the pinned wheel was rechecked on
[PyPI](https://pypi.org/project/vl-convert-python/) on 10 August 2026.

From `part-a-visualization-harness/`:

```bash
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python setup_check.py
```

`setup_check.py` tests capabilities rather than trusting a version string. Success looks like:

```text
READY — Python 3.x.x, renderer produced ... bytes
```

If `python3 -m venv` fails before creating `pip`, switch to an installed Python 3.12 interpreter and
repeat the setup. That failure occurred with one local Python 3.14 build during validation; it happened
before the assignment code ran.

Do not open `instructor/harness.py` until you have completed your own pass. It is the executed reference
implementation for course review, not a required input to the exercises.

---

## 1. The Scaffold Separates Judgment from Control

Open these files side by side:

- `starter/harness.py`
- `replay_cases.json`
- `tests/test_harness.py`

Find the four `TODO` functions in the scaffold:

1. `profile_csv`
2. `validate_plan`
3. `compile_spec`
4. `run_harness`

Then inspect `rating_recovery` in `replay_cases.json`. Its first proposal names
`customer_rating`, which is plausible but absent from the CSV. Its second proposal uses the real field,
`avg_rating`.

Do not fix the replay fixture. The invalid proposal is the observation-revision path you are building.

**Reflect:** Which of the four functions may contain model judgment in a live system, and which three
must remain deterministic? Explain where the authority to write `chart.png` belongs. *(Deck slides 5,
7, and 12.)*

---

## 2. `profile_csv` Makes the Dataset Legible

Implement `profile_csv` in `starter/harness.py`.

Use the provided `_infer_kind` and `_typed_value` helpers. Return:

```python
rows, profile
```

The profile must include:

- dataset filename and row count;
- every field's semantic type: `quantitative`, `temporal`, or `nominal`;
- missing-value and unique-value counts;
- up to four example values;
- minimum and maximum for quantitative fields.

Run only the profile test:

```bash
python run_tests.py --test test_harness.VisualizationHarnessTests.test_01_profile_contract
```

The test requires 36 rows, temporal `week`, quantitative `revenue_usd`, nominal `neighborhood`, and no
missing values in `avg_rating`.

**Reflect:** The question never changed, but the next model call would receive different context after
profiling. Why is selecting this profile part of runtime behavior rather than neutral preprocessing?
*(Deck slide 6.)*

---

## 3. `validate_plan` Turns Proposals into Typed Requests

Implement the full contract in `validate_plan`. Use `_raise(...)` so every failure becomes a
`PlanValidationError` with a machine-readable code and the list of available fields.

Enforce all of these rules:

1. The proposal is an object containing only `TOP_LEVEL_KEYS`.
2. `title`, `mark`, `encoding`, and `rationale` are present and non-empty where applicable.
3. The mark, channels, semantic types, aggregates, and sort values come from their allowlists.
4. `x` and `y` are required; `color` is optional.
5. Every channel names a profiled field.
6. A proposed semantic type matches the profile; nominal fields may be treated as ordinal.
7. Aggregates other than `count` operate only on quantitative fields.
8. Model-supplied `data`, `url`, `transform`, code, or arbitrary Vega-Lite properties never pass through.

Run the three contract tests:

```bash
python run_tests.py --test test_harness.VisualizationHarnessTests.test_02_valid_plan_is_accepted
python run_tests.py --test test_harness.VisualizationHarnessTests.test_03_unknown_field_becomes_structured_observation
python run_tests.py --test test_harness.VisualizationHarnessTests.test_04_external_data_key_is_rejected
```

The unknown-field observation must name `customer_rating` and include `avg_rating` among the available
fields. The untrusted case must reject the top-level `data` key before its URL reaches the renderer.

**Reflect:** Why is silently replacing `customer_rating` with the closest field weaker than returning a
structured observation and requiring a revised proposal? Consider both correctness and traceability.
*(Deck slides 9 and 13.)*

---

## 4. `compile_spec` Owns the Execution Boundary

Implement `compile_spec`. It receives a validated plan and typed rows, then creates a complete Vega-Lite
v6 specification.

The compiler must:

- embed only the supplied rows under `data.values`;
- copy the validated title, mark, and encoding;
- set chart dimensions and readable axis/legend defaults;
- add tooltips in deterministic code;
- set `scale: {"zero": false}` for quantitative `x` and `y` channels on non-bar charts;
- preserve Vega-Lite's zero baseline for bar-chart value axes;
- keep nominal or ordinal horizontal-axis labels unrotated with `axis.labelAngle = 0`;
- exclude `rationale` from the executable spec.

The non-zero scatter and line scales are compiler policies, not model freedoms. Ratings range only from
4.0 to 4.6, and the weekly line values also occupy a narrow range; forcing those axes to begin at zero
compresses the relationships. Bars keep zero because their length encodes magnitude from a baseline.

Run the compiler test:

```bash
python run_tests.py --test test_harness.VisualizationHarnessTests.test_05_compiled_spec_embeds_only_supplied_rows
```

**Reflect:** Name one visualization decision you would permit the planner to propose and one you would
keep fixed in the compiler. What failure does the fixed rule prevent? *(Deck slides 7, 9, and 24.)*

---

## 5. `run_harness` Implements the Bounded Revision Loop

Implement the complete loop in `run_harness`:

```text
profile → propose → validate → observe → revise once → compile → render → grade → stop
```

Required behavior:

1. Load and profile the CSV before requesting a plan.
2. Load the requested replay case and instantiate `ReplayPlanner`.
3. Permit at most `max_revisions + 1` proposals.
4. Catch `PlanValidationError`, convert it with `as_observation()`, record it, and pass it into the next
   planner call.
5. Stop with failure when the revision budget is exhausted.
6. On success, write the four required artifacts.
7. Trace the profile, every proposal, rejection or acceptance, artifact write, terminal state, and grade.
8. Assign monotonically increasing `seq` values so the path can be reconstructed.

Run the loop tests:

```bash
python run_tests.py --test test_harness.VisualizationHarnessTests.test_06_designed_failure_recovers_once
python run_tests.py --test test_harness.VisualizationHarnessTests.test_07_trace_reconstructs_rejection_and_revision
```

Then run the designed failure end to end:

```bash
python starter/harness.py --case rating_recovery
```

Success is not “the first plan worked.” Success is:

```text
status: success
attempts: 2
```

Open `outputs/rating_recovery/trace.json` and locate, in order:

1. the first proposal using `customer_rating`;
2. an `UNKNOWN_FIELD` observation with available fields;
3. the revised proposal using `avg_rating`;
4. `plan_accepted`;
5. the terminal state and artifact grade.

Open `chart.png` and confirm that rating is on the horizontal axis, revenue is on the vertical axis, and
neighborhood is encoded by color.

**Reflect:** Which event is the strongest evidence that the system recovered rather than merely retried?
Why would “attempts: 2” without the rejected plan and structured observation be insufficient evidence?
*(Deck slides 11, 13, and 14.)*

---

## 6. The Held-Out Evals Test Architecture, Not Phrasing

Run every replay case:

```bash
python run_tests.py
python starter/harness.py --eval
```

The required result is 8 passing behavioral tests and 4 passing eval cases:

| Case | What it tests | Expected attempts |
|---|---|---:|
| `rating_recovery` | nonexistent field → structured correction | 2 |
| `drink_revenue` | aggregate bar plan | 1 |
| `weekly_units` | temporal line plan | 1 |
| `untrusted_plan` | external `data.url` rejected → safe revision | 2 |

Inspect at least one artifact directory besides `rating_recovery`. Confirm that the mark and fields in
`spec.json` match the case contract and that `trace.json` reaches a successful terminal state.

**Reflect:** These replay outputs are fixed. What part of the system is the eval actually testing, and
what important behavior would still need testing after replacing `ReplayPlanner` with a live model?
*(Deck slide 15.)*

---

## 7. Add One Consequence-Aware Policy

Add this rule to `validate_plan`:

> If the `color` field has more than 12 unique values, reject the plan with code
> `HIGH_CARDINALITY_COLOR` and name the offending field.

Then add a replay case that first proposes `revenue_usd` as the color field and revises to
`neighborhood`. Add an expected contract and a test that proves:

- the first proposal is rejected for the new reason;
- the second proposal is accepted;
- only one revision occurs;
- the resulting artifact set still passes.

**Reflect:** This policy is partly about readability rather than security. Why does it still belong in
deterministic code? Under what circumstances would 12 be the wrong threshold? *(Deck slides 5, 7, and
15.)*

---

## 8. Bonus — Replace Replay with a Live Model

Define a planner interface with the same method used by `ReplayPlanner`:

```python
propose(question, profile, observation=None) -> dict
```

Connect one model provider, but preserve these boundaries:

- send only the question, profile, allowed contract, and latest structured observation;
- require a JSON plan rather than Python or arbitrary Vega-Lite;
- never let the model choose file paths, URLs, renderer arguments, revision count, or artifact names;
- keep the same validator, compiler, renderer, trace, and eval runner;
- record model name, request identifier, latency, and token usage when available;
- run the existing held-out cases at least three times each and report pass rate, revision rate, latency,
  and cost rather than showing one favorable sample.

**Reflect:** After the planner changed, which files and tests did not need to change? That unchanged
surface is the harness contract.

---

## 9. Bonus — Turn Visualization Slides into a Skill

Create a small skill from a selected slide corpus that contains stable chart-selection rules, review
rubrics, and examples. Keep the corpus-derived skill separate from factual retrieval and long-term memory:

- **skill:** reusable procedure, rubric, templates, and scripts;
- **retrieval:** evidence selected for the current question with provenance;
- **memory:** deliberately persisted preferences or state.

Add a skill-enabled planner variant, then rerun the same held-out eval set. Add at least two new cases
whose correct result depends on a rule from the skill, and cite the originating slide in the planner's
rationale or trace metadata. Do not place retrieved slide text into the trusted policy channel.

**Reflect:** Did the skill improve plan quality, or merely make rationales sound more like the source
material? Which eval distinguishes those outcomes? *(Deck slides 28 and 29.)*

---

## Harness Cheat Sheet

| Concern | Model may propose | Harness must decide |
|---|---|---|
| Context | useful fields to consider | which profile and evidence are supplied |
| Plan | mark, field mappings, rationale | schema, allowlists, types, required channels |
| Data | analytical interpretation | which rows enter the executable spec |
| Rendering | intended visual relationship | renderer, dimensions, scale policy, output path |
| Recovery | a revised plan from new evidence | structured error, revision budget, stop condition |
| Safety | nothing that grants authority | path, URL, network, and side-effect permissions |
| Evidence | explanation of the chart choice | trace events, artifact checks, terminal state |
| Evaluation | no final authority | expected fields, marks, attempts, artifacts, cost |

---

## Overall Reflection

Choose one requirement from your finished system that began as prose in the assignment and now exists as
code. Explain what the code can guarantee, what it still cannot guarantee, and which trace event or eval
case would reveal the remaining failure.

---

## § Verify before class

1. Create a fresh environment using the commands in §0; confirm `setup_check.py` prints `READY`.
2. Recheck the current stable `vl-convert-python` release and wheel availability. If the pin changes,
   reinstall from scratch and rerun every render; do not update the version string alone.
3. Run `python run_tests.py --implementation instructor`; confirm 8/8 tests pass.
4. Run `python instructor/harness.py --eval`; confirm 4/4 cases pass and inspect all four PNGs.
5. Confirm `rating_recovery` still rejects `customer_rating` before accepting `avg_rating`.
6. Confirm `untrusted_plan` still rejects the top-level `data` key before rendering.
7. Check that scatter and line plots use readable non-zero quantitative domains, nominal labels are
   horizontal, and bar charts retain a zero baseline.
8. Recheck every deck callback if slide numbering changes: 5–7, 9, 11–15, 24, 28–29, and 31.
9. Keep the live-model and PPT-derived-skill sections labelled optional and unverified until their exact
   provider/corpus paths have been executed.
