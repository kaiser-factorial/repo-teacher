const pptxgen = require("pptxgenjs");

// ---------- palette ----------
const NAVY = "0B2942";      // deep background navy
const MIDNIGHT = "21295C";  // accent
const DEEPBLUE = "065A82";  // primary
const TEAL = "1C7293";      // secondary
const ICE = "CFE8F0";       // light tint
const OFFWHITE = "FFFFFF";
const INK = "1B2733";       // body text on white
const MUTE = "5C7080";      // muted gray-blue
const CARD = "F2F8FA";      // light card fill

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "AI Seminar";
pres.title = "LogitLoom: Exploring Token Trajectory Trees";

const ICON = (name) => `/home/claude/icons/${name}.png`;

// ---------- helpers ----------
function addSlideNumber(slide, n) {
  slide.addText(String(n), {
    x: 12.6, y: 7.05, w: 0.5, h: 0.3,
    fontSize: 10, color: MUTE, align: "right", fontFace: "Calibri",
  });
}

function kicker(slide, text, color = TEAL) {
  slide.addText(text.toUpperCase(), {
    x: 0.6, y: 0.45, w: 9, h: 0.35,
    fontSize: 13, color, bold: true, charSpacing: 2, fontFace: "Calibri",
  });
}

function title(slide, text, color = INK, opts = {}) {
  slide.addText(text, {
    x: 0.6, y: 0.78, w: opts.w || 11.5, h: opts.h || 0.9,
    fontSize: opts.fontSize || 32, color, bold: true, fontFace: "Cambria",
    margin: 0,
  });
}

// icon variant used here must always be a WHITE glyph (no-suffix or "_white") —
// pairing a "_teal" (navy) icon with a navy/teal circle makes it invisible.
function iconChip(slide, iconVariant, x, y, size, bg) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: size, h: size, fill: { color: bg },
  });
  const pad = size * 0.26;
  slide.addImage({
    path: ICON(iconVariant),
    x: x + pad, y: y + pad, w: size - 2 * pad, h: size - 2 * pad,
  });
}

function pathTag(slide, text, x, y, w, dark) {
  const h = 0.34;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.05,
    fill: { color: dark ? "16385A" : ICE },
    line: { color: dark ? "3F6E8C" : "AEC7D6", width: 0.75 },
  });
  slide.addText(text, {
    x: x + 0.1, y, w: w - 0.2, h, fontSize: 10.5, color: dark ? "8FD4E8" : DEEPBLUE,
    fontFace: "Courier New", bold: true, valign: "middle", margin: 0,
  });
}

// small "callback" pill pointing back at a specific background slide
function backTag(slide, text, x, y, w, dark) {
  const h = 0.34;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.17,
    fill: { color: dark ? "2A3F63" : "E9F1E6" },
    line: { color: dark ? "5A8FB0" : "8FB88F", width: 0.75 },
  });
  slide.addText("\u21a9  " + text, {
    x: x + 0.14, y, w: w - 0.28, h, fontSize: 10, italic: true, color: dark ? "BFDCE8" : "3D6B3D",
    fontFace: "Calibri", bold: false, valign: "middle", margin: 0,
  });
}

function footerBrand(slide, dark) {
  slide.addText("LOGITLOOM  \u00b7  AI SEMINAR, LECTURE 2", {
    x: 0.6, y: 7.05, w: 6, h: 0.3,
    fontSize: 9, color: dark ? "8FA8C2" : MUTE, fontFace: "Calibri", charSpacing: 1,
  });
}

// ================= SLIDE 1: TITLE =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addShape(pres.shapes.OVAL, { x: 10.6, y: -1.4, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 40 } });
  s.addShape(pres.shapes.OVAL, { x: 12.2, y: 4.6, w: 3.2, h: 3.2, fill: { color: DEEPBLUE, transparency: 55 } });

  const nodes = [
    [10.6, 1.5], [11.5, 1.0], [11.5, 2.0], [12.4, 0.6], [12.4, 1.4], [12.4, 1.9], [12.4, 2.5],
  ];
  const lines = [
    [10.6, 1.5, 11.5, 1.0], [10.6, 1.5, 11.5, 2.0],
    [11.5, 1.0, 12.4, 0.6], [11.5, 1.0, 12.4, 1.4],
    [11.5, 2.0, 12.4, 1.9], [11.5, 2.0, 12.4, 2.5],
  ];
  for (const [x1, y1, x2, y2] of lines) {
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      line: { color: "5A8FB0", width: 1.25, transparency: 20 },
      flipV: (y2 < y1),
    });
  }
  for (const [x, y] of nodes) {
    s.addShape(pres.shapes.OVAL, { x: x - 0.06, y: y - 0.06, w: 0.12, h: 0.12, fill: { color: "8FD4E8" } });
  }

  s.addText("AI SEMINAR  \u00b7  LECTURE 2", {
    x: 0.8, y: 1.55, w: 8, h: 0.4,
    fontSize: 14, color: "7FB8D6", bold: true, charSpacing: 3, fontFace: "Calibri",
  });

  s.addText("LogitLoom", {
    x: 0.75, y: 2.05, w: 10, h: 1.5,
    fontSize: 64, color: OFFWHITE, bold: true, fontFace: "Cambria", margin: 0,
  });

  s.addText("Exploring Token Trajectory Trees in Base and Instruct Models", {
    x: 0.8, y: 3.45, w: 9.5, h: 0.7,
    fontSize: 20, color: ICE, fontFace: "Calibri",
  });

  s.addShape(pres.shapes.LINE, {
    x: 0.8, y: 4.35, w: 3.2, h: 0,
    line: { color: TEAL, width: 2 },
  });

  s.addText(
    [
      { text: "How we'll get there: ", options: { bold: true, color: "BFE0EE" } },
      { text: "a quick preview of the tool, then a standalone background section on sampling and the \u201cmultiverse\u201d idea behind loom-style tools, then back to LogitLoom for a full walkthrough of how it builds, prunes, and renders a live probability tree \u2014 plus where it's actually useful.", options: { color: "9FC3D9" } },
    ],
    { x: 0.8, y: 4.6, w: 8.6, h: 1.3, fontSize: 13.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  s.addText("github.com/vgel/logitloom   \u00b7   vgel.me/logitloom", {
    x: 0.8, y: 6.65, w: 8, h: 0.4,
    fontSize: 12, color: "6FA0BE", fontFace: "Courier New",
  });
}

// ================= SLIDE 2: PREVIEW / INTRO TEASER =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Preview");
  title(s, "LogitLoom, in One Breath");

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.7, w: 7.3, h: 3.9, rectRadius: 0.08, fill: { color: CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  s.addText(
    [
      { text: "logitloom", options: { bold: true, color: DEEPBLUE, fontFace: "Courier New" } },
      { text: " is a small, open-source tool that lets you watch a language model's next-token predictions unfold as a branching ", options: {} },
      { text: "tree", options: { bold: true } },
      { text: " \u2014 instead of the single reply a normal chat window shows you.", options: {} },
    ],
    { x: 0.95, y: 2.0, w: 6.8, h: 1.5, fontSize: 16, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );
  s.addText(
    "Every word in that sentence \u2014 \u201ctoken,\u201d \u201cprediction,\u201d \u201cbranching\u201d \u2014 is doing real work. The next few slides build up exactly what each one means, with no reference to this tool at all. Then we come back and this sentence will fully click.",
    { x: 0.95, y: 3.7, w: 6.8, h: 1.7, fontSize: 12.5, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );

  // small illustrative branching-tree graphic, right side
  const rx = 8.3, ry0 = 2.0;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: rx - 0.35, y: 1.7, w: 4.4, h: 3.9, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  const ox = rx + 0.15, oy = ry0 + 0.5;
  const layerX = [ox, ox + 1.0, ox + 2.0];
  const nodes = {
    root: [layerX[0], oy + 1.3],
    a: [layerX[1], oy + 0.6], b: [layerX[1], oy + 1.3], c: [layerX[1], oy + 2.0],
    a1: [layerX[2], oy + 0.4], a2: [layerX[2], oy + 0.85],
    b1: [layerX[2], oy + 1.3],
    c1: [layerX[2], oy + 1.75], c2: [layerX[2], oy + 2.2],
  };
  const edges = [
    ["root", "a"], ["root", "b"], ["root", "c"],
    ["a", "a1"], ["a", "a2"], ["b", "b1"], ["c", "c1"], ["c", "c2"],
  ];
  edges.forEach(([p, c]) => {
    const [x1, y1] = nodes[p], [x2, y2] = nodes[c];
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      line: { color: "3F6E8C", width: 1.5 }, flipV: y2 < y1,
    });
  });
  const chosen = new Set(["root", "b", "b1"]);
  Object.entries(nodes).forEach(([k, [x, y]]) => {
    const isChosen = chosen.has(k);
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.1, y: y - 0.1, w: 0.2, h: 0.2,
      fill: { color: isChosen ? "8FD4E8" : "3F6E8C" },
    });
  });
  s.addText("a token tree: one prompt, many possible next steps", {
    x: rx - 0.35, y: oy + 2.7, w: 4.4, h: 0.6, fontSize: 10.5, italic: true, color: "9FC3D9", align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.2,
  });

  footerBrand(s); addSlideNumber(s, 2);
}

