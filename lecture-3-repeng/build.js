const pptxgen = require("pptxgenjs");
const path = require("path");

// ---------- palette (series design system: Ocean Gradient) ----------
const NAVY = "0B2942";      // deep background navy
const MIDNIGHT = "21295C";  // accent
const DEEPBLUE = "065A82";  // primary
const TEAL = "1C7293";      // secondary
const ICE = "CFE8F0";       // light tint
const OFFWHITE = "FFFFFF";
const INK = "1B2733";       // body text on white
const MUTE = "5C7080";      // muted gray-blue
const CARD = "F2F8FA";      // light card fill
const TINT = "F4F1E8";      // differentiated-card tint (never an edge stripe)

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "AI Seminar";
pres.title = "repeng: Representation Engineering & Control Vectors";

const ICON = (name) => path.join(__dirname, "icons", `${name}.png`);

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

// Icon variant rule: a colored/dark circle ALWAYS takes the white (no-suffix)
// glyph; only a white/light circle takes the "_teal" (navy) glyph.
function iconChip(slide, iconVariant, x, y, size, bg) {
  const light = ["FFFFFF", CARD, ICE, TINT].includes(bg.toUpperCase());
  const wantsTeal = iconVariant.endsWith("_teal");
  if (light !== wantsTeal) {
    throw new Error(
      `icon contrast bug: "${iconVariant}" on fill ${bg} (light=${light}, tealGlyph=${wantsTeal})`
    );
  }
  slide.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: bg } });
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

// back-reference pill. U+2190 only -- U+21A9 renders as a tofu box in this pipeline.
function backTag(slide, text, x, y, w, dark) {
  const h = 0.34;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.17,
    fill: { color: dark ? "2A3F63" : "E9F1E6" },
    line: { color: dark ? "5A8FB0" : "8FB88F", width: 0.75 },
  });
  slide.addText("←  " + text, {
    x: x + 0.14, y, w: w - 0.28, h, fontSize: 10, italic: true,
    color: dark ? "BFDCE8" : "3D6B3D",
    fontFace: "Calibri", bold: false, valign: "middle", margin: 0,
  });
}

function footerBrand(slide, dark) {
  slide.addText("REPENG  ·  AI SEMINAR, LECTURE 3", {
    x: 0.6, y: 7.05, w: 6, h: 0.3,
    fontSize: 9, color: dark ? "8FA8C2" : MUTE, fontFace: "Calibri", charSpacing: 1,
  });
}

function card(slide, x, y, w, h, fill = CARD, opts = {}) {
  const o = { x, y, w, h, rectRadius: 0.08, fill: { color: fill } };
  if (opts.line) o.line = { ...opts.line };
  if (opts.shadow !== false) {
    o.shadow = { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 };
  }
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, o);
}

// connector with the correct diagonal: flipV exactly when the target is LEFT of the source
function connect(slide, x1, y1, x2, y2, color = "8FAAB8", width = 1.25) {
  const opts = {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    line: { color, width },
  };
  if (x1 > x2) opts.flipV = true;
  slide.addShape(pres.shapes.LINE, opts);
}

// ===================== SLIDE 1: TITLE =====================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addShape(pres.shapes.OVAL, { x: 10.2, y: -1.6, w: 5.4, h: 5.4, fill: { color: MIDNIGHT, transparency: 40 } });
  s.addShape(pres.shapes.OVAL, { x: 12.0, y: 4.8, w: 3.4, h: 3.4, fill: { color: DEEPBLUE, transparency: 55 } });

  // motif: a stack of layers with a vector being added into the middle band
  const bx = 9.9, by = 1.25, bw = 2.5, bh = 0.24, gap = 0.11;
  for (let i = 0; i < 13; i++) {
    const inBand = i >= 4 && i <= 9;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: bx, y: by + i * (bh + gap), w: bw, h: bh, rectRadius: 0.03,
      fill: { color: inBand ? "2F6E8F" : "17395A" },
      line: { color: inBand ? "8FD4E8" : "23496B", width: 0.75 },
    });
  }
  for (let i = 4; i <= 9; i++) {
    const yy = by + i * (bh + gap) + bh / 2;
    s.addShape(pres.shapes.LINE, {
      x: bx - 0.5, y: yy, w: 0.38, h: 0,
      line: { color: "8FD4E8", width: 1.5, endArrowType: "triangle" },
    });
  }
  s.addText("+ v", {
    x: bx - 1.18, y: by + 6.2 * (bh + gap) - 0.12, w: 0.62, h: 0.35,
    fontSize: 14, color: "8FD4E8", bold: true, fontFace: "Courier New", align: "right", margin: 0,
  });

  s.addText("AI SEMINAR  ·  LECTURE 3", {
    x: 0.8, y: 1.55, w: 8, h: 0.4,
    fontSize: 14, color: "7FB8D6", bold: true, charSpacing: 3, fontFace: "Calibri",
  });

  s.addText("repeng", {
    x: 0.75, y: 2.05, w: 8.6, h: 1.5,
    fontSize: 64, color: OFFWHITE, bold: true, fontFace: "Cambria", margin: 0,
  });

  s.addText("Representation Engineering: Training Control Vectors That Steer a Model From the Inside", {
    x: 0.8, y: 3.4, w: 7.6, h: 0.95,
    fontSize: 19, color: ICE, fontFace: "Calibri", lineSpacingMultiple: 1.15,
  });

  s.addText(
    [
      { text: "How we'll get there: ", options: { bold: true, color: "BFE0EE" } },
      { text: "a one-paragraph preview, then a standalone background section on contrast pairs, one-component PCA, activation addition, chat templates, and network depth — then back to repeng for the real training loop, the layer-targeting dial, and the places it breaks.", options: { color: "9FC3D9" } },
    ],
    { x: 0.8, y: 4.5, w: 8.6, h: 1.5, fontSize: 13.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  s.addText("github.com/vgel/repeng   ·   vgel.me/posts/representation-engineering", {
    x: 0.8, y: 6.6, w: 9, h: 0.4,
    fontSize: 12, color: "6FA0BE", fontFace: "Courier New",
  });
}

// ===================== SLIDE 2: PREVIEW =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Preview");
  title(s, "Snapshot: What repeng Does");

  card(s, 0.6, 1.75, 7.2, 3.85);
  s.addText(
    [
      { text: "repeng", options: { bold: true, color: DEEPBLUE, fontFace: "Courier New" } },
      { text: " is a small Python library that reads a model's own internal ", options: {} },
      { text: "activations", options: { bold: true } },
      { text: " on pairs of opposite prompts, distills the difference into a single ", options: {} },
      { text: "direction", options: { bold: true } },
      { text: " per layer, and then ", options: {} },
      { text: "adds that direction back in", options: { bold: true } },
      { text: " during generation — giving you a continuous dial on a behaviour without touching a single weight.", options: {} },
    ],
    { x: 0.95, y: 2.05, w: 6.6, h: 2.0, fontSize: 15.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );
  s.addText(
    [
      { text: "Three moving parts: ", options: { bold: true, color: DEEPBLUE } },
      { text: "a contrast dataset of paired prompts, a per-layer direction extracted from the activations those prompts produce, and a hook that adds the direction back during generation. The next five slides build up each one.", options: { color: MUTE } },
    ],
    { x: 0.95, y: 4.25, w: 6.6, h: 1.1, fontSize: 12.5, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );

  // right illustration: hidden state + vector = steered state
  card(s, 8.15, 1.75, 4.55, 3.85, MIDNIGHT, { shadow: false });
  const cx = 8.6;
  s.addText("one layer's output, one token", {
    x: cx, y: 1.95, w: 3.7, h: 0.3, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", italic: true,
  });
  const rowY = [2.45, 3.35, 4.25];
  const labels = ["h", "v", "h + αv"];
  const cols = ["3F6E8C", "8FD4E8", "4FB3A0"];
  rowY.forEach((yy, i) => {
    s.addText(labels[i], {
      x: cx, y: yy, w: 0.75, h: 0.4, fontSize: 15, color: "DDEAF3",
      fontFace: "Courier New", bold: true, valign: "middle", margin: 0,
    });
    for (let k = 0; k < 9; k++) {
      const mag = [0.30, 0.16, 0.40][i] * (0.45 + 0.55 * Math.abs(Math.sin(k * 1.7 + i)));
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx + 0.8 + k * 0.33, y: yy + 0.2 - mag / 2, w: 0.24, h: mag, rectRadius: 0.02,
        fill: { color: cols[i] },
      });
    }
  });
  s.addText("α = strength dial", {
    x: cx, y: 4.95, w: 3.6, h: 0.3, fontSize: 11, color: "8FD4E8", fontFace: "Calibri", italic: true,
  });

  s.addText("No weights are updated. No prompt text is added. The change happens between layers, at inference time.", {
    x: 0.6, y: 5.85, w: 12.1, h: 0.5, fontSize: 13, color: TEAL, fontFace: "Calibri", bold: true,
  });

  footerBrand(s); addSlideNumber(s, 2);
}

