"""Student implementation surface for the Memory Map assignment."""

from __future__ import annotations

import os
from typing import Any

from pydantic import SecretStr

from neo4j_agent_memory import MemoryClient, MemorySettings, Neo4jConfig
from neo4j_agent_memory.config.settings import (
    ExtractionConfig,
    ExtractorType,
    ResolutionConfig,
    ResolverStrategy,
)


class DisabledEmbedder:
    """Keep vector plumbing inert while this assignment isolates graph memory.

    MemoryClient sizes Neo4j's vector indexes at connection time. The assignment
    never requests embeddings, so this provider is deliberately not a semantic
    search model. Slide 6 explains why zero vectors are not semantic memory.
    """

    dimensions = 8

    async def embed(self, text: str) -> list[float]:
        return [0.0] * self.dimensions

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [[0.0] * self.dimensions for _ in texts]


def build_settings() -> MemorySettings:
    return MemorySettings(
        neo4j=Neo4jConfig(
            uri=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            username=os.getenv("NEO4J_USERNAME", "neo4j"),
            password=SecretStr(os.getenv("NEO4J_PASSWORD", "class-memory")),
        ),
        llm=None,
        extraction=ExtractionConfig(
            extractor_type=ExtractorType.NONE,
            enable_llm_fallback=False,
        ),
        resolution=ResolutionConfig(strategy=ResolverStrategy.NONE),
    )


class MemoryStore:
    def __init__(self) -> None:
        self.client = MemoryClient(build_settings(), embedder=DisabledEmbedder())

    async def connect(self) -> None:
        await self.client.connect()

    async def close(self) -> None:
        await self.client.close()

    async def store_connection(
        self,
        source_name: str,
        source_type: str,
        relationship_type: str,
        target_name: str,
        target_type: str,
        note: str = "",
    ) -> dict[str, Any]:
        """Create two entities and one typed relationship.

        TODO 1: use client.long_term.add_entity() twice. For this assignment,
        pass generate_embedding=False, resolve=False, deduplicate=False,
        geocode=False, and enrich=False.

        TODO 2: pass the returned Entity objects to
        client.long_term.add_relationship(). Normalize relationship_type to
        UPPER_SNAKE_CASE before storing it.
        """
        raise NotImplementedError("Complete Exercises 2 and 3")

    async def export_graph(self) -> dict[str, Any]:
        """Return the long-term graph in browser-ready JSON.

        TODO 3: call client.get_graph(memory_types=["long_term"]) and return
        graph.model_dump(mode="json", fallback=str). The fallback converts
        Neo4j temporal property objects at the JSON boundary. Do not include
        embedding vectors.
        """
        raise NotImplementedError("Complete Exercise 4")

    async def neighbors(self, name: str) -> list[dict[str, Any]]:
        """Return one-hop neighbors using the client's read-only Cypher API.

        TODO 4: call client.query.cypher() with a parameterized query. Match an
        Entity by name or canonical_name, traverse one relationship in either
        direction, and return source, coalesce(rel.type, type(rel)) as the
        semantic relationship, target, and description. Never interpolate
        `name` into the Cypher string.
        """
        raise NotImplementedError("Complete Exercise 5")
