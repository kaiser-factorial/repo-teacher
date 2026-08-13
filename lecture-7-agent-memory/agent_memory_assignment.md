# Neo4j Agent Memory — SDKs, MCP, and Graph-Native Persistence

## Assignment: Build a Persistent Memory Map

Build a small browser app that stores named entities and typed relationships in Neo4j through the `neo4j-agent-memory` Python SDK. The graph must survive an application restart, render in the browser, and support a safe one-hop neighbor lookup.

This assignment deliberately isolates **graph memory**. It does not call an LLM, create semantic embeddings, or pretend that zero vectors are meaningful similarity search. Slides 4–8 explain when text, vectors, graphs, and hybrids answer different questions; Slides 21–26 connect that choice to the repository's SDK and MCP surfaces.

### Deliverables

Submit:

1. Your completed `assignment_support/starter/memory_store.py`.
2. A screenshot of the rendered graph containing at least three entities and two relationships.
3. A short persistence proof showing the same relationship before and after restarting the FastAPI process.
4. Your responses to every **Reflect** prompt below.

The browser, routes, validation models, and styling are supplied. Your implementation surface is intentionally narrow: four SDK operations in `starter/memory_store.py`.

## 0. Setup and capability check

From this lesson directory:

```bash
cd assignment_support
cp .env.example .env
docker compose up -d

uv venv --python 3.12
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python -c "import neo4j_agent_memory; print('SDK import: OK')"
```

The lesson pins `neo4j-agent-memory==0.5.0`. The deck also records the separately verified TypeScript release and the main-branch commit used for source reading (Slide 27). If you use a newer release, record the version and re-run every behavior check; do not assume backend parity from the version number alone.

The support requirements also install `httpx` explicitly. In the verified `0.5.0` wheel, the bolt connection path imports a NAMS transport module during initialization, while `httpx` is not present in the base dependency set. Keep the explicit line unless a later release both fixes the import boundary and passes the live reference check.

Open these source files in the upstream repository before coding:

- `src/neo4j_agent_memory/__init__.py` — `MemoryClient` and `get_graph()`
- `src/neo4j_agent_memory/memory/long_term.py` — entity and relationship writes
- `src/neo4j_agent_memory/mcp/_tools.py` — SDK operations exposed as MCP tools

**Reflect:** What does `MemoryClient` own that a single raw Cypher statement does not? Name at least two lifecycle or capability concerns. *(Slides 10–12 and 21.)*

## 1. Trace the supplied webapp boundary

Read:

- `starter/app.py` — FastAPI lifecycle and three JSON routes
- `static/app.js` — form submission, graph export, and lookup requests
- `starter/memory_store.py` — the incomplete SDK adapter

Sketch this call path with one phrase on each arrow:

```text
browser → FastAPI route → MemoryStore → MemoryClient → Neo4j
```

The FastAPI process owns validation and response shaping. `MemoryClient` owns the SDK connection and memory methods. Neo4j owns durable graph state. This is the SDK path from Slide 26, not an MCP host dynamically selecting tools.

**Reflect:** Which layer should reject an empty entity name? Which layer should preserve the node after FastAPI stops? Explain why those responsibilities differ.

## 2. Store two long-term entities

Implement the two `client.long_term.add_entity()` calls in `store_connection()`.

For each call, explicitly pass:

```python
generate_embedding=False
resolve=False
deduplicate=False
geocode=False
enrich=False
```

Use the submitted note as the source entity's description. The starter config also disables extraction and resolution and supplies a `DisabledEmbedder` only because the bolt backend sizes vector indexes during connection. The app never asks that object to produce meaningful embeddings.

**Checkpoint:** Print or inspect the returned `Entity` objects. Identify the stable IDs you will pass to the relationship write.

**Reflect:** Why would enabling deduplication or entity resolution change this from a graph-persistence exercise into a harder identity-policy exercise? *(Slides 7–9 and 28.)*

## 3. Create a typed relationship

Normalize the submitted relationship label to uppercase snake case before storage. For example:

```text
wrote about → WROTE_ABOUT
depends-on  → DEPENDS_ON
```

Reject a value that contains no letter or number. Then call `client.long_term.add_relationship(source, target, relationship_type, description=...)` with the returned entity objects. In the bolt schema, this becomes a physical `RELATED_TO` edge whose `type` property carries the semantic label such as `WROTE_ABOUT`.

Return JSON containing the source, target, and relationship IDs plus the stored relationship type. The supplied browser uses that response for feedback.

**Checkpoint:** Store this exact seed:

```text
Ada Lovelace (PERSON) — WROTE_ABOUT → Analytical Engine (OBJECT)
```

**Reflect:** Why is a relationship type more useful than burying “wrote about” in a paragraph attached to Ada? Give one query the typed edge makes easier. *(Slides 7 and 22.)*

## 4. Export graph-shaped memory

Implement `export_graph()` with:

```python
graph = await self.client.get_graph(
    memory_types=["long_term"],
    include_embeddings=False,
)
```

