import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = process.env.REPO_TEACHER_BUILD || path.join(SCRIPT_DIR, ".deck-build");
const OUTPUT_DIR = process.env.REPO_TEACHER_OUT || SCRIPT_DIR;
const OUTPUT_PPTX = path.join(OUTPUT_DIR, "Agent_Memory_Lecture.pptx");
const ASSET_DIR = path.join(SCRIPT_DIR, "assets");

const W = 1280;
const H = 720;
const NAVY = "#0B2942";
const MIDNIGHT = "#21295C";
const DEEPBLUE = "#065A82";
const TEAL = "#1C7293";
const ICE = "#CFE8F0";
const WHITE = "#FFFFFF";
const INK = "#1B2733";
const MUTE = "#5C7080";
const CARD = "#F2F8FA";
const SEAFOAM = "#DDF4EF";
const AMBER = "#F4C95D";
const CORAL = "#E76F51";
const GRID = "#8FAAB8";
const PALE_GOLD = "#FFF7DA";
const PALE_CORAL = "#FFF1ED";

const FONT_TITLE = "Cambria";
const FONT_BODY = "Calibri";
const FONT_CODE = "Courier New";

const URL = {
  repo: "https://github.com/neo4j-labs/agent-memory",
  readme: "https://github.com/neo4j-labs/agent-memory/blob/main/README.md",
  memoryTypes: "https://neo4j.com/labs/agent-memory/explanation/memory-types/",
  poleo: "https://neo4j.com/labs/agent-memory/explanation/poleo-model/",
  mcpTools: "https://neo4j.com/labs/agent-memory/reference/mcp-tools/",
  pythonSdk: "https://neo4j.com/labs/agent-memory/sdks/python/",
  tsSdk: "https://neo4j.com/labs/agent-memory/sdks/typescript/",
  mcpArchitecture: "https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture",
  mcpSpec: "https://modelcontextprotocol.io/specification/2025-06-18/architecture",
  semanticIndexes: "https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/",
  fullText: "https://neo4j.com/docs/cypher-manual/25/indexes/semantic-indexes/full-text-indexes/",
  vector: "https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/",
  sourceClient: "https://github.com/neo4j-labs/agent-memory/blob/main/src/neo4j_agent_memory/__init__.py",
  sourceLongTerm: "https://github.com/neo4j-labs/agent-memory/blob/main/src/neo4j_agent_memory/memory/long_term.py",
  sourceMcp: "https://github.com/neo4j-labs/agent-memory/blob/main/src/neo4j_agent_memory/mcp/_tools.py",
  sourceServer: "https://github.com/neo4j-labs/agent-memory/blob/main/src/neo4j_agent_memory/mcp/server.py",
  pyproject: "https://github.com/neo4j-labs/agent-memory/blob/main/pyproject.toml",
  changelog: "https://github.com/neo4j-labs/agent-memory/blob/main/CHANGELOG.md",
  npm: "https://www.npmjs.com/package/@neo4j-labs/agent-memory",
  pypi: "https://pypi.org/project/neo4j-agent-memory/",
  issues: "https://github.com/neo4j-labs/agent-memory/issues",
  issue137: "https://github.com/neo4j-labs/agent-memory/issues/137",
  issue155: "https://github.com/neo4j-labs/agent-memory/issues/155",
  issue177: "https://github.com/neo4j-labs/agent-memory/issues/177",
};