// ===================== SLIDE 3: BG1 CONTRAST PAIRS =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 1 of 5");
  title(s, "Two Prompts That Differ in Exactly One Way");

  s.addText("To isolate a concept inside a network, you need two inputs that are identical in every respect except that concept. Everything shared cancels; what's left is the axis you care about.", {
    x: 0.6, y: 1.72, w: 7.1, h: 0.95, fontSize: 14, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  const pairs = [
    ["POSITIVE", "Write in an extremely formal style.  Dear colleagues, I", "1C7293"],
    ["NEGATIVE", "Write in an extremely casual style.  Dear colleagues, I", "8A6D3B"],
  ];
  pairs.forEach(([lab, txt, col], i) => {
    const y = 2.85 + i * 1.0;
    card(s, 0.6, y, 7.1, 0.82, i === 0 ? CARD : TINT, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    s.addText(lab, {
      x: 0.78, y: y + 0.08, w: 1.1, h: 0.28, fontSize: 9.5, bold: true, color: col,
      fontFace: "Calibri", charSpacing: 1, margin: 0,
    });
    s.addText(txt, {
      x: 0.78, y: y + 0.36, w: 6.7, h: 0.38, fontSize: 12, color: INK, fontFace: "Courier New", margin: 0,
    });
  });
  s.addText("identical shared ending — the only difference is one word", {
    x: 0.6, y: 4.88, w: 7.1, h: 0.3, fontSize: 10.5, italic: true, color: MUTE, fontFace: "Calibri",
  });

  const bullets = [
    ["contrast", "The pair is the experiment", "Run both, record the internal state at the same position in each. Subtracting removes everything they share."],
    ["shuffle", "One pair is noise; thousands are signal", "Reuse the same opposition across many different endings, so the only thing consistently varying is the concept."],
    ["ruler", "Cheap augmentation: cut the ending short", "Every prefix of a shared continuation is another valid pair. One sentence becomes a dozen training rows at no extra writing cost."],
  ];
  bullets.forEach(([ic, h, d], i) => {
    const y = 1.72 + i * 1.5;
    iconChip(s, ic, 8.1, y, 0.5, DEEPBLUE);
    s.addText(h, { x: 8.75, y: y - 0.03, w: 3.95, h: 0.35, fontSize: 13.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 8.75, y: y + 0.34, w: 3.95, h: 1.0, fontSize: 11.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });
  });

  card(s, 0.6, 5.5, 7.1, 1.2, TINT, { shadow: false, line: { color: "D8D2C0", width: 1 } });
  s.addText([
    { text: "Trap:  ", options: { bold: true, color: "8A4B2A" } },
    { text: "if one side of every pair is the same sentence every time, the two sides stop varying independently — and what you extract can end up being a property of the side that did vary, rather than of the contrast you intended.", options: { color: INK } },
  ], {
    x: 0.85, y: 5.62, w: 6.6, h: 0.98, fontSize: 11.5, fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0,
  });

  footerBrand(s); addSlideNumber(s, 3);
}

// ===================== SLIDE 4: BG2 PCA =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 2 of 5");
  title(s, "One Component: The Direction of Greatest Spread");

  s.addText("Given a cloud of high-dimensional points, principal component analysis finds the single direction along which the points are most spread out. Keep only the first component and you've compressed a whole dataset into one vector.", {
    x: 0.6, y: 1.7, w: 6.3, h: 1.1, fontSize: 13.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  // scatter + first component
  card(s, 7.25, 1.7, 5.45, 3.5, MIDNIGHT, { shadow: false });
  const ox = 7.6, oy = 1.95, ow = 4.75, oh = 3.0;
  const pts = [];
  for (let i = 0; i < 26; i++) {
    const t = (i / 25) * 2 - 1;
    const jitter = Math.sin(i * 4.7) * 0.32;
    pts.push([ox + ow / 2 + t * 1.85 + jitter * 0.35, oy + oh / 2 - t * 0.95 + jitter]);
  }
  s.addShape(pres.shapes.LINE, {
    x: ox + ow / 2 - 1.95, y: oy + oh / 2 - 1.05, w: 3.9, h: 2.1,
    line: { color: "8FD4E8", width: 2.25, endArrowType: "triangle" }, flipV: true,
  });
  pts.forEach(([px, py]) => {
    s.addShape(pres.shapes.OVAL, { x: px - 0.055, y: py - 0.055, w: 0.11, h: 0.11, fill: { color: "6FA8C9" } });
  });
  s.addText("first principal component", {
    x: ox, y: oy + oh - 0.05, w: 4.6, h: 0.3, fontSize: 10.5, color: "8FD4E8", fontFace: "Calibri", italic: true, align: "center",
  });

  const facts = [
    ["pca", "It centres the data first", "PCA subtracts the mean before it looks for spread. Anything that lives in the mean — including a constant offset between two groups — is removed before the search starts."],
    ["ruler", "It returns a unit direction, not a size", "The component has length 1. How far to travel along it is a separate decision you make later."],
    ["shuffle", "The sign is arbitrary", "PCA fixes an axis, not a heading. The unit vectors v and −v describe that same axis and explain identical variance, so whichever of the two comes back has to be checked against the data before its polarity is trusted."],
  ];
  facts.forEach(([ic, h, d], i) => {
    const y = 3.0 + i * 1.28;
    // white circle -> the navy "_teal" glyph is the correct-contrast variant here
    s.addShape(pres.shapes.OVAL, { x: 0.62, y, w: 0.46, h: 0.46, fill: { color: OFFWHITE }, line: { color: "AEC7D6", width: 1.25 } });
    s.addImage({ path: ICON(ic + "_teal"), x: 0.62 + 0.115, y: y + 0.115, w: 0.23, h: 0.23 });
    s.addText(h, { x: 1.22, y: y - 0.04, w: 5.6, h: 0.33, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 1.22, y: y + 0.3, w: 5.6, h: 0.9, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0 });
  });

  s.addText("Because the sign is arbitrary, any honest pipeline ends with a calibration step: project the original points back onto the extracted vector and negate it if the group you called “positive” landed on the low side.", {
    x: 7.25, y: 5.4, w: 5.45, h: 1.3, fontSize: 11.5, color: DEEPBLUE, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  footerBrand(s); addSlideNumber(s, 4);
}

// ===================== SLIDE 5: BG3 ACTIVATION ADDITION =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 3 of 5");
  title(s, "Activation Addition: Steering Without Changing Weights");

  s.addText("A transformer layer hands its output to the next layer. Intercept that hand-off, add a fixed vector before passing it along, and every downstream computation sees a shifted state — at every token position. Obtaining the vector is its own step with its own cost; what this buys is that applying it changes no weights.", {
    x: 0.6, y: 1.7, w: 12.1, h: 0.8, fontSize: 13.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  // pipeline diagram
  const py = 2.75;
  const boxes = [
    ["layer  n", "17395A"], ["+  vector", "1C7293"], ["layer  n+1", "17395A"],
  ];
  boxes.forEach(([lab, col], i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: py, w: 2.05, h: 0.85, rectRadius: 0.08, fill: { color: col },
    });
    s.addText(lab, {
      x, y: py, w: 2.05, h: 0.85, fontSize: 13, color: OFFWHITE, bold: true,
      fontFace: "Courier New", align: "center", valign: "middle", margin: 0,
    });
    if (i < 2) {
      s.addShape(pres.shapes.LINE, {
        x: x + 2.05, y: py + 0.425, w: 0.4, h: 0,
        line: { color: "5C7080", width: 1.5, endArrowType: "triangle" },
      });
    }
  });
  s.addText("the entire intervention", {
    x: 3.05, y: py + 0.95, w: 2.05, h: 0.3, fontSize: 10.5, color: TEAL,
    fontFace: "Calibri", italic: true, align: "center",
  });

  const compare = [
    ["gear", "Fine-tuning", "Rewrites weights. Needs gradients, data, and a full training run. Permanent until you train again.", CARD],
    ["chat", "Prompting", "Rewrites the input. Costs context, competes with later instructions, and has no dial — only rewording.", CARD],
    ["bolt", "Activation addition", "Leaves every weight untouched. Costs one extraction pass over the paired prompts — forward passes only, no gradients — after which it applies at every token position, toggles instantly, and scales continuously.", TINT],
  ];
  compare.forEach(([ic, h, d, fill], i) => {
    const x = 0.6 + i * 4.05;
    card(s, x, 4.35, 3.8, 2.15, fill, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    iconChip(s, ic, x + 0.25, 4.58, 0.5, i === 2 ? TEAL : DEEPBLUE);
    s.addText(h, { x: x + 0.88, y: 4.62, w: 2.75, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: x + 0.25, y: 5.18, w: 3.3, h: 1.2, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18, valign: "top", margin: 0 });
  });

  s.addText("Adding a vector also changes the state's magnitude. Whether you rescale back to the original length afterwards is a real design choice, with real consequences.", {
    x: 0.6, y: 6.56, w: 12.1, h: 0.38, fontSize: 12, color: DEEPBLUE, fontFace: "Calibri", italic: true,
  });

  footerBrand(s); addSlideNumber(s, 5);
}

// ===================== SLIDE 6: BG4 CHAT TEMPLATES =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 4 of 5");
  title(s, "Chat Templates Are Model-Specific, and Version-Specific", INK, { fontSize: 29 });

  s.addText("An instruction-tuned model was trained on text with structural markers around each turn. Those markers are tokens it learned to read as structure. Borrow another family's markers and it sees ordinary punctuation instead. This is not only a cross-family problem: Mistral-7B-Instruct kept [INST] from v0.1 to v0.3 while growing its vocabulary from 32,000 to 32,768 tokens and adding tool-call markers, so even a version bump can move the target.", {
    x: 0.6, y: 1.7, w: 12.1, h: 0.85, fontSize: 13.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  const fams = [
    ["Family A — role-marker style", "<|start|>user\nSummarise this.<|end|>\n<|start|>assistant\n", CARD],
    ["Family B — bracket-tag style", "[TAG] Summarise this. [/TAG]", TINT],
  ];
  fams.forEach(([h, code, fill], i) => {
    const x = 0.6 + i * 6.2;
    card(s, x, 2.75, 5.9, 1.5, fill, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    s.addText(h, { x: x + 0.25, y: 2.87, w: 5.4, h: 0.3, fontSize: 11.5, bold: true, color: DEEPBLUE, fontFace: "Calibri", margin: 0 });
    s.addText(code, { x: x + 0.25, y: 3.2, w: 5.4, h: 0.95, fontSize: 11, color: INK, fontFace: "Courier New", lineSpacingMultiple: 1.2, valign: "top", margin: 0 });
  });

  const notes = [
    ["braces", "System prompt injection", "Many templates insert a default system turn when you don't supply one. The string you get out is longer than the string you put in — and it is now in every training example."],
    ["code", "Assistant prefill", "Text placed after the assistant marker is treated as the opening of the model's own reply, so it continues rather than responds. Same characters in the user turn would be a request."],
    ["warn", "Wrong tokenization, no error", "Nothing crashes. The markers tokenise as ordinary text, so the model cannot parse where one role ends and the next begins, and it no longer treats the trailing text as a prefill of its own reply. The only symptom is worse output."],
  ];
  notes.forEach(([ic, h, d], i) => {
    const x = 0.6 + i * 4.05;
    iconChip(s, ic, x, 4.6, 0.5, i === 2 ? "8A4B2A" : DEEPBLUE);
    s.addText(h, { x, y: 5.18, w: 3.75, h: 0.58, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x, y: 5.74, w: 3.75, h: 1.0, fontSize: 11.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 6);
}

// ===================== SLIDE 7: BG5 DEPTH =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 5 of 5");
  title(s, "Activation Depth: Which Layers Carry the Property", INK, { fontSize: 30 });

  s.addText("An abstract property is not equally legible at every depth. Near the input the state still looks like tokens; near the output it has been bent toward predicting the next one. The middle is where abstract properties tend to be most cleanly separable — and it is a band, not a spot.", {
    x: 0.6, y: 1.7, w: 6.6, h: 1.15, fontSize: 13, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25,
  });

  // layer stack — labels sit OUTSIDE the bars, never on top of them
  const sx = 7.85, sy = 1.78, sw = 1.9, sh = 0.26, sg = 0.06;
  const bands = [
    [0, 3, "17395A", "surface / token-ish"],
    [4, 9, "1C7293", "abstract — most\ncleanly separable"],
    [10, 13, "3A5A78", "shaped toward output"],
  ];
  for (let i = 0; i < 14; i++) {
    const band = bands.find(([a, b]) => i >= a && i <= b);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: sx, y: sy + i * (sh + sg), w: sw, h: sh, rectRadius: 0.03,
      fill: { color: band[2] },
    });
  }
  bands.forEach(([a, b, col, lab]) => {
    const yTop = sy + a * (sh + sg);
    const yBot = sy + b * (sh + sg) + sh;
    // bracket
    s.addShape(pres.shapes.LINE, { x: sx + sw + 0.12, y: yTop, w: 0, h: yBot - yTop, line: { color: col, width: 2 } });
    s.addShape(pres.shapes.LINE, { x: sx + sw + 0.12, y: yTop, w: 0.12, h: 0, line: { color: col, width: 2 } });
    s.addShape(pres.shapes.LINE, { x: sx + sw + 0.12, y: yBot, w: 0.12, h: 0, line: { color: col, width: 2 } });
    s.addText(lab, {
      x: sx + sw + 0.34, y: (yTop + yBot) / 2 - 0.28, w: 2.55, h: 0.56, fontSize: 11,
      color: col, bold: true, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.1, margin: 0,
    });
  });
  s.addText("input", { x: sx - 0.92, y: sy - 0.04, w: 0.82, h: 0.26, fontSize: 10, color: MUTE, fontFace: "Calibri", align: "right", valign: "middle", margin: 0 });
  s.addText("output", { x: sx - 0.92, y: sy + 13 * (sh + sg), w: 0.82, h: 0.26, fontSize: 10, color: MUTE, fontFace: "Calibri", align: "right", valign: "middle", margin: 0 });

  const pts = [
    ["layers", "Read a band, not a layer", "Neighbouring layers carry overlapping versions of the same property, so a range is both more robust and more effective than any single index."],
    ["scale", "It is a hyperparameter, not a constant", "“Layer 15” is two-thirds of the way through a 24-layer network and under half-way through a 32-layer one, so absolute indices don't transfer. Neither does the depth fraction: the band that works is model-specific and has to be tuned by experiment, not inherited."],
    ["target", "Breadth is itself a strength dial", "Touching more layers at the same per-layer strength moves the model further. Push it far enough and coherence goes before the behaviour does."],
  ];
  pts.forEach(([ic, h, d], i) => {
    const y = 3.15 + i * 1.22;
    iconChip(s, ic, 0.62, y, 0.46, DEEPBLUE);
    s.addText(h, { x: 1.22, y: y - 0.04, w: 5.9, h: 0.33, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 1.22, y: y + 0.3, w: 5.9, h: 0.86, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.16, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 7);
}

// ===================== SLIDE 8: BRIDGE =====================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Bridge", "8FD4E8");
  title(s, "Five Concepts, Five Pieces of the Library", OFFWHITE);

  s.addText("Where each of the last five concepts reappears once we open the repository.", {
    x: 0.6, y: 1.72, w: 12.1, h: 0.4, fontSize: 13, color: "9FC3D9", fontFace: "Calibri",
  });

  const rows = [
    ["3", "Contrast pairs", "DatasetEntry(positive, negative)", "the unit of training data"],
    ["4", "One-component PCA", "read_representations()", "fits PCA(n_components=1), then fixes the sign"],
    ["5", "Activation addition", "ControlModule.forward()", "adds the vector to a layer's output mid-forward"],
    ["6", "Chat templates", "make_dataset() in the notebooks", "wraps each pair in the model's own turn markers"],
    ["7", "Depth as a band", "ControlModel(model, layer_ids)", "chooses which layers get touched at all"],
  ];
  rows.forEach(([n, concept, code, why], i) => {
    const y = 2.35 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6, y, w: 12.1, h: 0.72, rectRadius: 0.06,
      fill: { color: i % 2 ? "12314F" : "16385A" },
    });
    s.addShape(pres.shapes.OVAL, { x: 0.78, y: y + 0.16, w: 0.4, h: 0.4, fill: { color: TEAL } });
    s.addText(n, { x: 0.78, y: y + 0.16, w: 0.4, h: 0.4, fontSize: 12, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(concept, { x: 1.35, y, w: 2.5, h: 0.72, fontSize: 13, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle", margin: 0 });
    s.addText(code, { x: 3.95, y, w: 4.0, h: 0.72, fontSize: 11.5, color: "8FD4E8", fontFace: "Courier New", valign: "middle", margin: 0 });
    s.addText(why, { x: 8.1, y, w: 4.45, h: 0.72, fontSize: 11.5, color: "9FC3D9", fontFace: "Calibri", valign: "middle", margin: 0 });
  });

  s.addText("Slides that lean on one of these carry a pill like the one at right, naming the background slide it came from.", {
    x: 0.6, y: 6.65, w: 8.2, h: 0.35, fontSize: 11.5, color: "9FC3D9", fontFace: "Calibri", italic: true,
  });
  backTag(s, "Background · Slide 5, Activation Addition", 8.9, 6.6, 3.8, true);

  footerBrand(s, true); addSlideNumber(s, 8);
}

// ===================== SLIDE 9: WHAT IS REPENG =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Tool");
  title(s, "repeng: Author, Scope, and Maturity");

  card(s, 0.6, 1.72, 7.4, 2.45);
  s.addText(
    [
      { text: "repeng", options: { bold: true, fontFace: "Courier New", color: DEEPBLUE } },
      { text: " is a single-purpose Python package by ", options: {} },
      { text: "Theia Vogel", options: { bold: true } },
      { text: " (github.com/vgel), first released January 2024. It wraps a HuggingFace causal LM, trains one direction per layer from contrast pairs, and applies them at generation time. Roughly a thousand lines of Python across four modules — small enough to read end to end in an afternoon, which is exactly why it makes a good specimen.", options: {} },
    ],
    { x: 0.9, y: 1.95, w: 6.85, h: 2.0, fontSize: 13, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );

  const stats = [
    ["0.5.0", "current release\n(Sep 2025)"],
    ["4", "source modules\nin repeng/"],
    ["1", "PCA component\nper layer"],
    ["0", "weights\nupdated"],
  ];
  stats.forEach(([big, lab], i) => {
    const x = 0.6 + i * 1.9;
    card(s, x, 4.35, 1.72, 1.5, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    s.addText(big, { x, y: 4.5, w: 1.72, h: 0.6, fontSize: 30, bold: true, color: DEEPBLUE, align: "center", fontFace: "Cambria", margin: 0 });
    s.addText(lab, { x, y: 5.1, w: 1.72, h: 0.65, fontSize: 9.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.1, margin: 0 });
  });

  const facts = [
    ["book", "Derived from prior work", "The technique comes from the representation-engineering literature; the repository states that some of its code derives from andyzoujm/representation-engineering (MIT)."],
    ["package", "Two distribution channels", "On PyPI, and as a git repository — currently a full minor version apart. Only the repository copy imports successfully on NumPy 2, so the obvious install command is the wrong one."],
    ["flask", "No UI, no CLI", "There is no UI and no CLI. You import three names and write Python; the eight notebooks are the documentation."],
  ];
  facts.forEach(([ic, h, d], i) => {
    const y = 1.8 + i * 1.6;
    iconChip(s, ic, 8.35, y, 0.5, TEAL);
    s.addText(h, { x: 9.0, y: y - 0.03, w: 3.7, h: 0.33, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 9.0, y: y + 0.32, w: 3.7, h: 1.15, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0 });
  });

  backTag(s, "Background · Slide 5, Activation Addition", 0.6, 6.2, 4.0);
  footerBrand(s); addSlideNumber(s, 9);
}

// ===================== SLIDE 10: USE CASES =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Applications");
  title(s, "Use Cases");

  const uses = [
    ["wand", "A dial where prompting only gives a switch", "Asking for “a bit more formal” is a rewrite. A coefficient of 0.4 is a measurement you can reproduce, log, and sweep."],
    ["eye", "Probing what a model has internally", "If a clean direction exists for a property, the model represents that property linearly somewhere. Failing to find one is informative too."],
    ["scale", "Ablation studies without retraining", "Turn a behaviour up and down on a fixed checkpoint and watch a downstream metric move — controlled experiments on a frozen model."],
    ["compass", "Cheap iteration before committing to a fine-tune", "Minutes per behaviour instead of hours. If steering can't produce the behaviour at all, a fine-tune probably shouldn't be the next thing you try."],
    ["export", "Deploying a behaviour into a quantised runtime", "Train in Python, export to GGUF, apply inside llama.cpp — the training environment and the serving environment don't have to match."],
    ["bolt", "Robustness testing", "Because the control applies at every token, it isn't argued away by later instructions the way a system prompt can be."],
  ];
  uses.forEach(([ic, h, d], i) => {
    const c = i % 3, r = Math.floor(i / 3);
    const x = 0.6 + c * 4.05, y = 1.75 + r * 2.42;
    card(s, x, y, 3.8, 2.2, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    iconChip(s, ic, x + 0.25, y + 0.22, 0.48, i % 2 ? TEAL : DEEPBLUE);
    s.addText(h, { x: x + 0.25, y: y + 0.8, w: 3.3, h: 0.6, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: x + 0.25, y: y + 1.38, w: 3.3, h: 0.72, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 10);
}
// ===================== SLIDE 11: REPOSITORY STRUCTURE =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Orientation");
  title(s, "Repository Structure");
  pathTag(s, "github.com/vgel/repeng @ main", 8.35, 0.85, 4.35, false);

  card(s, 0.6, 1.72, 7.5, 4.95, NAVY, { shadow: false });

  const tree = [
    ["repeng/", 0, false, ""],
    ["├── .github/workflows/ci.yml", 1, false, ""],
    ["├── CHANGELOG", 1, false, ""],
    ["├── LICENSE", 1, false, ""],
    ["├── README.md", 1, false, ""],
    ["├── notebooks/", 1, false, ""],
    ["│   ├── data/", 2, false, ""],
    ["│   │   ├── all_truncated_outputs.json", 3, true, "582 generic sentence endings"],
    ["│   │   ├── code_questions.json", 3, false, ""],
    ["│   │   ├── reasoning.json", 3, false, ""],
    ["│   │   └── true_facts.json", 3, false, ""],
    ["│   ├── emotion.ipynb", 2, false, ""],
    ["│   ├── experiments.ipynb", 2, true, "the real make_dataset() lives here"],
    ["│   ├── honesty.ipynb", 2, false, ""],
    ["│   ├── llama-3-70b.ipynb", 2, false, ""],
    ["│   ├── llama-3.3-70b.ipynb", 2, false, ""],
    ["│   ├── model_delta.ipynb", 2, false, ""],
    ["│   ├── sae.ipynb", 2, false, ""],
    ["│   └── vector_ops.ipynb", 2, false, ""],
    ["├── pyproject.toml", 1, false, ""],
    ["├── repeng/", 1, false, ""],
    ["│   ├── __init__.py", 2, false, ""],
    ["│   ├── control.py", 2, true, "the wrapper + the forward hook"],
    ["│   ├── extract.py", 2, true, "training: hiddens → PCA → direction"],
    ["│   ├── saes.py", 2, true, "optional sparse-autoencoder path"],
    ["│   └── tests.py", 2, false, ""],
    ["└── uv.lock", 1, false, ""],
  ];
  const lh = 0.164;
  tree.forEach(([label, , hot, note], i) => {
    const y = 1.9 + i * lh;
    if (hot) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.75, y: y - 0.012, w: 7.2, h: lh, fill: { color: "1D4A6E" },
      });
    }
    s.addText(label, {
      x: 0.8, y: y - 0.02, w: 4.35, h: lh + 0.04, fontSize: 9.5,
      color: hot ? "8FD4E8" : "AFC6D6", bold: !!hot, fontFace: "Courier New", valign: "middle", margin: 0,
    });
    if (note) {
      s.addText(note, {
        x: 5.15, y: y - 0.02, w: 2.85, h: lh + 0.04, fontSize: 8.5,
        color: "7FA8C0", italic: true, fontFace: "Calibri", valign: "middle", margin: 0,
      });
    }
  });

  const rights = [
    ["repeng/ is the whole library", "repeng/ is the entire library. Everything else is documentation, data, or packaging."],
    ["The notebooks are the documentation", "The README's example elides make_dataset() with an ellipsis and points at the notebooks. The real definition — including how prompts get wrapped — is only in experiments.ipynb."],
    ["The JSON files are shared suffixes", "Not labelled examples. They are neutral continuations reused across both sides of every pair, so that the persona is the only thing that differs."],
  ];
  rights.forEach(([h, d], i) => {
    const y = 1.85 + i * 1.65;
    s.addText(h, { x: 8.35, y, w: 4.35, h: 0.55, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 8.35, y: y + 0.5, w: 4.35, h: 1.1, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 11);
}

// ===================== SLIDE 12: REPOSITORY MAP =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Orientation");
  title(s, "Repository Map: What Each Module Owns");

  const groups = [
    {
      head: "Core algorithm", ic: "brain", color: DEEPBLUE, x: 0.6,
      items: [
        ["repeng/extract.py", "ControlVector, DatasetEntry, ControlVector.train(), read_representations(), batched_get_hiddens(), project_onto_direction(). Everything from “run the pairs” to “one signed unit vector per layer.”"],
        ["repeng/control.py", "ControlModel, ControlModule, BlockControlParams, model_layer_list(). Wraps chosen decoder blocks so their outputs can be modified in flight, and finds those blocks across model families."],
      ],
    },
    {
      head: "Optional & supporting", ic: "package", color: TEAL, x: 6.75,
      items: [
        ["repeng/saes.py", "Sae, SaeLayer, from_eleuther(). Lets training run in a sparse-autoencoder feature basis instead of the raw activation basis, then decode back."],
        ["repeng/tests.py", "Pinned end-to-end expectations on two tiny models, plus per-architecture layer-discovery tests. The fastest way to see intended behaviour."],
        ["notebooks/", "Eight worked examples — emotion, honesty, vector arithmetic, SAEs, 70B models. The de-facto documentation."],
      ],
    },
  ];
  groups.forEach((g) => {
    iconChip(s, g.ic, g.x, 1.72, 0.5, g.color);
    s.addText(g.head, {
      x: g.x + 0.65, y: 1.75, w: 4.6, h: 0.4, fontSize: 15, bold: true, color: INK,
      fontFace: "Cambria", valign: "middle", margin: 0,
    });
    let y = 2.42;
    g.items.forEach(([name, desc]) => {
      const h = desc.length > 170 ? 1.45 : 1.28;
      card(s, g.x, y, 5.9, h, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
      s.addText(name, {
        x: g.x + 0.22, y: y + 0.12, w: 5.5, h: 0.3, fontSize: 11.5, bold: true,
        color: DEEPBLUE, fontFace: "Courier New", margin: 0,
      });
      s.addText(desc, {
        x: g.x + 0.22, y: y + 0.44, w: 5.5, h: h - 0.56, fontSize: 10.5, color: MUTE,
        fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0,
      });
      y += h + 0.14;
    });
  });

  footerBrand(s); addSlideNumber(s, 12);
}

// ===================== SLIDE 13: CORE DATA STRUCTURES =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Core Objects");
  title(s, "Core Types: DatasetEntry, ControlVector, ControlModel", INK, { fontSize: 28 });
  pathTag(s, "repeng/extract.py  ·  repeng/control.py", 8.0, 0.44, 4.7, false);

  const objs = [
    ["DatasetEntry", "extract.py", ["positive: str", "negative: str"],
      "A dataclass with two strings. That is the entire training format — no labels, no scores, no weights."],
    ["ControlVector", "extract.py", ["model_type: str", "directions: dict[int, np.ndarray]"],
      "One numpy array per layer index, plus the model type it was trained on. Supports +, −, unary −, * and / so vectors can be combined arithmetically."],
    ["ControlModel", "control.py", ["model: PreTrainedModel", "layer_ids: list[int]"],
      "Replaces the chosen decoder blocks in place with ControlModule wrappers. Note the docstring's warning: it mutates the model you hand it."],
  ];
  objs.forEach(([name, file, fields, desc], i) => {
    const x = 0.6 + i * 4.05;
    card(s, x, 1.75, 3.8, 3.05, i === 2 ? TINT : CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    s.addText(name, { x: x + 0.22, y: 1.9, w: 3.4, h: 0.35, fontSize: 15, bold: true, color: DEEPBLUE, fontFace: "Courier New", margin: 0 });
    s.addText(file, { x: x + 0.22, y: 2.24, w: 3.4, h: 0.25, fontSize: 9.5, color: MUTE, fontFace: "Courier New", italic: true, margin: 0 });
    fields.forEach((f, k) => {
      s.addText("•  " + f, {
        x: x + 0.22, y: 2.58 + k * 0.32, w: 3.45, h: 0.3, fontSize: 10.5, color: INK,
        fontFace: "Courier New", margin: 0,
      });
    });
    s.addText(desc, {
      x: x + 0.22, y: 3.32 + (fields.length > 1 ? 0.05 : 0), w: 3.4, h: 1.35, fontSize: 11,
      color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0,
    });
  });

  // flow
  const fy = 5.35;
  const flow = ["DatasetEntry[]", "ControlVector", "ControlModel", "generate()"];
  flow.forEach((lab, i) => {
    const x = 0.85 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: fy, w: 2.5, h: 0.7, rectRadius: 0.08,
      fill: { color: i === 3 ? TEAL : MIDNIGHT },
    });
    s.addText(lab, {
      x, y: fy, w: 2.5, h: 0.7, fontSize: 12, color: OFFWHITE, bold: true,
      fontFace: "Courier New", align: "center", valign: "middle", margin: 0,
    });
    if (i < 3) {
      s.addShape(pres.shapes.LINE, {
        x: x + 2.5, y: fy + 0.35, w: 0.6, h: 0,
        line: { color: "5C7080", width: 1.5, endArrowType: "triangle" },
      });
    }
  });
  s.addText("train()", { x: 3.35, y: fy + 0.72, w: 0.9, h: 0.28, fontSize: 10, color: TEAL, fontFace: "Courier New", align: "center", italic: true });
  s.addText("set_control()", { x: 6.15, y: fy + 0.72, w: 1.6, h: 0.28, fontSize: 10, color: TEAL, fontFace: "Courier New", align: "center", italic: true });

  backTag(s, "Background · Slide 3, Contrast Pairs", 0.6, 6.45, 3.7);
  footerBrand(s); addSlideNumber(s, 13);
}

// ===================== SLIDE 14: TRAINING WALKTHROUGH =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Algorithm");
  title(s, "Training a Control Vector, Step by Step");
  pathTag(s, "repeng/extract.py", 10.35, 0.85, 2.35, false);

  const steps = [
    ["1", "Flatten the pairs, in order",
      "read_representations() builds train_strs as [pos, neg, pos, neg, …]. That strict interleaving is an assumption the later maths depends on."],
    ["2", "Take one activation vector per string",
      "batched_get_hiddens() does a forward pass with output_hidden_states=True and keeps only the last non-padding position, found via the attention mask."],
    ["3", "Reduce each pair to what differs",
      "method=\"pca_diff\" (the default) subtracts negative from positive. method=\"pca_center\" instead subtracts each pair's midpoint from both sides, keeping twice as many rows."],
    ["4", "Fit one component per layer",
      "PCA(n_components=1, whiten=False).fit(train), then .components_ squeezed to a single (hidden_dim,) float32 array."],
    ["5", "Fix the sign",
      "project_onto_direction() projects the original hidden states onto the new direction; if positives landed lower than negatives on average, the direction is multiplied by −1."],
  ];
  steps.forEach(([n, h, d], i) => {
    const y = 1.72 + i * 0.9;
    s.addShape(pres.shapes.OVAL, { x: 0.62, y: y + 0.04, w: 0.44, h: 0.44, fill: { color: DEEPBLUE } });
    s.addText(n, { x: 0.62, y: y + 0.04, w: 0.44, h: 0.44, fontSize: 14, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(h, { x: 1.22, y: y - 0.02, w: 3.4, h: 0.58, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: 4.7, y: y - 0.02, w: 8.0, h: 0.86, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.16, margin: 0 });
  });

  card(s, 0.6, 6.28, 8.0, 0.68, TINT, { shadow: false, line: { color: "D8D2C0", width: 1 } });
  s.addText(
    [
      { text: "Worth noticing:  ", options: { bold: true, color: "8A4B2A" } },
      { text: "train() gives you a direction for ", options: { color: INK } },
      { text: "every", options: { bold: true, color: INK } },
      { text: " layer — not only the wrapped ones. One vector can be re-aimed at any depth with no retraining.", options: { color: INK } },
    ],
    { x: 0.82, y: 6.34, w: 7.6, h: 0.56, fontSize: 10.5, fontFace: "Calibri", lineSpacingMultiple: 1.12, valign: "middle" }
  );

  backTag(s, "Background · Slide 4, One-Component PCA", 8.75, 6.45, 3.95);
  footerBrand(s); addSlideNumber(s, 14);
}

// ===================== SLIDE 15: THE CONTROL HOOK =====================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Algorithm", "8FD4E8");
  title(s, "ControlModule.forward(): What Runs at Each Wrapped Layer", OFFWHITE, { fontSize: 28 });
  pathTag(s, "repeng/control.py · ControlModule.forward()", 8.05, 0.44, 4.65, true);

  const steps = [
    ["Run the wrapped block", "output = self.block(*args, **kwargs) — the original decoder layer runs untouched first."],
    ["Return unchanged if no control is set", "If no control tensor is set, the output is returned unchanged. A wrapped model with no vector behaves exactly like the original."],
    ["Reshape to broadcast", "A 1-D direction is reshaped to (1, 1, hidden) so it lands on every token position at once."],
    ["Mask the padding", "When position_ids are available, a mask zeroes the control over left-padding, so padded slots aren't steered. The source notes this path is only tested for left padding."],
    ["Apply the operator", "modified = operator(modified, control * mask) — addition by default, but any callable of two tensors is accepted."],
    ["Optionally restore the norm", "With normalize=True the result is rescaled to the magnitude it had before the addition."],
  ];
  steps.forEach(([h, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.2, y = 1.78 + row * 1.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 5.9, h: 1.42, rectRadius: 0.08, fill: { color: "12314F" },
    });
    s.addShape(pres.shapes.OVAL, { x: x + 0.22, y: y + 0.2, w: 0.36, h: 0.36, fill: { color: TEAL } });
    s.addText(String(i + 1), { x: x + 0.22, y: y + 0.2, w: 0.36, h: 0.36, fontSize: 11, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(h, { x: x + 0.7, y: y + 0.17, w: 5.0, h: 0.34, fontSize: 12.5, bold: true, color: OFFWHITE, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: x + 0.7, y: y + 0.52, w: 5.0, h: 0.82, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.15, margin: 0 });
  });

  backTag(s, "Background · Slide 5, Steering by Addition", 0.6, 6.55, 4.1, true);
  s.addText("unwrap() puts the original blocks back, and reset() clears the control without unwrapping.", {
    x: 5.0, y: 6.55, w: 7.7, h: 0.34, fontSize: 11, color: "9FC3D9", fontFace: "Calibri", italic: true, valign: "middle",
  });

  footerBrand(s, true); addSlideNumber(s, 15);
}

// ===================== SLIDE 16: CONFIGURATION =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Controls");
  title(s, "Configuration Parameters and What Each Changes", INK, { fontSize: 30 });

  const dials = [
    ["gear", "method", "\"pca_diff\" | \"pca_center\"", "Which matrix PCA sees. pca_diff fits on pair differences; pca_center fits on both sides after removing each pair's midpoint. They are not small variations of each other — on the same data they can point in substantially different directions.", DEEPBLUE],
    ["target", "coeff", "float, sign matters", "Multiplied into the direction before it is added. Negative flips the concept; magnitude sets intensity. Push it too far and fluency collapses before the behaviour does.", DEEPBLUE],
    ["layers", "layer_ids", "list[int] on ControlModel", "Which decoder blocks are wrapped at all. Negative indices count from the end. This is a second strength dial hiding as a structural choice.", TEAL],
    ["scale", "normalize", "bool, default False", "Rescales the steered activation back to its pre-control magnitude, so the direction changes but the length does not.", DEEPBLUE],
    ["math", "operator", "Callable[[Tensor, Tensor], Tensor]", "How the control is combined with the block output. Defaults to addition; swap it for projection, clamping, or anything else two-tensor.", DEEPBLUE],
    ["cpu", "batch_size", "int, default 32", "Forward-pass batch during training only. Lower it when memory is tight; it does not affect the resulting vector.", DEEPBLUE],
  ];
  dials.forEach(([ic, name, sig, desc, col], i) => {
    const c = i % 2, r = Math.floor(i / 2);
    const x = 0.6 + c * 6.2, y = 1.72 + r * 1.72;
    card(s, x, y, 5.9, 1.55, i === 2 ? TINT : CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    iconChip(s, ic, x + 0.22, y + 0.22, 0.44, col);
    s.addText(name, { x: x + 0.78, y: y + 0.16, w: 2.0, h: 0.32, fontSize: 13.5, bold: true, color: DEEPBLUE, fontFace: "Courier New", margin: 0 });
    s.addText(sig, { x: x + 2.55, y: y + 0.19, w: 3.2, h: 0.28, fontSize: 9.5, color: MUTE, fontFace: "Courier New", align: "right", margin: 0 });
    s.addText(desc, { x: x + 0.22, y: y + 0.56, w: 5.5, h: 0.92, fontSize: 10.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.15, margin: 0 });
  });

  s.addText("compute_hiddens and transform_hiddens (added in 0.5.0) let you replace or post-process the activation matrix entirely — the extension point the SAE path is built on.", {
    x: 0.6, y: 6.74, w: 12.1, h: 0.3, fontSize: 10.5, color: MUTE, fontFace: "Calibri", italic: true, valign: "middle", margin: 0,
  });

  footerBrand(s); addSlideNumber(s, 16);
}

// ===================== SLIDE 17: LAYER TARGETING =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Controls · Deep Dive");
  title(s, "Layer Targeting: Absolute Indices Don't Transfer", INK, { fontSize: 30 });

  card(s, 0.6, 1.72, 5.9, 1.5, TINT, { shadow: false, line: { color: "D8D2C0", width: 1 } });
  s.addText("list(range(-5, -18, -1))", { x: 0.85, y: 1.84, w: 5.4, h: 0.32, fontSize: 14, bold: true, color: "8A4B2A", fontFace: "Courier New", margin: 0 });
  s.addText([
    { text: "on Mistral-7B (32 layers)", options: { bold: true } },
    { text: "  →  layers 15–27, i.e. 47%–84% of depth.\n" },
    { text: "on Qwen2.5-0.5B (24 layers)", options: { bold: true } },
    { text: "  →  layers 7–19, i.e. 29%–79%.  The same literal expression aims somewhere else." },
  ], { x: 0.85, y: 2.2, w: 5.4, h: 0.9, fontSize: 10.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });

  s.addText("Negative indices resolve against the model's own layer count, so an absolute range silently retargets when the model changes size. Matching the depth fraction instead gives range(-4, -14, -1) here — but treat that as a starting point, not an answer. The band is a hyperparameter: sweep it per model, the way the table does.", {
    x: 6.75, y: 1.75, w: 5.95, h: 1.45, fontSize: 11.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.22,
  });

  s.addText("Measured on Qwen2.5-0.5B-Instruct — one formal/casual vector, held constant, applied to different bands at ±1.5:", {
    x: 0.6, y: 3.35, w: 12.1, h: 0.32, fontSize: 11.5, bold: true, color: DEEPBLUE, fontFace: "Calibri",
  });

  const rows = [
    ["depth-matched", "11–20", "cleanest: both directions fluent and still answering the question", "1C7293"],
    ["late only", "16–23", "works; the shift reads as genre rather than register", "3A7D5A"],
    ["README range, copied", "7–19", "steers, but the formal side derails into meta-commentary", "8A6D3B"],
    ["early only", "1–7", "erratic — barely moves one way, refuses outright the other", "8A6D3B"],
    ["all layers", "1–23", "over-steered: both ends abandon the task before saturating", "8A4B2A"],
    ["single layer", "12", "weakest of all — barely separable from baseline", "5C7080"],
  ];
  const hy = 3.78;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: hy, w: 12.1, h: 0.34, fill: { color: MIDNIGHT } });
  [["band", 0.75, 3.0], ["layers", 3.8, 1.2], ["what actually happens", 5.1, 7.4]].forEach(([t, x, w]) => {
    s.addText(t.toUpperCase(), { x, y: hy, w, h: 0.34, fontSize: 9, bold: true, color: "BFE0EE", fontFace: "Calibri", charSpacing: 1, valign: "middle", margin: 0 });
  });
  rows.forEach(([band, lay, note, col], i) => {
    const y = hy + 0.34 + i * 0.34;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.34, fill: { color: i % 2 ? "FFFFFF" : CARD } });
    s.addText(band, { x: 0.75, y, w: 3.0, h: 0.34, fontSize: 10.5, bold: true, color: col, fontFace: "Calibri", valign: "middle", margin: 0 });
    s.addText(lay, { x: 3.8, y, w: 1.2, h: 0.34, fontSize: 10.5, color: INK, fontFace: "Courier New", valign: "middle", margin: 0 });
    s.addText(note, { x: 5.1, y, w: 7.4, h: 0.34, fontSize: 10.5, color: MUTE, fontFace: "Calibri", valign: "middle", margin: 0 });
  });

  backTag(s, "Background · Slide 7, Depth as a Band", 0.6, 6.6, 3.85);
  s.addText("More layers is not more control — past a point it is just more damage. Same ordering held on a second, unrelated concept.", {
    x: 4.6, y: 6.6, w: 8.1, h: 0.34, fontSize: 10.5, color: DEEPBLUE, fontFace: "Calibri", bold: true, valign: "middle", margin: 0,
  });

  footerBrand(s); addSlideNumber(s, 17);
}

// ===================== SLIDE 18: DATASET CONSTRUCTION / TOKENIZATION =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Practice · The Sharpest Edge");
  title(s, "Wrapping Pairs in the Model's Own Template", INK, { w: 8.6, fontSize: 29 });

  s.addText("The notebooks' make_dataset() wraps every pair in the model's turn markers and puts the shared ending in the assistant position — so each training string is a partial reply, not a bare sentence. Those markers are Mistral's. Reuse them on a model from another family and nothing errors.", {
    x: 0.6, y: 1.7, w: 12.1, h: 0.85, fontSize: 13, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.22,
  });

  const variants = [
    ["Mistral markers on a Qwen model", "[INST] Write in an extremely formal style. [/INST] Hmm", "8A4B2A",
      "Even with no vector applied, the reply comes back studded with [INSTRUCTION] and [/INST] — the model is reading the markers as content, because to it they are."],
    ["Correct turn markers, hand-built", "<|im_start|>user\\n…<|im_end|>\\n<|im_start|>assistant\\nHmm", "3A7D5A",
      "Clean steering in both directions. This is the shape you want."],
    ["Via the tokenizer's own template", "… plus an auto-inserted default system turn", "1C7293",
      "The portable choice, and what the notebook uses — but it silently adds text you never wrote, so training and inference strings must both go through it."],
  ];
  variants.forEach(([h, code, col, note], i) => {
    const y = 2.65 + i * 1.2;
    card(s, 0.6, y, 12.1, 1.08, i === 1 ? TINT : CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    s.addText(h, { x: 0.85, y: y + 0.08, w: 4.3, h: 0.3, fontSize: 12, bold: true, color: col, fontFace: "Calibri", margin: 0 });
    s.addText(code, { x: 0.85, y: y + 0.42, w: 4.6, h: 0.55, fontSize: 9.5, color: INK, fontFace: "Courier New", lineSpacingMultiple: 1.15, margin: 0 });
    s.addText(note, { x: 5.75, y: y + 0.12, w: 6.7, h: 0.88, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2, valign: "middle", margin: 0 });
  });

  card(s, 0.6, 6.3, 12.1, 0.68, MIDNIGHT, { shadow: false });
  s.addText([
    { text: "Cosine between the resulting vectors (Qwen2.5-0.5B, mid-layer):  ", options: { color: "9FC3D9" } },
    { text: "wrong markers vs correct = 0.70", options: { bold: true, color: "FFC9A8" } },
    { text: "   ·   ", options: { color: "5C7080" } },
    { text: "auto system turn vs none = 0.95", options: { bold: true, color: "8FD4E8" } },
    { text: "   — measured on two different concept pairs; both say the same thing.", options: { color: "9FC3D9" } },
  ], { x: 0.85, y: 6.36, w: 11.6, h: 0.56, fontSize: 10.5, fontFace: "Calibri", valign: "middle", margin: 0 });

  backTag(s, "Background · Slide 6, Chat Templates", 8.9, 0.95, 3.8);
  footerBrand(s); addSlideNumber(s, 18);
}

// ===================== SLIDE 19: ARITHMETIC & EXPORT =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Beyond One Vector");
  title(s, "Vector Arithmetic, GGUF Export, and the SAE Path", INK, { fontSize: 29 });

  card(s, 0.6, 1.75, 5.9, 2.6, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
  iconChip(s, "plus", 0.85, 1.98, 0.48, DEEPBLUE);
  s.addText("Arithmetic on directions", { x: 1.48, y: 2.0, w: 4.7, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText([
    { text: "formal + lazy", options: { fontFace: "Courier New", bold: true, color: DEEPBLUE } },
    { text: "  blends two behaviours;  " },
    { text: "-formal", options: { fontFace: "Courier New", bold: true, color: DEEPBLUE } },
    { text: "  inverts one;  " },
    { text: "v / 2", options: { fontFace: "Courier New", bold: true, color: DEEPBLUE } },
    { text: "  halves it. Implemented as ordinary Python dunder methods that combine the per-layer arrays, with a warning if the two vectors came from different model types.\n\nAdding a vector to itself and halving returns something equal to the original — the operations are exactly as literal as they look." },
  ], { x: 0.85, y: 2.6, w: 5.4, h: 1.6, fontSize: 11, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });

  card(s, 6.75, 1.75, 5.95, 2.6, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
  iconChip(s, "export", 7.0, 1.98, 0.48, TEAL);
  s.addText("Export to GGUF", { x: 7.63, y: 2.0, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText([
    { text: "export_gguf(path)", options: { fontFace: "Courier New", bold: true, color: DEEPBLUE } },
    { text: "  writes a file with architecture  " },
    { text: "controlvector", options: { fontFace: "Courier New" } },
    { text: ", a  " },
    { text: "model_hint", options: { fontFace: "Courier New" } },
    { text: "  string, and one tensor per layer named  " },
    { text: "direction.N", options: { fontFace: "Courier New" } },
    { text: ".  " },
    { text: "import_gguf()", options: { fontFace: "Courier New", bold: true, color: DEEPBLUE } },
    { text: "  reads it back and warns if the architecture field doesn't match.\n\nThis is how a vector trained here gets used inside a quantised llama.cpp runtime." },
  ], { x: 7.0, y: 2.6, w: 5.45, h: 1.6, fontSize: 11, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });

  card(s, 0.6, 4.6, 12.1, 1.75, MIDNIGHT, { shadow: false });
  iconChip(s, "brain", 0.85, 4.85, 0.5, TEAL);
  s.addText("The SAE path", { x: 1.5, y: 4.87, w: 4.0, h: 0.4, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText([
    { text: "train_with_sae()", options: { fontFace: "Courier New", bold: true, color: "8FD4E8" } },
    { text: "  runs the same pipeline in a sparse-autoencoder feature basis: activations are encoded to features, PCA runs there, and the result is decoded back to a usable direction — or kept as features for inspection. It defaults to ", options: { color: "9FC3D9" } },
    { text: "pca_center", options: { fontFace: "Courier New", color: "8FD4E8" } },
    { text: " where the plain trainer defaults to ", options: { color: "9FC3D9" } },
    { text: "pca_diff", options: { fontFace: "Courier New", color: "8FD4E8" } },
    { text: ". Loading via from_eleuther() also has an index offset to respect: this library counts the embedding as layer 0, the SAE library does not.", options: { color: "9FC3D9" } },
  ], { x: 1.5, y: 5.3, w: 11.0, h: 0.95, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });

  s.addText("The library's own docstring calls this path a work in progress — treat it as an experiment, not a default.", {
    x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 11, color: MUTE, fontFace: "Calibri", italic: true,
  });

  footerBrand(s); addSlideNumber(s, 19);
}

// ===================== SLIDE 20: RUNNING IT =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Setup");
  title(s, "Installation and Runtime Requirements");

  card(s, 0.6, 1.72, 5.9, 2.35, TINT, { shadow: false, line: { color: "D8D2C0", width: 1 } });
  iconChip(s, "warn", 0.85, 1.94, 0.48, "8A4B2A");
  s.addText("The PyPI release does not import", { x: 1.48, y: 1.96, w: 4.8, h: 0.42, fontSize: 13.5, bold: true, color: "8A4B2A", fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText([
    { text: "pip install repeng", options: { fontFace: "Courier New", bold: true } },
    { text: "  currently resolves to  " },
    { text: "0.4.0", options: { fontFace: "Courier New", bold: true } },
    { text: "  (Dec 2024), which fails at import time on NumPy 2 with " },
    { text: "AttributeError: `np.float_` was removed", options: { fontFace: "Courier New" } },
    { text: ". Every modern environment ships NumPy 2, so the published package does not import at all. Install from the repository, or from a wheel built from it." },
  ], { x: 0.85, y: 2.5, w: 5.4, h: 1.5, fontSize: 10.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2, margin: 0 });

  card(s, 6.75, 1.72, 5.95, 2.35, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
  iconChip(s, "package", 7.0, 1.94, 0.48, DEEPBLUE);
  s.addText("What 0.5.0 adds that 0.4.0 lacks", { x: 7.63, y: 1.96, w: 4.9, h: 0.42, fontSize: 13.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText([
    { text: "a layer-list search that handles Llama, Mistral, Gemma, Qwen and GPT-2, with a repeng_layers override for anything else", options: { bullet: true, breakLine: true } },
    { text: "attribute forwarding on the wrapper, so wrapped blocks still answer questions the runtime asks them", options: { bullet: true, breakLine: true } },
    { text: "the compute_hiddens / transform_hiddens hooks", options: { bullet: true, breakLine: true } },
    { text: "the NumPy 2 fix", options: { bullet: true } },
  ], { x: 7.0, y: 2.5, w: 5.45, h: 1.5, fontSize: 10.5, color: INK, fontFace: "Calibri", paraSpaceAfter: 4, margin: 0 });

  const envs = [
    ["cpu", "A laptop is enough for a small model", "A 0.5B instruct model trains a vector on CPU in about a minute at a few hundred pairs, and generates fast enough to iterate. No GPU, no quota."],
    ["cloud", "Free hosted GPUs make 7B comfortable", "A hosted notebook with a free accelerator tier covers the README's own Mistral-7B example. Offline wheel installs work where outbound network is disabled."],
    ["bug", "Version drift is the real hazard", "The library targets a moving HuggingFace API. One upstream test already fails against the current transformers release — a stale assertion rather than a broken feature, but a warning shot."],
  ];
  envs.forEach(([ic, h, d], i) => {
    const x = 0.6 + i * 4.05;
    card(s, x, 4.3, 3.8, 2.35, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
    iconChip(s, ic, x + 0.25, 4.52, 0.46, i === 2 ? "8A4B2A" : TEAL);
    s.addText(h, { x: x + 0.25, y: 5.06, w: 3.3, h: 0.55, fontSize: 12, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: x + 0.25, y: 5.62, w: 3.3, h: 0.95, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 20);
}


// ===================== SLIDE 21: LIMITATIONS =====================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Honest Assessment", "8FD4E8");
  title(s, "Known Limitations and Open Bugs", OFFWHITE);

  const lims = [
    ["Training is not reproducible", "scikit-learn's PCA picks a randomised solver by default at these matrix shapes, and no seed is set. Two runs on identical data give vectors that are not bit-identical. On a strong concept the direction still lands in the same place; the issue reporter observed real divergence on weak ones. Open issue #78."],
    ["pca_diff can miss the concept entirely", "If one side of every pair is the same string, the mean difference — where the concept sits — is exactly what PCA removes before it starts. The reporter measured near-orthogonality to the difference-of-means direction. Open issue #77."],
    ["The published package is stale and broken", "PyPI is a full minor version behind and doesn't import on NumPy 2. Open issue #76."],
    ["MoE models are unsupported", "Stated plainly in the README: “Vector training currently does not work with MoE models (such as Mixtral).”"],
    ["It rides a moving API", "Model internals are accessed by attribute path and module-name suffix. New architectures need the override; upstream renames break things quietly."],
    ["Strength has a narrow usable band", "The gap between “no visible effect” and “fluency collapses” is small, model-specific, and has to be found empirically for every vector."],
  ];
  lims.forEach(([h, d], i) => {
    const c = i % 2, r = Math.floor(i / 2);
    const x = 0.6 + c * 6.2, y = 1.72 + r * 1.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 1.55, rectRadius: 0.08, fill: { color: "12314F" } });
    s.addText(h, { x: x + 0.25, y: y + 0.13, w: 5.4, h: 0.34, fontSize: 12.5, bold: true, color: "FFC9A8", fontFace: "Calibri", margin: 0 });
    s.addText(d, { x: x + 0.25, y: y + 0.48, w: 5.4, h: 0.98, fontSize: 10, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.15, margin: 0 });
  });

  s.addText("Issues #77 and #78 were opened in July 2026 and are still open. Both are worth reading in full — they are unusually well-instrumented bug reports.", {
    x: 0.6, y: 6.74, w: 12.1, h: 0.3, fontSize: 10.5, color: "7FA8C0", fontFace: "Calibri", italic: true, valign: "middle", margin: 0,
  });

  footerBrand(s, true); addSlideNumber(s, 21);
}

// ===================== SLIDE 22: CLOSING =====================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Wrap-Up");
  title(s, "Resources, Next Steps, and Discussion", INK, { fontSize: 30 });

  card(s, 0.6, 1.75, 5.9, 2.45, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
  s.addText("Resources", { x: 0.85, y: 1.9, w: 5.4, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
  const links = [
    ["github.com/vgel/repeng", "the library, the notebooks, the issues"],
    ["vgel.me/posts/representation-engineering", "the author's walkthrough of the technique"],
    ["github.com/andyzoujm/representation-engineering", "the prior work this derives from"],
    ["notebooks/experiments.ipynb", "start here — the canonical worked example"],
  ];
  links.forEach(([u, d], i) => {
    const y = 2.35 + i * 0.47;
    s.addText(u, { x: 0.85, y, w: 5.4, h: 0.24, fontSize: 10.5, color: DEEPBLUE, bold: true, fontFace: "Courier New", margin: 0 });
    s.addText(d, { x: 0.85, y: y + 0.21, w: 5.4, h: 0.24, fontSize: 9.5, color: MUTE, fontFace: "Calibri", italic: true, margin: 0 });
  });

  card(s, 6.75, 1.75, 5.95, 2.45, MIDNIGHT, { shadow: false });
  iconChip(s, "chat", 7.0, 1.98, 0.5, TEAL);
  s.addText("For discussion", { x: 7.65, y: 2.0, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText("A control vector is trained from prompts describing a persona, yet it changes behaviour on inputs that have nothing to do with that persona. So what has actually been isolated — a representation of the concept, or a representation of “text where someone is acting this way”? What evidence would let you tell those apart?", {
    x: 7.0, y: 2.62, w: 5.45, h: 1.45, fontSize: 11.5, color: "BFE0EE", fontFace: "Calibri", lineSpacingMultiple: 1.25, margin: 0,
  });

  card(s, 0.6, 4.45, 12.1, 1.85, CARD, { shadow: false, line: { color: "DCE7EC", width: 1 } });
  s.addText("What this lesson established", { x: 0.85, y: 4.6, w: 5.6, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
  s.addText([
    { text: "Next:  ", options: { bold: true, color: DEEPBLUE } },
    { text: "quiz.py --mode post", options: { fontFace: "Courier New", bold: true, color: INK } },
    { text: "  (the same check you took before)   ·   ", options: { color: MUTE } },
    { text: "repeng_assignment.md", options: { fontFace: "Courier New", bold: true, color: INK } },
    { text: "  (8 exercises)   ·   ", options: { color: MUTE } },
    { text: "repeng_kaggle.ipynb", options: { fontFace: "Courier New", bold: true, color: INK } },
    { text: "  (runs them, CPU is enough)", options: { color: MUTE } },
  ], { x: 0.85, y: 6.42, w: 11.6, h: 0.34, fontSize: 10.5, fontFace: "Calibri", valign: "middle", margin: 0 });
  const carry = [
    ["target", "A direction is not a behaviour", "You extracted the axis along which two sets of prompts differ. Whether that axis is the concept you named is a separate empirical question."],
    ["layers", "Where you intervene is as important as how hard", "Band position and band width change the result at least as much as the coefficient does."],
    ["bug", "Read the issues before trusting the defaults", "Two of this library's default settings have open, well-evidenced reports against them."],
  ];
  carry.forEach(([ic, h, d], i) => {
    const x = 0.85 + i * 4.0;
    iconChip(s, ic, x, 5.0, 0.42, DEEPBLUE);
    s.addText(h, { x: x + 0.54, y: 4.98, w: 3.3, h: 0.46, fontSize: 11, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    s.addText(d, { x, y: 5.5, w: 3.75, h: 0.72, fontSize: 9.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.12, margin: 0 });
  });

  footerBrand(s); addSlideNumber(s, 22);
}

pres.writeFile({ fileName: path.join(__dirname, "Repeng_Lecture.pptx") }).then((f) => {
  console.log("wrote", f);
});
