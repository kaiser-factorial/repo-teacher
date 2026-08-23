#!/usr/bin/env python3
"""Reference implementation for the data-visualization agent harness lab."""

from __future__ import annotations

import argparse
import csv
import json
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
    """Read a CSV, infer three teaching-oriented field kinds, and summarize it."""

    with path.open(newline="", encoding="utf-8") as handle:
        raw_rows = list(csv.DictReader(handle))
    if not raw_rows:
        raise ValueError(f"Dataset is empty: {path}")

    fieldnames = list(raw_rows[0])
    kinds = {
        field: _infer_kind([row.get(field, "") for row in raw_rows])
        for field in fieldnames
    }
    rows = [
        {field: _typed_value(row.get(field, ""), kinds[field]) for field in fieldnames}
        for row in raw_rows
    ]

    fields: dict[str, dict[str, Any]] = {}
    for field in fieldnames:
        values = [row[field] for row in rows]
        present = [value for value in values if value is not None]
        summary: dict[str, Any] = {
            "type": kinds[field],
            "missing": len(values) - len(present),
            "unique": len(set(present)),
            "examples": list(dict.fromkeys(present))[:4],
        }
        if kinds[field] == "quantitative" and present:
            summary["min"] = min(present)
            summary["max"] = max(present)
        fields[field] = summary

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

    return json.loads(json.dumps(plan))


def compile_spec(plan: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Compile a validated plan into a data-embedded Vega-Lite v6 spec."""

    encoding = json.loads(json.dumps(plan["encoding"]))
    if plan["mark"] != "bar":
        for channel in ("x", "y"):
            if encoding[channel]["type"] == "quantitative":
                encoding[channel]["scale"] = {"zero": False}
    if encoding["x"]["type"] in {"nominal", "ordinal"}:
        encoding["x"]["axis"] = {"labelAngle": 0}
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        "title": plan["title"],
        "width": 640,
        "height": 420,
        "data": {"values": rows},
        "mark": {"type": plan["mark"], "tooltip": True},
        "encoding": encoding,
        "config": {
            "view": {"stroke": None},
            "axis": {"labelFontSize": 12, "titleFontSize": 13},
            "legend": {"labelFontSize": 12, "titleFontSize": 13},
        },
    }


def render_spec(spec: dict[str, Any], output_path: Path) -> None:
    """Render a Vega-Lite spec without network access after installation."""

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
) -> dict[str, Any]:
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    if case_id not in cases:
        raise KeyError(f"Unknown replay case: {case_id}")
    case = cases[case_id]
    question = case["question"]
    planner = ReplayPlanner(case["plans"])
    output_dir.mkdir(parents=True, exist_ok=True)

    rows, profile = profile_csv(dataset_path)
    trace: dict[str, Any] = {
        "case_id": case_id,
        "question": question,
        "dataset": dataset_path.name,
        "events": [],
    }
    _append_event(
        trace,
        "profile_complete",
        row_count=profile["row_count"],
        fields=profile["fields"],
    )

    observation: dict[str, Any] | None = None
    attempts = 0
    validated: dict[str, Any] | None = None
    for attempt in range(1, max_revisions + 2):
        attempts = attempt
        proposal = planner.propose(question, profile, observation)
        _append_event(trace, "plan_proposed", attempt=attempt, plan=proposal)
        try:
            validated = validate_plan(proposal, profile)
        except PlanValidationError as exc:
            observation = exc.as_observation()
            _append_event(
                trace,
                "plan_rejected",
                attempt=attempt,
                observation=observation,
            )
            if attempt > max_revisions:
                _append_event(trace, "terminal", status="failed")
                _write_json(output_dir / "trace.json", trace)
                raise
            continue
        _append_event(trace, "plan_accepted", attempt=attempt)
        break

    if validated is None:
        raise RuntimeError("No plan reached validation")

    spec = compile_spec(validated, rows)
    _write_json(output_dir / "spec.json", spec)
    (output_dir / "rationale.md").write_text(
        f"# Chart rationale\n\n{validated['rationale']}\n",
        encoding="utf-8",
    )
    render_spec(spec, output_dir / "chart.png")
    _append_event(
        trace,
        "artifacts_written",
        files=["chart.png", "spec.json", "rationale.md", "trace.json"],
    )
    _append_event(trace, "terminal", status="success", attempts=attempts)
    _write_json(output_dir / "trace.json", trace)

    grade = grade_artifacts(output_dir)
    _append_event(trace, "artifact_grade", **grade)
    _write_json(output_dir / "trace.json", trace)
    return {
        "case_id": case_id,
        "status": "success" if grade["passed"] else "failed",
        "attempts": attempts,
        "output_dir": str(output_dir),
        "grade": grade,
    }


def run_evals(
    *, dataset_path: Path, cases_path: Path, output_root: Path
) -> dict[str, Any]:
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    results: list[dict[str, Any]] = []
    for case_id, case in cases.items():
        summary = run_harness(
            dataset_path=dataset_path,
            cases_path=cases_path,
            case_id=case_id,
            output_dir=output_root / case_id,
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
            "attempts": summary["attempts"] == expected["attempts"],
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the visualization harness lab")
    parser.add_argument("--case", default="rating_recovery")
    parser.add_argument("--eval", action="store_true", help="run every replay case")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if args.eval:
        output = args.output or PART_DIR / "outputs" / "evals"
        result = run_evals(
            dataset_path=args.dataset,
            cases_path=args.cases,
            output_root=output,
        )
    else:
        output = args.output or PART_DIR / "outputs" / args.case
        result = run_harness(
            dataset_path=args.dataset,
            cases_path=args.cases,
            case_id=args.case,
            output_dir=output,
        )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