function addShape(slide, geometry, left, top, width, height, fill, line = "none", radius = undefined) {
  return slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill,
    line: line === "none" ? { style: "solid", fill: "none", width: 0 } : line,
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function addText(slide, value, left, top, width, height, options = {}) {
  const shape = addShape(slide, "textbox", left, top, width, height, options.fill || "none", options.line || "none", options.radius);
  shape.text = value;
  shape.text.style = {
    fontSize: options.fontSize || 24,
    color: options.color || INK,
    bold: options.bold || false,
    italic: options.italic || false,
    alignment: options.align || "left",
    verticalAlignment: options.valign || "top",
    autoFit: options.autoFit || "shrinkText",
    wrap: "square",
    insets: options.insets || { top: 4, right: 4, bottom: 4, left: 4 },
    typeface: options.typeface || FONT_BODY,
    lineSpacing: options.lineSpacing || 1.0,
  };
  return shape;
}

function addBullets(slide, items, left, top, width, height, options = {}) {
  const shape = addShape(slide, "textbox", left, top, width, height, options.fill || "none", options.line || "none", options.radius);
  shape.text = items.map((item) => {
    const lead = typeof item === "string" ? null : item.lead;
    const body = typeof item === "string" ? item : item.body;
    const runs = lead
      ? [{ run: lead, textStyle: { bold: true, color: options.color || INK } }, { run: body }]
      : [body];
    return { bulletCharacter: "•", marginLeft: 24, indent: -13, spaceAfter: options.spaceAfter || 10, runs };
  });
  shape.text.style = {
    fontSize: options.fontSize || 23,
    color: options.color || INK,
    verticalAlignment: "top",
    autoFit: "shrinkText",
    wrap: "square",
    insets: { top: 8, right: 8, bottom: 8, left: 8 },
    typeface: options.typeface || FONT_BODY,
    lineSpacing: options.lineSpacing || 1.08,
  };
  return shape;
}

function addCode(slide, code, left, top, width, height, options = {}) {
  addShape(slide, "roundRect", left, top, width, height, options.fill || NAVY, { style: "solid", fill: options.lineColor || DEEPBLUE, width: 1.2 }, "rounded-xl");
  return addText(slide, code, left + 18, top + 14, width - 36, height - 28, {
    fontSize: options.fontSize || 20,
    color: options.color || ICE,
    typeface: FONT_CODE,
    lineSpacing: 1.0,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

function addHeader(slide, title, number, dark = false, kicker = "NEO4J AGENT MEMORY") {
  addText(slide, kicker, 64, 38, 650, 26, { fontSize: 17, bold: true, color: dark ? ICE : DEEPBLUE, typeface: FONT_CODE });
  addText(slide, title, 64, 72, 1152, 68, {
    fontSize: 46,
    bold: true,
    color: dark ? WHITE : NAVY,
    typeface: FONT_TITLE,
    valign: "middle",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(slide, "AGENT MEMORY · AI SEMINAR, LECTURE 7", 64, 680, 600, 20, { fontSize: 15, color: dark ? GRID : MUTE, typeface: FONT_CODE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  addText(slide, String(number).padStart(2, "0"), 1158, 678, 58, 22, { fontSize: 17, bold: true, align: "right", color: dark ? ICE : DEEPBLUE, typeface: FONT_CODE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
}

function addBackref(slide, label, dark = false) {
  addShape(slide, "roundRect", 820, 37, 396, 30, dark ? "#173F58" : SEAFOAM, { style: "solid", fill: dark ? TEAL : "#A6DAD0", width: 1 }, "rounded-full");
  addText(slide, `← Background · ${label}`, 834, 41, 368, 22, { fontSize: 16, bold: true, color: dark ? ICE : DEEPBLUE, align: "center", insets: { top: 0, right: 0, bottom: 0, left: 0 } });
}

function addBand(slide, left, top, width, height, fill, title, body, options = {}) {
  addShape(slide, "roundRect", left, top, width, height, fill, { style: "solid", fill: options.line || fill, width: 1 }, "rounded-xl");
  addText(slide, title, left + 22, top + 18, width - 44, 36, { fontSize: options.titleSize || 27, bold: true, color: options.titleColor || NAVY, typeface: options.titleTypeface || FONT_TITLE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  addText(slide, body, left + 22, top + 66, width - 44, height - 86, { fontSize: options.bodySize || 21, color: options.bodyColor || INK, typeface: options.bodyTypeface || FONT_BODY, lineSpacing: 1.05, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
}

function addLabel(slide, text, left, top, width, fill, color = WHITE) {
  addShape(slide, "roundRect", left, top, width, 34, fill, { style: "solid", fill, width: 0 }, "rounded-full");
  addText(slide, text, left + 8, top + 5, width - 16, 24, { fontSize: 17, bold: true, color, align: "center", typeface: FONT_CODE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
}

function addArrow(slide, from, to, color = GRID, options = {}) {
  return slide.shapes.connect(from, to, {
    kind: options.kind || "straight",
    fromSide: options.fromSide || "right",
    toSide: options.toSide || "left",
    line: { style: "solid", fill: color, width: options.width || 2 },
    tail: { type: "triangle", width: "sm", length: "sm" },
  });
}

function setNotes(slide, body, sources = []) {
  const lines = [];
  if (body) lines.push(body.trim());
  if (sources.length) lines.push("", "[Sources]", ...sources.map((source) => `- ${source}`), "[/Sources]");
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addImage(slide, blob, alt, left, top, width, height, fit = "contain") {
  return slide.images.add({ blob, contentType: "image/png", alt, fit, position: { left, top, width, height }, geometry: "roundRect", borderRadius: "rounded-xl" });
}

const p = Presentation.create({ slideSize: { width: W, height: H } });
const asset = {
  architecture: await readImageBlob(path.join(ASSET_DIR, "memory-architecture.png")),
  graphModel: await readImageBlob(path.join(ASSET_DIR, "memory-graph-model.png")),
  extraction: await readImageBlob(path.join(ASSET_DIR, "extraction-pipeline.png")),
  memoryTypes: await readImageBlob(path.join(ASSET_DIR, "memory-types.png")),
};

// 1 — title
{
  const s = p.slides.add();
  s.background.fill = NAVY;
  addShape(s, "ellipse", 830, -20, 430, 430, DEEPBLUE, "none");
  addShape(s, "ellipse", 950, 310, 330, 330, TEAL, "none");
  addShape(s, "ellipse", 770, 350, 190, 190, MIDNIGHT, "none");
  addText(s, "AI TOOLING SEMINAR · LECTURE 7", 72, 70, 640, 30, { fontSize: 19, bold: true, color: ICE, typeface: FONT_CODE });
  addText(s, "Neo4j Agent\nMemory", 72, 145, 730, 190, { fontSize: 72, bold: true, color: WHITE, typeface: FONT_TITLE, lineSpacing: 0.92, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  addText(s, "SDKs, MCP, and graph-native persistence", 76, 365, 710, 70, { fontSize: 30, color: ICE, lineSpacing: 1.0, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  addText(s, "Choose the retrieval system by the question it must answer.", 76, 566, 790, 42, { fontSize: 24, bold: true, color: AMBER, typeface: FONT_CODE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  setNotes(s, "This lesson moves from retrieval concepts to integration mechanics, then reads the repository's SDK and MCP implementation. The repository is a Neo4j Labs project and describes itself as experimental and community supported.", [URL.repo, URL.readme]);
}

// 2 — preview
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "One Memory Graph Serves Apps and Agents", 2);
  addText(s, "Neo4j Agent Memory persists conversations, entities, relationships, and reasoning traces in Neo4j. Applications call an SDK; compatible AI hosts can discover the same capabilities through MCP.", 72, 155, 500, 160, { fontSize: 28, color: MUTE, lineSpacing: 1.05 });
  addImage(s, asset.architecture, "Neo4j Agent Memory architecture showing agents, MCP, memory types, and Neo4j", 630, 155, 570, 400, "contain");
  addText(s, "Slides 3–17 build the memory, SDK, and MCP concepts without relying on this repository. Slide 18 maps each concept back to its source.", 76, 568, 1120, 50, { fontSize: 24, bold: true, color: DEEPBLUE, align: "center" });
  setNotes(s, "Flag the standalone-background pattern. The architecture image is copied from the repository and used under its Apache-2.0 license.", [URL.readme, URL.repo]);
}

// 3 — state is not model memory
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "A Model Call Does Not Persist Experience", 3, false, "BACKGROUND · PERSISTENCE");
  addText(s, "A model receives an input, produces an output, and ends. Durable memory exists only when an external system writes state and retrieves it on a later run.", 80, 155, 1115, 76, { fontSize: 29, color: MUTE });
  const first = addShape(s, "roundRect", 92, 300, 270, 170, WHITE, { style: "solid", fill: ICE, width: 2 }, "rounded-xl");
  const write = addShape(s, "roundRect", 505, 300, 270, 170, DEEPBLUE, "none", "rounded-xl");
  const later = addShape(s, "roundRect", 918, 300, 270, 170, WHITE, { style: "solid", fill: ICE, width: 2 }, "rounded-xl");
  addText(s, "RUN 1", 124, 326, 206, 32, { fontSize: 25, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  addText(s, "observation exists\nonly in this context", 122, 382, 210, 62, { fontSize: 22, color: MUTE, align: "center" });
  addText(s, "PERSIST", 537, 326, 206, 32, { fontSize: 25, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "write identity, content,\nrelationships, and time", 532, 382, 216, 62, { fontSize: 22, color: ICE, align: "center" });
  addText(s, "RUN 2", 950, 326, 206, 32, { fontSize: 25, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  addText(s, "retrieval reconstructs\nrelevant prior state", 948, 382, 210, 62, { fontSize: 22, color: MUTE, align: "center" });
  addArrow(s, first, write, TEAL); addArrow(s, write, later, TEAL);
  addText(s, "Persistence is a storage-and-retrieval contract—not a property of a single completion.", 176, 550, 928, 50, { fontSize: 29, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Distinguish model weights, one-run context, and application-managed durable state. The rest of the background focuses on the retrieval structures that make persisted state useful.");
}

// 4 — retrieval contract
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Retrieval Begins with the Question Shape", 4, true, "BACKGROUND · RETRIEVAL");
  const rows = [
    ["ORDER", "What happened immediately before this?", "sequence / timestamp", DEEPBLUE],
    ["WORDS", "Where did this exact name or phrase appear?", "inverted text index", TEAL],
    ["MEANING", "Which stored item is semantically similar?", "vector nearest neighbors", MIDNIGHT],
    ["CONNECTION", "How are these entities related?", "graph traversal", CORAL],
  ];
  rows.forEach((row, index) => {
    const top = 164 + index * 112;
    addShape(s, "roundRect", 90, top, 1100, 90, index % 2 ? "#123A55" : "#173F58", { style: "solid", fill: row[3], width: 2 }, "rounded-xl");
    addLabel(s, row[0], 112, top + 28, 146, row[3]);
    addText(s, row[1], 290, top + 20, 520, 52, { fontSize: 25, bold: true, color: WHITE, valign: "middle" });
    addText(s, row[2], 852, top + 24, 300, 42, { fontSize: 21, color: ICE, align: "right", typeface: FONT_CODE, valign: "middle" });
  });
  addText(s, "A memory system can combine indexes, but each index still answers a different question.", 142, 620, 996, 36, { fontSize: 25, bold: true, color: AMBER, align: "center" });
  setNotes(s, "This matrix is the conceptual anchor for the next four slides. Sequence, lexical, vector, and graph retrieval overlap in applications but should not be treated as interchangeable.", [URL.semanticIndexes]);
}

// 5 — text lookup
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Text Indexes Recover Tokens and Phrases", 5, false, "BACKGROUND · TEXT LOOKUP");
  addText(s, "A full-text index maps terms to the stored documents or graph elements that contain them. It is strongest when the query includes identifiers, names, acronyms, or exact wording.", 78, 154, 1120, 82, { fontSize: 28, color: MUTE });
  addCode(s, "Ada → {doc 2, doc 9}\nengine → {doc 4, doc 9}\nBernoulli → {doc 9}", 94, 284, 432, 210, { fontSize: 25 });
  addBand(s, 608, 270, 574, 236, CARD, "What it preserves", "Spelling, token boundaries, phrase occurrence, and field-level filters. Ranking may score lexical proximity, but the index does not infer that “calculation device” means “computer.”", { titleColor: DEEPBLUE, bodySize: 23 });
  addText(s, "Use lexical retrieval when exactness is evidence, not noise.", 200, 550, 880, 52, { fontSize: 30, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Neo4j full-text indexes use Lucene and can index string properties on nodes or relationships. The background claim is general: text lookup is the reliable path for exact names, identifiers, and wording.", [URL.fullText]);
}

// 6 — vectors
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Vector Search Recovers Semantic Neighbors", 6, false, "BACKGROUND · VECTORS");
  addText(s, "An embedding model maps text to a fixed-length numeric vector. A vector index returns stored vectors close to the query under a configured similarity measure.", 78, 154, 1120, 78, { fontSize: 28, color: MUTE });
  addBand(s, 82, 280, 330, 220, WHITE, "1 · ENCODE", "“calculation device”\n→ [0.18, −0.42, …]", { titleColor: DEEPBLUE, bodySize: 25, bodyTypeface: FONT_CODE });
  addBand(s, 475, 280, 330, 220, PALE_GOLD, "2 · COMPARE", "query vector against stored vectors with cosine, dot product, or Euclidean distance", { titleColor: MIDNIGHT, bodySize: 23 });
  addBand(s, 868, 280, 330, 220, WHITE, "3 · RANK", "return approximate nearest neighbors with similarity scores", { titleColor: TEAL, bodySize: 23 });
  addText(s, "Similarity is model- and configuration-dependent; it is not proof of a factual relationship.", 154, 552, 972, 58, { fontSize: 28, bold: true, color: CORAL, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Vector indexes support similarity retrieval over stored embeddings. The embedding model and dimensionality are part of the index contract; changing models can invalidate the index configuration.", [URL.vector, URL.semanticIndexes]);
}

// 7 — graph
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Graph Memory Recovers Connected Structure", 7, true, "BACKGROUND · GRAPHS");
  const ada = addShape(s, "ellipse", 110, 280, 180, 180, DEEPBLUE, "none");
  const notes = addShape(s, "ellipse", 550, 210, 200, 200, TEAL, "none");
  const engine = addShape(s, "ellipse", 970, 320, 190, 190, MIDNIGHT, "none");
  addArrow(s, ada, notes, GRID, { width: 3 }); addArrow(s, notes, engine, GRID, { width: 3 });
  addText(s, "Ada\nLovelace", 135, 330, 130, 80, { fontSize: 26, bold: true, color: WHITE, align: "center", valign: "middle" });
  addText(s, "Notes on\nBernoulli numbers", 578, 262, 144, 84, { fontSize: 24, bold: true, color: WHITE, align: "center", valign: "middle" });
  addText(s, "Analytical\nEngine", 998, 374, 134, 80, { fontSize: 25, bold: true, color: WHITE, align: "center", valign: "middle" });
  addLabel(s, "AUTHORED", 340, 310, 150, "#173F58");
  addLabel(s, "DESCRIBES", 790, 318, 160, "#173F58");
  addText(s, "Nodes carry properties; typed edges preserve who or what connects them. Traversal answers path, neighborhood, and pattern questions that similarity alone cannot.", 160, 550, 960, 70, { fontSize: 27, color: ICE, align: "center" });
  setNotes(s, "Graph retrieval preserves entities and explicit relationships. A path is evidence that edges exist under the stored schema; it is not automatically evidence that every inferred causal or semantic claim is true.");
}

// 8 — hybrid
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Hybrid Retrieval Combines Independent Signals", 8, false, "BACKGROUND · HYBRID SEARCH");
  const text = addShape(s, "ellipse", 178, 265, 280, 280, DEEPBLUE, "none");
  const vector = addShape(s, "ellipse", 500, 265, 280, 280, TEAL, "none");
  const graph = addShape(s, "ellipse", 822, 265, 280, 280, MIDNIGHT, "none");
  addText(s, "TEXT", 246, 344, 144, 38, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "exact terms", 246, 397, 144, 30, { fontSize: 21, color: ICE, align: "center" });
  addText(s, "VECTOR", 552, 344, 176, 38, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "semantic rank", 548, 397, 184, 30, { fontSize: 21, color: ICE, align: "center" });
  addText(s, "GRAPH", 884, 344, 156, 38, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "relationships", 872, 397, 180, 30, { fontSize: 21, color: ICE, align: "center" });
  addText(s, "Rank each retrieval source on its own terms, then fuse or filter the results. Raw scores from different index types are not directly comparable.", 132, 570, 1016, 58, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Neo4j documents using full-text and vector indexes together for hybrid search and cautions that independent sources should be ranked independently rather than by comparing raw scores.", [URL.semanticIndexes]);
}

// 9 — lifecycle
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Memory Quality Depends on the Write Lifecycle", 9, false, "BACKGROUND · MEMORY OPERATIONS");
  const rows = [
    ["PROVENANCE", "Who asserted this, from which event, and when?", DEEPBLUE],
    ["IDENTITY", "Does a new mention refer to an existing entity?", TEAL],
    ["ISOLATION", "Which user, tenant, or session may read it?", MIDNIGHT],
    ["TEMPORALITY", "Is it still valid, superseded, archived, or expired?", CORAL],
    ["EVALUATION", "Did retrieval return useful, faithful context?", "#1E7A5F"],
  ];
  rows.forEach((row, index) => {
    const top = 164 + index * 90;
    addLabel(s, row[0], 88, top + 17, 200, row[2]);
    addText(s, row[1], 330, top + 13, 850, 52, { fontSize: 27, color: INK, valign: "middle" });
  });
  addText(s, "“Store everything forever” is a retention policy with privacy and accuracy costs.", 142, 620, 996, 38, { fontSize: 27, bold: true, color: CORAL, align: "center" });
  setNotes(s, "Persistence introduces governance work: provenance, deduplication, scoping, temporality, and evaluation. These concerns recur in the repository's issues and production-oriented APIs.", [URL.issues]);
}

// 10 — SDK definition
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "An SDK Packages a Supported Integration Path", 10, true, "BACKGROUND · SOFTWARE DEVELOPMENT KITS");
  addText(s, "A software development kit is application code that imports into your process. It turns a service or subsystem into language-native types, methods, errors, and lifecycle operations.", 86, 158, 1100, 84, { fontSize: 29, color: ICE });
  const items = [
    ["TYPES", "request and response objects"],
    ["METHODS", "named operations and signatures"],
    ["TRANSPORT", "HTTP, sockets, database drivers"],
    ["LIFECYCLE", "connect, close, retry, cleanup"],
    ["ERRORS", "stable failure categories"],
  ];
  items.forEach((item, index) => {
    const left = 70 + index * 242;
    addShape(s, "roundRect", left, 310, 210, 180, index === 2 ? TEAL : "#173F58", { style: "solid", fill: index === 2 ? TEAL : DEEPBLUE, width: 1.5 }, "rounded-xl");
    addText(s, item[0], left + 20, 342, 170, 34, { fontSize: 24, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
    addText(s, item[1], left + 18, 402, 174, 54, { fontSize: 21, color: ICE, align: "center" });
  });
  addText(s, "The SDK chooses defaults and abstractions; your application still owns product behavior and data policy.", 132, 560, 1016, 60, { fontSize: 28, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Use this as the working definition for the course. The next slides distinguish the SDK from the API it calls and the protocol used between separate processes.");
}

// 11 — SDK call path
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "SDK Calls Cross Several Contracts", 11, false, "BACKGROUND · SDK CALL PATH");
  const labels = [
    ["APP", "language-native call", DEEPBLUE],
    ["SDK", "validate + serialize", TEAL],
    ["TRANSPORT", "send + authenticate", MIDNIGHT],
    ["SERVICE", "execute operation", CORAL],
    ["RESULT", "parse or raise", "#1E7A5F"],
  ];
  const nodes = [];
  labels.forEach((item, index) => {
    const left = 55 + index * 248;
    const node = addShape(s, "roundRect", left, 285, 205, 180, index === 1 ? TEAL : CARD, { style: "solid", fill: item[2], width: 2 }, "rounded-xl");
    nodes.push(node);
    addText(s, item[0], left + 18, 320, 169, 34, { fontSize: 25, bold: true, color: index === 1 ? WHITE : NAVY, align: "center", typeface: FONT_CODE });
    addText(s, item[1], left + 18, 386, 169, 50, { fontSize: 21, color: index === 1 ? ICE : MUTE, align: "center" });
    if (index > 0) addArrow(s, nodes[index - 1], node, GRID);
  });
  addText(s, "Debugging requires locating the failing contract: application input, SDK validation, transport, server behavior, or response parsing.", 120, 538, 1040, 72, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "An SDK is not a monolith. Separating these layers makes version skew and provider-specific failures diagnosable.");
}

// 12 — API SDK protocol
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "API, SDK, and Protocol Name Different Boundaries", 12, false, "BACKGROUND · INTERFACE VOCABULARY");
  addBand(s, 74, 180, 350, 360, WHITE, "API", "The operations a component exposes: names, inputs, outputs, and error semantics. An API may be local or remote.", { titleColor: DEEPBLUE, bodySize: 25 });
  addBand(s, 465, 180, 350, 360, SEAFOAM, "SDK", "A language-specific package that helps an application call an API. It may add types, defaults, helpers, retries, or adapters.", { titleColor: TEAL, bodySize: 25 });
  addBand(s, 856, 180, 350, 360, PALE_GOLD, "PROTOCOL", "Rules two independent participants follow on the wire: message shapes, lifecycle, capabilities, and transport behavior.", { titleColor: MIDNIGHT, bodySize: 25 });
  addText(s, "One product can expose an API, ship multiple SDKs, and participate in more than one protocol.", 150, 580, 980, 48, { fontSize: 29, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "This distinction prevents a common vocabulary collapse. MCP is a protocol; its official language packages are SDKs; the tools/resources/prompts exposed by a server are APIs at the application level.", [URL.mcpArchitecture]);
}

// 13 — MCP architecture
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "MCP Separates Host, Client, and Server", 13, true, "BACKGROUND · MODEL CONTEXT PROTOCOL");
  const host = addShape(s, "roundRect", 80, 190, 460, 390, "#173F58", { style: "solid", fill: DEEPBLUE, width: 2 }, "rounded-xl");
  addText(s, "HOST", 116, 220, 180, 38, { fontSize: 30, bold: true, color: WHITE, typeface: FONT_CODE });
  addText(s, "AI application", 116, 266, 220, 32, { fontSize: 23, color: ICE });
  addBullets(s, ["owns the model conversation", "creates clients", "applies consent and policy", "aggregates context and tools"], 110, 326, 380, 190, { fontSize: 23, color: WHITE, spaceAfter: 10 });
  const client = addShape(s, "roundRect", 620, 248, 240, 180, TEAL, "none", "rounded-xl");
  addText(s, "CLIENT", 655, 282, 170, 36, { fontSize: 28, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "one stateful session\nwith one server", 654, 345, 172, 56, { fontSize: 22, color: ICE, align: "center" });
  const server = addShape(s, "roundRect", 940, 190, 260, 390, MIDNIGHT, { style: "solid", fill: ICE, width: 2 }, "rounded-xl");
  addText(s, "SERVER", 978, 220, 184, 38, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addBullets(s, ["declares capabilities", "exposes focused primitives", "executes its own logic", "does not receive every host detail"], 970, 310, 202, 230, { fontSize: 22, color: WHITE, spaceAfter: 13 });
  addArrow(s, host, client, GRID); addArrow(s, client, server, GRID);
  setNotes(s, "A host can create multiple clients, with each client maintaining one connection to one server. The host remains the container and coordinator; servers focus on narrow capabilities.", [URL.mcpArchitecture, URL.mcpSpec]);
}

// 14 — data and transport layers
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "MCP Has Data and Transport Layers", 14, false, "BACKGROUND · MCP LAYERS");
  addBand(s, 82, 188, 520, 360, CARD, "DATA LAYER", "JSON-RPC message shapes\nLifecycle and capability negotiation\nTools, resources, prompts\nNotifications and errors", { titleColor: DEEPBLUE, bodySize: 25, bodyTypeface: FONT_CODE });
  addBand(s, 678, 188, 520, 360, SEAFOAM, "TRANSPORT LAYER", "Connection and framing\nLocal stdio streams\nRemote Streamable HTTP\nAuthorization for networked use", { titleColor: TEAL, bodySize: 25, bodyTypeface: FONT_CODE });
  addText(s, "The same MCP method can travel over different transports; transport does not change the method's meaning.", 144, 580, 992, 50, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The current MCP architecture documentation separates a JSON-RPC data layer from the transport layer. Stdio is common for local servers; Streamable HTTP is the current remote transport described by the documentation.", [URL.mcpArchitecture]);
}

// 15 — MCP lifecycle
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "An MCP Session Negotiates Before It Calls", 15, false, "BACKGROUND · MCP LIFECYCLE");
  const steps = [
    ["1", "INITIALIZE", "exchange versions, identities, capabilities"],
    ["2", "READY", "initialized notification completes setup"],
    ["3", "DISCOVER", "tools/list, resources/list, prompts/list"],
    ["4", "INVOKE", "tools/call or resource/prompt retrieval"],
    ["5", "RESULT", "structured success, content, or error"],
  ];
  const nodes = [];
  steps.forEach((item, index) => {
    const left = 52 + index * 248;
    const node = addShape(s, "roundRect", left, 250, 210, 230, index === 0 ? DEEPBLUE : WHITE, { style: "solid", fill: index === 0 ? DEEPBLUE : ICE, width: 2 }, "rounded-xl");
    nodes.push(node);
    addText(s, item[0], left + 16, 270, 38, 32, { fontSize: 23, bold: true, color: index === 0 ? AMBER : DEEPBLUE, typeface: FONT_CODE });
    addText(s, item[1], left + 18, 322, 174, 34, { fontSize: 23, bold: true, color: index === 0 ? WHITE : NAVY, align: "center", typeface: FONT_CODE });
    addText(s, item[2], left + 20, 382, 170, 70, { fontSize: 20, color: index === 0 ? ICE : MUTE, align: "center" });
    if (index > 0) addArrow(s, nodes[index - 1], node, GRID);
  });
  addText(s, "Capability negotiation prevents participants from assuming optional features that were never declared.", 146, 548, 988, 60, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Initialization exchanges a protocol version and capabilities. Discovery methods are dynamic, so a client lists primitives before using them rather than relying only on a hard-coded catalog.", [URL.mcpArchitecture]);
}

// 16 — primitives
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "MCP Primitives Assign Different Controllers", 16, true, "BACKGROUND · MCP PRIMITIVES");
  const rows = [
    ["PROMPTS", "user-controlled", "reusable message templates chosen by the user", DEEPBLUE],
    ["RESOURCES", "application-controlled", "context data the host attaches or reads", TEAL],
    ["TOOLS", "model-controlled", "executable functions the model may request", MIDNIGHT],
  ];
  rows.forEach((item, index) => {
    const top = 180 + index * 142;
    addShape(s, "roundRect", 100, top, 1080, 110, "#173F58", { style: "solid", fill: item[3], width: 2 }, "rounded-xl");
    addLabel(s, item[0], 126, top + 38, 190, item[3]);
    addText(s, item[1], 360, top + 25, 350, 34, { fontSize: 21, bold: true, color: WHITE, typeface: FONT_CODE });
    addText(s, item[2], 360, top + 63, 770, 30, { fontSize: 23, color: ICE });
  });
  addText(s, "“Model-controlled” means the model can request a tool; it does not remove host authorization or server validation.", 124, 614, 1032, 42, { fontSize: 25, bold: true, color: AMBER, align: "center" });
  setNotes(s, "The MCP server-primitives overview describes prompts as user-controlled, resources as application-controlled, and tools as model-controlled. Control here describes selection, not unlimited authority.", [URL.mcpArchitecture]);
}

// 17 — MCP boundary
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "MCP Standardizes Access—not Orchestration", 17, false, "BACKGROUND · MCP TRUST BOUNDARY");
  addBand(s, 74, 180, 520, 365, SEAFOAM, "MCP DEFINES", "• initialization and capability negotiation\n• primitive discovery\n• JSON-RPC methods and results\n• transport-compatible sessions", { titleColor: TEAL, bodySize: 25 });
  addBand(s, 686, 180, 520, 365, PALE_CORAL, "THE HOST STILL OWNS", "• which servers may connect\n• what context crosses the boundary\n• approvals and permissions\n• orchestration, stop policy, success criteria", { titleColor: CORAL, bodySize: 25 });
  addText(s, "A protocol can make an unsafe capability interoperable. Safety still requires scoping, consent, validation, and audit.", 128, 580, 1024, 52, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The host coordinates the LLM integration and security policy. MCP improves composability but does not decide the next action or define the product's success contract.", [URL.mcpArchitecture, URL.mcpSpec]);
}

// 18 — bridge
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "The Repository Makes Each Background Choice Concrete", 18, true, "BRIDGE · CONCEPTS → SOURCE");
  const rows = [
    ["TEXT · VECTOR · GRAPH", "Neo4j indexes plus typed entity relationships", "Slides 5–8"],
    ["MEMORY LIFECYCLE", "extraction, resolution, consolidation, scoping, audit", "Slide 9"],
    ["SDK", "Python MemoryClient and TypeScript MemoryClient", "Slides 10–12"],
    ["MCP", "server profiles register tools over the same memory model", "Slides 13–17"],
  ];
  rows.forEach((row, index) => {
    const top = 170 + index * 116;
    addShape(s, "roundRect", 90, top, 1100, 92, index % 2 ? "#173F58" : "#123A55", { style: "solid", fill: index === 3 ? TEAL : DEEPBLUE, width: 1.5 }, "rounded-xl");
    addText(s, row[0], 116, top + 25, 290, 38, { fontSize: 23, bold: true, color: WHITE, typeface: FONT_CODE, valign: "middle" });
    addText(s, row[1], 430, top + 19, 550, 52, { fontSize: 24, color: ICE, valign: "middle" });
    addText(s, row[2], 1000, top + 28, 158, 28, { fontSize: 18, bold: true, color: AMBER, align: "right", typeface: FONT_CODE });
  });
  addText(s, "From this slide onward, every mechanism is tied to a repository file, class, or function.", 144, 620, 992, 36, { fontSize: 25, bold: true, color: WHITE, align: "center" });
  setNotes(s, "This is the explicit bridge required by the course format. The remaining slides identify exact repository paths and public APIs.", [URL.repo, URL.readme]);
}

// 19 — memory types
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Three Memory Types Share One Graph", 19); addBackref(s, "Slides 4 + 9, Retrieval · Lifecycle");
  addImage(s, asset.memoryTypes, "Neo4j Agent Memory diagram of short-term, long-term, and reasoning memory", 58, 158, 650, 430, "contain");
  addBand(s, 748, 170, 460, 126, CARD, "SHORT-TERM", "Conversations and messages; ordered, session-scoped history.", { titleColor: DEEPBLUE, bodySize: 21, titleSize: 24 });
  addBand(s, 748, 318, 460, 126, SEAFOAM, "LONG-TERM", "Entities, facts, preferences, and typed relationships across sessions.", { titleColor: TEAL, bodySize: 21, titleSize: 24 });
  addBand(s, 748, 466, 460, 126, PALE_GOLD, "REASONING", "Traces, steps, tool calls, observations, and outcomes.", { titleColor: MIDNIGHT, bodySize: 21, titleSize: 24 });
  setNotes(s, "The repository implements short-term, long-term, and reasoning memory as connected graph structures. The image is copied from the repository and used under Apache-2.0.", [URL.memoryTypes, URL.readme]);
}

// 20 — repository map
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "The Repository Is Polyglot, with Python at the Root", 20, true); addBackref(s, "Slide 12, API · SDK · Protocol", true);
  addCode(s, `.github/          CI + release workflows
benchmarks/        retrieval evaluation utilities
docs/              Antora documentation source
examples/          runnable apps and integration demos
img/               architecture diagrams
src/               Python package
tests/             Python unit, integration, typing tests
typescript/        TypeScript SDK + its tests/docs
pyproject.toml     Python package 0.5.0
uv.lock            locked Python environment`, 70, 165, 560, 450, { fontSize: 16 });
  addCode(s, `src/neo4j_agent_memory/
├── __init__.py       MemoryClient + get_graph()
├── config/           settings + backend selection
├── graph/            driver, schema, Cypher
├── memory/           short_term / long_term / reasoning
├── mcp/              server, tools, resources, prompts
├── nams/             hosted REST backend
├── integrations/     agent framework adapters
└── llm/              provider protocols + adapters`, 670, 165, 540, 450, { fontSize: 16, fill: "#123A55", lineColor: TEAL });
  setNotes(s, "The root listing follows the repository's current GitHub contents order as checked on 13 August 2026. The code map then narrows to the Python package paths used in later slides. The repository commit inspected for this deck was 231d60eac9401ab156ba194b519d89dd644dadb8.", [URL.repo, URL.sourceClient, URL.pyproject]);
}

// 21 — MemoryClient lifecycle/backends
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "MemoryClient Selects a Backend at Connect Time", 21); addBackref(s, "Slides 10–11, SDK Contract");
  addCode(s, `settings = MemorySettings(...)

async with MemoryClient(settings) as memory:
    await memory.long_term.add_entity(...)
    graph = await memory.get_graph(
        memory_types=["long_term"]
    )`, 70, 172, 530, 390, { fontSize: 17 });
  addBand(s, 660, 170, 250, 330, SEAFOAM, "BOLT", "Direct Neo4j driver\n\nClient initializes schema, indexes, extraction, resolution, and graph export.", { titleColor: TEAL, bodySize: 22 });
  addBand(s, 944, 170, 250, 330, PALE_GOLD, "NAMS", "Hosted REST service\n\nServer manages embedding, extraction, and resolution; some bolt methods are unavailable.", { titleColor: MIDNIGHT, bodySize: 22 });
  addText(s, "The public accessors stay stable—short_term, long_term, reasoning, and query—while backend capability differs.", 128, 570, 1024, 52, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "MemoryClient.connect dispatches to bolt or NAMS. On bolt it opens Neo4j, configures schema, and wires concrete memory classes. NAMS wires protocol-compatible REST accessors and marks bolt-only features unsupported.", [URL.sourceClient, URL.pythonSdk]);
}

// 22 — write path
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "add_entity() Turns an SDK Call into a Graph Write", 22); addBackref(s, "Slides 6–7 and 9, Vector + Graph + Lifecycle");
  addImage(s, asset.extraction, "Neo4j Agent Memory extraction and persistence pipeline", 60, 180, 570, 380, "contain");
  const stages = [
    ["1", "TYPE", "normalize POLE+O entity type"],
    ["2", "RESOLVE", "choose canonical identity"],
    ["3", "EMBED", "optional vector + dedup"],
    ["4", "WRITE", "dynamic labels + Cypher"],
    ["5", "LINK", "typed relationships, provenance"],
  ];
  stages.forEach((item, index) => {
    const top = 165 + index * 88;
    addText(s, item[0], 680, top, 42, 42, { fontSize: 23, bold: true, color: DEEPBLUE, align: "center", valign: "middle", typeface: FONT_CODE, fill: SEAFOAM, radius: "rounded-full" });
    addText(s, item[1], 746, top + 2, 150, 30, { fontSize: 22, bold: true, color: NAVY, typeface: FONT_CODE });
    addText(s, item[2], 910, top + 2, 286, 42, { fontSize: 21, color: MUTE });
  });
  addText(s, "add_relationship(source, target, type) stores type on a RELATED_TO edge between the two entity IDs.", 150, 602, 980, 34, { fontSize: 24, bold: true, color: DEEPBLUE, align: "center" });
  setNotes(s, "LongTermMemory.add_entity normalizes the entity type, may resolve identity, may generate an embedding and check duplicates, then executes a Cypher write. add_relationship persists a RELATED_TO edge whose type property carries the semantic relationship label. The image shows the repository's broader extraction pipeline.", [URL.sourceLongTerm, URL.poleo, URL.readme]);
}

// 23 — graph export
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "get_graph() Produces Browser-Ready Nodes and Edges", 23, true); addBackref(s, "Slide 7, Graph Memory", true);
  addCode(s, `graph = await memory.get_graph(
    memory_types=["long_term"],
    include_embeddings=False,
)

return graph.model_dump(mode="json")`, 72, 170, 500, 350, { fontSize: 22 });
  addCode(s, `{
  "nodes": [
    {"id": "…", "labels": ["Entity"],
     "properties": {"name": "Ada", "type": "PERSON"}}
  ],
  "relationships": [
    {"type": "WROTE_ABOUT",
     "from_node": "…", "to_node": "…"}
  ],
  "metadata": {"node_count": 2}
}`, 620, 170, 590, 350, { fontSize: 18, fill: "#123A55", lineColor: TEAL });
  addText(s, "The export omits embeddings by default and is designed for visualization libraries. In 0.5.0, this convenience method is bolt-only.", 124, 558, 1032, 68, { fontSize: 27, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "MemoryClient.get_graph queries each requested memory type and returns MemoryGraph with GraphNode and GraphRelationship models. The method explicitly raises NotSupportedError for NAMS and recommends hosted-side alternatives.", [URL.sourceClient]);
}

// 24 — search path
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Search Methods Select a Retrieval Mechanism", 24); addBackref(s, "Slides 4–8, Retrieval Systems");
  const rows = [
    ["search_entities(query)", "embed query → vector index → optional type filter", SEAFOAM],
    ["search_preferences(query)", "vector index; category fallback when no embedder", PALE_GOLD],
    ["get_related_entities(entity)", "graph neighborhood traversal", "#EDF1FA"],
    ["query.cypher(query, params)", "validated read-only Cypher for custom patterns", PALE_CORAL],
    ["get_context(query, session)", "assemble selected memory layers into prompt context", WHITE],
  ];
  rows.forEach((row, index) => {
    const top = 162 + index * 92;
    addShape(s, "roundRect", 74, top, 1132, 72, row[2], { style: "solid", fill: ICE, width: 1 }, "rounded-xl");
    addText(s, row[0], 100, top + 20, 390, 34, { fontSize: 20, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
    addText(s, row[1], 500, top + 15, 670, 42, { fontSize: 23, color: INK, valign: "middle" });
  });
  addText(s, "Neo4j's semantic indexes are not invoked automatically by ordinary Cypher; code must call the relevant index or method.", 112, 622, 1056, 34, { fontSize: 24, bold: true, color: CORAL, align: "center" });
  setNotes(s, "The source makes retrieval choice visible in method bodies. search_entities returns an empty list without an embedder; get_related_entities uses graph relationships; query.cypher exposes parameterized read-only traversal. Neo4j documents that semantic indexes require explicit use.", [URL.sourceLongTerm, URL.semanticIndexes]);
}

// 25 — MCP server profiles
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "MCP Tool Profiles Trade Breadth for Context Cost", 25); addBackref(s, "Slides 15–16, Discovery + Tools");
  addBand(s, 72, 170, 520, 390, SEAFOAM, "CORE PROFILE · 6 TOOLS", "memory_search\nmemory_get_context\nmemory_store_message\nmemory_add_entity\nmemory_add_preference\nmemory_add_fact", { titleColor: TEAL, bodySize: 23, bodyTypeface: FONT_CODE });
  addBand(s, 688, 170, 520, 390, PALE_GOLD, "EXTENDED PROFILE · 16 TOOLS", "Core plus history, entity details, graph export, relationship creation, reasoning traces, observations, and read-only Cypher.", { titleColor: MIDNIGHT, bodySize: 24 });
  addText(s, "A smaller catalog reduces tool-description tokens and selection ambiguity; a larger catalog exposes more graph operations.", 136, 584, 1008, 46, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The README and MCP server source define a six-tool core profile and a sixteen-tool extended profile. The tool list is dated to the repository state checked on 13 August 2026; treat it as version-specific.", [URL.readme, URL.mcpTools, URL.sourceServer]);
}

// 26 — SDK vs MCP
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "SDK and MCP Use the Same Memory Differently", 26, true); addBackref(s, "Slides 10–17, SDK + MCP", true);
  addBand(s, 72, 174, 450, 365, "#173F58", "SDK PATH", "Your application imports MemoryClient, calls typed async methods, and owns connection lifecycle, input validation, routes, and user experience.", { titleColor: ICE, bodyColor: WHITE, bodySize: 24 });
  addBand(s, 758, 174, 450, 365, "#123A55", "MCP PATH", "An MCP host discovers tools, presents eligible schemas to a model, validates the requested call, and sends it to a memory server process.", { titleColor: ICE, bodyColor: WHITE, bodySize: 24 });
  addShape(s, "roundRect", 548, 282, 184, 150, TEAL, "none", "rounded-xl");
  addText(s, "ONE\nMEMORY\nGRAPH", 572, 304, 136, 108, { fontSize: 23, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE, lineSpacing: 0.85 });
  addText(s, "Choose the SDK when your code owns the workflow. Choose MCP when an external compatible host should discover and invoke the capability.", 126, 576, 1028, 60, { fontSize: 27, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The MCP functions in _tools.py call the same integration/client memory operations used by application code. The difference is caller, discovery, lifecycle, and authorization—not a second memory model.", [URL.sourceMcp, URL.sourceServer, URL.sourceClient]);
}

// 27 — release and backend matrix
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Released SDKs Differ from Main-Branch Source", 27); addBackref(s, "Slide 11, SDK Contracts");
  const rows = [
    ["Python package", "neo4j-agent-memory 0.5.0", "PyPI import verified on Python 3.12", SEAFOAM],
    ["TypeScript package", "@neo4j-labs/agent-memory 0.4.1", "npm ESM import verified on Node 26", PALE_GOLD],
    ["Repository main", "commit 231d60e…", "contains changes after published tags", "#EDF1FA"],
    ["Bolt backend", "direct Neo4j", "graph export, schema, geospatial, write Cypher", WHITE],
    ["NAMS backend", "hosted REST", "server-managed layers; method support differs", PALE_CORAL],
  ];
  rows.forEach((row, index) => {
    const top = 156 + index * 94;
    addShape(s, "roundRect", 70, top, 1140, 76, row[3], { style: "solid", fill: ICE, width: 1 }, "rounded-xl");
    addText(s, row[0], 94, top + 20, 250, 34, { fontSize: 22, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
    addText(s, row[1], 360, top + 18, 330, 36, { fontSize: 23, bold: true, color: NAVY });
    addText(s, row[2], 710, top + 15, 470, 46, { fontSize: 21, color: MUTE });
  });
  addText(s, "This slide was checked on 13 August 2026. Re-run the install and capability checks before teaching it again.", 128, 628, 1024, 30, { fontSize: 22, bold: true, color: CORAL, align: "center" });
  setNotes(s, "The Python published version matched pyproject.toml at 0.5.0 and imported in a clean Python 3.12 environment. npm reported 0.4.1 and the package imported as ESM. GitHub main contained unreleased changes. This is deliberately date-stamped.", [URL.pypi, URL.npm, URL.pyproject, URL.changelog]);
}

// 28 — limitations
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Experimental Memory Still Has Isolation and Time Risks", 28); addBackref(s, "Slides 9 + 17, Lifecycle · Trust");
  const rows = [
    ["PROJECT STATUS", "Neo4j Labs, experimental, community supported", "APIs and defaults may move", DEEPBLUE],
    ["USER ISOLATION", "open issues describe unscoped long-term reads", "enforce tenant identity in application policy", CORAL],
    ["GRAPH POISONING", "shared entity neighborhoods can cross trust boundaries", "scope writes, reads, and merge behavior", MIDNIGHT],
    ["TEMPORAL OVERWRITE", "facts can change or conflict across time", "preserve validity and supersession evidence", TEAL],
    ["BACKEND SKEW", "bolt and NAMS do not expose every method equally", "capability-test instead of version-assuming", "#1E7A5F"],
  ];
  rows.forEach((row, index) => {
    const top = 154 + index * 94;
    addShape(s, "roundRect", 68, top, 1144, 76, index % 2 ? CARD : WHITE, { style: "solid", fill: ICE, width: 1 }, "rounded-xl");
    addText(s, row[0], 94, top + 19, 220, 34, { fontSize: 20, bold: true, color: row[3], typeface: FONT_CODE });
    addText(s, row[1], 330, top + 14, 470, 46, { fontSize: 22, color: INK });
    addText(s, row[2], 820, top + 14, 360, 46, { fontSize: 21, bold: true, color: NAVY });
  });
  addText(s, "Open-issue evidence is a limitation signal, not proof that every deployment is exploitable in the same way.", 120, 628, 1040, 30, { fontSize: 22, color: MUTE, align: "center" });
  setNotes(s, "As of 13 August 2026, open issues included long-term user isolation (#137), graph-memory poisoning (#155), and a bitemporal supersession RFC (#177). Issue counts and status are volatile; the slide names concrete risks and avoids claiming universal exploitability.", [URL.readme, URL.issue137, URL.issue155, URL.issue177]);
}

// 29 — assignment
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Assignment: Build a Persistent Memory Map", 29, true); addBackref(s, "Slides 21–26, SDK · Graph", true);
  const browser = addShape(s, "roundRect", 62, 250, 230, 220, DEEPBLUE, "none", "rounded-xl");
  const api = addShape(s, "roundRect", 370, 250, 230, 220, TEAL, "none", "rounded-xl");
  const sdk = addShape(s, "roundRect", 678, 250, 230, 220, MIDNIGHT, "none", "rounded-xl");
  const neo = addShape(s, "roundRect", 986, 250, 230, 220, "#1E7A5F", "none", "rounded-xl");
  addArrow(s, browser, api, GRID); addArrow(s, api, sdk, GRID); addArrow(s, sdk, neo, GRID);
  addText(s, "BROWSER", 90, 286, 174, 34, { fontSize: 26, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "form + SVG graph\nneighbor lookup", 90, 355, 174, 62, { fontSize: 22, color: ICE, align: "center" });
  addText(s, "FASTAPI", 398, 286, 174, 34, { fontSize: 26, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "validated routes\nasync lifecycle", 398, 355, 174, 62, { fontSize: 22, color: ICE, align: "center" });
  addText(s, "MEMORYCLIENT", 692, 286, 202, 34, { fontSize: 23, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "entities + edge\nget_graph + Cypher", 708, 355, 174, 62, { fontSize: 22, color: ICE, align: "center" });
  addText(s, "NEO4J", 1014, 286, 174, 34, { fontSize: 26, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "named volume\nsurvives restart", 1014, 355, 174, 62, { fontSize: 22, color: ICE, align: "center" });
  addText(s, "Required proof: store → render → stop app → restart → retrieve the same relationship.", 136, 548, 1008, 54, { fontSize: 28, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The assignment starter supplies the browser, routes, and local Neo4j configuration. Students implement SDK writes, graph export, and parameterized one-hop traversal, then prove persistence across an application restart. The instructor reference was designed against published Python 0.5.0.", [URL.sourceClient, URL.sourceLongTerm, URL.readme]);
}

// 30 — conclusion
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Conclusion", 30, true, "NEO4J AGENT MEMORY");
  const takeaways = [
    ["1", "MATCH RETRIEVAL TO THE QUESTION", "Text preserves words; vectors rank meaning; graphs traverse relationships."],
    ["2", "USE THE SDK INSIDE YOUR APP", "It packages typed async calls, backend selection, errors, and lifecycle."],
    ["3", "USE MCP ACROSS HOST BOUNDARIES", "It standardizes discovery and invocation while the host retains policy."],
    ["4", "PROVE PERSISTENCE AND ISOLATION", "A memory feature is only as reliable as its write, scope, and retrieval evidence."],
  ];
  takeaways.forEach((item, index) => {
    const top = 150 + index * 105;
    addText(s, item[0], 90, top, 48, 48, { fontSize: 26, bold: true, color: NAVY, align: "center", valign: "middle", typeface: FONT_CODE, fill: AMBER, radius: "rounded-full" });
    addText(s, item[1], 166, top, 480, 34, { fontSize: 24, bold: true, color: WHITE, typeface: FONT_CODE });
    addText(s, item[2], 166, top + 39, 960, 42, { fontSize: 22, color: ICE });
  });
  addShape(s, "roundRect", 92, 590, 1096, 58, "#173F58", { style: "solid", fill: TEAL, width: 1 }, "rounded-xl");
  addText(s, "NEXT · python3 quiz.py --mode post   ·   agent_memory_assignment.md", 120, 605, 1040, 30, { fontSize: 21, bold: true, color: AMBER, align: "center", typeface: FONT_CODE });
  setNotes(s, "Route students to the post-lesson quiz and the Memory Map assignment. The assignment ends with a persistence demonstration and a comparison between SDK and MCP integration surfaces.", [URL.repo]);
}

async function writeBlob(filePath, blob) {
  const arrayBuffer = await blob.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function main() {
  await fs.mkdir(BUILD_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const renderDir = path.join(BUILD_DIR, "rendered");
  await fs.rm(renderDir, { recursive: true, force: true });
  await fs.mkdir(renderDir, { recursive: true });

  for (const [index, slide] of p.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(renderDir, `${stem}.png`), await p.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(renderDir, `${stem}.layout.json`), await layout.text());
  }

  await writeBlob(path.join(BUILD_DIR, "montage.webp"), await p.export({ format: "webp", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(OUTPUT_PPTX);
  await fs.writeFile(path.join(BUILD_DIR, "inspection.ndjson"), (await p.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 160000 })).ndjson);
  console.log(JSON.stringify({ output: OUTPUT_PPTX, slides: p.slides.items.length, renderDir }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
