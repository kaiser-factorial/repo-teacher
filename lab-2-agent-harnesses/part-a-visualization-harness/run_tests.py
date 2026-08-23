#!/usr/bin/env python3
"""Run lab tests against the student scaffold or instructor reference."""

from __future__ import annotations

import argparse
import sys
import unittest
from pathlib import Path

PART_DIR = Path(__file__).resolve().parent


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--implementation",
        choices=["starter", "instructor"],
        default="starter",
    )
    parser.add_argument(
        "--pattern",
        default="test_*.py",
        help="unittest discovery pattern",
    )
    parser.add_argument(
        "--test",
        help="run one dotted unittest name, e.g. test_harness.Class.test_name",
    )
    args = parser.parse_args()

    sys.path.insert(0, str(PART_DIR / args.implementation))
    sys.path.insert(0, str(PART_DIR / "tests"))
    if args.test:
        suite = unittest.defaultTestLoader.loadTestsFromName(args.test)
    else:
        suite = unittest.defaultTestLoader.discover(
            str(PART_DIR / "tests"), pattern=args.pattern
        )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    main()
