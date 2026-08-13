"""Question bank for the Neo4j Agent Memory pre/post quiz."""

CATEGORY_LABELS = {
    "retrieval": "Memory Systems and Retrieval",
    "sdk_mcp": "SDKs and Model Context Protocol",
    "repository": "Neo4j Agent Memory Source and Practice",
}

QUESTIONS = [
    # Memory Systems and Retrieval
    {
        "id": "m1", "category": "retrieval", "type": "short_answer",
        "prompt": "What two-word retrieval family matches literal terms or token patterns rather than meaning represented as coordinates?",
        "canonical": "lexical search",
        "aliases": ["text search", "keyword search", "full text search", "full-text search"],
        "explanation": "Lexical search is strongest when exact words, identifiers, names, or rare strings matter. It is not the same mechanism as embedding similarity.",
    },
    {
        "id": "m2", "category": "retrieval", "type": "short_answer",
        "prompt": "What numeric representation lets a system retrieve items whose meanings are close even when their wording differs?",
        "canonical": "embedding",
        "aliases": ["vector embedding", "embeddings", "dense vector", "vector"],
        "explanation": "An embedding maps an item into a vector space. A similarity index can retrieve nearby vectors, subject to the model, metric, filters, and corpus used.",
    },
    {
        "id": "m3", "category": "retrieval", "type": "short_answer",
        "prompt": "What operation follows explicit relationships from one node to neighboring or multi-hop nodes in a graph?",
        "canonical": "graph traversal",
        "aliases": ["traversal", "graph walk", "relationship traversal"],
        "explanation": "Graph traversal answers structural questions by following stored edges. It differs from ranking documents or vectors by query similarity.",
    },
    {
        "id": "m4", "category": "retrieval", "type": "multiple_choice",
        "prompt": "A user asks, 'Which engine did Ada write about, and which people influenced that work?' Which primary mechanism best preserves the requested structure?",
        "choices": [
            "A substring scan over raw chat transcripts",
            "A nearest-neighbor search over document embeddings only",
            "A graph traversal over typed entities and relationships",
            "A chronological sort of every stored message",
        ],
        "answer": 2,
        "explanation": "The question names entities and relationship paths. A graph represents that structure directly; text and vectors may still help locate candidates or evidence.",
    },
    {
        "id": "m5", "category": "retrieval", "type": "multiple_choice",
        "prompt": "Which mechanism should lead when the query is an exact error code such as NEO.CLIENTERROR.SCHEMA.INDEXNOTFOUND?",
        "choices": [
            "Lexical or exact-match retrieval",
            "Unfiltered vector similarity",
            "A two-hop relationship expansion",
            "Random sampling from recent memories",
        ],
        "answer": 0,
        "explanation": "Exact identifiers are high-value lexical signals. Semantic similarity can complement the lookup, but it should not replace an exact match.",
    },
    {
        "id": "m6", "category": "retrieval", "type": "multiple_choice",
        "prompt": "Which ordering best describes a defensible memory lifecycle?",
        "choices": [
            "Retrieve, display, then decide whether the source was trustworthy",
            "Embed every input, discard provenance, then merge all duplicates",
            "Store raw text forever and infer relationships at every read",
            "Ingest, normalize, resolve identity, index, retrieve, and evaluate",
        ],
        "answer": 3,
        "explanation": "Retrieval cannot repair missing provenance, unsafe writes, unresolved identities, or an index built for the wrong question.",
    },
    {
        "id": "m7", "category": "retrieval", "type": "true_false",
        "prompt": "A high vector-similarity score proves that the retrieved claim is factually correct and current.",
        "answer": False,
        "explanation": "False. Similarity is a ranking signal, not a truth or freshness guarantee. Provenance, scope, temporal policy, and validation still matter.",
    },
    {
        "id": "m8", "category": "retrieval", "type": "true_false",
        "prompt": "A property graph can store entities as nodes and make typed relationships first-class queryable data.",
        "answer": True,
        "explanation": "True. Nodes and relationships can carry properties, and traversal can select paths using labels, relationship types, and predicates.",
    },

    # SDKs and Model Context Protocol
    {
        "id": "s1", "category": "sdk_mcp", "type": "short_answer",
        "prompt": "What three-letter term names a language-facing package of types, methods, helpers, and lifecycle conventions for using a service or subsystem?",
        "canonical": "SDK",
        "aliases": ["software development kit", "an sdk"],
        "explanation": "An SDK gives application code a native programming interface and may wrap local code, a network API, or both.",
    },
    {
        "id": "s2", "category": "sdk_mcp", "type": "short_answer",
        "prompt": "What protocol lets a compatible host discover prompts, resources, and tools exposed by an external server?",
        "canonical": "MCP",
        "aliases": ["Model Context Protocol", "the Model Context Protocol"],
        "explanation": "MCP standardizes host-client-server connection and capability discovery. It does not replace host orchestration or authorization policy.",
    },
    {
        "id": "s3", "category": "sdk_mcp", "type": "multiple_choice",
        "prompt": "In an MCP deployment, which component owns the user-facing application, model access, orchestration, and consent experience?",
        "choices": [
            "The data store behind the server",
            "The host application",
            "The transport framing layer",
            "Each individual tool implementation",
        ],
        "answer": 1,
        "explanation": "The host coordinates MCP clients, decides what reaches the model, and owns the broader application policy.",
    },
    {
        "id": "s4", "category": "sdk_mcp", "type": "multiple_choice",
        "prompt": "Which mapping of MCP primitives to their usual controlling party is correct?",
        "choices": [
            "Prompts are model-controlled; resources are user-controlled; tools are server-controlled",
            "Prompts are server-controlled; resources are model-controlled; tools are user-controlled",
            "All three primitives are controlled exclusively by the language model",
            "Prompts are user-controlled; resources are application-controlled; tools are model-controlled",
        ],
        "answer": 3,
        "explanation": "The labels describe who normally initiates selection. A model-controlled tool remains subject to host authorization and server validation.",
    },
    {
        "id": "s5", "category": "sdk_mcp", "type": "multiple_choice",
        "prompt": "A FastAPI route must validate a form, write two graph entities, create an edge, and return JSON. Why is the SDK the clearest primary interface?",
        "choices": [
            "The application owns the exact workflow and can call typed methods directly",
            "An SDK removes the need for credentials and input validation",
            "MCP cannot expose write tools under any circumstances",
            "The SDK guarantees every backend supports identical methods",
        ],
        "answer": 0,
        "explanation": "Direct SDK calls fit application-owned control flow. MCP is useful when an external compatible host should discover capabilities dynamically.",
    },
    {
        "id": "s6", "category": "sdk_mcp", "type": "true_false",
        "prompt": "Calling MCP tools 'model-controlled' means a model may request them, while the host and server can still deny or validate the call.",
        "answer": True,
        "explanation": "True. Control initiation is not blanket authority. Hosts govern exposure and consent; servers validate arguments, identity, and domain rules.",
    },
    {
        "id": "s7", "category": "sdk_mcp", "type": "true_false",
        "prompt": "An MCP server determines the host application's retry budget, stopping rule, and definition of overall task success.",
        "answer": False,
        "explanation": "False. The server implements capabilities and protocol behavior. The host owns the enclosing workflow and completion criteria.",
    },
    {
        "id": "s8", "category": "sdk_mcp", "type": "true_false",
        "prompt": "An MCP client and server negotiate protocol version and capabilities during initialization before normal operation begins.",
        "answer": True,
        "explanation": "True. Initialization establishes compatibility and declared capabilities before ordinary requests and notifications are exchanged.",
    },

    # Neo4j Agent Memory Source and Practice
    {
        "id": "r1", "category": "repository", "type": "short_answer",
        "prompt": "Which top-level Python class connects to the configured backend and exposes short_term, long_term, reasoning, and query accessors?",
        "canonical": "MemoryClient",
        "aliases": ["memory client", "the MemoryClient class", "neo4j_agent_memory.MemoryClient"],
        "explanation": "MemoryClient is the public SDK entry point. Its lifecycle wraps backend initialization while its accessor names remain stable.",
    },
    {
        "id": "r2", "category": "repository", "type": "short_answer",
        "prompt": "Which backend name selects a direct Neo4j driver connection rather than the hosted NAMS REST service?",
        "canonical": "bolt",
        "aliases": ["the bolt backend", "Bolt"],
        "explanation": "The bolt backend connects directly to Neo4j and exposes graph-specific capabilities. NAMS has a different capability surface.",
    },
    {
        "id": "r3", "category": "repository", "type": "short_answer",
        "prompt": "Which MemoryClient method exports selected memory layers as nodes and relationships for visualization?",
        "canonical": "get_graph",
        "aliases": ["get_graph()", "MemoryClient.get_graph", "memory.get_graph"],
        "explanation": "get_graph accepts memory_types and include_embeddings controls, returning a graph-shaped result suitable for a UI.",
    },
    {
        "id": "r4", "category": "repository", "type": "multiple_choice",
        "prompt": "Which query style best protects a neighbor lookup whose entity name comes from a browser form?",
        "choices": [
            "Concatenate the form value into a Cypher string after trimming whitespace",
            "Use a fixed Cypher statement with a $name parameter map",
            "Ask an LLM to rewrite the form value as safe Cypher",
            "Permit only names already present in exported graph JSON",
        ],
        "answer": 1,
        "explanation": "Parameterized Cypher separates code from data. The assignment also normalizes relationship types to a restricted identifier.",
    },
    {
        "id": "r5", "category": "repository", "type": "multiple_choice",
        "prompt": "The assignment isolates graph persistence and does not configure an embedding provider. Which add_entity options make that intent explicit?",
        "choices": [
            "resolve=True and enrich=True",
            "geocode=True and deduplicate=True",
            "generate_embedding=False and resolve=False",
            "include_embeddings=True and enable_llm_fallback=True",
        ],
        "answer": 2,
        "explanation": "The reference app disables embedding generation and entity resolution, then uses graph export and parameterized traversal.",
    },
    {
        "id": "r6", "category": "repository", "type": "true_false",
        "prompt": "The repository models short-term conversation memory, long-term knowledge memory, and reasoning traces as distinct layers that can share a Neo4j graph.",
        "answer": True,
        "explanation": "True. The layers have different data models and accessors even though the bolt backend stores them in one graph database.",
    },
    {
        "id": "r7", "category": "repository", "type": "true_false",
        "prompt": "The published Python and TypeScript SDKs were verified for this lesson at the same package version.",
        "answer": False,
        "explanation": "False. On 13 August 2026 the verified releases were Python 0.5.0 and TypeScript 0.4.1; main source can move beyond both.",
    },
    {
        "id": "r8", "category": "repository", "type": "true_false",
        "prompt": "Stopping the FastAPI process necessarily deletes memories already committed to the still-running Neo4j database.",
        "answer": False,
        "explanation": "False. The app is a client. Persisted nodes and relationships remain in Neo4j, and the assignment proves this by reconnecting.",
    },
]
