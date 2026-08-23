from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import harness


class VisualizationHarnessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = harness.DEFAULT_DATASET
        cls.cases = harness.DEFAULT_CASES
        cls.rows, cls.profile = harness.profile_csv(cls.dataset)
        cls.case_data = json.loads(cls.cases.read_text(encoding="utf-8"))

    def test_01_profile_contract(self):
        self.assertEqual(self.profile["row_count"], 36)
        self.assertEqual(self.profile["fields"]["revenue_usd"]["type"], "quantitative")
        self.assertEqual(self.profile["fields"]["week"]["type"], "temporal")
        self.assertEqual(self.profile["fields"]["neighborhood"]["type"], "nominal")
        self.assertEqual(self.profile["fields"]["avg_rating"]["missing"], 0)

    def test_02_valid_plan_is_accepted(self):
        plan = self.case_data["rating_recovery"]["plans"][1]
        self.assertEqual(harness.validate_plan(plan, self.profile), plan)

    def test_03_unknown_field_becomes_structured_observation(self):
        plan = self.case_data["rating_recovery"]["plans"][0]
        with self.assertRaises(harness.PlanValidationError) as caught:
            harness.validate_plan(plan, self.profile)
        observation = caught.exception.as_observation()
        self.assertEqual(observation["code"], "UNKNOWN_FIELD")
        self.assertEqual(observation["field"], "customer_rating")
        self.assertIn("avg_rating", observation["available_fields"])

    def test_04_external_data_key_is_rejected(self):
        plan = self.case_data["untrusted_plan"]["plans"][0]
        with self.assertRaises(harness.PlanValidationError) as caught:
            harness.validate_plan(plan, self.profile)
        self.assertEqual(caught.exception.code, "FORBIDDEN_TOP_LEVEL_KEY")
        self.assertEqual(caught.exception.field, "data")

    def test_05_compiled_spec_embeds_only_supplied_rows(self):
        plan = harness.validate_plan(
            self.case_data["drink_revenue"]["plans"][0], self.profile
        )
        spec = harness.compile_spec(plan, self.rows)
        self.assertEqual(spec["$schema"], "https://vega.github.io/schema/vega-lite/v6.json")
        self.assertEqual(len(spec["data"]["values"]), 36)
        self.assertNotIn("url", spec["data"])
        self.assertNotIn("rationale", spec)
        self.assertEqual(spec["encoding"]["x"]["axis"], {"labelAngle": 0})

        point_plan = harness.validate_plan(
            self.case_data["rating_recovery"]["plans"][1], self.profile
        )
        point_spec = harness.compile_spec(point_plan, self.rows)
        self.assertEqual(point_spec["encoding"]["x"]["scale"], {"zero": False})

        line_plan = harness.validate_plan(
            self.case_data["weekly_units"]["plans"][0], self.profile
        )
        line_spec = harness.compile_spec(line_plan, self.rows)
        self.assertEqual(line_spec["encoding"]["y"]["scale"], {"zero": False})

    def test_06_designed_failure_recovers_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "rating_recovery"
            summary = harness.run_harness(
                dataset_path=self.dataset,
                cases_path=self.cases,
                case_id="rating_recovery",
                output_dir=output,
            )
            self.assertEqual(summary["status"], "success")
            self.assertEqual(summary["attempts"], 2)
            self.assertTrue(summary["grade"]["passed"])
            for name in ("chart.png", "spec.json", "rationale.md", "trace.json"):
                self.assertTrue((output / name).exists(), name)

    def test_07_trace_reconstructs_rejection_and_revision(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "rating_recovery"
            harness.run_harness(
                dataset_path=self.dataset,
                cases_path=self.cases,
                case_id="rating_recovery",
                output_dir=output,
            )
            trace = json.loads((output / "trace.json").read_text(encoding="utf-8"))
            events = trace["events"]
            names = [event["event"] for event in events]
            self.assertIn("plan_rejected", names)
            self.assertIn("plan_accepted", names)
            self.assertIn("terminal", names)
            self.assertEqual([event["seq"] for event in events], list(range(1, len(events) + 1)))

    def test_08_held_out_replay_evals(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = harness.run_evals(
                dataset_path=self.dataset,
                cases_path=self.cases,
                output_root=Path(tmp) / "evals",
            )
            self.assertTrue(report["passed"], report)
            self.assertEqual(report["passed_cases"], len(self.case_data))
            self.assertEqual(report["total_cases"], len(self.case_data))

    def test_09_high_cardinality_color_recovery(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "cardinality_recovery"
            summary = harness.run_harness(
                dataset_path=self.dataset,
                cases_path=self.cases,
                case_id="cardinality_recovery",
                output_dir=output,
            )
            self.assertEqual(summary["status"], "success")
            self.assertEqual(summary["attempts"], 2)
            self.assertTrue(summary["grade"]["passed"])
            trace = json.loads((output / "trace.json").read_text(encoding="utf-8"))
            rejections = [e for e in trace["events"] if e["event"] == "plan_rejected"]
            self.assertEqual(len(rejections), 1)
            self.assertEqual(rejections[0]["observation"]["code"], "HIGH_CARDINALITY_COLOR")
            self.assertEqual(rejections[0]["observation"]["field"], "revenue_usd")


if __name__ == "__main__":
    unittest.main()