// ================= SLIDE 3 (BG1): AUTOREGRESSIVE GENERATION =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background");
  title(s, "How an LLM Actually Writes Text");

  s.addText(
    "This section stands on its own \u2014 no specific tool needed. It's the mechanical loop every language model runs, one token at a time.",
    { x: 0.6, y: 1.55, w: 11.8, h: 0.5, fontSize: 14, color: MUTE, fontFace: "Calibri" }
  );

  const steps = [
    ["1", "Tokenize", "Input text is split into tokens \u2014 sub-word chunks, not words or characters.", "layers"],
    ["2", "Predict", "The model consumes the token sequence and outputs one score (a logit) per vocabulary token \u2014 tens of thousands of numbers.", "lightbulb_white"],
    ["3", "Choose", "Logits become a probability distribution; a sampling rule picks the next token.", "dice"],
    ["4", "Repeat", "The chosen token is appended to the sequence, and the whole process runs again \u2014 one token at a time.", "chevron"],
  ];

  const cardW = 2.78, gap = 0.22, startX = 0.6, y = 2.35, cardH = 3.7;
  steps.forEach(([num, head, body, icon], i) => {
    const x = startX + i * (cardW + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cardW, h: cardH, rectRadius: 0.08,
      fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    s.addText(num, {
      x: x + 0.22, y: y + 0.2, w: 0.8, h: 0.5,
      fontSize: 26, color: ICE, bold: true, fontFace: "Cambria",
    });
    iconChip(s, icon, x + cardW / 2 - 0.4, y + 0.75, 0.8, DEEPBLUE);
    s.addText(head, {
      x: x + 0.2, y: y + 1.75, w: cardW - 0.4, h: 0.4,
      fontSize: 16, bold: true, color: INK, align: "center", fontFace: "Calibri",
    });
    s.addText(body, {
      x: x + 0.22, y: y + 2.2, w: cardW - 0.44, h: 1.35,
      fontSize: 11.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.15,
    });
  });

  s.addText(
    [
      { text: "Key point: ", options: { bold: true, color: INK } },
      { text: "step 3 is not a single decision \u2014 at every position the model actually knows how likely dozens of alternative tokens were. Normal chat interfaces throw that information away and show you only the one path taken.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.35, w: 12.1, h: 0.7, fontSize: 13, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s); addSlideNumber(s, 3);
}

// ================= SLIDE 4 (BG2): LOGITS, LOGPROBS, SAMPLING =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background");
  title(s, "Logits, Logprobs, and Sampling Rules");

  const defs = [
    ["Logit", "A raw, unnormalized score the model assigns to each vocabulary token at a given position. Higher = more likely."],
    ["Softmax \u2192 probability", "Logits are exponentiated and normalized so they sum to 1, giving each candidate token a probability."],
    ["Logprob", "The natural log of that probability. Convenient because they add instead of multiply, and APIs often return them directly alongside the generated text."],
  ];
  let dy = 1.65;
  defs.forEach(([h, b]) => {
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: dy + 0.06, w: 0.12, h: 0.12, fill: { color: TEAL } });
    s.addText(h, { x: 0.85, y: dy - 0.12, w: 5.6, h: 0.35, fontSize: 15, bold: true, color: INK, fontFace: "Calibri" });
    s.addText(b, { x: 0.85, y: dy + 0.24, w: 5.7, h: 0.85, fontSize: 12, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    dy += 1.15;
  });

  const rx = 6.85, rw = 5.85;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: rx, y: 1.6, w: rw, h: 5.15, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  s.addText("Sampling strategies", {
    x: rx + 0.35, y: 1.85, w: rw - 0.7, h: 0.4, fontSize: 16, bold: true, color: OFFWHITE, fontFace: "Calibri",
  });
  const strategies = [
    ["Greedy", "Always take the single highest-probability token. Deterministic \u2014 the \u201cchosen path\u201d in a normal chat reply is exactly this, repeated."],
    ["Temperature", "Rescales logits before softmax \u2014 lower = sharper / more confident, higher = flatter / more random."],
    ["Top-p (nucleus)", "Keep only the smallest set of top tokens whose cumulative probability exceeds p, then sample from that set \u2014 a way to cut off the unlikely long tail."],
  ];
  let sy = 2.4;
  strategies.forEach(([h, b]) => {
    s.addText([{ text: h + ":  ", options: { bold: true, color: "8FD4E8" } }, { text: b, options: { color: "D7E9F2" } }], {
      x: rx + 0.35, y: sy, w: rw - 0.7, h: 1.05, fontSize: 12.5, fontFace: "Calibri", lineSpacingMultiple: 1.2,
    });
    sy += 1.15;
  });
  s.addText(
    "Most interfaces show you only the one sampled token. But an API that exposes logprobs lets you see the whole local neighborhood of alternatives the model weighed at that position \u2014 not just the one that won.",
    { x: rx + 0.35, y: 5.85, w: rw - 0.7, h: 0.75, fontSize: 11.5, italic: true, color: "BFDCE8", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s); addSlideNumber(s, 4);
}

// ================= SLIDE 5 (BG3): BASE VS INSTRUCT =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background");
  title(s, "Base Models vs. Instruct (Chat) Models");

  s.addText(
    "The same architecture, trained two different ways, behaves very differently \u2014 this distinction shows up constantly once you start poking at real model internals.",
    { x: 0.6, y: 1.55, w: 12, h: 0.5, fontSize: 14, color: MUTE, fontFace: "Calibri" }
  );

  const colW = 5.75, colY = 2.25, colH = 4.5;
  const cols = [
    {
      x: 0.6, color: DEEPBLUE, icon: "book", label: "Base model",
      rows: [
        "Trained only to predict the next token of raw text \u2014 no chat formatting, no notion of \u201cassistant.\u201d",
        "A prompt and its continuation are simply concatenated; the model just keeps writing.",
        "Tends to branch more at each step \u2014 many plausible continuations, higher diversity.",
        "Example: a freshly pretrained checkpoint like Llama 3 405B-base, before any instruction tuning.",
      ],
    },
    {
      x: 6.95, color: TEAL, icon: "robot", label: "Instruct / chat model",
      rows: [
        "Fine-tuned (often with RLHF/instruction tuning) to follow a system/user/assistant turn structure.",
        "Needs a prompt template; the model has learned to treat \u201cassistant\u201d turns specially.",
        "Distributions are usually more peaked around a small set of \u201con-policy\u201d continuations.",
        "Example: the assistants behind ChatGPT, Claude, or any RLHF/DPO-tuned chat deployment.",
      ],
    },
  ];

  cols.forEach((col) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: col.x, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, col.icon, col.x + 0.3, colY + 0.3, 0.65, col.color);
    s.addText(col.label, {
      x: col.x + 1.1, y: colY + 0.35, w: colW - 1.3, h: 0.55, fontSize: 18, bold: true, color: INK, fontFace: "Calibri", valign: "middle",
    });
    const items = col.rows.map((r) => ({ text: r, options: { bullet: { code: "2022" }, color: MUTE, breakLine: true, paraSpaceAfter: 10 } }));
    items[items.length - 1].options.breakLine = false;
    s.addText(items, { x: col.x + 0.35, y: colY + 1.15, w: colW - 0.7, h: colH - 1.4, fontSize: 12, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
  });
  footerBrand(s); addSlideNumber(s, 5);
}

// ================= SLIDE 6 (BG4): LOOM / MULTIVERSE CONCEPT =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Background", "8FD4E8");
  title(s, "The \u201cMultiverse\u201d View of Generation", OFFWHITE);

  s.addText(
    "One more idea, and the background section is complete: at every step, a model doesn't produce one continuation \u2014 it defines a whole distribution over possible ones.",
    { x: 0.6, y: 1.6, w: 7.3, h: 1.0, fontSize: 14, color: "BFDCE8", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const pts = [
    ["\u201cLoom\u201d / \u201clooming\u201d", "Community term (associated with researchers like janus/repligate and the \u201ccyborgism\u201d community) for interfaces that generate, branch, and curate multiple completions from a model \u2014 treating text generation as navigating a tree of timelines rather than writing one line."],
    ["Simulator framing", "Especially with base models, it's often useful to think of the model as simulating many possible \u201cwho could plausibly continue this text\u201d rather than as a single fixed persona giving one answer."],
    ["Prior art", "Tools like Loom and Exoloom pioneered branching, tree-curation interfaces for base-model \u201ctextual multiverse\u201d exploration \u2014 letting people navigate, save, and filter these branches directly."],
  ];
  let py = 1.6;
  pts.forEach(([h, b]) => {
    s.addShape(pres.shapes.OVAL, { x: 7.75, y: py + 0.06, w: 0.12, h: 0.12, fill: { color: "8FD4E8" } });
    s.addText(h, { x: 8.0, y: py - 0.15, w: 4.7, h: 0.35, fontSize: 14.5, bold: true, color: OFFWHITE, fontFace: "Calibri" });
    s.addText(b, { x: 8.0, y: py + 0.2, w: 4.7, h: 1.35, fontSize: 11, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    py += 1.65;
  });

  const baseX = 1.0, baseY = 4.1;
  const treeNodes = [
    [baseX, baseY],
    [baseX + 1.1, baseY - 0.6], [baseX + 1.1, baseY], [baseX + 1.1, baseY + 0.6],
    [baseX + 2.2, baseY - 0.9], [baseX + 2.2, baseY - 0.4],
    [baseX + 2.2, baseY + 0.35], [baseX + 2.2, baseY + 0.85],
  ];
  const treeLines = [
    [0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [3, 6], [3, 7],
  ];
  treeLines.forEach(([a, b]) => {
    const [x1, y1] = treeNodes[a], [x2, y2] = treeNodes[b];
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      line: { color: "3F6E8C", width: 1.5 }, flipV: y2 < y1,
    });
  });
  treeNodes.forEach(([x, y], i) => {
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.09, y: y - 0.09, w: 0.18, h: 0.18,
      fill: { color: i === 0 ? "8FD4E8" : TEAL },
    });
  });
  s.addText("one prompt \u2192 many plausible futures", {
    x: baseX - 0.2, y: baseY + 1.3, w: 3.6, h: 0.4, fontSize: 11, italic: true, color: "7FA9C4", fontFace: "Calibri",
  });
  footerBrand(s, true); addSlideNumber(s, 6);
}

// ================= SLIDE 7: BRIDGE - BACK TO LOGITLOOM =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Bridge");
  title(s, "Now, Back to LogitLoom");

  s.addText(
    "Everything in the background section maps directly onto a specific part of the tool. Here's exactly where each idea shows up.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const rows = [
    ["Slide 3", "Tokens, logits, choosing", "Every node in a LogitLoom tree is one token; its logprob/prob fields are exactly the quantities from that slide."],
    ["Slide 4", "Logprobs & sampling", "LogitLoom's \u201cTop P\u201d control is literally the nucleus-sampling threshold from that slide, applied to pruning the tree instead of picking one token."],
    ["Slide 5", "Base vs. instruct", "LogitLoom has an explicit modelType switch for exactly this distinction \u2014 it changes both prompting and which backends will work."],
    ["Slide 6", "The multiverse view", "LogitLoom is a lightweight, focused implementation of that same idea, specifically for visualizing raw logprobs from a live API."],
  ];
  let ry = 2.15;
  const rh = 0.85;
  rows.forEach(([tag, h, b], i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y: ry, w: 12.1, h: rh, rectRadius: 0.06, fill: { color: CARD },
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: ry + (rh - 0.4) / 2, w: 1.15, h: 0.4, rectRadius: 0.2, fill: { color: "E9F1E6" }, line: { color: "8FB88F", width: 0.75 } });
    s.addText(tag, { x: 0.85, y: ry + (rh - 0.4) / 2, w: 1.15, h: 0.4, fontSize: 10.5, bold: true, italic: true, color: "3D6B3D", align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(h, { x: 2.25, y: ry + 0.08, w: 2.7, h: rh - 0.16, fontSize: 13.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: 5.05, y: ry + 0.08, w: 7.45, h: rh - 0.16, fontSize: 11, color: MUTE, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.12 });
    ry += rh + 0.13;
  });

  s.addText(
    "From here on, every slide that leans on background material will carry a small tag pointing back to the relevant slide above.",
    { x: 0.6, y: ry + 0.08, w: 12.1, h: 0.35, fontSize: 10.5, italic: true, color: MUTE, fontFace: "Calibri" }
  );
  footerBrand(s); addSlideNumber(s, 7);
}

// ================= SLIDE 8: WHAT IS LOGITLOOM =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "What Is LogitLoom?");

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.7, w: 7.1, h: 4.9, rectRadius: 0.08, fill: { color: CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  s.addText(
    [
      { text: "logitloom", options: { bold: true, color: DEEPBLUE, fontFace: "Courier New" } },
      { text: " is a small, open-source, browser-based tool for exploring ", options: {} },
      { text: "token trajectory trees", options: { bold: true } },
      { text: " \u2014 branching visualizations of what a language model could have generated at each step, not just what it did generate.", options: {} },
    ],
    { x: 0.95, y: 1.95, w: 6.5, h: 1.3, fontSize: 15, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const facts = [
    ["Author", "Built by Theia Vogel (github handle vgel), released as an open hobby project (currently unlicensed pending a formal license)."],
    ["What it is, technically", "A single client-side web app (TypeScript + React-style UI, bundled with Bun) that talks directly to a model provider's API from your browser \u2014 no backend server, API keys stay local."],
    ["Where to use it", "Hosted build at vgel.me/logitloom, or run/build it yourself from the GitHub repo."],
    ["Scale", "Small, focused codebase (~a few hundred lines of core logic) \u2014 approachable to read end-to-end, which is part of why it's a good teaching example."],
  ];
  let fy = 3.35;
  facts.forEach(([h, b]) => {
    s.addText([{ text: h + ":  ", options: { bold: true, color: INK } }, { text: b, options: { color: MUTE } }], {
      x: 0.95, y: fy, w: 6.5, h: 0.75, fontSize: 11.5, fontFace: "Calibri", lineSpacingMultiple: 1.15,
    });
    fy += 0.82;
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.95, y: 1.7, w: 4.75, h: 4.9, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  iconChip(s, "diagram", 8.3, 2.0, 0.7, DEEPBLUE);
  s.addText("The core shift", {
    x: 9.15, y: 2.05, w: 3.3, h: 0.5, fontSize: 16, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle",
  });
  s.addText(
    "Chat UIs show you the single sampled path. logitloom instead queries the model's top-k logprobs at every position and renders the resulting branching structure directly \u2014 turning an invisible, one-shot sampling decision into an object you can inspect, compare, and steer.",
    { x: 8.3, y: 2.85, w: 4.05, h: 1.6, fontSize: 12.5, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addShape(pres.shapes.LINE, { x: 8.3, y: 4.65, w: 4.05, h: 0, line: { color: "3F6E8C", width: 1 } });
  backTag(s, "Background \u00b7 Slide 6, The Multiverse View", 8.3, 4.85, 4.05, true);
  s.addText(
    "In short: it makes the probabilistic, tree-shaped nature of autoregressive generation something you can literally click through, rather than something you have to imagine.",
    { x: 8.3, y: 5.3, w: 4.05, h: 1.2, fontSize: 12, italic: true, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  footerBrand(s); addSlideNumber(s, 8);
}

// ================= SLIDE 9: REPOSITORY STRUCTURE (ACTUAL TREE) =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Today's Tool", "8FD4E8");
  title(s, "Repository Structure", OFFWHITE);

  s.addText(
    "This is the actual file listing from github.com/vgel/logitloom \u2014 the highlighted files are the ones we'll walk through in detail.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13, color: "9FC3D9", fontFace: "Calibri" }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 2.15, w: 6.7, h: 4.9, rectRadius: 0.08, fill: { color: "0F2036" }, line: { color: "3F6E8C", width: 1 },
  });

  const HL = "8FD4E8";   // highlighted core-logic files
  const DIRC = "7FA9C4"; // directories
  const DIMC = "6B87A3"; // config/build/misc files
  const entries = [
    ["media/", DIRC, false],
    ["vendored/", DIRC, false],
    [".gitignore", DIMC, false],
    ["README.md", DIMC, false],
    ["api-sniffer.ts", HL, true],
    ["build-for-website-and-copy.sh", DIMC, false],
    ["bun.lock", DIMC, false],
    ["index.html", "D7E9F2", false],
    ["index.tsx", "D7E9F2", false],
    ["logit-loom.ts", HL, true],
    ["openai.ts", "D7E9F2", false],
    ["package.json", DIMC, false],
    ["save-load.ts", HL, true],
    ["tree-store.ts", HL, true],
    ["tsconfig.json", DIMC, false],
    ["vendor-openai.sh", DIMC, false],
  ];

  s.addText("vgel/logitloom", {
    x: 0.85, y: 2.3, w: 6.2, h: 0.35, fontSize: 13, bold: true, color: OFFWHITE, fontFace: "Courier New",
  });
  let ty = 2.72;
  const rowH = 0.245;
  entries.forEach(([name, color, hl], i) => {
    const isLast = i === entries.length - 1;
    const branch = isLast ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 ";
    if (hl) {
      s.addShape(pres.shapes.RECTANGLE, { x: 0.72, y: ty - 0.01, w: 6.42, h: rowH, fill: { color: "1C3A57" } });
    }
    s.addText(
      [
        { text: branch, options: { color: "3F6E8C" } },
        { text: name, options: { color, bold: hl } },
      ],
      { x: 0.85, y: ty, w: 6.1, h: rowH, fontSize: 11.5, fontFace: "Courier New", valign: "middle", margin: 0 }
    );
    ty += rowH;
  });

  // legend + annotations, right side
  const rx = 7.6, rw = 5.1;
  s.addText("Highlighted = core algorithm & state files", {
    x: rx, y: 2.15, w: rw, h: 0.35, fontSize: 12, bold: true, color: "8FD4E8", fontFace: "Calibri",
  });
  const notes = [
    ["logit-loom.ts", "The algorithm itself: Token type, buildTree(), expandTree(), query()."],
    ["api-sniffer.ts", "sniffApi() detects what a given backend API supports."],
    ["tree-store.ts", "React state layer wiring the UI to the algorithm above."],
    ["save-load.ts", "Import/export a tree + settings as JSON."],
  ];
  let ny = 2.6;
  notes.forEach(([f, d]) => {
    s.addText(f, { x: rx, y: ny, w: rw, h: 0.3, fontSize: 11.5, bold: true, color: DEEPBLUE, fontFace: "Courier New" });
    s.addText(d, { x: rx, y: ny + 0.3, w: rw, h: 0.5, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
    ny += 0.95;
  });
  s.addText(
    "Everything else is app shell and build tooling \u2014 index.tsx/index.html render the UI, openai.ts is a vendored API client, and the rest is Bun/TypeScript config.",
    { x: rx, y: ny + 0.05, w: rw, h: 0.9, fontSize: 10, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s, true); addSlideNumber(s, 9);
}

// ================= SLIDE 10: REPOSITORY MAP (FUNCTION GROUPS) =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "Repository Map: Where Things Live");

  s.addText(
    "Same files as the tree you just saw, now grouped by what they actually do. We'll cite the exact path as we go.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const colW = 5.85, colY = 2.2, colH = 4.55, gap = 0.4;
  const cols = [
    {
      x: 0.6, label: "Core algorithm", color: DEEPBLUE,
      rows: [
        ["logit-loom.ts", "Token type, buildTree(), expandTree(), query(), appendTokens(), getContinuablePrefix() \u2014 the algorithmic heart of the tool."],
        ["api-sniffer.ts", "sniffApi() probes a provider's /models endpoint to auto-detect logprob & prefill support (OpenAI, Anthropic, DeepSeek, Hyperbolic, vLLM, KoboldCpp, llama-server, Nous...)."],
        ["tree-store.ts", "React state layer (useTreeStore / run()) that wires UI actions to buildTree/expandTree and persists the tree to localStorage."],
        ["save-load.ts", "Serializes/deserializes a full tree + model settings as JSON so a session can be exported and reloaded."],
      ],
    },
    {
      x: 0.6 + colW + gap, label: "App shell & tooling", color: TEAL,
      rows: [
        ["index.tsx / index.html", "UI entry point \u2014 renders the tree view, the depth/max-children/top-p settings panel, and the prompt/prefill controls."],
        ["openai.ts", "A vendored copy of the OpenAI client, kept local to sidestep a Bun browser-bundling issue (see vendor-openai.sh)."],
        ["vendored/", "Other third-party dependencies bundled directly into the app rather than fetched at build time."],
        ["package.json, build-for-website-and-copy.sh", "Bun-based dev/build tooling \u2014 bun --hot index.html for local dev; the shell script produces the vgel.me/logitloom build."],
      ],
    },
  ];

  cols.forEach((col) => {
    s.addText(col.label, {
      x: col.x, y: colY, w: colW, h: 0.35, fontSize: 13, bold: true, color: col.color, fontFace: "Calibri", charSpacing: 1,
    });
    let ry = colY + 0.45;
    col.rows.forEach(([path, desc]) => {
      const rh = 0.98;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: col.x, y: ry, w: colW, h: rh, rectRadius: 0.06, fill: { color: CARD },
      });
      s.addText(path, {
        x: col.x + 0.2, y: ry + 0.1, w: colW - 0.4, h: 0.3, fontSize: 12.5, bold: true, color: INK, fontFace: "Courier New",
      });
      s.addText(desc, {
        x: col.x + 0.2, y: ry + 0.42, w: colW - 0.4, h: rh - 0.5, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.12,
      });
      ry += rh + 0.1;
    });
  });
  footerBrand(s); addSlideNumber(s, 10);
}

// ================= SLIDE 11: CORE IDEA - TREE STRUCTURE =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "The Core Data Structure: a Token Tree");
  pathTag(s, "logit-loom.ts \u2014 interface Token", 8.85, 0.5, 3.85);

  s.addText(
    "Internally, everything logitloom does revolves around one recursive shape: a Token node with a piece of text, its probability, and a list of child Tokens.",
    { x: 0.6, y: 1.55, w: 12, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 2.2, w: 5.5, h: 4.4, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  s.addText("Token", { x: 0.95, y: 2.4, w: 3, h: 0.4, fontSize: 15, bold: true, color: "8FD4E8", fontFace: "Courier New" });
  const fields = [
    ["text", "the token string, e.g. \"the\""],
    ["logprob / prob", "log-probability and probability at this position"],
    ["branchFinished", "non-null once this branch has hit a stop condition"],
    ["children", "the Token nodes that could follow this one"],
  ];
  let cy = 2.9;
  fields.forEach(([f, d]) => {
    s.addText([
      { text: f, options: { bold: true, color: "FFD782", fontFace: "Courier New" } },
      { text: "  \u2014  " + d, options: { color: "D7E9F2", fontFace: "Calibri" } },
    ], { x: 1.0, y: cy, w: 4.75, h: 0.55, fontSize: 12 });
    cy += 0.62;
  });
  backTag(s, "Background \u00b7 Slide 3, Tokens & Logits", 1.0, 5.4, 4.75, true);
  s.addText(
    "Building a tree = repeatedly finding an unfinished, unexpanded leaf, querying the API for the continuation from that point, and attaching the returned tokens as children.",
    { x: 1.0, y: 5.8, w: 4.75, h: 0.7, fontSize: 11, italic: true, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.15 }
  );

  const ox = 7.3, oy = 2.5;
  const layerX = [ox, ox + 1.7, ox + 3.4, ox + 5.1];
  const nodes = {
    root: [layerX[0], oy + 1.6],
    a: [layerX[1], oy + 0.6], b: [layerX[1], oy + 1.6], c: [layerX[1], oy + 2.6],
    a1: [layerX[2], oy + 0.3], a2: [layerX[2], oy + 0.9],
    b1: [layerX[2], oy + 1.6],
    c1: [layerX[2], oy + 2.3], c2: [layerX[2], oy + 2.9],
  };
  const edges = [
    ["root", "a"], ["root", "b"], ["root", "c"],
    ["a", "a1"], ["a", "a2"], ["b", "b1"], ["c", "c1"], ["c", "c2"],
  ];
  edges.forEach(([p, c]) => {
    const [x1, y1] = nodes[p], [x2, y2] = nodes[c];
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      line: { color: "AEC7D6", width: 1.5 }, flipV: y2 < y1,
    });
  });
  const chosen = new Set(["root", "b", "b1"]);
  Object.entries(nodes).forEach(([k, [x, y]]) => {
    const isChosen = chosen.has(k);
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.13, y: y - 0.13, w: 0.26, h: 0.26,
      fill: { color: isChosen ? DEEPBLUE : ICE },
      line: { color: isChosen ? DEEPBLUE : "AEC7D6", width: 1 },
    });
  });
  s.addText("darker nodes = the token the model actually chose at each step", {
    x: ox - 0.1, y: oy + 3.3, w: 5.6, h: 0.4, fontSize: 11, italic: true, color: MUTE, fontFace: "Calibri",
  });
  s.addText("lighter nodes = alternative tokens the API also reported (via top-k logprobs)", {
    x: ox - 0.1, y: oy + 3.65, w: 5.7, h: 0.4, fontSize: 11, italic: true, color: MUTE, fontFace: "Calibri",
  });
  footerBrand(s); addSlideNumber(s, 11);
}

// ================= SLIDE 12: ALGORITHM WALKTHROUGH =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "How the Tree Actually Gets Built");
  pathTag(s, "logit-loom.ts", 11.35, 0.5, 1.35);

  const rows = [
    ["Query", "Send the current prefix (prompt + prefill + tokens-so-far) to the model's completions/chat endpoint, requesting logprobs and the top-k alternatives per position.", "query()"],
    ["Attach", "For the returned position(s), push every reported token as a child node; follow the model's actually-chosen token down into its own children slot for the next query.", "appendTokens()"],
    ["Find next leaf", "Walk all root-to-leaf paths (a depth-first traversal) to find the first unfinished, unexpanded leaf shallower than the target depth.", "getContinuablePrefix() / _treeTraversals()"],
    ["Repeat until done", "Loop: query \u2192 attach \u2192 find next leaf, until no continuable leaf remains or the requested depth is reached.", "buildTree()"],
    ["Expand on demand", "\u201cExpand from here\u201d re-runs the same loop rooted at one clicked node, one level deeper \u2014 so you drill into a single branch without rebuilding the whole tree.", "expandTree()"],
  ];

  let ry = 1.7;
  const rh = 0.98;
  rows.forEach(([h, b, fn], i) => {
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: ry + 0.06, w: 0.42, h: 0.42, fill: { color: i % 2 === 0 ? DEEPBLUE : TEAL } });
    s.addText(String(i + 1), { x: 0.6, y: ry + 0.06, w: 0.42, h: 0.42, fontSize: 15, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(h, { x: 1.2, y: ry - 0.02, w: 2.1, h: rh - 0.1, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "top" });
    s.addText(b, { x: 3.35, y: ry - 0.02, w: 8.0, h: rh - 0.4, fontSize: 12, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    s.addText(fn, { x: 3.35, y: ry + rh - 0.38, w: 8.0, h: 0.3, fontSize: 10.5, color: DEEPBLUE, fontFace: "Courier New", bold: true });
    if (i < rows.length - 1) {
      s.addShape(pres.shapes.LINE, { x: 0.6, y: ry + rh - 0.06, w: 12.1, h: 0, line: { color: "E4EDF1", width: 1 } });
    }
    ry += rh;
  });
  footerBrand(s); addSlideNumber(s, 12);
}

// ================= SLIDE 13: CONTROLS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "Three Dials Shape Every Tree");
  pathTag(s, "logit-loom.ts \u2014 TreeOptions", 9.35, 0.5, 3.35);

  s.addText(
    "These map directly onto the sampling concepts from the background section \u2014 they control how deep and how wide the tree grows, and where the long tail gets cut off.",
    { x: 0.6, y: 1.55, w: 12, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const dials = [
    ["sliders", "Depth", "How many tokens deep to expand the tree. Larger depth = longer trajectories, but the number of leaves can grow fast.", DEEPBLUE, "depth", null],
    ["branch", "Max Children", "How many alternative next-tokens to keep at each node. Capped by how many top-logprobs the API is willing to return.", TEAL, "maxWidth", null],
    ["dice", "Top P", "A coverage threshold: keep only the smallest, highest-probability set of children whose cumulative probability passes P. Set to 100 to disable; base models typically need a lower value since they branch more.", MIDNIGHT, "coverProb", "Background \u00b7 Slide 4, Sampling"],
  ];
  const cw = 3.85, gap = 0.28, sx = 0.6, sy = 2.3, ch = 4.3;
  dials.forEach(([icon, h, b, color, field, back], i) => {
    const x = sx + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: sy, w: cw, h: ch, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, icon, x + cw / 2 - 0.4, sy + 0.35, 0.8, color);
    s.addText(h, { x: x + 0.25, y: sy + 1.35, w: cw - 0.5, h: 0.45, fontSize: 18, bold: true, color: INK, align: "center", fontFace: "Calibri" });
    s.addText(b, { x: x + 0.3, y: sy + 1.9, w: cw - 0.6, h: ch - 2.55, fontSize: 11.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.18 });
    if (back) {
      backTag(s, back, x + 0.25, sy + ch - 0.85, cw - 0.5, false);
    }
    s.addText(field, { x: x + 0.3, y: sy + ch - 0.4, w: cw - 0.6, h: 0.3, fontSize: 11, color: color, align: "center", fontFace: "Courier New", bold: true });
  });
  footerBrand(s); addSlideNumber(s, 13);
}

// ================= SLIDE 14: INTERACTING WITH A NODE =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "What You Can Do With Any Node");
  pathTag(s, "tree-store.ts \u00b7 index.tsx", 9.35, 0.5, 3.35);

  const items = [
    ["Token & probability", "Every node shows its literal token text (spaces/newlines rendered visibly) plus its probability and raw logprob \u2014 the exact quantities from the background section, now attached to a specific branch.", "commentdots_white", DEEPBLUE, "Token.text / .prob / .logprob \u2014 logit-loom.ts"],
    ["Add to prefill", "Appends this token \u2014 and everything leading up to it \u2014 to the prefill box, so the next \u201cRun\u201d continues generation from exactly this point. Effectively: commit to a branch.", "chevron", DEEPBLUE, "getTokenAndPrefix() \u2014 tree-store.ts"],
    ["Expand from here", "Runs the build loop rooted at this node only, going one level deeper without touching the rest of the tree \u2014 useful for chasing one interesting branch.", "search", DEEPBLUE, "run({ fromNodeId }) \u2192 expandTree() \u2014 tree-store.ts"],
    ["UTF-8 repair", "Best-effort fix-up so multi-byte Unicode characters split across several tokens render as the correct character instead of garbled bytes (a known rough edge \u2014 see limitations).", "warning", "B85042", "see the byte-escaping comment in query() \u2014 logit-loom.ts"],
  ];

  const positions = [
    [0.6, 1.75], [6.6, 1.75], [0.6, 4.15], [6.6, 4.15],
  ];
  items.forEach(([h, b, icon, color, fn], i) => {
    const [x, y] = positions[i];
    const w = 6.0, hgt = 2.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h: hgt, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, icon, x + 0.28, y + 0.28, 0.55, color);
    s.addText(h, { x: x + 1.0, y: y + 0.28, w: w - 1.3, h: 0.55, fontSize: 15, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.3, y: y + 0.95, w: w - 0.6, h: hgt - 1.45, fontSize: 11.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18 });
    s.addText(fn, { x: x + 0.3, y: y + hgt - 0.42, w: w - 0.6, h: 0.3, fontSize: 9.5, color: DEEPBLUE, fontFace: "Courier New", bold: true });
  });
  footerBrand(s); addSlideNumber(s, 14);
}

// ================= SLIDE 15: BACKEND REQUIREMENTS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Today's Tool");
  title(s, "Not Every API Can Run This");
  pathTag(s, "api-sniffer.ts \u2014 sniffApi()", 9.35, 0.5, 3.35);

  s.addText(
    "logitloom needs two things most default chat APIs don't guarantee together: fine-grained logprobs, and (for chat models) assistant-message prefill support. That constrains which backends work.",
    { x: 0.6, y: 1.55, w: 12, h: 0.6, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  backTag(s, "Background \u00b7 Slide 5, Base vs. Instruct", 0.6, 2.12, 3.6, false);

  const colW = 5.75, colY = 2.6, colH = 3.6;
  const cols = [
    {
      x: 0.6, label: "Chat / instruct setup", color: TEAL,
      rows: [
        ["Base URL", "api.deepseek.com/beta"],
        ["Model", "deepseek-chat"],
        ["Why this one", "Supports both logprobs and assistant prefill on chat completions \u2014 needed to expand non-chosen branches. (Not deepseek-r1: no logprobs support.)"],
      ],
    },
    {
      x: 6.95, label: "Base model setup", color: DEEPBLUE,
      rows: [
        ["Base URL", "api.hyperbolic.xyz/v1"],
        ["Model", "meta-llama/Meta-Llama-3.1-405B"],
        ["Why this one", "A raw completions API with solid logprob support; recommended directly over OpenRouter, which can introduce issues for this use case."],
      ],
    },
  ];
  cols.forEach((col) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: col.x, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    s.addShape(pres.shapes.RECTANGLE, { x: col.x, y: colY, w: colW, h: 0.6, fill: { color: col.color } });
    s.addText(col.label, { x: col.x + 0.3, y: colY, w: colW - 0.6, h: 0.6, fontSize: 15, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle" });
    let ry = colY + 0.82;
    col.rows.forEach(([k, v]) => {
      const isWhy = k === "Why this one";
      s.addText(k, { x: col.x + 0.3, y: ry, w: colW - 0.6, h: 0.28, fontSize: 11, bold: true, color: col.color, fontFace: "Calibri" });
      s.addText(v, { x: col.x + 0.3, y: ry + 0.28, w: colW - 0.6, h: isWhy ? 1.05 : 0.38, fontSize: isWhy ? 10.5 : 13, color: isWhy ? MUTE : INK, fontFace: isWhy ? "Calibri" : "Courier New", lineSpacingMultiple: 1.12 });
      ry += isWhy ? 1.35 : 0.7;
    });
  });

  s.addText(
    [
      { text: "Auto-detection: ", options: { bold: true, color: INK } },
      { text: "before running, logitloom's sniffApi() hits {baseUrl}/models and matches the response against known providers, returning an ApiInfo object (supportsLogprobs, supportsPrefill, prefillStyle) \u2014 e.g. it recognizes DeepSeek, Hyperbolic, vLLM, KoboldCpp, llama-server, and Nous automatically. ", options: { color: MUTE } },
      { text: "API keys never leave your browser", options: { bold: true, color: INK } },
      { text: " \u2014 there's no backend server; keys are stored and used locally only.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.35, w: 12.1, h: 0.62, fontSize: 10.5, fontFace: "Calibri", lineSpacingMultiple: 1.15 }
  );
  footerBrand(s); addSlideNumber(s, 15);
}

// ================= SLIDE 16: USE CASES =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Applications", "8FD4E8");
  title(s, "Why You'd Actually Reach for This", OFFWHITE);

  const cases = [
    ["microscope", "Interpretability & behavior research", "See the model's real uncertainty at a position \u2014 was a refusal, a fact, or a stylistic choice a near-certainty or a coin flip against strong alternatives?"],
    ["search", "Prompt debugging", "Directly inspect why the model produced token X instead of the Y you expected, instead of guessing from black-box outputs."],
    ["shield", "Alignment & safety analysis", "Explore near-miss completions around refusal boundaries or jailbreak-adjacent prompts \u2014 what was the model close to saying?"],
    ["feather", "Creative / branching writing", "Treat generation as a tree of possible continuations to curate from \u2014 the \u201clooming\u201d workflow, useful for base-model creative exploration."],
    ["teacher", "Teaching sampling & tokenization", "A concrete, visual way to show students what logits/logprobs/top-p actually do to a real model's output distribution."],
    ["flask", "Base vs. instruct comparison", "Run the same prompt against a base and an instruct model to see concretely how fine-tuning reshapes the output distribution."],
  ];

  const cw = 3.9, gap = 0.2, sx = 0.6, rows2 = [2.15, 4.75];
  cases.forEach(([icon, h, b], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = sx + col * (cw + gap), y = rows2[row];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cw, h: 2.35, rectRadius: 0.08, fill: { color: MIDNIGHT },
    });
    iconChip(s, icon, x + 0.25, y + 0.25, 0.55, DEEPBLUE);
    s.addText(h, { x: x + 0.25, y: y + 0.95, w: cw - 0.5, h: 0.55, fontSize: 13.5, bold: true, color: OFFWHITE, fontFace: "Calibri", lineSpacingMultiple: 1.1 });
    s.addText(b, { x: x + 0.25, y: y + 1.5, w: cw - 0.5, h: 0.8, fontSize: 10.5, color: "AECBDD", fontFace: "Calibri", lineSpacingMultiple: 1.15 });
  });
  footerBrand(s, true); addSlideNumber(s, 16);
}

// ================= SLIDE 17: LIMITATIONS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Keeping It Honest");
  title(s, "Limitations & Open Issues");
  pathTag(s, "logit-loom.ts \u2014 query()", 9.35, 0.5, 3.35);

  const rows = [
    ["Byte-split Unicode tokens", "Some Unicode characters are split across multiple tokens as raw byte-escapes; re-feeding escaped text into the model can cause it to generate further garbled escape sequences. Documented directly in a comment atop query() in logit-loom.ts, closing with the maintainer's own framing: \u201ctokenization continuing to suck in new and profound ways.\u201d A real, unresolved BPE edge case, not a logitloom-specific bug."],
    ["Combinatorial growth", "Tree size grows roughly as (max children)^(depth) in the worst case \u2014 wide, deep trees get expensive and visually dense fast."],
    ["Narrow backend support", "Requires an API that returns sufficiently detailed logprobs and, for chat models, supports assistant-message prefill \u2014 many mainstream hosted chat APIs support neither well (see api-sniffer.ts)."],
    ["No backend, local-only keys", "A feature for privacy, but it also means no shared/team history, rate-limit smoothing, or server-side caching."],
    ["Project maturity", "Small hobby-scale open-source project (single maintainer, currently unlicensed) \u2014 expect rough edges rather than production polish."],
  ];
  let ry = 1.7;
  rows.forEach(([h, b], i) => {
    iconChip(s, "warning", 0.6, ry, 0.4, "B85042");
    s.addText(h, { x: 1.2, y: ry - 0.02, w: 2.9, h: 0.75, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
    s.addText(b, { x: 4.25, y: ry - 0.02, w: 8.45, h: 0.9, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18 });
    if (i < rows.length - 1) {
      s.addShape(pres.shapes.LINE, { x: 0.6, y: ry + 0.92, w: 12.1, h: 0, line: { color: "E4EDF1", width: 1 } });
    }
    ry += 1.0;
  });
  footerBrand(s); addSlideNumber(s, 17);
}

// ================= SLIDE 18: CLOSING / RESOURCES =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: -1.5, y: 4.5, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 45 } });

  s.addText("TRY IT YOURSELF", {
    x: 0.8, y: 1.0, w: 8, h: 0.4, fontSize: 14, bold: true, color: "7FB8D6", charSpacing: 3, fontFace: "Calibri",
  });
  s.addText("Go Loom Something", {
    x: 0.75, y: 1.4, w: 10, h: 1.1, fontSize: 44, bold: true, color: OFFWHITE, fontFace: "Cambria", margin: 0,
  });

  const links = [
    ["link", "Live tool", "vgel.me/logitloom"],
    ["terminal", "Source code", "github.com/vgel/logitloom"],
  ];
  let ly = 2.85;
  links.forEach(([icon, h, v]) => {
    iconChip(s, icon, 0.8, ly, 0.55, DEEPBLUE);
    s.addText(h, { x: 1.55, y: ly, w: 3, h: 0.3, fontSize: 12, color: "9FC3D9", fontFace: "Calibri" });
    s.addText(v, { x: 1.55, y: ly + 0.28, w: 6, h: 0.35, fontSize: 15, bold: true, color: OFFWHITE, fontFace: "Courier New" });
    ly += 0.95;
  });

  s.addShape(pres.shapes.LINE, { x: 0.8, y: 5.0, w: 6, h: 0, line: { color: TEAL, width: 1 } });
  s.addText("Discussion for next time", { x: 0.8, y: 5.2, w: 8, h: 0.35, fontSize: 13, bold: true, color: "8FD4E8", fontFace: "Calibri" });
  s.addText(
    "If a chat model's \u201cchosen\u201d token was only 8% more likely than its runner-up, what should we conclude about how confident the model actually was in its answer?",
    { x: 0.8, y: 5.6, w: 8.3, h: 0.9, fontSize: 13, italic: true, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  footerBrand(s, true);
}

pres.writeFile({ fileName: "/home/claude/LogitLoom_Lecture.pptx" }).then(() => console.log("done"));
