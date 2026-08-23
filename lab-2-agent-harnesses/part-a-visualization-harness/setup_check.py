#!/usr/bin/env python3
"""Capability-based setup check for the visualization harness lab."""

from __future__ import annotations

import json
import platform
import sys


def main() -> None:
    if sys.version_info < (3, 10):
        raise SystemExit("Python 3.10 or newer is required.")
    try:
        import vl_convert as vlc
    except ImportError as exc:
        raise SystemExit(
            "vl-convert-python is missing. Activate the environment and install requirements.txt."
        ) from exc

    probe = {
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        "data": {"values": [{"x": "ready", "y": 1}]},
        "mark": "bar",
        "encoding": {
            "x": {"field": "x", "type": "nominal"},
            "y": {"field": "y", "type": "quantitative"},
        },
    }
    png = vlc.vegalite_to_png(vl_spec=json.dumps(probe))
    if not png.startswith(b"\x89PNG"):
        raise SystemExit("Renderer returned data that is not a PNG.")
    print(f"READY — Python {platform.python_version()}, renderer produced {len(png)} bytes")


if __name__ == "__main__":
    main()
