#!/usr/bin/env python3
"""Student scaffold for the data-visualization agent harness lab."""

from __future__ import annotations

import argparse
import csv
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

PART_DIR = Path(__file__).resolve().parents[1]
LAB_DIR = PART_DIR.parent
DEFAULT_DATASET = LAB_DIR / "datasets" / "cafe_metrics.csv"
DEFAULT_CASES = PART_DIR / "replay_cases.json"

ALLOWED_MARKS = {"bar", "line", "point"}
ALLOWED_CHANNELS = {"x", "y", "color"}
ALLOWED_TYPES = {"quantitative", "nominal", "ordinal", "temporal"}
ALLOWED_AGGREGATES = {"sum", "mean", "median", "min", "max", "count"}
ALLOWED_SORTS = {"ascending", "descending", "-x", "-y", "x", "y"}
TOP_LEVEL_KEYS = {"title", "mark", "encoding", "rationale"}
CHANNEL_KEYS = {"field", "type", "aggregate", "sort"}


@dataclass
class PlanValidationError(ValueError):
    code: str
    message: str
    field: str | None = None
    channel: str | None = None
    available_fields: list[str] | None = None

    def __str__(self) -> str:
        return self.message

    def as_observation(self) -> dict[str, Any]:
        return {
            "ok": False,
            "code": self.code,
            "message": self.message,
            "field": self.field,
            "channel": self.channel,
            "available_fields": self.available_fields or [],
        }


class ReplayPlanner:
    """A deterministic stand-in for a model, used to test the harness itself."""

    def __init__(self, plans: list[dict[str, Any]]):
        self._plans = plans
        self._index = 0

    def propose(
        self,
        question: str,
        profile: dict[str, Any],
        observation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        del question, profile, observation
        if self._index >= len(self._plans):
            raise RuntimeError("ReplayPlanner has no remaining proposal")
        plan = self._plans[self._index]
        self._index += 1
        return json.loads(json.dumps(plan))


class GeminiPlanner:
    """Live model planner that queries Gemini models via Google AI Studio API."""

    def __init__(
        self,
        model: str = "gemini-3.7-flash",
        api_key: str | None = None,
    ):
        self.model = model
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. Export it or pass api_key to GeminiPlanner."
            )

    def propose(
        self,
        question: str,
        profile: dict[str, Any],
        observation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        system_instruction = (
            "You are an expert data visualization planner. Output ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "title": "<descriptive title>",\n'
            '  "mark": "bar" | "line" | "point",\n'
            '  "encoding": {\n'
            '    "x": {"field": "<field>", "type": "quantitative"|"nominal"|"ordinal"|"temporal", "aggregate"?: "sum"|"mean"|"min"|"max"|"count", "sort"?: "-y"|"y"|"ascending"|"descending"},\n'
            '    "y": {"field": "<field>", "type": "quantitative"|"nominal"|"ordinal"|"temporal", "aggregate"?: "sum"|"mean"|"min"|"max"|"count", "sort"?: "-y"|"y"|"ascending"|"descending"},\n'
            '    "color"?: {"field": "<field>", "type": "nominal"|"ordinal"|"quantitative"}\n'
            "  },\n"
            '  "rationale": "<explanation of your visual design choices>"\n'
            "}\n"
            "Rules:\n"
            "1. ONLY use field names from the provided dataset profile.\n"
            "2. 'x' and 'y' channels are required; 'color' is optional.\n"
            "3. Do NOT include 'data', 'url', 'transform', code, or arbitrary Vega-Lite properties.\n"
            "4. For 'color', avoid fields with more than 12 unique values.\n"
            "5. Return pure JSON without markdown backticks."
        )

        user_parts = [
            f"Dataset Profile:\n{json.dumps(profile, indent=2)}",
            f"User Analytical Question: {question}",
        ]

        if observation:
            user_parts.append(
                f"PREVIOUS PROPOSAL FAILED VALIDATION:\n"
                f"Error Code: {observation.get('code')}\n"
                f"Message: {observation.get('message')}\n"
                f"Available Fields: {observation.get('available_fields')}\n"
                f"Please fix the error and provide a valid revised proposal."
            )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": "\n\n".join(user_parts)}],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
            "systemInstruction": {
                "parts": [{"text": system_instruction}],
            },
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key,
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Gemini API error ({exc.code}): {err_body}") from exc

        text = body["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])

        plan = json.loads(text)
        return plan


class OpenAIPlanner:
    """Live model planner that queries OpenAI or OpenAI-compatible endpoints."""

    def __init__(
        self,
        model: str = "gpt-4o-mini",
        api_key: str | None = None,
        base_url: str = "https://api.openai.com/v1/chat/completions",
    ):
        self.model = model
        self.base_url = base_url
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. Export it or pass api_key to OpenAIPlanner."
            )

    def propose(
        self,
        question: str,
        profile: dict[str, Any],
        observation: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        system_prompt = (
            "You are an expert data visualization planner. Output ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "title": "<descriptive title>",\n'
            '  "mark": "bar" | "line" | "point",\n'
            '  "encoding": {\n'
            '    "x": {"field": "<field>", "type": "quantitative"|"nominal"|"ordinal"|"temporal", "aggregate"?: "sum"|"mean"|"min"|"max"|"count", "sort"?: "-y"|"y"|"ascending"|"descending"},\n'
            '    "y": {"field": "<field>", "type": "quantitative"|"nominal"|"ordinal"|"temporal", "aggregate"?: "sum"|"mean"|"min"|"max"|"count", "sort"?: "-y"|"y"|"ascending"|"descending"},\n'
            '    "color"?: {"field": "<field>", "type": "nominal"|"ordinal"|"quantitative"}\n'
            "  },\n"
            '  "rationale": "<explanation of your visual design choices>"\n'
            "}\n"
            "Rules:\n"
            "1. ONLY use field names from the provided dataset profile.\n"
            "2. 'x' and 'y' channels are required; 'color' is optional.\n"
            "3. Do NOT include 'data', 'url', 'transform', code, or arbitrary Vega-Lite properties.\n"
            "4. For 'color', avoid fields with more than 12 unique values.\n"
            "5. Return pure JSON without markdown backticks."
        )

        user_content = [
            f"Dataset Profile:\n{json.dumps(profile, indent=2)}",
            f"User Analytical Question: {question}",
        ]

        if observation:
            user_content.append(
                f"PREVIOUS PROPOSAL FAILED VALIDATION:\n"
                f"Error Code: {observation.get('code')}\n"
                f"Message: {observation.get('message')}\n"
                f"Available Fields: {observation.get('available_fields')}\n"
                f"Please fix the error and provide a valid revised proposal."
            )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "\n\n".join(user_content)},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        req = urllib.request.Request(
            self.base_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"OpenAI API error ({exc.code}): {err_body}") from exc

        content = body["choices"][0]["message"]["content"]
        content = content.strip()
        if content.startswith("```"):
            lines = content.splitlines()
            content = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])

        plan = json.loads(content)
        return plan



