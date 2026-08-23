const pptxgen = require("pptxgenjs");

// ---------- palette (shared series identity with Lecture 2) ----------
const NAVY = "0B2942";
const MIDNIGHT = "21295C";
const DEEPBLUE = "065A82";
const TEAL = "1C7293";
const ICE = "CFE8F0";
const OFFWHITE = "FFFFFF";
const INK = "1B2733";
const MUTE = "5C7080";
const CARD = "F2F8FA";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "AI Seminar";
pres.title = "Foundations: How Transformer LLMs Work";

const ICON = (name) => `/home/claude/icons/${name}.png`;

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
    x: 0.6, y: 0.78, w: opts.w || 11.8, h: opts.h || 0.9,
    fontSize: opts.fontSize || 30, color, bold: true, fontFace: "Cambria",
    margin: 0,
  });
}
function iconChip(slide, iconVariant, x, y, size, bg) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: bg } });
  const pad = size * 0.26;
  slide.addImage({ path: ICON(iconVariant), x: x + pad, y: y + pad, w: size - 2 * pad, h: size - 2 * pad });
}
function footerBrand(slide, dark) {
  slide.addText("AI TOOLING SEMINAR  \u00b7  LECTURE 1: FOUNDATIONS", {
    x: 0.6, y: 7.05, w: 8, h: 0.3,
    fontSize: 9, color: dark ? "8FA8C2" : MUTE, fontFace: "Calibri", charSpacing: 1,
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

// ================= SLIDE 1: TITLE =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: -1.4, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 40 } });
  s.addShape(pres.shapes.OVAL, { x: 12.2, y: 4.6, w: 3.2, h: 3.2, fill: { color: DEEPBLUE, transparency: 55 } });

  // stacked-block motif (transformer layers) top right
  const blockY0 = 0.6, blockH = 0.42, blockGap = 0.14, blockX = 10.5, blockW = 2.1;
  for (let i = 0; i < 5; i++) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: blockX, y: blockY0 + i * (blockH + blockGap), w: blockW, h: blockH, rectRadius: 0.05,
      fill: { color: i % 2 === 0 ? "16385A" : "1E4A6E" }, line: { color: "3F6E8C", width: 0.75 },
    });
  }

  s.addText("AI TOOLING SEMINAR  \u00b7  LECTURE 1", {
    x: 0.8, y: 1.55, w: 8, h: 0.4, fontSize: 14, color: "7FB8D6", bold: true, charSpacing: 3, fontFace: "Calibri",
  });
  s.addText("Foundations", {
    x: 0.75, y: 2.05, w: 10, h: 1.2, fontSize: 60, color: OFFWHITE, bold: true, fontFace: "Cambria", margin: 0,
  });
  s.addText("How Transformer LLMs Work, and How We Look Inside Them", {
    x: 0.8, y: 3.15, w: 9.8, h: 0.7, fontSize: 20, color: ICE, fontFace: "Calibri",
  });
  s.addShape(pres.shapes.LINE, { x: 0.8, y: 4.0, w: 3.2, h: 0, line: { color: TEAL, width: 2 } });
  s.addText(
    [
      { text: "What we'll cover: ", options: { bold: true, color: "BFE0EE" } },
      { text: "one shared vocabulary for the transformer architecture, how models are trained, and the core mindset and terminology behind interpretability research \u2014 the foundation every tool we look at this semester builds on.", options: { color: "9FC3D9" } },
    ],
    { x: 0.8, y: 4.25, w: 8.7, h: 1.2, fontSize: 13.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText("This lecture assumes: some prior exposure to ML, but no shared vocabulary yet.", {
    x: 0.8, y: 6.65, w: 9, h: 0.4, fontSize: 11.5, italic: true, color: "6FA0BE", fontFace: "Calibri",
  });
}

// ================= SLIDE 2: COURSE FRAMING =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Course Framing");
  title(s, "Welcome to AI Tooling");

  s.addText(
    "This course is a hands-on tour of open-source AI and interpretability tools \u2014 each week digs into a real repo. Today's goal is a shared vocabulary, so that when we hit a new tool, we spend our time on what's actually new about it.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.85, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 2.55, w: 12.1, h: 3.85, rectRadius: 0.08, fill: { color: CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  s.addText("By the end of today, you should be able to:", {
    x: 0.95, y: 2.8, w: 11.4, h: 0.4, fontSize: 15, bold: true, color: INK, fontFace: "Calibri",
  });

  const goals = [
    ["cubes_white", "Describe the transformer architecture end to end", "tokenization \u2192 embeddings \u2192 attention \u2192 residual stream \u2192 MLPs \u2192 logits \u2014 in your own words."],
    ["route_white", "Explain the training pipeline", "pretraining vs. fine-tuning vs. post-training alignment, and why that pipeline produces the \u201cbase vs. instruct\u201d split."],
    ["eye_white", "Use standard interpretability vocabulary", "residual stream, features, superposition, circuits, activation patching, SAEs, control vectors, logit lens."],
    ["terminal", "Navigate the common tooling stack", "PyTorch tensors, HuggingFace Transformers, and TransformerLens \u2014 what each is for."],
  ];
  const gw = 5.6, gh = 1.35, gx0 = 0.95, gy0 = 3.35, ggap = 0.35;
  goals.forEach(([icon, h, b], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx0 + col * (gw + ggap), y = gy0 + row * (gh + 0.15);
    iconChip(s, icon, x, y, 0.55, DEEPBLUE);
    s.addText(h, { x: x + 0.75, y: y - 0.02, w: gw - 0.75, h: 0.4, fontSize: 13, bold: true, color: INK, fontFace: "Calibri" });
    s.addText(b, { x: x + 0.75, y: y + 0.38, w: gw - 0.75, h: 0.85, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
  });
  footerBrand(s); addSlideNumber(s, 2);
}

// ================= SLIDE 3: BRIDGING BACKGROUNDS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Perspectives");
  title(s, "One Object, Many Lenses");

  s.addText(
    "Math, CS, EE, and data science each have their own native vocabulary for the same underlying object. None of these are required background \u2014 they're just optional handholds if one happens to be familiar.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const rows = [
    ["calculator_teal", "Math", "Linear algebra & vector spaces", "Embeddings and the residual stream are just vectors; attention is a weighted combination \u2014 a matrix operation you already know."],
    ["microchip_teal", "EE", "Signals & filtering", "Attention behaves like an adaptive, learned filter: it re-weights a sequence of signals based on relevance, per position."],
    ["network_teal", "CS", "Data structures & systems", "Tokenization, model architecture, and tooling (hooks, pipelines, APIs) are the systems-engineering side of the same object."],
    ["database_teal", "Data Sci", "Probability & statistics", "Logits, softmax, and sampling are exactly the probability distributions and estimation you already reason about."],
  ];
  let ry = 2.3;
  const rh = 0.95;
  rows.forEach(([icon, bg, lens, mapping], i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y: ry, w: 12.1, h: rh, rectRadius: 0.06, fill: { color: CARD },
    });
    iconChip(s, icon, 0.85, ry + (rh - 0.55) / 2, 0.55, OFFWHITE);
    s.addText(bg, { x: 1.6, y: ry + 0.12, w: 1.5, h: 0.7, fontSize: 15, bold: true, color: DEEPBLUE, fontFace: "Calibri", valign: "middle" });
    s.addText(lens, { x: 3.2, y: ry + 0.12, w: 3.0, h: 0.7, fontSize: 12, italic: true, color: MUTE, fontFace: "Calibri", valign: "middle" });
    s.addText(mapping, { x: 6.3, y: ry + 0.08, w: 6.2, h: rh - 0.16, fontSize: 11, color: INK, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.15 });
    ry += rh + 0.15;
  });
  footerBrand(s); addSlideNumber(s, 3);
}

