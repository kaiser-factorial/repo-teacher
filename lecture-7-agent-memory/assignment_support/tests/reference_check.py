#!/usr/bin/env python3
"""Live persistence check for the instructor Memory Map implementation."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

SUPPORT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SUPPORT_DIR / "instructor"))

from memory_store import MemoryStore, normalize_relationship  # noqa: E402


async def main() -> None:
    suffix = uuid4().hex[:8]
    source_name = f"Ada Lovelace {suffix}"
    target_name = f"Analytical Engine {suffix}"

    first = MemoryStore()
    await first.connect()
    try:
        stored = await first.store_connection(
            source_name=source_name,
            source_type="PERSON",
            relationship_type="wrote about",
            target_name=target_name,
            target_type="OBJECT",
            note="Persistence verification",
        )
        assert stored["relationship_type"] == "WROTE_ABOUT"
        graph = await first.export_graph()
        ids = {node["id"] for node in graph["nodes"]}
        assert stored["source_id"] in ids
        assert stored["target_id"] in ids
        assert all("embedding" not in node.get("properties", {}) for node in graph["nodes"])
    finally:
        await first.close()

    second = MemoryStore()
    await second.connect()
    try:
        neighbors = await second.neighbors(source_name)
        assert any(
            row["relationship"] == "WROTE_ABOUT" and row["target"] == target_name
            for row in neighbors
        ), neighbors
        injection_probe = await second.neighbors("' MATCH (n) DETACH DELETE n //")
        assert injection_probe == []
        graph = await second.export_graph()
        assert any(node.get("properties", {}).get("name") == source_name for node in graph["nodes"])
    finally:
        await second.close()

    assert normalize_relationship("  depends on  ") == "DEPENDS_ON"
    print("PASS: SDK write, graph export, parameterized traversal, and reconnect persistence")


if __name__ == "__main__":
    asyncio.run(main())
