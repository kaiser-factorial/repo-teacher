import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = process.env.REPO_TEACHER_BUILD || path.join(SCRIPT_DIR, ".deck-build");
const OUTPUT_DIR = process.env.REPO_TEACHER_OUT || SCRIPT_DIR;
const OUTPUT_PPTX = path.join(OUTPUT_DIR, "Agent_Harness_Engineering.pptx");

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

const FONT_TITLE = "Cambria";
const FONT_BODY = "Calibri";
const FONT_CODE = "Courier New";

const URL = {
  harness: "https://openai.com/index/harness-engineering/",
  practical: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
  running: "https://openai.github.io/openai-agents-python/running_agents/",
  agents: "https://openai.github.io/openai-agents-python/agents/",
  orchestration: "https://openai.github.io/openai-agents-python/multi_agent/",
  tools: "https://openai.github.io/openai-agents-python/tools/",
  guardrails: "https://openai.github.io/openai-agents-python/guardrails/",
  hitl: "https://openai.github.io/openai-agents-python/human_in_the_loop/",
  tracing: "https://openai.github.io/openai-agents-python/tracing/",
  evals: "https://platform.openai.com/docs/api-reference/evals",
  injection: "https://openai.com/index/designing-agents-to-resist-prompt-injection/",
  skills: "https://learn.chatgpt.com/docs/build-skills.md",
  agentsMd: "https://learn.chatgpt.com/docs/agent-configuration/agents-md.md",
  subagents: "https://learn.chatgpt.com/docs/agent-configuration/subagents.md",
  mcp: "https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture",
  anthropic: "https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf",
  react: "https://arxiv.org/abs/2210.03629",
  sweAgent: "https://arxiv.org/abs/2405.15793",
  langgraph: "https://langchain-ai.github.io/langgraph/concepts/breakpoints/",
  vega: "https://vega.github.io/vega-lite/docs/",
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
    return {
      bulletCharacter: "•",
      marginLeft: 24,
      indent: -13,
      spaceAfter: options.spaceAfter || 11,
      runs,
    };
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

function addHeader(slide, title, number, dark = false, kicker = "AGENT HARNESS ENGINEERING") {
  addText(slide, kicker, 64, 38, 610, 26, {
    fontSize: 17,
    bold: true,
    color: dark ? ICE : DEEPBLUE,
    typeface: FONT_CODE,
  });
  addText(slide, title, 64, 72, 1152, 68, {
    fontSize: 48,
    bold: true,
    color: dark ? WHITE : NAVY,
    typeface: FONT_TITLE,
    valign: "middle",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(slide, `AGENT HARNESSES · AI SEMINAR, LAB 2`, 64, 680, 560, 20, {
    fontSize: 15,
    color: dark ? GRID : MUTE,
    typeface: FONT_CODE,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(slide, String(number).padStart(2, "0"), 1158, 678, 58, 22, {
    fontSize: 17,
    bold: true,
    align: "right",
    color: dark ? ICE : DEEPBLUE,
    typeface: FONT_CODE,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

function addBackref(slide, label, dark = false) {
  addShape(slide, "roundRect", 850, 37, 366, 30, dark ? "#173F58" : SEAFOAM, { style: "solid", fill: dark ? TEAL : "#A6DAD0", width: 1 }, "rounded-full");
  addText(slide, `← Background · ${label}`, 864, 41, 338, 22, {
    fontSize: 16,
    bold: true,
    color: dark ? ICE : DEEPBLUE,
    align: "center",
    typeface: FONT_BODY,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

function setNotes(slide, body, sources = []) {
  const lines = [];
  if (body) lines.push(body.trim());
  if (sources.length) {
    lines.push("", "[Sources]", ...sources.map((s) => `- ${s}`), "[/Sources]");
  }
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

function addLabel(slide, text, left, top, width, fill, color = WHITE) {
  addShape(slide, "roundRect", left, top, width, 34, fill, { style: "solid", fill, width: 0 }, "rounded-full");
  addText(slide, text, left + 8, top + 5, width - 16, 24, {
    fontSize: 17,
    bold: true,
    color,
    align: "center",
    typeface: FONT_CODE,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

function addBand(slide, left, top, width, height, fill, title, body, options = {}) {
  addShape(slide, "roundRect", left, top, width, height, fill, { style: "solid", fill: options.line || fill, width: 1 }, "rounded-xl");
  addText(slide, title, left + 22, top + 18, width - 44, 34, {
    fontSize: options.titleSize || 28,
    bold: true,
    color: options.titleColor || NAVY,
    typeface: options.titleTypeface || FONT_TITLE,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(slide, body, left + 22, top + 62, width - 44, height - 80, {
    fontSize: options.bodySize || 21,
    color: options.bodyColor || INK,
    typeface: options.bodyTypeface || FONT_BODY,
    lineSpacing: 1.05,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}

function addArrow(slide, from, to, color = GRID, kind = "straight") {
  return slide.shapes.connect(from, to, {
    kind,
    fromSide: "right",
    toSide: "left",
    line: { style: "solid", fill: color, width: 2 },
    tail: { type: "triangle", width: "sm", length: "sm" },
  });
}

const p = Presentation.create({ slideSize: { width: W, height: H } });

// 1 — Title
{
  const s = p.slides.add();
  s.background.fill = NAVY;
  addShape(s, "ellipse", 830, 0, 440, 440, DEEPBLUE, "none");
  addShape(s, "ellipse", 930, 290, 350, 350, TEAL, "none");
  addShape(s, "ellipse", 750, 300, 220, 220, MIDNIGHT, "none");
  addText(s, "AI TOOLING SEMINAR · LAB 2", 72, 74, 600, 30, { fontSize: 19, bold: true, color: ICE, typeface: FONT_CODE });
  addText(s, "Agent Harness\nEngineering", 72, 150, 720, 190, {
    fontSize: 72, bold: true, color: WHITE, typeface: FONT_TITLE, lineSpacing: 0.94,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(s, "How models become bounded, observable systems that can act", 76, 370, 680, 72, {
    fontSize: 29, color: ICE, typeface: FONT_BODY, lineSpacing: 1.0,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  addText(s, "Models propose. Harnesses control what happens next.", 76, 565, 760, 42, {
    fontSize: 24, bold: true, color: AMBER, typeface: FONT_CODE,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  setNotes(s, "Open by separating model capability from system reliability. The deck builds the surrounding runtime one control surface at a time.");
}

// 2 — model vs harness
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "The Model Is Only the Decision Engine", 2);
  addText(s, "A model produces candidate text, structured outputs, or tool calls. The harness decides whether those candidates become actions.", 82, 158, 1110, 70, { fontSize: 28, color: MUTE });
  const model = addShape(s, "ellipse", 130, 300, 220, 220, NAVY, "none");
  addText(s, "MODEL", 160, 364, 160, 44, { fontSize: 32, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE });
  addText(s, "proposes", 166, 414, 148, 30, { fontSize: 21, color: ICE, align: "center" });
  const harness = addShape(s, "roundRect", 480, 270, 650, 280, CARD, { style: "solid", fill: ICE, width: 2 }, "rounded-2xl");
  addText(s, "HARNESS", 520, 302, 240, 38, { fontSize: 32, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
  addBullets(s, ["assembles context", "exposes tools", "executes or refuses", "stores state", "stops, retries, or escalates", "records evidence"], 518, 352, 560, 170, { fontSize: 23, color: INK, spaceAfter: 5 });
  addArrow(s, model, harness, TEAL);
  setNotes(s, "The same model can behave like a chatbot, a classifier, a coding agent, or a workflow component depending on the harness around it. Reliability claims therefore belong to the system, not to the model alone.", [URL.practical, URL.harness]);
}

// 3 — layers
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Five Layers Separate an Agent System", 3, true);
  const layers = [
    ["EXPERIENCE", "User interface, API, or event that supplies the task", "#173F58"],
    ["ORCHESTRATION", "Loop, routing, handoffs, parallelism, stop policy", DEEPBLUE],
    ["CAPABILITIES", "Tools, MCP servers, code execution, computer use", TEAL],
    ["CONTEXT", "Instructions, history, retrieval, skills, runtime facts", MIDNIGHT],
    ["MODEL", "Generates decisions under the context it receives", "#071E30"],
  ];
  layers.forEach((x, i) => {
    const top = 158 + i * 91;
    addShape(s, "roundRect", 150 + i * 28, top, 980 - i * 56, 70, x[2], { style: "solid", fill: i === 2 ? ICE : x[2], width: i === 2 ? 1 : 0 }, "rounded-xl");
    addText(s, x[0], 180 + i * 28, top + 17, 250, 34, { fontSize: 24, bold: true, color: WHITE, typeface: FONT_CODE });
    addText(s, x[1], 440 + i * 16, top + 17, 620 - i * 38, 36, { fontSize: 22, color: i === 2 ? WHITE : ICE, align: "right" });
  });
  setNotes(s, "These layers prevent vocabulary collapse. A model is not a tool; a tool is not a workflow; MCP is not an orchestrator; and a user interface is not the harness by itself.", [URL.practical, URL.agents, URL.mcp]);
}

// 4 — loop
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "The Loop Converts Model Output into Work", 4);
  const labels = [
    ["1", "ASSEMBLE", "instructions + state + observations"],
    ["2", "CALL", "model returns final output or an action"],
    ["3", "INTERPRET", "validate structure and policy"],
    ["4", "EXECUTE", "run an allowed capability"],
    ["5", "OBSERVE", "append result, error, or approval state"],
  ];
  const nodes = [];
  labels.forEach((x, i) => {
    const left = 72 + i * 238;
    const node = addShape(s, "roundRect", left, 274, 196, 166, i === 1 ? NAVY : CARD, { style: "solid", fill: i === 1 ? NAVY : ICE, width: 1.2 }, "rounded-xl");
    nodes.push(node);
    addText(s, x[0], left + 16, 290, 34, 30, { fontSize: 22, bold: true, color: i === 1 ? AMBER : DEEPBLUE, typeface: FONT_CODE });
    addText(s, x[1], left + 18, 329, 160, 32, { fontSize: 25, bold: true, color: i === 1 ? WHITE : NAVY, typeface: FONT_CODE });
    addText(s, x[2], left + 18, 373, 160, 48, { fontSize: 19, color: i === 1 ? ICE : MUTE, align: "center" });
    if (i > 0) addArrow(s, nodes[i - 1], node, GRID);
  });
  addText(s, "The loop ends only when the harness recognizes a valid terminal state.", 250, 500, 780, 44, { fontSize: 30, bold: true, color: DEEPBLUE, align: "center", typeface: FONT_TITLE });
  addText(s, "final output · explicit stop · limit exceeded · approval pause · unrecoverable error", 226, 554, 828, 32, { fontSize: 20, color: MUTE, align: "center", typeface: FONT_CODE });
  setNotes(s, "This is the smallest agentic runtime. ReAct established the interleaving of reasoning and environment actions; production runners make the loop explicit and add terminal states, validation, and limits.", [URL.react, URL.running]);
}

// 5 — control plane
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "The Harness Owns the Control Plane", 5);
  addText(s, "MODEL PLANE", 96, 164, 300, 38, { fontSize: 27, bold: true, color: MIDNIGHT, typeface: FONT_CODE });
  addText(s, "Probabilistic judgment", 96, 210, 300, 34, { fontSize: 25, color: MUTE });
  addText(s, "Which chart best answers the question?\nWhich tool should run next?\nIs the evidence sufficient?", 96, 274, 410, 190, { fontSize: 26, color: INK, lineSpacing: 1.18 });
  addShape(s, "rect", 578, 155, 2, 430, DEEPBLUE, "none");
  addText(s, "HARNESS PLANE", 650, 164, 410, 38, { fontSize: 27, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
  addText(s, "Deterministic control", 650, 210, 320, 34, { fontSize: 25, color: MUTE });
  addBullets(s, [
    { lead: "Context: ", body: "what enters the call" },
    { lead: "Capability: ", body: "what actions exist" },
    { lead: "Policy: ", body: "what may execute" },
    { lead: "Lifecycle: ", body: "when to continue or stop" },
    { lead: "Evidence: ", body: "what is logged and graded" },
  ], 638, 268, 500, 250, { fontSize: 24, spaceAfter: 13 });
  addText(s, "Move requirements into code whenever they can be checked mechanically.", 650, 540, 500, 56, { fontSize: 26, bold: true, color: CORAL, typeface: FONT_TITLE });
  setNotes(s, "The control-plane framing explains why better prompting alone cannot fix missing tools, inaccessible logs, unsafe execution, or absent tests. Harness engineering makes needed capabilities legible and enforceable.", [URL.harness]);
}

// 6 — context
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Context Assembly Is Runtime Behavior", 6, true);
  const sources = [
    ["POLICY", "system + developer instructions", 110, 210, DEEPBLUE],
    ["TASK", "current user request", 110, 340, TEAL],
    ["STATE", "history + working memory", 110, 470, MIDNIGHT],
    ["EVIDENCE", "retrieval + tool results", 780, 210, DEEPBLUE],
    ["SKILLS", "selected workflows + references", 780, 340, TEAL],
    ["BUDGET", "remaining turns, time, cost", 780, 470, MIDNIGHT],
  ];
  sources.forEach((x) => {
    addShape(s, "roundRect", x[2], x[3], 330, 88, x[4], { style: "solid", fill: x[4], width: 0 }, "rounded-xl");
    addText(s, x[0], x[2] + 18, x[3] + 14, 120, 30, { fontSize: 22, bold: true, color: WHITE, typeface: FONT_CODE });
    addText(s, x[1], x[2] + 18, x[3] + 48, 292, 25, { fontSize: 19, color: ICE });
  });
  addShape(s, "ellipse", 515, 294, 250, 250, WHITE, "none");
  addText(s, "NEXT\nMODEL\nCALL", 558, 348, 164, 132, { fontSize: 34, bold: true, color: NAVY, align: "center", valign: "middle", typeface: FONT_CODE, lineSpacing: 0.9 });
  addText(s, "Selection is a design decision: relevance, authority, freshness, and token cost compete.", 180, 585, 920, 42, { fontSize: 25, color: AMBER, align: "center" });
  setNotes(s, "Context is assembled, not merely accumulated. Progressive disclosure keeps the entry point small and loads deeper instructions or references only when the task needs them.", [URL.harness, URL.skills, URL.running]);
}

// 7 — instructions
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Instructions Are Contracts, Not Wishes", 7);
  addBand(s, 76, 170, 528, 390, CARD, "Good instruction", "“Write the chart to output/chart.png and return the selected fields.”\n\nIt states the intended behavior and output contract.", { titleColor: DEEPBLUE, titleSize: 30, bodySize: 25 });
  addBand(s, 676, 170, 528, 390, "#FFF4EF", "Mechanical enforcement", "Allow writes only under output/.\nValidate every referenced field.\nRequire chart.png before success.\nReject a third revision.\n\nIt makes the contract testable.", { titleColor: CORAL, titleSize: 30, bodySize: 25 });
  addText(s, "Reliable harnesses pair semantic guidance with deterministic checks.", 170, 592, 940, 42, { fontSize: 30, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Instructions improve model decisions, but controls such as allowed paths, schemas, approval rules, and maximum turns should be represented in runtime policy when possible.", [URL.practical, URL.harness, URL.guardrails]);
}

// 8 — seven boundaries
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Critical Instructions Specify Seven Boundaries", 8);
  const items = [
    ["1", "OUTCOME", "The artifact or decision the run must produce"],
    ["2", "AUTHORITY", "Which sources outrank others"],
    ["3", "PROCESS", "Required checks and order dependencies"],
    ["4", "TOOLS", "When each capability should be used"],
    ["5", "PERMISSION", "Actions allowed now versus after approval"],
    ["6", "FAILURE", "Retry, ask, stop, or degrade behavior"],
    ["7", "OUTPUT", "Schema, evidence, and completion signal"],
  ];
  items.forEach((x, i) => {
    const col = i < 4 ? 0 : 1;
    const row = col === 0 ? i : i - 4;
    const left = col === 0 ? 76 : 660;
    const top = 162 + row * 116;
    addText(s, x[0], left, top, 46, 46, { fontSize: 29, bold: true, color: DEEPBLUE, align: "center", valign: "middle", typeface: FONT_CODE, fill: SEAFOAM, radius: "rounded-full" });
    addText(s, x[1], left + 64, top, 210, 30, { fontSize: 23, bold: true, color: NAVY, typeface: FONT_CODE });
    addText(s, x[2], left + 64, top + 34, 460, 50, { fontSize: 20, color: MUTE });
  });
  addText(s, "One instruction per rule. Short entry point. Deeper sources on demand.", 286, 612, 708, 36, { fontSize: 24, bold: true, color: CORAL, align: "center" });
  setNotes(s, "This is the deck's reusable instruction template. The short entry point should route to deeper, versioned sources rather than repeat every policy inline.", [URL.harness, URL.skills, URL.agentsMd]);
}

// 9 — typed tools
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Tools Are Typed Capabilities", 9, true);
  addCode(s, `{
  "name": "render_chart",
  "description": "Render one validated Vega-Lite spec",
  "input": {
    "spec": "VegaLiteSpec",
    "output_path": "safe relative path"
  },
  "returns": { "path": "string", "warnings": "string[]" },
  "errors": ["INVALID_FIELD", "UNSAFE_PATH", "RENDER_FAILED"]
}`, 72, 164, 610, 430, { fontSize: 20 });
  addText(s, "A tool contract tells the model—and the runtime—five things:", 740, 178, 430, 62, { fontSize: 27, bold: true, color: WHITE, typeface: FONT_TITLE });
  addBullets(s, ["what the capability does", "when it applies", "which inputs are valid", "what the result contains", "how failure is represented"], 730, 266, 450, 260, { fontSize: 24, color: ICE, spaceAfter: 14 });
  addText(s, "A vague tool description is an ambiguous API.", 744, 548, 420, 44, { fontSize: 27, bold: true, color: AMBER, align: "center" });
  setNotes(s, "Function tools and MCP tools expose machine-readable schemas. Descriptions still matter because they guide model selection; schemas then constrain arguments and enable validation.", [URL.tools, URL.mcp]);
}

// 10 — state
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "State Is Four Different Things", 10);
  const rows = [
    ["CONVERSATION", "Messages and tool results carried between turns", "Does the next call need this transcript?"],
    ["WORKING", "Plan, intermediate artifacts, pending calls, counters", "Can the run resume without replaying work?"],
    ["APPLICATION", "User profile, records, permissions, dependencies", "Does the model need this—or only the tool?"],
    ["LONG-TERM", "Retrieved memories or durable knowledge", "Who wrote it, when, and for which scope?"],
  ];
  rows.forEach((r, i) => {
    const top = 164 + i * 111;
    addShape(s, "roundRect", 76, top, 1128, 91, i % 2 ? WHITE : CARD, { style: "solid", fill: ICE, width: 1 }, "rounded-xl");
    addText(s, r[0], 98, top + 20, 210, 30, { fontSize: 22, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
    addText(s, r[1], 324, top + 16, 470, 55, { fontSize: 22, color: INK });
    addText(s, r[2], 830, top + 16, 340, 55, { fontSize: 20, italic: true, color: MUTE });
  });
  addText(s, "Do not call all of these “memory.” Their ownership, lifetime, and privacy differ.", 188, 620, 904, 34, { fontSize: 24, bold: true, color: CORAL, align: "center" });
  setNotes(s, "Conversation state, application context, and persistent memory are separate surfaces. Current agent runtimes support manual histories, session stores, and server-managed conversation IDs; the harness chooses which lifecycle fits.", [URL.running, URL.agents]);
}

// 11 — stop conditions
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Stop Conditions Bound Autonomy", 11);
  addText(s, "A model can always suggest another step. The harness decides when another step is justified.", 84, 160, 1088, 54, { fontSize: 28, color: MUTE, align: "center" });
  const stops = [
    ["SUCCESS", "typed final output passes validation", TEAL],
    ["BUDGET", "turn, token, time, or spend limit reached", DEEPBLUE],
    ["STALL", "same action or error repeats", MIDNIGHT],
    ["RISK", "next action crosses an approval boundary", CORAL],
    ["UNCERTAINTY", "required evidence is unavailable", "#7A6A1F"],
  ];
  stops.forEach((x, i) => {
    const left = 82 + i * 231;
    addShape(s, "roundRect", left, 272, 200, 236, WHITE, { style: "solid", fill: x[2], width: 2 }, "rounded-xl");
    addShape(s, "ellipse", left + 67, 294, 66, 66, x[2], "none");
    addText(s, String(i + 1), left + 82, 309, 36, 36, { fontSize: 25, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE });
    addText(s, x[0], left + 16, 382, 168, 30, { fontSize: 21, bold: true, color: x[2], align: "center", typeface: FONT_CODE });
    addText(s, x[1], left + 20, 428, 160, 58, { fontSize: 19, color: INK, align: "center" });
  });
  addText(s, "A stop is part of the algorithm—not an afterthought.", 310, 560, 660, 44, { fontSize: 31, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Maximum turns are the simplest bound. Production systems also need limits for repeated actions, elapsed time, spend, missing evidence, and risk escalation.", [URL.running, URL.practical]);
}

// 12 — boundaries
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Execution Boundaries Limit Consequences", 12, true);
  const ring = [
    ["READ", "inspect approved inputs", 156, 252, TEAL],
    ["TRANSFORM", "compute in a sandbox", 430, 174, DEEPBLUE],
    ["WRITE", "restricted paths only", 884, 252, MIDNIGHT],
    ["PUBLISH", "external side effect", 430, 430, CORAL],
  ];
  const nodes = [];
  ring.forEach((x) => {
    const n = addShape(s, "roundRect", x[2], x[3], 240, 116, x[4], { style: "solid", fill: x[4], width: 0 }, "rounded-xl");
    nodes.push(n);
    addText(s, x[0], x[2] + 18, x[3] + 18, 204, 28, { fontSize: 23, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
    addText(s, x[1], x[2] + 18, x[3] + 58, 204, 36, { fontSize: 20, color: ICE, align: "center" });
  });
  addShape(s, "ellipse", 475, 284, 330, 150, WHITE, "none");
  addText(s, "LEAST PRIVILEGE", 510, 330, 260, 42, { fontSize: 31, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  addText(s, "identity · filesystem · network · credentials · spend", 248, 588, 784, 34, { fontSize: 23, color: AMBER, align: "center", typeface: FONT_CODE });
  setNotes(s, "Treat each capability as a security boundary. Sandboxes, scoped credentials, allowlists, protected paths, and explicit external-write approvals reduce the downside of both mistakes and prompt injection.", [URL.injection, URL.hitl, URL.harness]);
}

// 13 — errors
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Errors Must Become Structured Observations", 13);
  addBand(s, 80, 178, 340, 328, "#FFF4EF", "Opaque failure", "“Render failed.”\n\nThe model cannot identify the violated contract, so retries become guesses.", { titleColor: CORAL, titleSize: 30, bodySize: 25 });
  addBand(s, 470, 178, 730, 328, CARD, "Recoverable observation", `{
  "code": "INVALID_FIELD",
  "field": "rating",
  "available_fields": ["user_rating", "critic_rating"],
  "retryable": true,
  "completed_side_effects": []
}`, { titleColor: DEEPBLUE, titleSize: 30, bodySize: 21, bodyTypeface: FONT_CODE });
  addText(s, "Retry only when the next attempt can use new information—and when repeating is safe.", 146, 552, 988, 62, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Errors are observations in the agent loop. Structured errors support targeted revision, while side-effect metadata and idempotency keys prevent a retry from duplicating completed actions.", [URL.running, URL.tools]);
}

// 14 — traces
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Traces Reconstruct the Run", 14);
  addText(s, "A final answer hides the path. A trace preserves enough evidence to debug the path.", 96, 160, 1088, 48, { fontSize: 28, color: MUTE, align: "center" });
  const events = [
    ["00:00.0", "INPUT", "question + dataset path"],
    ["00:00.4", "MODEL", "requests profile_dataset"],
    ["00:00.5", "TOOL", "12 fields · 3 missing values"],
    ["00:01.3", "MODEL", "emits ChartPlan"],
    ["00:01.4", "CHECK", "INVALID_FIELD: rating"],
    ["00:02.1", "MODEL", "revises to user_rating"],
    ["00:02.3", "OUTPUT", "chart.png + spec.json"],
  ];
  events.forEach((e, i) => {
    const top = 236 + i * 55;
    addText(s, e[0], 100, top, 110, 28, { fontSize: 18, color: MUTE, typeface: FONT_CODE });
    addLabel(s, e[1], 228, top - 4, 116, i === 4 ? CORAL : i === 6 ? TEAL : DEEPBLUE);
    addText(s, e[2], 372, top, 750, 30, { fontSize: 22, color: INK, typeface: i === 1 || i === 3 || i === 5 ? FONT_CODE : FONT_BODY });
    if (i < events.length - 1) addShape(s, "line", 286, top + 31, 0, 20, "none", { style: "solid", fill: GRID, width: 2 });
  });
  addText(s, "Record model calls, tool calls, guardrails, approvals, usage, and terminal state—without leaking secrets.", 174, 632, 932, 32, { fontSize: 22, bold: true, color: DEEPBLUE, align: "center" });
  setNotes(s, "Agent traces need more than application logs: model calls, tool arguments/results, guardrails, handoffs, usage, and state transitions. Sensitive inputs and outputs require explicit data-handling choices.", [URL.tracing, URL.running]);
}

// 15 — evals
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Evals Define Whether “Done” Is Correct", 15, true);
  const cols = [
    ["DETERMINISTIC", "Spec parses\nFields exist\nOutput file exists\nWrites stay in scope", TEAL],
    ["TASK QUALITY", "Chart answers question\nAggregation is honest\nLabels are readable\nCaveats are stated", DEEPBLUE],
    ["TRAJECTORY", "Right tools used\nRetries stay bounded\nEvidence precedes claims\nNo duplicate side effects", MIDNIGHT],
  ];
  cols.forEach((x, i) => {
    const left = 72 + i * 400;
    addShape(s, "roundRect", left, 190, 350, 360, "#123B53", { style: "solid", fill: x[2], width: 2 }, "rounded-xl");
    addText(s, x[0], left + 24, 220, 302, 34, { fontSize: 25, bold: true, color: x[2] === TEAL ? WHITE : ICE, align: "center", typeface: FONT_CODE });
    addText(s, x[1], left + 38, 290, 274, 180, { fontSize: 24, color: WHITE, align: "center", lineSpacing: 1.25 });
  });
  addText(s, "An eval set is the executable definition of the harness contract.", 186, 594, 908, 44, { fontSize: 30, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Evaluate the artifact and the trajectory. Deterministic graders are best for objective invariants; model or human grading can assess judgment, but should be calibrated and paired with concrete criteria.", [URL.evals, URL.tracing, URL.orchestration]);
}

// 16 — bridge
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "The Same Controls Generate Every Harness Form", 16, false, "BRIDGE · BACKGROUND → ARCHITECTURE");
  const map = [
    ["Slide 4", "LOOP", "Who chooses the next step?"],
    ["Slide 6", "CONTEXT", "What does each decision see?"],
    ["Slide 9", "TOOLS", "Which actions can be taken?"],
    ["Slide 10", "STATE", "What survives between steps?"],
    ["Slide 11", "STOPS", "Where does autonomy end?"],
    ["Slides 12–15", "CONTROL", "How is execution bounded and judged?"],
  ];
  map.forEach((x, i) => {
    const top = 154 + i * 78;
    addText(s, x[0], 92, top + 12, 150, 30, { fontSize: 19, bold: true, color: MUTE, typeface: FONT_CODE });
    addText(s, x[1], 264, top + 10, 190, 34, { fontSize: 24, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
    addShape(s, "line", 458, top + 27, 88, 0, "none", { style: "solid", fill: ICE, width: 3 });
    addText(s, x[2], 574, top + 7, 570, 42, { fontSize: 25, color: INK });
  });
  addText(s, "The forms differ mainly in who controls sequencing, state, and delegation.", 168, 624, 944, 36, { fontSize: 26, bold: true, color: CORAL, align: "center" });
  setNotes(s, "This bridge turns the background anatomy into a comparison framework. Later slides carry back-reference pills to the relevant control surface.", [URL.orchestration, URL.anthropic]);
}

// 17 — deterministic
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Deterministic Workflows Constrain the Path", 17); addBackref(s, "Slide 4, Loop");
  const steps = ["CLASSIFY", "PROFILE", "PLAN", "RENDER", "GRADE"];
  const nodes = [];
  steps.forEach((t, i) => {
    const left = 72 + i * 236;
    const n = addShape(s, "roundRect", left, 288, 190, 110, i === 2 ? NAVY : WHITE, { style: "solid", fill: i === 2 ? NAVY : ICE, width: 1.5 }, "rounded-xl");
    nodes.push(n);
    addText(s, t, left + 12, 322, 166, 34, { fontSize: 23, bold: true, color: i === 2 ? WHITE : DEEPBLUE, align: "center", typeface: FONT_CODE });
    if (i > 0) addArrow(s, nodes[i - 1], n, GRID);
  });
  addText(s, "Code fixes the order; models supply judgment inside selected steps.", 168, 470, 944, 48, { fontSize: 30, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  addText(s, "Use when the process is known, auditable, and should have predictable latency and cost.", 200, 536, 880, 44, { fontSize: 24, color: MUTE, align: "center" });
  setNotes(s, "Code orchestration is appropriate when the path is known. Structured model outputs can classify or plan within a deterministic graph while the host controls sequence and retries.", [URL.orchestration, URL.anthropic]);
}

// 18 — single agent
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Single-Agent Loops Adapt the Path", 18, true); addBackref(s, "Slide 11, Stops", true);
  addShape(s, "ellipse", 470, 220, 340, 340, WHITE, "none");
  addText(s, "ONE AGENT", 530, 302, 220, 44, { fontSize: 34, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  addText(s, "chooses tools, reads results,\nand revises its plan", 524, 370, 232, 80, { fontSize: 23, color: MUTE, align: "center" });
  [["SEARCH", 160, 194], ["DATA", 160, 466], ["CODE", 900, 194], ["WRITE", 900, 466]].forEach((x, i) => {
    addShape(s, "roundRect", x[1], x[2], 220, 92, i % 2 ? MIDNIGHT : DEEPBLUE, "none", "rounded-xl");
    addText(s, x[0], x[1] + 18, x[2] + 26, 184, 36, { fontSize: 25, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  });
  addText(s, "Best default for open-ended work when one context and one owner are enough.", 192, 604, 896, 38, { fontSize: 25, color: AMBER, align: "center" });
  setNotes(s, "A single agent is often the simplest adaptive architecture. Add tools and strong boundaries before adding agents; evaluation and maintenance remain easier with one owner.", [URL.practical, URL.anthropic, URL.running]);
}

// 19 — router
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Routers Choose Among Bounded Paths", 19); addBackref(s, "Slide 6, Context");
  const router = addShape(s, "diamond", 170, 274, 220, 180, NAVY, "none");
  addText(s, "ROUTER", 212, 335, 136, 40, { fontSize: 28, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  const dests = [
    ["SUMMARIZE", "text-only path", 620, 174, TEAL],
    ["VISUALIZE", "data + renderer", 620, 308, DEEPBLUE],
    ["ESCALATE", "human review", 620, 442, CORAL],
  ];
  dests.forEach((x) => {
    const n = addShape(s, "roundRect", x[2], x[3], 420, 100, CARD, { style: "solid", fill: x[4], width: 2 }, "rounded-xl");
    addText(s, x[0], x[2] + 24, x[3] + 18, 190, 30, { fontSize: 24, bold: true, color: x[4], typeface: FONT_CODE });
    addText(s, x[1], x[2] + 220, x[3] + 18, 166, 42, { fontSize: 22, color: MUTE, align: "right" });
    addArrow(s, router, n, GRID, "elbow");
  });
  addText(s, "Routing keeps each path’s instructions and tools narrower than one universal agent.", 168, 590, 944, 42, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "A router can be deterministic or model-based. Structured classification is a common pattern: the model selects a bounded route, then code activates only that route's context and tools.", [URL.orchestration, URL.anthropic]);
}

// 20 — planner executor critic
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Planner–Executor–Critic Splits the Work", 20); addBackref(s, "Slide 15, Evals");
  const defs = [
    ["PLANNER", "decomposes the goal\ninto explicit steps", DEEPBLUE, 94],
    ["EXECUTOR", "uses tools and\nproduces artifacts", TEAL, 470],
    ["CRITIC", "checks the result\nagainst a rubric", CORAL, 846],
  ];
  const ns = [];
  defs.forEach((x) => {
    const n = addShape(s, "roundRect", x[3], 260, 300, 210, WHITE, { style: "solid", fill: x[2], width: 2 }, "rounded-xl");
    ns.push(n);
    addText(s, x[0], x[3] + 30, 294, 240, 36, { fontSize: 27, bold: true, color: x[2], align: "center", typeface: FONT_CODE });
    addText(s, x[1], x[3] + 35, 354, 230, 82, { fontSize: 24, color: INK, align: "center" });
  });
  addArrow(s, ns[0], ns[1], GRID); addArrow(s, ns[1], ns[2], GRID);
  s.shapes.connect(ns[2], ns[1], { kind: "curved", fromSide: "bottom", toSide: "bottom", line: { style: "dashed", fill: CORAL, width: 2 }, tail: { type: "triangle", width: "sm", length: "sm" } });
  addText(s, "A rubric and a revision cap turn “critique yourself” into a bounded optimization loop.", 160, 544, 960, 54, { fontSize: 28, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Evaluator-optimizer patterns are useful when criteria are explicit and revision improves measurable quality. Without a rubric and cap, critique can add cost without reliable improvement.", [URL.orchestration, URL.anthropic]);
}

// 21 — managers/handoffs
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Managers and Handoffs Assign Control Differently", 21, true); addBackref(s, "Slide 4, Loop", true);
  addText(s, "MANAGER · agents as tools", 90, 170, 480, 38, { fontSize: 27, bold: true, color: AMBER, typeface: FONT_CODE });
  addText(s, "One agent retains the conversation, calls specialists for bounded subtasks, and synthesizes the final answer.", 90, 222, 480, 118, { fontSize: 25, color: WHITE });
  addText(s, "Best when one place must own output format, shared guardrails, and user interaction.", 90, 390, 480, 90, { fontSize: 22, color: ICE });
  addShape(s, "rect", 628, 158, 2, 420, TEAL, "none");
  addText(s, "HANDOFF · control transfer", 700, 170, 480, 38, { fontSize: 27, bold: true, color: AMBER, typeface: FONT_CODE });
  addText(s, "A triage agent transfers the active conversation to a specialist whose instructions now govern the turn.", 700, 222, 480, 118, { fontSize: 25, color: WHITE });
  addText(s, "Best when the specialist should respond directly and carry a focused context.", 700, 390, 480, 90, { fontSize: 22, color: ICE });
  addText(s, "Delegation changes ownership—not just who computes a subtask.", 220, 574, 840, 44, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Current agent SDKs distinguish manager-style agents-as-tools from handoffs. The former keeps the manager active; the latter changes the active agent and instruction context.", [URL.orchestration, URL.agents]);
}

// 22 — parallel
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Parallel Workers Trade Tokens for Time", 22); addBackref(s, "Slide 10, State");
  const start = addShape(s, "roundRect", 90, 294, 190, 110, NAVY, "none", "rounded-xl");
  addText(s, "TASK", 120, 329, 130, 40, { fontSize: 29, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  const workers = [
    ["DATA", 430, 170, DEEPBLUE], ["DESIGN", 430, 298, TEAL], ["RISK", 430, 426, MIDNIGHT],
  ];
  const ws = workers.map((x) => {
    const n = addShape(s, "roundRect", x[1], x[2], 240, 92, CARD, { style: "solid", fill: x[3], width: 2 }, "rounded-xl");
    addText(s, x[0], x[1] + 24, x[2] + 27, 192, 34, { fontSize: 25, bold: true, color: x[3], align: "center", typeface: FONT_CODE });
    addArrow(s, start, n, GRID, "elbow");
    return n;
  });
  const synth = addShape(s, "roundRect", 890, 294, 280, 110, CORAL, "none", "rounded-xl");
  addText(s, "SYNTHESIZE", 920, 329, 220, 40, { fontSize: 27, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  ws.forEach((n) => addArrow(s, n, synth, GRID, "elbow"));
  addText(s, "Parallelize independent work. Serialize work that shares mutable state or depends on prior results.", 158, 566, 964, 60, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Parallel workers can reduce elapsed time, but each consumes its own model and tool budget. Shared writes create conflicts; good worker tasks are independent and return compact summaries or artifacts.", [URL.anthropic, URL.subagents]);
}

// 23 — durable
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Durable Harnesses Survive Waiting and Restarts", 23); addBackref(s, "Slide 10, State");
  const lineY = 360;
  addShape(s, "line", 110, lineY, 1050, 0, "none", { style: "solid", fill: GRID, width: 3 });
  const events = [
    ["RUN", "agent begins", 130, DEEPBLUE],
    ["CHECKPOINT", "state persisted", 360, TEAL],
    ["PAUSE", "approval requested", 590, CORAL],
    ["RESUME", "new process", 820, MIDNIGHT],
    ["COMMIT", "effect recorded", 1050, DEEPBLUE],
  ];
  events.forEach((x, i) => {
    addShape(s, "ellipse", x[2], lineY - 28, 56, 56, x[3], "none");
    addText(s, String(i + 1), x[2] + 11, lineY - 17, 34, 34, { fontSize: 22, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE });
    addText(s, x[0], x[2] - 50, lineY - 104, 156, 30, { fontSize: 21, bold: true, color: x[3], align: "center", typeface: FONT_CODE });
    addText(s, x[1], x[2] - 55, lineY + 48, 166, 45, { fontSize: 20, color: MUTE, align: "center" });
  });
  addText(s, "Durability requires persisted state, idempotent effects, and versioned resumes—not a longer timeout.", 150, 546, 980, 66, { fontSize: 29, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Long-running workflows must be resumable across human waits and process failures. Frameworks such as LangGraph and durable workflow integrations checkpoint state and resume from a stored cursor.", [URL.langgraph, URL.running, URL.hitl]);
}

// 24 — ACI
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Environment Design Changes Agent Performance", 24, true); addBackref(s, "Slide 12, Boundaries", true);
  addText(s, "A model does not act on a repository or desktop directly. It acts through an interface designed for its strengths and limits.", 104, 158, 1072, 72, { fontSize: 28, color: ICE, align: "center" });
  const before = ["raw shell", "unbounded files", "long outputs", "hidden app state"];
  const after = ["typed edit tools", "workspace scope", "summarized results", "screenshots + DOM"];
  addText(s, "GENERAL-PURPOSE INTERFACE", 100, 268, 430, 36, { fontSize: 25, bold: true, color: GRID, align: "center", typeface: FONT_CODE });
  addBullets(s, before, 116, 320, 400, 220, { fontSize: 25, color: WHITE, spaceAfter: 14 });
  addText(s, "AGENT-COMPUTER INTERFACE", 748, 268, 430, 36, { fontSize: 25, bold: true, color: AMBER, align: "center", typeface: FONT_CODE });
  addBullets(s, after, 764, 320, 400, 220, { fontSize: 25, color: WHITE, spaceAfter: 14 });
  addText(s, "Better interfaces reduce search, ambiguity, and unsafe affordances.", 244, 588, 792, 42, { fontSize: 30, bold: true, color: WHITE, align: "center", typeface: FONT_TITLE });
  setNotes(s, "The SWE-agent paper names this layer the Agent-Computer Interface and reports that interface design materially changes behavior and benchmark performance. Harness engineering similarly emphasizes making application state, logs, and tests legible to agents.", [URL.sweAgent, URL.harness]);
}

// 25 — multiagent cost
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Multi-Agent Complexity Must Earn Its Cost", 25); addBackref(s, "Slide 15, Evals");
  const ladder = [
    ["1", "ONE CALL", "structured response", 150, CARD, DEEPBLUE],
    ["2", "WORKFLOW", "code controls sequence", 250, "#E9F5F8", DEEPBLUE],
    ["3", "ONE AGENT", "model controls sequence", 350, SEAFOAM, TEAL],
    ["4", "SPECIALISTS", "manager or handoff", 450, "#E9EAF6", MIDNIGHT],
    ["5", "PARALLEL FLEET", "coordination + synthesis", 550, "#FFF1EA", CORAL],
  ];
  ladder.forEach((x, i) => {
    const width = Math.max(360, 960 - i * 176);
    const left = (W - width) / 2;
    const top = i === 0 ? 160 : x[3];
    const labelWidth = Math.min(300, Math.max(140, width * 0.38));
    const detailLeft = left + width * 0.55;
    addShape(s, "roundRect", left, top, width, 72, x[4], { style: "solid", fill: x[5], width: 1 }, "rounded-xl");
    addText(s, x[0], left + 18, top + 17, 38, 32, { fontSize: 24, bold: true, color: x[5], typeface: FONT_CODE });
    addText(s, x[1], left + 60, top + 17, labelWidth, 32, { fontSize: i === 4 ? 20 : 23, bold: true, color: NAVY, typeface: FONT_CODE });
    addText(s, x[2], detailLeft, top + 17, width * 0.41, 32, { fontSize: i === 4 ? 18 : 21, color: MUTE, align: "right" });
  });
  addText(s, "Advance only when evals show a measurable gain in quality, latency, isolation, or recoverability.", 136, 630, 1008, 36, { fontSize: 24, bold: true, color: CORAL, align: "center" });
  setNotes(s, "Multi-agent architectures add context boundaries, routing, coordination, synthesis, latency, and token use. Start with the simplest architecture that passes the evals; add specialists only for a measured reason.", [URL.practical, URL.anthropic, URL.subagents]);
}

// 26 — frameworks
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Frameworks Package Recurring Harness Decisions", 26); addBackref(s, "Slides 4–15, Controls");
  const rows = [
    ["DIRECT API", "You own loop, dispatch, state, retries, and traces", "maximum visibility"],
    ["AGENT SDK", "Runner manages turns, tools, sessions, guardrails, handoffs", "fewer custom primitives"],
    ["GRAPH RUNTIME", "Nodes, edges, checkpoints, interrupts, persistence", "explicit workflow topology"],
    ["DURABLE ENGINE", "Retries, timers, queues, resumable external work", "long-lived reliability"],
  ];
  rows.forEach((x, i) => {
    const top = 162 + i * 111;
    addShape(s, "roundRect", 80, top, 1120, 90, i % 2 ? WHITE : "#E9F5F8", { style: "solid", fill: ICE, width: 1 }, "rounded-xl");
    addText(s, x[0], 104, top + 18, 220, 30, { fontSize: 22, bold: true, color: DEEPBLUE, typeface: FONT_CODE });
    addText(s, x[1], 342, top + 14, 580, 48, { fontSize: 22, color: INK });
    addText(s, x[2], 950, top + 14, 220, 48, { fontSize: 20, italic: true, color: MUTE, align: "right" });
  });
  addText(s, "A framework is a bundle of defaults. Read the defaults before trusting the abstraction.", 180, 620, 920, 34, { fontSize: 25, bold: true, color: NAVY, align: "center" });
  setNotes(s, "The framework choice is secondary to the control-surface choices. Direct APIs maximize ownership; SDKs package the loop; graph runtimes package topology and persistence; durable engines package long-lived execution.", [URL.running, URL.orchestration, URL.langgraph]);
}

// 27 — MCP
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "MCP Standardizes Discovery—not Orchestration", 27, true); addBackref(s, "Slide 9, Tools", true);
  const host = addShape(s, "roundRect", 92, 270, 310, 190, WHITE, "none", "rounded-xl");
  addText(s, "HOST / HARNESS", 122, 304, 250, 36, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  addText(s, "chooses servers\nregisters tools\nruns the loop", 142, 358, 210, 78, { fontSize: 23, color: MUTE, align: "center" });
  const mcp = addShape(s, "roundRect", 486, 226, 308, 278, DEEPBLUE, "none", "rounded-xl");
  addText(s, "MCP", 556, 270, 168, 44, { fontSize: 37, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "version + identity\ncapability discovery\ntools · resources · prompts", 530, 344, 220, 100, { fontSize: 23, color: ICE, align: "center" });
  const server = addShape(s, "roundRect", 878, 270, 310, 190, TEAL, "none", "rounded-xl");
  addText(s, "SERVER", 932, 304, 202, 36, { fontSize: 27, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
  addText(s, "publishes schemas\nreturns results\nreports capabilities", 928, 358, 210, 78, { fontSize: 23, color: WHITE, align: "center" });
  addArrow(s, host, mcp, GRID); addArrow(s, mcp, server, GRID);
  addText(s, "MCP does not decide the next action, the stop policy, permissions, or success criteria.", 154, 574, 972, 52, { fontSize: 27, bold: true, color: AMBER, align: "center", typeface: FONT_TITLE });
  setNotes(s, "MCP defines a client-server protocol for discovering capabilities and invoking primitives. The host still owns context assembly, tool registration, orchestration, authorization, and lifecycle.", [URL.mcp]);
}

// 28 — context subsystems
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "Skills, RAG, and Memory Serve Different Roles", 28); addBackref(s, "Slide 6, Context");
  const cols = [
    ["SKILL", "Reusable workflow", "Stable procedures, rubrics, templates, scripts", "Loaded when the task matches", DEEPBLUE],
    ["RAG", "Selective evidence", "Large corpora where only a few passages matter", "Retrieved per question with provenance", TEAL],
    ["MEMORY", "Prior state or preference", "Facts meant to survive beyond one run", "Scoped by owner, project, and freshness", MIDNIGHT],
  ];
  cols.forEach((x, i) => {
    const left = 64 + i * 405;
    addText(s, x[0], left, 166, 360, 42, { fontSize: 29, bold: true, color: x[4], align: "center", typeface: FONT_CODE });
    addText(s, x[1], left + 24, 224, 312, 36, { fontSize: 26, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
    addText(s, x[2], left + 34, 292, 292, 88, { fontSize: 22, color: INK, align: "center" });
    addShape(s, "line", left + 80, 402, 200, 0, "none", { style: "solid", fill: ICE, width: 2 });
    addText(s, x[3], left + 34, 432, 292, 88, { fontSize: 21, color: MUTE, align: "center" });
  });
  addText(s, "Use a skill to control the process; use retrieval to supply evidence; use memory only when persistence is intentional.", 114, 582, 1052, 64, { fontSize: 27, bold: true, color: CORAL, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Skills use progressive disclosure: the host sees a short description, then loads the selected SKILL.md and any referenced materials. For the visualization lab, a skill can encode chart-design procedure while retrieval selects relevant slides from a larger PPT corpus.", [URL.skills, URL.tools, URL.running]);
}

// 29 — prompt injection
{
  const s = p.slides.add(); s.background.fill = CARD; addHeader(s, "Untrusted Content Cannot Become Policy", 29); addBackref(s, "Slides 6 & 12, Context + Boundaries");
  addText(s, "TRUSTED CONTROL", 84, 168, 440, 36, { fontSize: 26, bold: true, color: DEEPBLUE, align: "center", typeface: FONT_CODE });
  addBullets(s, ["system and developer policy", "tool permissions", "approval rules", "output and validation contract"], 92, 224, 420, 230, { fontSize: 24, color: INK, spaceAfter: 15 });
  addShape(s, "rect", 580, 162, 3, 408, CORAL, "none");
  addText(s, "UNTRUSTED EVIDENCE", 652, 168, 500, 36, { fontSize: 26, bold: true, color: CORAL, align: "center", typeface: FONT_CODE });
  addBullets(s, ["web pages and emails", "retrieved documents", "uploaded slides", "tool-returned text"], 676, 224, 440, 230, { fontSize: 24, color: INK, spaceAfter: 15 });
  addText(s, "Treat retrieved text as data—even when it contains imperative language.", 666, 488, 456, 54, { fontSize: 25, bold: true, color: CORAL, align: "center" });
  addText(s, "Minimize exposed tools · constrain outputs · sandbox execution · confirm consequential actions", 144, 600, 992, 34, { fontSize: 23, bold: true, color: NAVY, align: "center", typeface: FONT_CODE });
  setNotes(s, "Prompt injection places instructions inside external content. The model may still be influenced, so defense is layered: separate policy from data, minimize capabilities, validate outputs, sandbox execution, and require approval for consequential actions.", [URL.injection, URL.guardrails, URL.hitl]);
}

// 30 — approval
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Human Approval Gates Consequential Actions", 30, true); addBackref(s, "Slide 12, Boundaries", true);
  const actions = [
    ["READ DATA", "reversible · internal", 92, TEAL, "AUTO"],
    ["WRITE DRAFT", "scoped · recoverable", 370, DEEPBLUE, "AUTO"],
    ["SEND / DELETE", "external or destructive", 648, CORAL, "PAUSE"],
    ["RESUME", "decision stored in run state", 926, MIDNIGHT, "HUMAN"],
  ];
  const nodes = [];
  actions.forEach((x) => {
    const n = addShape(s, "roundRect", x[2], 286, 230, 190, x[3], "none", "rounded-xl");
    nodes.push(n);
    addText(s, x[4], x[2] + 24, 308, 182, 30, { fontSize: 19, bold: true, color: AMBER, align: "center", typeface: FONT_CODE });
    addText(s, x[0], x[2] + 24, 354, 182, 36, { fontSize: 24, bold: true, color: WHITE, align: "center", typeface: FONT_CODE });
    addText(s, x[1], x[2] + 30, 414, 170, 42, { fontSize: 20, color: ICE, align: "center" });
  });
  for (let i = 1; i < nodes.length; i++) addArrow(s, nodes[i - 1], nodes[i], GRID);
  addText(s, "Approval is a runtime state transition—not a sentence that hopes the model asks.", 170, 560, 940, 60, { fontSize: 29, bold: true, color: WHITE, align: "center", typeface: FONT_TITLE });
  setNotes(s, "Human-in-the-loop runtimes pause before a sensitive call, surface the exact tool and arguments, store the decision, and resume the original run. Gate actions by consequence, not by whether the model sounds confident.", [URL.hitl, URL.practical]);
}

// 31 — assignment
{
  const s = p.slides.add(); s.background.fill = WHITE; addHeader(s, "The Visualization Lab Implements the Complete Loop", 31, false, "BUILD PREVIEW · DATA VISUALIZATION HARNESS");
  const nodes = [
    ["QUESTION\n+ CSV", 56, 278, NAVY],
    ["PROFILE\nDATA", 272, 278, DEEPBLUE],
    ["CHART\nPLAN", 488, 278, TEAL],
    ["VALIDATE\n+ RENDER", 704, 278, MIDNIGHT],
    ["GRADE\n+ REVISE", 920, 278, CORAL],
  ].map((x) => {
    const n = addShape(s, "roundRect", x[1], x[2], 170, 142, x[3], "none", "rounded-xl");
    addText(s, x[0], x[1] + 18, x[2] + 42, 134, 62, { fontSize: 25, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE, lineSpacing: 0.95 });
    return n;
  });
  for (let i = 1; i < nodes.length; i++) addArrow(s, nodes[i - 1], nodes[i], GRID);
  s.shapes.connect(nodes[4], nodes[2], { kind: "curved", fromSide: "bottom", toSide: "bottom", line: { style: "dashed", fill: CORAL, width: 2 }, tail: { type: "triangle", width: "sm", length: "sm" } });
  addText(s, "Artifacts", 1094, 246, 166, 28, { fontSize: 20, bold: true, color: DEEPBLUE, align: "center", typeface: FONT_CODE });
  addText(s, "chart.png\nspec.json\nrationale.md\ntrace.json", 1094, 292, 166, 140, { fontSize: 18, color: INK, align: "center", typeface: FONT_CODE, lineSpacing: 1.2 });
  addText(s, "Designed failure: the first plan references a plausible but nonexistent field. The harness returns a structured error and permits one evidence-based revision.", 128, 510, 1024, 82, { fontSize: 27, bold: true, color: NAVY, align: "center", typeface: FONT_TITLE });
  addText(s, "Extension: add a PPT-derived visualization skill, then rerun the same held-out eval set.", 210, 612, 860, 32, { fontSize: 23, color: CORAL, align: "center", typeface: FONT_CODE });
  setNotes(s, "The assignment uses a constrained Vega-Lite specification rather than arbitrary plotting code. That makes field validation, rendering, artifact checks, and held-out evaluation concrete while preserving a real revise-after-observation loop.", [URL.vega, URL.running, URL.skills]);
}

// 32 — conclusion
{
  const s = p.slides.add(); s.background.fill = NAVY; addHeader(s, "Conclusion", 32, true, "AGENT HARNESS ENGINEERING · SYNTHESIS");
  addText(s, "Models supply judgment.\nHarnesses supply reliable agency.", 90, 170, 760, 130, { fontSize: 50, bold: true, color: WHITE, typeface: FONT_TITLE, lineSpacing: 0.94 });
  addBullets(s, [
    { lead: "Build the loop: ", body: "context → decision → action → observation → stop." },
    { lead: "Bound the run: ", body: "typed tools, least privilege, budgets, approvals, and structured failure." },
    { lead: "Make it inspectable: ", body: "state, traces, artifacts, and evals define what happened and whether it worked." },
    { lead: "Add complexity last: ", body: "routers, critics, specialists, and durable runtimes must earn their cost." },
  ], 88, 340, 850, 250, { fontSize: 25, color: ICE, spaceAfter: 14 });
  addShape(s, "roundRect", 970, 160, 250, 440, WHITE, "none", "rounded-2xl");
  addText(s, "NEXT", 1016, 194, 158, 30, { fontSize: 24, bold: true, color: DEEPBLUE, align: "center", typeface: FONT_CODE });
  addText(s, "1", 998, 250, 52, 52, { fontSize: 29, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE, fill: TEAL, radius: "rounded-full" });
  addText(s, "PRE\nquiz.py --mode pre", 1064, 242, 132, 68, { fontSize: 18, bold: true, color: NAVY, align: "left", typeface: FONT_CODE, lineSpacing: 0.95 });
  addText(s, "2", 998, 352, 52, 52, { fontSize: 29, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE, fill: CORAL, radius: "rounded-full" });
  addText(s, "BUILD\nviz harness", 1064, 344, 132, 66, { fontSize: 18, bold: true, color: NAVY, align: "left", typeface: FONT_CODE, lineSpacing: 0.95 });
  addText(s, "3", 998, 468, 52, 52, { fontSize: 29, bold: true, color: WHITE, align: "center", valign: "middle", typeface: FONT_CODE, fill: MIDNIGHT, radius: "rounded-full" });
  addText(s, "POST\nquiz.py --mode post", 1064, 460, 132, 68, { fontSize: 18, bold: true, color: NAVY, align: "left", typeface: FONT_CODE, lineSpacing: 0.95 });
  addText(s, "Discussion: Which requirement in your own agent belongs in instructions—and which belongs in code?", 92, 620, 850, 42, { fontSize: 23, color: AMBER, typeface: FONT_BODY });
  setNotes(s, "Close by returning to the opening distinction: the model is a decision engine; reliable agency is a systems property. Students take quiz.py in pre mode, build part-a-visualization-harness, then return to the same quiz in post mode for the comparison.", [URL.harness, URL.practical]);
}

async function writeBlob(target, blob) {
  await fs.writeFile(target, new Uint8Array(await blob.arrayBuffer()));
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
  await fs.writeFile(path.join(BUILD_DIR, "inspection.ndjson"), (await p.inspect({ kind: "slide,textbox,shape,notes", maxChars: 100000 })).ndjson);
  console.log(JSON.stringify({ output: OUTPUT_PPTX, slides: p.slides.items.length, renderDir }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