// ================= SLIDE 4: NEURAL NET REFRESHER =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Fast Refresher");
  title(s, "A Neural Network Is a Differentiable Function");

  s.addText(
    "Deliberately fast \u2014 just enough shared vocabulary on the core loop every neural net runs, so later slides can build on it without re-deriving it.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const cardW = 3.85, gap = 0.28, sx = 0.6, sy = 2.3, ch = 3.9;
  const cards = [
    ["puzzle_white", "Forward pass", "Inputs are multiplied by learned weight matrices, summed, and passed through a nonlinearity (e.g. ReLU/GELU), layer after layer, to produce an output.", DEEPBLUE],
    ["compass_white", "Loss", "A single number scoring how wrong the output was, compared to what it should have been.", TEAL],
    ["route_white", "Backprop + gradient descent", "The chain rule computes how much each weight contributed to the loss; weights are nudged a small step in the direction that reduces it. Repeat, a lot.", MIDNIGHT],
  ];
  cards.forEach(([icon, h, b, color], i) => {
    const x = sx + i * (cardW + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: sy, w: cardW, h: ch, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, icon, x + cardW / 2 - 0.4, sy + 0.35, 0.8, color);
    s.addText(h, { x: x + 0.25, y: sy + 1.35, w: cardW - 0.5, h: 0.55, fontSize: 16, bold: true, color: INK, align: "center", fontFace: "Calibri" });
    s.addText(b, { x: x + 0.3, y: sy + 2.0, w: cardW - 0.6, h: ch - 2.2, fontSize: 11.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });
  s.addText(
    [
      { text: "Why this matters for interpretability: ", options: { bold: true, color: INK } },
      { text: "every technique we'll use \u2014 patching, probing, steering \u2014 works by reading or intervening on the intermediate numbers this forward pass produces.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.35, w: 12.1, h: 0.62, fontSize: 11.5, fontFace: "Calibri", lineSpacingMultiple: 1.15 }
  );
  footerBrand(s); addSlideNumber(s, 4);
}

// ================= SLIDE 5: TOKENIZATION =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Transformer, Step by Step");
  title(s, "Step 1: Tokenization");

  s.addText(
    "Models don't read characters or whole words \u2014 they read tokens: subword chunks from a fixed vocabulary, usually built with Byte Pair Encoding (BPE).",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.6, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const opts = [
    ["Characters", "Vocabulary is tiny, but sequences become very long \u2014 expensive, and hard to learn long-range structure.", "B85042"],
    ["Whole words", "Sequences are short, but the vocabulary is huge and can't cover every word (typos, rare words, new terms) \u2014 the classic \u201cout of vocabulary\u201d problem.", "B85042"],
    ["Subwords (BPE)", "Start from individual bytes/characters; repeatedly merge the most frequent adjacent pair into a new token, until you hit a target vocabulary size. Common words become single tokens; rare words fall back to smaller pieces.", DEEPBLUE],
  ];
  let ry = 2.35;
  opts.forEach(([h, b, color], i) => {
    const isWinner = i === 2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y: ry, w: 12.1, h: isWinner ? 1.5 : 0.85, rectRadius: 0.06,
      fill: { color: isWinner ? "E9F4F8" : CARD },
      line: isWinner ? { color: DEEPBLUE, width: 1 } : undefined,
    });
    s.addText(h, { x: 0.9, y: ry + 0.08, w: 2.6, h: isWinner ? 1.34 : 0.7, fontSize: 13.5, bold: true, color, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: 3.6, y: ry + 0.08, w: 8.8, h: isWinner ? 1.34 : 0.7, fontSize: 11, color: INK, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.18 });
    ry += (isWinner ? 1.5 : 0.85) + 0.2;
  });

  s.addText(
    [
      { text: "Why this matters later: ", options: { bold: true, color: INK } },
      { text: "any tool that shows you a model's raw output token-by-token is showing you these exact subword pieces \u2014 which is why individual tokens sometimes look like partial words or single characters instead of whole words.", options: { color: MUTE } },
    ],
    { x: 0.6, y: ry + 0.1, w: 12.1, h: 0.5, fontSize: 11.5, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s); addSlideNumber(s, 5);
}

// ================= SLIDE 6: EMBEDDINGS & POSITIONAL ENCODING =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Transformer, Step by Step");
  title(s, "Step 2: Embeddings & Position");

  const colW = 5.75, colY = 1.9, colH = 4.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  iconChip(s, "layers", 0.9, colY + 0.3, 0.6, DEEPBLUE);
  s.addText("Token embeddings", { x: 1.7, y: colY + 0.3, w: 4.5, h: 0.6, fontSize: 16, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
  s.addText(
    "Each token ID is looked up in an embedding matrix and turned into a dense vector (hundreds to thousands of dimensions). Similar tokens tend to land in similar directions \u2014 this vector space is where nearly all interpretability work actually happens.",
    { x: 0.9, y: colY + 1.15, w: colW - 0.6, h: 1.7, fontSize: 12, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText(
    "A token's logprob \u2014 how likely the model thought it was \u2014 is, underneath, a statement about vectors in this exact space.",
    { x: 0.9, y: colY + 3.1, w: colW - 0.6, h: 1.3, fontSize: 11, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const rx = 6.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: rx, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  iconChip(s, "compass_white", rx + 0.3, colY + 0.3, 0.6, DEEPBLUE);
  s.addText("Positional encoding", { x: rx + 1.1, y: colY + 0.3, w: 4.4, h: 0.6, fontSize: 16, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle" });
  s.addText(
    "Attention (next slide) treats a sequence as an unordered set \u2014 it's permutation-invariant. Without extra help, \u201cdog bites man\u201d and \u201cman bites dog\u201d would look identical to the model.",
    { x: rx + 0.3, y: colY + 1.15, w: colW - 0.6, h: 1.4, fontSize: 12, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText(
    "Fix: give the model access to position somehow. Older approaches inject it directly into the embeddings (classic sinusoidal encodings, learned position embeddings). Most current models instead apply it inside attention itself, at every layer \u2014 rotary position embeddings (RoPE).",
    { x: rx + 0.3, y: colY + 2.7, w: colW - 0.6, h: 1.8, fontSize: 11.5, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );
  footerBrand(s); addSlideNumber(s, 6);
}

// ================= SLIDE 7: SELF-ATTENTION =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Transformer, Step by Step");
  title(s, "Step 3: Self-Attention");

  s.addText(
    "Attention lets every token look at every other token and pull in the information it needs \u2014 dynamically, based on content, not fixed rules.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const qkv = [
    ["search", "Query", "\u201cWhat am I looking for?\u201d \u2014 a vector each token emits describing what information it wants.", DEEPBLUE],
    ["network_white", "Key", "\u201cWhat do I offer?\u201d \u2014 a vector each token emits describing what information it holds.", TEAL],
    ["database_white", "Value", "\u201cHere's my actual content\u201d \u2014 the information that actually gets passed along, weighted by the query-key match.", MIDNIGHT],
  ];
  const cw = 3.85, gap = 0.28, sx = 0.6, sy = 2.25, ch = 2.15;
  qkv.forEach(([icon, h, b, color], i) => {
    const x = sx + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: sy, w: cw, h: ch, rectRadius: 0.08, fill: { color: CARD } });
    iconChip(s, icon, x + 0.25, sy + 0.25, 0.55, color);
    s.addText(h, { x: x + 0.95, y: sy + 0.25, w: cw - 1.2, h: 0.55, fontSize: 15, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.25, y: sy + 0.9, w: cw - 0.5, h: ch - 1.05, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.65, w: 12.1, h: 2.25, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  s.addText("scaled dot-product attention: softmax( Q \u00b7 K\u1d40 / \u221adk ) \u00b7 V", {
    x: 0.9, y: 4.85, w: 11.5, h: 0.45, fontSize: 15, bold: true, color: "8FD4E8", fontFace: "Courier New",
  });
  s.addText(
    "Here, dk is the dimensionality of the key vectors \u2014 dividing by its square root keeps the dot products from growing too large as dimensionality increases, which would otherwise push softmax into a region with near-zero gradients. Each token's query is compared against every other token's key; the scores are turned into weights (softmax); those weights combine the values into this token's new representation. \"Multi-head\" attention just runs several of these in parallel with different learned projections, so different heads can specialize \u2014 one for syntax, another for coreference, and so on.",
    { x: 0.9, y: 5.35, w: 11.5, h: 1.45, fontSize: 11.5, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );
  footerBrand(s); addSlideNumber(s, 7);
}

// ================= SLIDE 8: RESIDUAL STREAM =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "The Transformer, Step by Step", "8FD4E8");
  title(s, "Step 4: The Residual Stream", OFFWHITE);

  s.addText(
    "This is the single most important concept for everything we'll do later in the course \u2014 most interpretability techniques are really just techniques for reading or editing this one object.",
    { x: 0.6, y: 1.6, w: 7.3, h: 1.0, fontSize: 13.5, color: "BFDCE8", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const pts = [
    ["A shared channel, not a hidden state", "Each token position has one vector \u2014 the residual stream \u2014 that persists across every layer of the model."],
    ["Layers read and add, they don't overwrite", "Attention reads the stream, computes something, and adds its result back in. Then the MLP block does the same. The stream accumulates."],
    ["Everything lives here", "Early \u201craw\u201d token information, later \u201cprocessed\u201d information, and everything in between coexist, added together, in the same vector."],
  ];
  let py = 1.6;
  pts.forEach(([h, b]) => {
    s.addShape(pres.shapes.OVAL, { x: 7.75, y: py + 0.06, w: 0.12, h: 0.12, fill: { color: "8FD4E8" } });
    s.addText(h, { x: 8.0, y: py - 0.15, w: 4.7, h: 0.55, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri" });
    s.addText(b, { x: 8.0, y: py + 0.35, w: 4.7, h: 1.15, fontSize: 11, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    py += 1.55;
  });

  // residual-stream diagram: line THICKENS at each junction to show accumulation,
  // not just "things happening nearby" — and each tap is marked with an explicit +
  const lx = 2.2, topY = 4.2, botY = 6.35;
  const taps = [
    [topY + 0.4, "+ Attention", TEAL],
    [topY + 1.15, "+ MLP", DEEPBLUE],
    [topY + 1.9, "+ Attention", TEAL],
  ];
  const segBounds = [topY, taps[0][0], taps[1][0], taps[2][0], botY];
  const segWidths = [1.25, 2.0, 2.75, 3.5];
  for (let i = 0; i < 4; i++) {
    s.addShape(pres.shapes.LINE, {
      x: lx, y: segBounds[i], w: 0, h: segBounds[i + 1] - segBounds[i],
      line: { color: "5A8FB0", width: segWidths[i] },
    });
  }
  taps.forEach(([y, label, color]) => {
    s.addShape(pres.shapes.OVAL, { x: lx - 0.13, y: y - 0.13, w: 0.26, h: 0.26, fill: { color: "8FD4E8" } });
    s.addText("+", { x: lx - 0.13, y: y - 0.16, w: 0.26, h: 0.26, fontSize: 13, bold: true, color: NAVY, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: lx + 0.35, y: y - 0.22, w: 1.9, h: 0.44, rectRadius: 0.06, fill: { color } });
    s.addText(label, { x: lx + 0.35, y: y - 0.22, w: 1.9, h: 0.44, fontSize: 11, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
  });
  s.addText("residual\nstream", { x: lx - 0.65, y: topY - 0.55, w: 1.3, h: 0.5, fontSize: 10, italic: true, color: "8FA8C2", align: "center", fontFace: "Calibri" });
  s.addText("the line thickens at each + \u2014 the vector is genuinely accumulating, not just passing by", {
    x: lx - 0.65, y: botY + 0.15, w: 5.2, h: 0.4, fontSize: 9.5, italic: true, color: "7FA9C4", fontFace: "Calibri",
  });
  footerBrand(s, true); addSlideNumber(s, 8);
}

// ================= SLIDE 9: MLP + LAYER NORM =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Transformer, Step by Step");
  title(s, "Step 5: MLP Blocks & LayerNorm");

  const colW = 5.75, colY = 1.9, colH = 4.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  iconChip(s, "cubes_white", 0.9, colY + 0.3, 0.6, DEEPBLUE);
  s.addText("MLP (feedforward) block", { x: 1.7, y: colY + 0.3, w: 4.5, h: 0.6, fontSize: 15, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
  s.addText(
    "Unlike attention, the MLP processes each token position independently \u2014 no mixing across positions. It's a simple up-projection, nonlinearity, down-projection.",
    { x: 0.9, y: colY + 1.15, w: colW - 0.6, h: 1.0, fontSize: 12, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText(
    "In practice, MLP blocks are where a large share of a model's factual knowledge appears to be stored and looked up \u2014 a recurring finding in interpretability research.",
    { x: 0.9, y: colY + 2.3, w: colW - 0.6, h: 1.1, fontSize: 11.5, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const rx = 6.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: rx, y: colY, w: colW, h: colH, rectRadius: 0.08, fill: { color: MIDNIGHT },
  });
  iconChip(s, "sliders", rx + 0.3, colY + 0.3, 0.6, DEEPBLUE);
  s.addText("LayerNorm", { x: rx + 1.1, y: colY + 0.3, w: 4.4, h: 0.6, fontSize: 15, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle" });
  s.addText(
    "A normalization step applied before (or after) attention and MLP blocks, rescaling each token's vector so training stays numerically stable across many stacked layers.",
    { x: rx + 0.3, y: colY + 1.15, w: colW - 0.6, h: 1.3, fontSize: 12, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText(
    "Practical note: because LayerNorm rescales, interpretability tools that read the residual stream often have to account for it \u2014 raw magnitudes aren't always directly comparable across positions or layers.",
    { x: rx + 0.3, y: colY + 2.6, w: colW - 0.6, h: 1.7, fontSize: 11, italic: true, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );
  footerBrand(s); addSlideNumber(s, 9);
}

// ================= SLIDE 10: FULL TRANSFORMER BLOCK =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Putting It Together");
  title(s, "The Full Pipeline, End to End");

  // vertical pipeline diagram
  const steps = [
    ["Tokens", DEEPBLUE],
    ["Embeddings + position", DEEPBLUE],
    ["[ LayerNorm \u2192 Attention \u2192 +residual \u2192 LayerNorm \u2192 MLP \u2192 +residual ]  \u00d7 N layers", MIDNIGHT],
    ["Final LayerNorm", DEEPBLUE],
    ["Unembedding matrix", DEEPBLUE],
    ["Logits \u2192 softmax \u2192 probability distribution over next token", TEAL],
  ];
  let sy = 1.65;
  const rh = 0.52;
  steps.forEach(([label, color], i) => {
    const isBig = i === 2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.4, y: sy, w: 10.5, h: isBig ? 0.68 : rh, rectRadius: 0.06, fill: { color },
    });
    s.addText(label, {
      x: 1.6, y: sy, w: 10.1, h: isBig ? 0.68 : rh, fontSize: isBig ? 11 : 13, bold: !isBig, color: OFFWHITE,
      align: "center", valign: "middle", fontFace: isBig ? "Courier New" : "Calibri",
    });
    sy += (isBig ? 0.68 : rh);
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.OVAL, { x: 6.6, y: sy + 0.02, w: 0.12, h: 0.12, fill: { color: MUTE } });
      sy += 0.18;
    }
  });

  s.addText(
    [
      { text: "The key idea to hold onto: ", options: { bold: true, color: INK } },
      { text: "the model doesn't just produce one answer \u2014 it produces this whole final probability distribution, and \u201cthe output\u201d is just one draw from it. Every tool in this course reads or intervenes on some piece of this pipeline.", options: { color: MUTE } },
    ],
    { x: 0.6, y: sy + 0.25, w: 12.1, h: 0.55, fontSize: 11.5, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s); addSlideNumber(s, 10);
}

// ================= SLIDE 11: TRAINING PARADIGMS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "How Models Get This Way");
  title(s, "Three Stages of Training");

  s.addText(
    "This pipeline is exactly where the \u201cbase vs. instruct\u201d distinction comes from \u2014 they're just checkpoints from different stages below.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const stages = [
    ["book", "1. Pretraining", "Self-supervised next-token prediction on a huge, broad text corpus. No notion of \u201cassistant\u201d \u2014 the model just learns to continue text.", "This produces a BASE model.", DEEPBLUE],
    ["gradcap_white", "2. Fine-tuning", "Supervised training on a much smaller, curated set of examples \u2014 often instruction/response pairs \u2014 to teach a task format.", "Base \u2192 instruction-following.", TEAL],
    ["shield", "3. Post-training", [
      { text: "Further alignment toward some notion of a \u201cbetter\u201d response, using feedback of some kind. RLHF, DPO, RLVR, and ", options: { color: MUTE } },
      { text: "RAFT", options: { color: DEEPBLUE, bold: true, underline: true, hyperlink: { url: "https://github.com/lumpenspace/raft" } } },
      { text: " are all examples \u2014 the specific mechanism varies; the goal doesn't.", options: { color: MUTE } },
    ], "This produces an INSTRUCT / chat model.", MIDNIGHT],
  ];
  const cw = 3.85, gap = 0.28, sx = 0.6, sy = 2.3, ch = 4.0;
  stages.forEach(([icon, h, b, tag, color], i) => {
    const x = sx + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: sy, w: cw, h: ch, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, icon, x + 0.25, sy + 0.3, 0.6, color);
    s.addText(h, { x: x + 0.25, y: sy + 1.05, w: cw - 0.5, h: 0.4, fontSize: 15, bold: true, color: INK, fontFace: "Calibri" });
    s.addText(b, { x: x + 0.25, y: sy + 1.45, w: cw - 0.5, h: 1.75, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: sy + ch - 0.65, w: cw - 0.5, h: 0.45, rectRadius: 0.05, fill: { color } });
    s.addText(tag, { x: x + 0.25, y: sy + ch - 0.65, w: cw - 0.5, h: 0.45, fontSize: 10, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
  });
  footerBrand(s); addSlideNumber(s, 11);
}

// ================= SLIDE 12: THE INTERPRETABILITY MINDSET =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Why We're Here", "8FD4E8");
  title(s, "The Interpretability Mindset", OFFWHITE);

  s.addText(
    "We can already observe what a model outputs. Interpretability asks a different question: what is it actually computing to get there?",
    { x: 0.6, y: 1.6, w: 12, h: 0.6, fontSize: 14, color: "BFDCE8", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const loop = [
    ["Hypothesize", "Propose a specific mechanism \u2014 e.g. \u201cthis attention head copies the subject of the sentence.\u201d"],
    ["Intervene", "Don't just look \u2014 change something: ablate a component, patch in an activation from a different run, add a steering vector."],
    ["Observe", "Measure the causal effect on the model's output or on a downstream activation."],
    ["Revise", "Update the hypothesis based on what actually moved \u2014 and what didn't."],
  ];
  const cw = 2.85, gap = 0.2, sx = 0.6, sy = 2.55, ch = 2.1;
  loop.forEach(([h, b], i) => {
    const x = sx + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: sy, w: cw, h: ch, rectRadius: 0.08, fill: { color: MIDNIGHT } });
    s.addText(String(i + 1), { x: x + 0.2, y: sy + 0.15, w: 0.6, h: 0.5, fontSize: 22, bold: true, color: "3F6E8C", fontFace: "Cambria" });
    s.addText(h, { x: x + 0.2, y: sy + 0.65, w: cw - 0.4, h: 0.4, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri" });
    s.addText(b, { x: x + 0.2, y: sy + 1.05, w: cw - 0.4, h: ch - 1.2, fontSize: 10, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.18 });
    if (i < loop.length - 1) {
      s.addText(">", { x: x + cw, y: sy + ch / 2 - 0.25, w: gap, h: 0.5, fontSize: 18, bold: true, color: "5A8FB0", align: "center" });
    }
  });

  s.addText(
    [
      { text: "Correlational vs. causal: ", options: { bold: true, color: OFFWHITE } },
      { text: "noticing that a neuron activates on a concept is a hypothesis, not a finding. Patching or ablating it and watching the downstream effect is what makes it evidence.", options: { color: "9FC3D9" } },
    ],
    { x: 0.6, y: 5.0, w: 12.1, h: 0.6, fontSize: 12.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  footerBrand(s, true); addSlideNumber(s, 12);
}

// ================= SLIDE 13: MECHINTERP VOCABULARY FIELD GUIDE =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Reference");
  title(s, "A Field Guide to Mechinterp Vocabulary");

  s.addText(
    "We're introducing these now so future lectures on specific tools don't have to stop and define them \u2014 we'll go deep on each as it comes up.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const terms = [
    ["Feature", "A human-interpretable direction or pattern in a model's activation space \u2014 not necessarily one neuron."],
    ["Superposition", "A model needs to represent far more concepts than it has dimensions for, so it compresses many unrelated ones into overlapping directions \u2014 one neuron can end up firing for several unrelated concepts at once."],
    ["Circuit", "A sub-network of attention heads and MLPs that together implement one identifiable behavior."],
    ["Activation patching", "Swapping an internal activation from one run into another to test whether it's causally responsible for a behavior."],
    ["Probing", "Training a simple classifier on internal activations to test whether a concept is linearly decodable from them."],
    ["Sparse autoencoder (SAE)", "Learns an overcomplete, sparse basis that decomposes messy activations into cleaner, more interpretable features."],
    ["Logit lens", "Projecting an intermediate residual-stream state through the unembedding matrix to see what the model would \u201csay\u201d from that layer."],
    ["Control / steering vector", "A direction in activation space that, when added in during a forward pass at inference time, reliably shifts model behavior \u2014 no retraining required."],
  ];
  const cw = 5.85, gap = 0.4, sx = 0.6, sy = 2.2;
  const rh = 1.05;
  terms.forEach(([term, def], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = sx + col * (cw + gap), y = sy + row * (rh + 0.12);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: rh, rectRadius: 0.06, fill: { color: CARD } });
    s.addText(term, { x: x + 0.2, y: y + 0.08, w: cw - 0.4, h: 0.32, fontSize: 12.5, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
    s.addText(def, { x: x + 0.2, y: y + 0.4, w: cw - 0.4, h: rh - 0.48, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
  });
  footerBrand(s); addSlideNumber(s, 13);
}

// ================= SLIDE 14: TOOLING LANDSCAPE =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Practical Matters");
  title(s, "The Tooling Landscape");

  s.addText(
    "The practical stack most of the tools in this course sit on top of.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.5, fontSize: 13.5, color: MUTE, fontFace: "Calibri" }
  );

  const tools = [
    ["cubes_white", "PyTorch", "The tensor engine underneath almost everything here \u2014 models are just nested operations on tensors, with automatic differentiation for training."],
    ["network_white", "HuggingFace Transformers", "The standard library for loading and running pretrained model architectures and weights with a consistent API."],
    ["search", "TransformerLens", "A lightweight research library purpose-built for interpretability \u2014 easy hooks to read and edit any internal activation during a forward pass."],
    ["terminal", "Jupyter / Colab", "The iterative, cell-by-cell workflow most interpretability exploration actually happens in \u2014 run, inspect, adjust, repeat."],
  ];
  const cw = 5.75, gap = 0.4, sx = 0.6, sy = 2.3, rh = 1.9;
  tools.forEach(([icon, h, b], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = sx + col * (cw + gap), y = sy + row * (rh + 0.25);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: cw, h: rh, rectRadius: 0.08, fill: { color: CARD },
      shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
    });
    iconChip(s, icon, x + 0.3, y + 0.3, 0.6, DEEPBLUE);
    s.addText(h, { x: x + 1.1, y: y + 0.3, w: cw - 1.4, h: 0.6, fontSize: 15, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: rh - 1.2, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  s.addText(
    [
      { text: "Not every tool works this way: ", options: { bold: true, color: INK } },
      { text: "some skip loading weights locally entirely, and instead call a hosted provider's API directly for what they need (like per-token logprobs). Same underlying idea \u2014 inspecting what's normally hidden \u2014 just a different point of entry.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.35, w: 12.1, h: 0.6, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  footerBrand(s); addSlideNumber(s, 14);
}

// ================= SLIDE 15: COURSE ROADMAP =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Looking Ahead", "8FD4E8");
  title(s, "Where This Course Goes From Here", OFFWHITE);

  const roadmap = [
    ["1", "Foundations (today)", "Shared vocabulary: architecture, training, interpretability mindset.", null, true],
    ["2", "LogitLoom", "Token trees, logprobs, base vs. instruct in practice.", "https://github.com/vgel/logitloom", false],
    ["3", "repeng", "Representation engineering & control vectors \u2014 building and applying steering directions.", "https://github.com/vgel/repeng", false],
    ["4+", "Possible directions from here", "Sparse autoencoders & features, probing, activation patching \u2014 exact lineup still open.", null, false],
  ];
  let ry = 1.7;
  roadmap.forEach(([num, h, b, url, current]) => {
    const rh = 0.68;
    s.addShape(pres.shapes.OVAL, { x: 0.7, y: ry + 0.04, w: 0.44, h: 0.44, fill: { color: current ? TEAL : MIDNIGHT }, line: current ? undefined : { color: "3F6E8C", width: 1 } });
    s.addText(num, { x: 0.7, y: ry + 0.04, w: 0.44, h: 0.44, fontSize: 13, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.35, y: ry, w: 10.95, h: rh, rectRadius: 0.06, fill: { color: current ? "16385A" : MIDNIGHT }, line: current ? { color: TEAL, width: 1 } : undefined });
    if (url) {
      s.addText([{ text: h, options: { hyperlink: { url }, bold: true, color: "8FD4E8", underline: true, fontFace: "Calibri" } }],
        { x: 1.6, y: ry + 0.06, w: 4.2, h: rh - 0.12, fontSize: 13, valign: "middle" });
    } else {
      s.addText(h, { x: 1.6, y: ry + 0.06, w: 4.2, h: rh - 0.12, fontSize: 13, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle" });
    }
    s.addText(b, { x: 5.85, y: ry + 0.06, w: 6.25, h: rh - 0.12, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.1 });
    ry += rh + 0.14;
  });

  s.addText(
    "Exact order and topics past Lecture 3 may shift \u2014 the throughline stays the same: every tool we open up will read or edit some version of the residual stream you saw today.",
    { x: 0.6, y: ry + 0.1, w: 12.1, h: 0.55, fontSize: 11, italic: true, color: "8FA8C2", fontFace: "Calibri", lineSpacingMultiple: 1.15 }
  );
  footerBrand(s, true); addSlideNumber(s, 15);
}

// ================= SLIDE 16: CLOSING / RESOURCES =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: -1.5, y: 4.5, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 45 } });

  s.addText("BEFORE NEXT LECTURE", {
    x: 0.8, y: 0.9, w: 8, h: 0.4, fontSize: 14, bold: true, color: "7FB8D6", charSpacing: 3, fontFace: "Calibri",
  });
  s.addText("Further Reading", {
    x: 0.75, y: 1.3, w: 10.5, h: 1.0, fontSize: 38, bold: true, color: OFFWHITE, fontFace: "Cambria", margin: 0,
  });

  const links = [
    ["book", "Reading", "\u201cThe Illustrated Transformer\u201d (Jay Alammar) \u2014 the best visual walkthrough of everything in slides 5\u20139."],
    ["microscope", "Reading", "Anthropic's \u201cA Mathematical Framework for Transformer Circuits\u201d \u2014 the paper that popularized the residual-stream framing."],
    ["terminal", "Reference", "Neel Nanda's mechanistic interpretability glossary, and the TransformerLens documentation."],
  ];
  let ly = 2.55;
  links.forEach(([icon, h, v]) => {
    iconChip(s, icon, 0.8, ly, 0.5, DEEPBLUE);
    s.addText(h, { x: 1.5, y: ly, w: 2, h: 0.3, fontSize: 11, color: "9FC3D9", fontFace: "Calibri" });
    s.addText(v, { x: 1.5, y: ly + 0.28, w: 10.5, h: 0.55, fontSize: 12, color: OFFWHITE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    ly += 0.85;
  });

  s.addShape(pres.shapes.LINE, { x: 0.8, y: ly + 0.05, w: 6, h: 0, line: { color: TEAL, width: 1 } });
  s.addText("A Question to Sit With", { x: 0.8, y: ly + 0.25, w: 8, h: 0.35, fontSize: 13, bold: true, color: "8FD4E8", fontFace: "Calibri" });
  s.addText(
    "The residual stream carries every layer's contribution, added together. What does that suggest about why a single neuron's activation might be hard to interpret in isolation?",
    { x: 0.8, y: ly + 0.65, w: 9.5, h: 0.9, fontSize: 13, italic: true, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  footerBrand(s, true);
}

pres.writeFile({ fileName: "/home/claude/AI_Tooling_Lecture1_Foundations.pptx" }).then(() => console.log("all done"));




