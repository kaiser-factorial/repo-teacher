# Lecture 7 handoff

## Delivered lesson

**Neo4j Agent Memory — SDKs, MCP, and Graph-Native Persistence**

- 30-slide PowerPoint with standalone memory-system and SDK/MCP background, an explicit source-code bridge, repository internals, released-versus-main caveats, risks, and assignment launch.
- 24-question pre/post quiz: eight short answer, eight multiple choice, eight true/false; eight questions per topic.
- Guided Memory Map assignment with starter code, a complete instructor reference, local Neo4j Compose file, browser UI, and verification scripts.

## Source snapshot

- Repository: `https://github.com/neo4j-labs/agent-memory`
- Main commit inspected: `231d60eac9401ab156ba194b519d89dd644dadb8`
- Python release verified: `neo4j-agent-memory==0.5.0` on Python 3.12
- TypeScript release import verified: `@neo4j-labs/agent-memory==0.4.1` on Node 26
- MCP architecture reference checked: protocol documentation dated `2026-07-28`

## Validation evidence

- Deck rebuilt to 30 slides and visually inspected slide by slide.
- PowerPoint ZIP integrity and slide-overflow checks passed.
- Quiz content hardening passed keyword-echo, prior-answer leakage, mashable-fragment, answer-distribution, pre-test-integrity, and hedge checks.
- Quiz scoring passed all-correct, all-wrong, and mixed-result scenarios.
- Assignment static checks passed.
- Instructor reference passed live against `neo4j:5.26-community`: entity and relationship writes, graph export, parameterized traversal, an injection-shaped literal probe, close/reconnect, and persistence retrieval.
- The health-checked instructor web server passed an HTTP POST write, graph JSON read, and neighbor-route read.
- `.devserver.toml` provides a health-checked instructor target after `assignment_support/.venv` is created.

## Released-package wrinkles preserved in the lesson

1. The `0.5.0` bolt connect path imports a NAMS transport module, so the assignment installs `httpx` explicitly even though the base wheel does not.
2. Bolt graph export can contain `neo4j.time` property values. The web boundary uses `model_dump(mode="json", fallback=str)`.
3. `add_relationship(..., semantic_type)` persists a physical `RELATED_TO` relationship with the semantic label in `rel.type`; custom traversal reads `coalesce(rel.type, type(rel))`.
4. The assignment disables extraction, entity resolution, deduplication, enrichment, geocoding, and embedding generation so the exercise stays about graph persistence rather than silently becoming an LLM or vector-search lab.

## Recheck before teaching

Package versions, MCP tool profiles, NAMS parity, and open issues can drift. Re-run the install, live reference, quiz, and deck render checks before a future cohort. Do not remove the two package workarounds without verifying the released wheel and live bolt path.