Return `graph.model_dump(mode="json", fallback=str)`. In the verified `0.5.0` bolt result, properties can include Neo4j temporal objects that strict Pydantic JSON serialization does not know how to encode. The fallback converts those boundary values without changing the SDK model used inside Python. Do not expose embedding properties to the browser.

Start your implementation:

```bash
.venv/bin/uvicorn app:app --reload --app-dir starter --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000`, submit the seed relationship, and confirm that the SVG contains two labeled nodes and an edge.

**Reflect:** Why is `get_graph()` an export boundary rather than a general ranking algorithm? What would a vector search return instead? *(Slides 6, 23, and 24.)*

## 5. Add a parameterized traversal

Implement `neighbors(name)` with `client.query.cypher(query, {"name": name})`.

Your fixed query must:

- match `Entity` nodes by `name` or `canonical_name`, case-insensitively;
- traverse one relationship in either direction;
- return `source`, `coalesce(rel.type, type(rel)) AS relationship`, `target`, and `description`;
- apply a small result limit; and
- keep the submitted name out of the Cypher source string.

Use the lookup form to search for `Ada Lovelace`. Then try this input:

```text
' MATCH (n) DETACH DELETE n //
```

It should be treated as a literal name and return no matches—not become executable Cypher.

**Reflect:** Parameterization protects values. What additional restriction would you need if the browser were allowed to choose a label, property key, or arbitrary Cypher fragment? *(Slides 24 and 28.)*

## 6. Prove persistence across an app restart

Persistence is the acceptance test, not an optional observation.

1. With Neo4j still running, store at least one more relationship.
2. Save a screenshot or JSON copy from `/api/graph`.
3. Stop only the FastAPI process.
4. Start the same command again.
5. Reload the page and retrieve the same relationship.

The named Docker volume `agent_memory_data` also survives `docker compose down`. Running `docker compose down -v` intentionally deletes the volume; use that only when you want to reset your work.

**Reflect:** Which state lived in Python memory, which state lived in Neo4j, and what evidence distinguishes the two? *(Slides 3, 9, and 29.)*

## 7. Compare the SDK call path with MCP

Do not replace the webapp with an agent. Instead, inspect how the repository wraps related SDK calls in `src/neo4j_agent_memory/mcp/_tools.py` and map these boundaries:

| Webapp SDK path | MCP path |
|---|---|
| FastAPI route selects a method | Host/model may request a discovered tool |
| Pydantic route model validates browser input | Tool input schema validates protocol arguments |
| App owns connect/write/export order | Host owns orchestration; server owns tool execution |
| App renders returned JSON | Host decides how tool results enter model or UI context |

Optional: with Neo4j running, inspect the smaller tool catalog:

```bash
uvx "neo4j-agent-memory[mcp]==0.5.0" mcp serve --profile core --password class-memory
```

The default extended profile exposes more graph operations but also consumes more tool-description context (Slide 25). Running the server alone does not supply a model, host UI, approval policy, or overall stopping rule.

**Reflect:** If an MCP host could call `memory_add_entity`, where would you enforce user scope and write authorization: the model prompt, the host, the server, or more than one layer? Defend your answer. *(Slides 13–17 and 28.)*

## 8. Validate and inspect the reference only afterward

Run the low-cost support check:

```bash
.venv/bin/python tests/static_check.py
```

After your own implementation works, compare it with `instructor/memory_store.py`. To run the supplied reference app instead:

```bash
.venv/bin/uvicorn app:app --reload --app-dir instructor --host 127.0.0.1 --port 8000
```

The instructor implementation and live reference check exercise SDK writes, graph export, parameterized traversal, and a new `MemoryClient` connection. On 13 August 2026, the reference passed against Neo4j `5.26-community`, Python 3.12, and the published Python SDK `0.5.0`: two entity writes, one relationship write, JSON-safe graph export, literal handling of an injection-shaped name, and retrieval after reconnecting a fresh client. The run also exposed the explicit `httpx` and temporal-serialization workarounds documented above.

## Overall reflection

In 250–400 words, answer:

1. Which question in your app is answered structurally by graph traversal?
2. Which future feature would genuinely need lexical lookup?
3. Which future feature would genuinely need vectors, and what embedding/provenance policy would it require?
4. Why did the webapp use the SDK while the same repository also exposes MCP?
5. What is the most important unresolved production risk if multiple users share one graph?

Your response should use the mechanisms precisely. “Graph is better memory” is not sufficient; the correct choice depends on the question, lifecycle, scope, and evidence requirements.

## Cleanup

Stop the app with `Ctrl-C`. Preserve the database for later work with:

```bash
docker compose down
```

To intentionally erase the assignment graph and its named volume:

```bash
docker compose down -v
```

## Source basis

- Repository: <https://github.com/neo4j-labs/agent-memory>
- Python SDK release used by the assignment: `neo4j-agent-memory==0.5.0`
- Main-branch source snapshot used by the lesson: `231d60eac9401ab156ba194b519d89dd644dadb8`
- MCP architecture background: <https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture>
