#!/usr/bin/env python3
"""Low-cost checks for assignment support files."""

from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

for path in sorted(ROOT.rglob("*.py")):
    ast.parse(path.read_text(), filename=str(path))

starter = (ROOT / "starter" / "memory_store.py").read_text()
assert starter.count("NotImplementedError") == 3
assert "generate_embedding=False" in starter
assert 'memory_types=["long_term"]' in starter

instructor = (ROOT / "instructor" / "memory_store.py").read_text()
assert 'client.get_graph(' in instructor
assert 'model_dump(mode="json", fallback=str)' in instructor
assert 'client.query.cypher(query, {"name": name})' in instructor
assert "MATCH (source:Entity)-[rel]-(target:Entity)" in instructor
assert "coalesce(rel.type, type(rel)) AS relationship" in instructor

html = (ROOT / "static" / "index.html").read_text()
js = (ROOT / "static" / "app.js").read_text()
assert "/api/connections" in js and "/api/graph" in js and "/api/neighbors/" in js
assert "Persistent graph" in html

print("PASS: Python syntax, starter TODO contract, instructor SDK calls, and web routes")
