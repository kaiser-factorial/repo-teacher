"""Validated reference implementation for the Memory Map assignment."""

from __future__ import annotations

import os
import re
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


def normalize_relationship(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9]+", "_", value.strip()).strip("_").upper()
    if not normalized:
        raise ValueError("relationship_type must contain a letter or number")
    return normalized


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
        common = {
            "generate_embedding": False,
            "resolve": False,
            "deduplicate": False,
            "geocode": False,
            "enrich": False,
        }
        source, _ = await self.client.long_term.add_entity(
            source_name,
            source_type,
            description=note or None,
            **common,
        )
        target, _ = await self.client.long_term.add_entity(
            target_name,
            target_type,
            **common,
        )
        relationship = await self.client.long_term.add_relationship(
            source,
            target,
            normalize_relationship(relationship_type),
            description=note or None,
        )
        return {
            "source_id": str(source.id),
            "target_id": str(target.id),
            "relationship_id": str(relationship.id),
            "relationship_type": relationship.type,
        }

    async def export_graph(self) -> dict[str, Any]:
        graph = await self.client.get_graph(
            memory_types=["long_term"],
            include_embeddings=False,
        )
        # The 0.5.0 bolt result can contain neo4j.time values in properties.
        # Convert only at the JSON boundary, preserving the SDK model internally.
        return graph.model_dump(mode="json", fallback=str)

    async def neighbors(self, name: str) -> list[dict[str, Any]]:
        query = """
        MATCH (source:Entity)-[rel]-(target:Entity)
        WHERE toLower(source.name) = toLower($name)
           OR toLower(source.canonical_name) = toLower($name)
        RETURN source.name AS source,
               coalesce(rel.type, type(rel)) AS relationship,
               target.name AS target,
               rel.description AS description
        ORDER BY relationship, target
        LIMIT 25
        """
        return await self.client.query.cypher(query, {"name": name})