def _is_number(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


def _is_iso_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


def _infer_kind(values: list[str]) -> str:
    present = [value for value in values if value.strip()]
    if present and all(_is_number(value) for value in present):
        return "quantitative"
    if present and all(_is_iso_date(value) for value in present):
        return "temporal"
    return "nominal"


def _typed_value(value: str, kind: str) -> Any:
    if not value.strip():
        return None
    if kind == "quantitative":
        number = float(value)
        return int(number) if number.is_integer() else number
    return value


def profile_csv(path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Read the CSV, type each cell, and return (rows, profile)."""

    with path.open(newline="", encoding="utf-8") as handle:
        raw_rows = list(csv.DictReader(handle))

    field_names = list(raw_rows[0].keys()) if raw_rows else []
    kinds = {
        name: _infer_kind([row[name] for row in raw_rows]) for name in field_names
    }

    rows: list[dict[str, Any]] = []
    for raw in raw_rows:
        rows.append(
            {name: _typed_value(raw[name], kinds[name]) for name in field_names}
        )

    fields: dict[str, Any] = {}
    for name in field_names:
        values = [row[name] for row in rows]
        present = [value for value in values if value is not None]
        unique: list[Any] = []
        for value in present:
            if value not in unique:
                unique.append(value)
        summary: dict[str, Any] = {
            "type": kinds[name],
            "missing": len(values) - len(present),
            "unique": len(unique),
            "examples": unique[:4],
        }
        if kinds[name] == "quantitative" and present:
            summary["min"] = min(present)
            summary["max"] = max(present)
        fields[name] = summary

    profile = {
        "dataset": path.name,
        "row_count": len(rows),
        "fields": fields,
    }
    return rows, profile


def _raise(
    code: str,
    message: str,
    profile: dict[str, Any],
    *,
    field: str | None = None,
    channel: str | None = None,
) -> None:
    raise PlanValidationError(
        code=code,
        message=message,
        field=field,
        channel=channel,
        available_fields=sorted(profile["fields"]),
    )


def validate_plan(plan: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    """Enforce the plan contract before it becomes an executable chart spec."""

    if not isinstance(plan, dict):
        _raise("INVALID_PLAN", "The proposal must be a JSON object.", profile)

    unexpected = sorted(set(plan) - TOP_LEVEL_KEYS)
    if unexpected:
        _raise(
            "FORBIDDEN_TOP_LEVEL_KEY",
            f"Unsupported top-level key: {unexpected[0]}",
            profile,
            field=unexpected[0],
        )

    for required in ("title", "mark", "encoding", "rationale"):
        if required not in plan:
            _raise(
                "MISSING_REQUIRED_KEY",
                f"The plan is missing required key: {required}",
                profile,
                field=required,
            )

    if not isinstance(plan["title"], str) or not plan["title"].strip():
        _raise("INVALID_TITLE", "title must be a non-empty string.", profile)
    if not isinstance(plan["rationale"], str) or not plan["rationale"].strip():
        _raise("INVALID_RATIONALE", "rationale must be a non-empty string.", profile)

    mark = plan["mark"]
    if mark not in ALLOWED_MARKS:
        _raise(
            "UNSUPPORTED_MARK",
            f"mark must be one of: {', '.join(sorted(ALLOWED_MARKS))}",
            profile,
            field=str(mark),
        )

    encoding = plan["encoding"]
    if not isinstance(encoding, dict):
        _raise("INVALID_ENCODING", "encoding must be an object.", profile)
    if not {"x", "y"}.issubset(encoding):
        _raise("MISSING_CHANNEL", "encoding must define both x and y.", profile)

    unexpected_channels = sorted(set(encoding) - ALLOWED_CHANNELS)
    if unexpected_channels:
        _raise(
            "UNSUPPORTED_CHANNEL",
            f"Unsupported channel: {unexpected_channels[0]}",
            profile,
            channel=unexpected_channels[0],
        )

    for channel, definition in encoding.items():
        if not isinstance(definition, dict):
            _raise(
                "INVALID_CHANNEL",
                f"{channel} must be an object.",
                profile,
                channel=channel,
            )
        unexpected_channel_keys = sorted(set(definition) - CHANNEL_KEYS)
        if unexpected_channel_keys:
            _raise(
                "FORBIDDEN_CHANNEL_KEY",
                f"Unsupported key in {channel}: {unexpected_channel_keys[0]}",
                profile,
                field=unexpected_channel_keys[0],
                channel=channel,
            )
        if "field" not in definition or "type" not in definition:
            _raise(
                "INCOMPLETE_CHANNEL",
                f"{channel} must name a field and semantic type.",
                profile,
                channel=channel,
            )

        field = definition["field"]
        if field not in profile["fields"]:
            _raise(
                "UNKNOWN_FIELD",
                f"Field '{field}' is not present in the profiled dataset.",
                profile,
                field=str(field),
                channel=channel,
            )

        field_type = definition["type"]
        if field_type not in ALLOWED_TYPES:
            _raise(
                "UNSUPPORTED_TYPE",
                f"Unsupported semantic type: {field_type}",
                profile,
                field=field,
                channel=channel,
            )
        inferred = profile["fields"][field]["type"]
        compatible = field_type == inferred or (
            inferred == "nominal" and field_type == "ordinal"
        )
        if not compatible:
            _raise(
                "TYPE_MISMATCH",
                f"Field '{field}' was profiled as {inferred}, not {field_type}.",
                profile,
                field=field,
                channel=channel,
            )

        aggregate = definition.get("aggregate")
        if aggregate is not None:
            if aggregate not in ALLOWED_AGGREGATES:
                _raise(
                    "UNSUPPORTED_AGGREGATE",
                    f"Unsupported aggregate: {aggregate}",
                    profile,
                    field=field,
                    channel=channel,
                )
            if aggregate != "count" and inferred != "quantitative":
                _raise(
                    "INVALID_AGGREGATE_FIELD",
                    f"Aggregate '{aggregate}' requires a quantitative field.",
                    profile,
                    field=field,
                    channel=channel,
                )

        sort = definition.get("sort")
        if sort is not None and sort not in ALLOWED_SORTS:
            _raise(
                "UNSUPPORTED_SORT",
                f"Unsupported sort value: {sort}",
                profile,
                field=field,
                channel=channel,
            )

        if channel == "color":
            unique_count = profile["fields"][field]["unique"]
            if unique_count > 12:
                _raise(
                    "HIGH_CARDINALITY_COLOR",
                    f"Color field '{field}' has {unique_count} unique values (maximum allowed is 12).",
                    profile,
                    field=field,
                    channel=channel,
                )

    return json.loads(json.dumps(plan))


def compile_spec(plan: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    """TODO 3: compile a validated plan into a data-embedded Vega-Lite v6 spec."""

    encoding = json.loads(json.dumps(plan["encoding"]))

    # Quantitative scale policy for non-bar charts
    if plan["mark"] != "bar":
        for channel in ("x", "y"):
            if channel in encoding and encoding[channel].get("type") == "quantitative":
                scale = dict(encoding[channel].get("scale", {}))
                scale["zero"] = False
                encoding[channel]["scale"] = scale

    # Label angle policy for nominal/ordinal x-axis
    if "x" in encoding and encoding["x"].get("type") in ("nominal", "ordinal"):
        axis = dict(encoding["x"].get("axis", {}))
        axis["labelAngle"] = 0
        encoding["x"]["axis"] = axis

    spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        "title": plan["title"],
        "mark": {"type": plan["mark"], "tooltip": True},
        "data": {"values": rows},
        "encoding": encoding,
        "width": 600,
        "height": 400,
    }

    return spec


def render_spec(spec: dict[str, Any], output_path: Path) -> None:
    """Provided capability: render a validated spec without network access."""

    try:
        import vl_convert as vlc
    except ImportError as exc:
        raise RuntimeError(
            "vl-convert-python is required; install requirements.txt first"
        ) from exc
    png = vlc.vegalite_to_png(vl_spec=json.dumps(spec), scale=2)
    output_path.write_bytes(png)


def _write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def _append_event(trace: dict[str, Any], event: str, **payload: Any) -> None:
    trace["events"].append(
        {"seq": len(trace["events"]) + 1, "event": event, **payload}
    )


def grade_artifacts(output_dir: Path) -> dict[str, Any]:
    checks = {
        "chart_png": (output_dir / "chart.png").stat().st_size > 1000,
        "spec_json": (output_dir / "spec.json").stat().st_size > 100,
        "rationale_md": (output_dir / "rationale.md").stat().st_size > 40,
        "trace_json": (output_dir / "trace.json").stat().st_size > 100,
    }
    return {"passed": all(checks.values()), "checks": checks}


def run_harness(
    *,
    dataset_path: Path,
    cases_path: Path,
    case_id: str,
    output_dir: Path,
    max_revisions: int = 1,
    planner: Any | None = None,
) -> dict[str, Any]:
    """TODO 4: build the bounded propose -> validate -> revise -> render loop."""

    rows, profile = profile_csv(dataset_path)
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    if case_id not in cases:
        raise KeyError(f"Case '{case_id}' not found in {cases_path}")

    case = cases[case_id]
    question = case["question"]
    if planner is None:
        planner = ReplayPlanner(case["plans"])

    trace: dict[str, Any] = {"case_id": case_id, "events": []}
    _append_event(
        trace,
        "profile_dataset",
        dataset=str(dataset_path),
        row_count=profile["row_count"],
    )

    observation: dict[str, Any] | None = None
    max_attempts = max_revisions + 1

    for attempt in range(1, max_attempts + 1):
        plan = planner.propose(question, profile, observation)
        _append_event(trace, "plan_proposed", attempt=attempt, plan=plan)

        try:
            validated_plan = validate_plan(plan, profile)
            _append_event(trace, "plan_accepted", attempt=attempt, plan=validated_plan)

            spec = compile_spec(validated_plan, rows)
            output_dir.mkdir(parents=True, exist_ok=True)

            render_spec(spec, output_dir / "chart.png")
            _write_json(output_dir / "spec.json", spec)
            (output_dir / "rationale.md").write_text(
                validated_plan["rationale"] + "\n", encoding="utf-8"
            )
            _append_event(trace, "artifacts_written", output_dir=str(output_dir))
            _write_json(output_dir / "trace.json", trace)

            grade = grade_artifacts(output_dir)
            _append_event(trace, "grade", grade=grade)
            _append_event(
                trace, "terminal", status="success", attempts=attempt, grade=grade
            )
            _write_json(output_dir / "trace.json", trace)

            return {
                "status": "success",
                "attempts": attempt,
                "grade": grade,
                "spec": spec,
            }
        except PlanValidationError as exc:
            observation = exc.as_observation()
            _append_event(
                trace, "plan_rejected", attempt=attempt, observation=observation
            )
            if attempt >= max_attempts:
                output_dir.mkdir(parents=True, exist_ok=True)
                _append_event(
                    trace,
                    "terminal",
                    status="failure",
                    attempts=attempt,
                    error=observation["message"],
                )
                _write_json(output_dir / "trace.json", trace)
                return {
                    "status": "failure",
                    "attempts": attempt,
                    "error": observation,
                    "grade": {"passed": False},
                }

    raise RuntimeError("Unexpected loop exit in run_harness")


def run_evals(
    *,
    dataset_path: Path,
    cases_path: Path,
    output_root: Path,
    planner_factory: Any | None = None,
) -> dict[str, Any]:
    """Provided evaluator: a completed run_harness() should pass all cases."""

    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    results: list[dict[str, Any]] = []
    for case_id, case in cases.items():
        planner = planner_factory() if planner_factory else None
        summary = run_harness(
            dataset_path=dataset_path,
            cases_path=cases_path,
            case_id=case_id,
            output_dir=output_root / case_id,
            planner=planner,
        )
        spec = json.loads(
            (output_root / case_id / "spec.json").read_text(encoding="utf-8")
        )
        mark = spec["mark"]["type"]
        fields = sorted(
            definition["field"] for definition in spec["encoding"].values()
        )
        expected = case["expected"]
        checks = {
            "terminal_status": summary["status"]
            == expected["terminal_status"],
            "attempts": summary["attempts"] == expected["attempts"]
            if planner is None
            else summary["status"] == "success",
            "mark": mark == expected["mark"],
            "fields": fields == sorted(expected["fields"]),
            "artifacts": summary["grade"]["passed"],
        }
        results.append(
            {"case_id": case_id, "passed": all(checks.values()), "checks": checks}
        )
    return {
        "passed": all(result["passed"] for result in results),
        "passed_cases": sum(result["passed"] for result in results),
        "total_cases": len(results),
        "results": results,
    }


def _create_planner(provider: str, model: str | None) -> Any:
    if provider == "openai":
        return OpenAIPlanner(model=model or "gpt-4o-mini")
    elif provider == "openrouter":
        return OpenAIPlanner(
            model=model or "google/gemini-2.5-flash",
            base_url="https://openrouter.ai/api/v1/chat/completions",
            api_key=os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY"),
        )
    elif provider == "gemini":
        return GeminiPlanner(model=model or "gemini-2.5-flash")
    else:
        raise ValueError(f"Unknown provider: {provider}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the visualization harness lab")
    parser.add_argument("--case", default="rating_recovery")
    parser.add_argument("--eval", action="store_true", help="run every replay case")
    parser.add_argument("--live", action="store_true", help="use live model planner")
    parser.add_argument(
        "--provider",
        choices=["gemini", "openai", "openrouter"],
        default="gemini",
        help="LLM provider (gemini, openai, openrouter)",
    )
    parser.add_argument(
        "--model", default=None, help="Model name (e.g. gpt-4o-mini, gemini-2.5-flash)"
    )
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    planner_factory = (lambda: _create_planner(args.provider, args.model)) if args.live else None

    if args.eval:
        output = args.output or PART_DIR / "outputs" / ("live_evals" if args.live else "evals")
        result = run_evals(
            dataset_path=args.dataset,
            cases_path=args.cases,
            output_root=output,
            planner_factory=planner_factory,
        )
    else:
        output = args.output or PART_DIR / "outputs" / args.case
        planner = _create_planner(args.provider, args.model) if args.live else None
        result = run_harness(
            dataset_path=args.dataset,
            cases_path=args.cases,
            case_id=args.case,
            output_dir=output,
            planner=planner,
        )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
