const pptxgen = require("pptxgenjs");

// ---------- palette (shared series identity) ----------
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
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "AI Seminar";
pres.title = "Prime Intellect: RL Environments, Hosted Training, and the Compute Underneath";

const ICON = (name) => `${__dirname}/icons/${name}.png`;

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
    x: 0.6, y: 0.78, w: opts.w || 11.8, h: opts.h || 0.9,
    fontSize: opts.fontSize || 30, color, bold: true, fontFace: "Cambria",
    margin: 0,
  });
}

// On a COLORED circle always pass a *_white icon. On a white/light circle pass *_teal.
function iconChip(slide, iconVariant, x, y, size, bg) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: bg } });
  const pad = size * 0.26;
  slide.addImage({ path: ICON(iconVariant), x: x + pad, y: y + pad, w: size - 2 * pad, h: size - 2 * pad });
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

// back-reference pill. U+2190 only - U+21A9 renders as tofu through this pipeline.
function backTag(slide, text, x, y, w, dark) {
  const h = 0.34;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.17,
    fill: { color: dark ? "2A3F63" : "E9F1E6" },
    line: { color: dark ? "5A8FB0" : "8FB88F", width: 0.75 },
  });
  slide.addText("←  " + text, {
    x: x + 0.14, y, w: w - 0.28, h, fontSize: 10, italic: true,
    color: dark ? "BFDCE8" : "3D6B3D", fontFace: "Calibri", valign: "middle", margin: 0,
  });
}

function footerBrand(slide, dark) {
  slide.addText("PRIME INTELLECT  ·  AI SEMINAR, LECTURE 4", {
    x: 0.6, y: 7.05, w: 7, h: 0.3,
    fontSize: 9, color: dark ? "8FA8C2" : MUTE, fontFace: "Calibri", charSpacing: 1,
  });
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: fill || CARD },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
}

// ================= SLIDE 1: TITLE =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: 10.6, y: -1.4, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 40 } });
  s.addShape(pres.shapes.OVAL, { x: 12.2, y: 4.6, w: 3.2, h: 3.2, fill: { color: DEEPBLUE, transparency: 55 } });

  // motif: a closed training loop, top right
  const cx = 11.55, cy = 2.15, r = 0.95;
  [0, 1, 2].forEach((i) => {
    const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    s.addShape(pres.shapes.OVAL, {
      x: cx + r * Math.cos(a) - 0.26, y: cy + r * Math.sin(a) - 0.26, w: 0.52, h: 0.52,
      fill: { color: i === 0 ? TEAL : "1E4A6E" }, line: { color: "3F6E8C", width: 1 },
    });
  });
  s.addShape(pres.shapes.OVAL, {
    x: cx - r - 0.1, y: cy - r - 0.1, w: 2 * (r + 0.1), h: 2 * (r + 0.1),
    fill: { type: "none" }, line: { color: "3F6E8C", width: 1.25 },
  });

  s.addText("AI TOOLING SEMINAR  ·  LECTURE 4", {
    x: 0.8, y: 1.5, w: 8, h: 0.4, fontSize: 14, color: "7FB8D6", bold: true, charSpacing: 3, fontFace: "Calibri",
  });
  s.addText("Prime Intellect", {
    x: 0.75, y: 1.98, w: 10, h: 1.2, fontSize: 58, color: OFFWHITE, bold: true, fontFace: "Cambria", margin: 0,
  });
  s.addText("RL Environments, Hosted Training, and the Compute Underneath", {
    x: 0.8, y: 3.08, w: 9.4, h: 0.7, fontSize: 19, color: ICE, fontFace: "Calibri",
  });
  s.addShape(pres.shapes.LINE, { x: 0.8, y: 3.92, w: 3.2, h: 0, line: { color: TEAL, width: 2 } });
  s.addText(
    [
      { text: "How we'll get there: ", options: { bold: true, color: "BFE0EE" } },
      { text: "first the ideas a platform like this rests on — how reinforcement learning is used after pretraining, where a reward actually comes from, and why rewards are so easy to game. Then the platform itself: the library you write environments in, the loop that trains on them, and the one command-line tool that drives all of it.", options: { color: "9FC3D9" } },
    ],
    { x: 0.8, y: 4.18, w: 8.9, h: 1.5, fontSize: 13.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );
  s.addText("A shift in the course: the first three lectures opened up models. This one opens up the machinery that trains them.", {
    x: 0.8, y: 6.6, w: 10, h: 0.4, fontSize: 11.5, italic: true, color: "6FA0BE", fontFace: "Calibri",
  });
}

// ================= SLIDE 2: PREVIEW / TEASER =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Preview");
  title(s, "What We're Building Toward");

  card(s, 0.6, 1.55, 7.9, 1.75);
  s.addText(
    [
      { text: "Prime Intellect ", options: { bold: true, color: INK } },
      { text: "is two things stacked together: a marketplace that rents GPUs, and a managed research platform called ", options: { color: MUTE } },
      { text: "Lab ", options: { bold: true, color: INK } },
      { text: "that runs reinforcement-learning training on top of them. You write a small Python package describing a task and how to score it; the platform handles every GPU, every rollout, and every weight update.", options: { color: MUTE } },
    ],
    { x: 0.95, y: 1.8, w: 7.2, h: 1.3, fontSize: 13.5, fontFace: "Calibri", lineSpacingMultiple: 1.3 }
  );

  // small illustrative pipeline
  card(s, 8.8, 1.55, 3.9, 1.75, "16385A");
  const stepsY = 1.82;
  [["write", TEAL], ["score", DEEPBLUE], ["train", MIDNIGHT]].forEach(([lbl, c], i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 9.05 + i * 1.2, y: stepsY, w: 1.05, h: 0.55, rectRadius: 0.06,
      fill: { color: c }, line: { color: "3F6E8C", width: 0.75 },
    });
    s.addText(lbl, { x: 9.05 + i * 1.2, y: stepsY, w: 1.05, h: 0.55, fontSize: 11, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    if (i < 2) s.addText("→", { x: 10.1 + i * 1.2, y: stepsY, w: 0.15, h: 0.55, fontSize: 13, color: "8FD4E8", align: "center", valign: "middle", fontFace: "Calibri" });
  });
  s.addText("Everything in this lecture is a variation on this loop — and it runs in a circle, not a line.", {
    x: 9.05, y: 2.5, w: 3.4, h: 0.7, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.15,
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 3.6, w: 12.1, h: 1.15, rectRadius: 0.08, fill: { color: "FFF6E5" }, line: { color: "E0C27A", width: 1 },
  });
  iconChip(s, "lightbulb_teal", 0.9, 3.83, 0.65, OFFWHITE);
  s.addText(
    [
      { text: "The next five slides will not mention Prime Intellect at all. ", options: { bold: true, color: "7A5A10" } },
      { text: "They build up the ideas the platform assumes you already have. We'll come back to the paragraph above once they're in place, and it should read very differently the second time.", options: { color: "8A6A20" } },
    ],
    { x: 1.75, y: 3.78, w: 10.6, h: 0.85, fontSize: 12.5, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  s.addText("Five ideas, in order:", {
    x: 0.6, y: 5.0, w: 6, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri",
  });
  const previews = [
    ["arrows_rotate_white", "Learning from outcomes", "why a model can improve without labelled answers"],
    ["list_check_white", "Where reward comes from", "the three ways a machine scores an attempt"],
    ["bug_white", "Gaming the reward", "why scoring is the hard part, not the training"],
    ["layer_group_white", "Cheap adaptation", "changing behaviour without changing every weight"],
    ["scale_balanced_white", "Tests and training data", "why a hard benchmark and a good task are the same object"],
  ];
  const pw = 2.35, pgap = 0.11;
  previews.forEach(([icon, h, b], i) => {
    const x = 0.6 + i * (pw + pgap);
    card(s, x, 5.45, pw, 1.35);
    iconChip(s, icon, x + pw / 2 - 0.26, 5.62, 0.52, i % 2 === 0 ? DEEPBLUE : TEAL);
    s.addText(h, { x: x + 0.12, y: 6.18, w: pw - 0.24, h: 0.3, fontSize: 10.5, bold: true, color: INK, align: "center", fontFace: "Calibri" });
    s.addText(b, { x: x + 0.12, y: 6.44, w: pw - 0.24, h: 0.33, fontSize: 9, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.05 });
  });

  footerBrand(s); addSlideNumber(s, 2);
}

// ================= SLIDE 3: BACKGROUND 1 =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 1 of 5");
  title(s, "Learning From Outcomes, Not Answers");

  s.addText(
    "Supervised training needs a correct answer for every example. But for most interesting tasks nobody has one — there are many good solutions, or the answer only exists once you've tried. Reinforcement learning replaces the answer key with a score, and lets the model discover what earns it.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.75, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const steps = [
    ["dice_white", "Sample", "The model attempts the task — possibly over many turns, using tools. One complete attempt is called a rollout.", DEEPBLUE],
    ["bullseye_white", "Score", "A scoring function turns the finished attempt into a number. This is the only feedback the model gets.", TEAL],
    ["scale_balanced_white", "Compare", "Several rollouts of the same task are scored together. What matters is which attempts beat the group average — not the raw score.", MIDNIGHT],
    ["arrows_rotate_white", "Update", "Weights shift toward whatever produced above-average attempts, away from below. Then sample again.", DEEPBLUE],
  ];
  const cw = 2.93, gap = 0.16, sy = 2.5, chh = 2.6;
  steps.forEach(([icon, h, b, color], i) => {
    const x = 0.6 + i * (cw + gap);
    card(s, x, sy, cw, chh);
    iconChip(s, icon, x + cw / 2 - 0.33, sy + 0.28, 0.66, color);
    s.addText(`${i + 1}. ${h}`, { x: x + 0.2, y: sy + 1.05, w: cw - 0.4, h: 0.4, fontSize: 14, bold: true, color: INK, align: "center", fontFace: "Calibri" });
    s.addText(b, { x: x + 0.22, y: sy + 1.5, w: cw - 0.44, h: chh - 1.65, fontSize: 10.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.35, w: 12.1, h: 1.35, rectRadius: 0.08, fill: { color: "EEF4F7" }, line: { color: "AEC7D6", width: 1 },
  });
  s.addText("Why compare instead of just rewarding high scores?", {
    x: 0.9, y: 5.5, w: 11.5, h: 0.32, fontSize: 12.5, bold: true, color: DEEPBLUE, fontFace: "Calibri",
  });
  s.addText(
    "Because a raw score has no meaning on its own — 0.4 is excellent on a hard task and terrible on an easy one. Scoring a batch of attempts at the same task and measuring each against that batch's own average sidesteps the problem entirely: no separate model is needed to predict what a good score would have been. This family of methods is called group-relative optimisation, and GRPO is the variant most RL post-training runs use today.",
    { x: 0.9, y: 5.82, w: 11.5, h: 0.8, fontSize: 11.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 3);
}

// ================= SLIDE 4: BACKGROUND 2 =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 2 of 5");
  title(s, "Where the Reward Actually Comes From");

  s.addText(
    "“Score the attempt” hides all the difficulty. Something has to decide, automatically and thousands of times an hour, whether an attempt was good. There are only three real options, and they trade off sharply.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const rows = [
    ["circle_check_teal", "Match a known answer", "Cheap, fast, unambiguous", "Compare against ground truth after normalising. Works when the answer is short and canonical — a number, a label, a date. Fails the moment there are many valid phrasings."],
    ["terminal_teal", "Run it and see", "Objective, but needs isolation", "For code, the honest test is execution: run the program against a test suite and read the exit code. Requires somewhere safe to run untrusted, model-written code — a disposable container per attempt."],
    ["gavel_teal", "Ask another model", "Handles open-ended work, but noisy", "A separate model judges the attempt against written criteria. The only option for essays, analysis, or design — but the judge has its own biases, and its noise becomes your training signal."],
  ];
  let ry = 2.3;
  const rh = 1.18;
  rows.forEach(([icon, h, tag, b]) => {
    card(s, 0.6, ry, 12.1, rh);
    iconChip(s, icon, 0.88, ry + (rh - 0.58) / 2, 0.58, OFFWHITE);
    s.addText(h, { x: 1.62, y: ry + 0.14, w: 2.85, h: 0.36, fontSize: 13.5, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
    s.addText(tag, { x: 1.62, y: ry + 0.52, w: 2.85, h: 0.5, fontSize: 10, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.1 });
    s.addText(b, { x: 4.65, y: ry + 0.12, w: 7.85, h: rh - 0.24, fontSize: 11, color: INK, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.2 });
    ry += rh + 0.12;
  });

  s.addText(
    [
      { text: "The set of scoring functions applied to one attempt is called a rubric. ", options: { bold: true, color: INK } },
      { text: "A rubric can combine all three — for example, exact-match on the final answer plus a judge on the reasoning — with a weight on each. And some functions are worth recording without rewarding at all: measuring how often the model produced parseable output tells you a great deal, but paying it to format nicely teaches a different lesson than paying it to be right.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.16, w: 12.1, h: 0.62, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 4);
}

// ================= SLIDE 5: BACKGROUND 3 =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 3 of 5");
  title(s, "The Scoring Function Is the Whole Problem");

  s.addText(
    "Optimisation is indifferent to intent. It will find whatever most reliably produces a high number — and if a shortcut scores better than the task you meant, the shortcut is the correct answer to the problem you actually posed.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const hacks = [
    ["magnifying_glass_white", "Measuring a proxy", "You can't measure “helpful,” so you measure response length, or confident phrasing, or agreement with the user. The model optimises exactly what you wrote down.", TEAL],
    ["key_white", "Reaching the scorer", "If the thing being graded can touch the grader — edit the tests, write to the answer file, call the checker directly — it will eventually find that path. It's the highest-scoring strategy available.", DEEPBLUE],
    ["triangle_exclamation_white", "Degenerate strategies", "A reward that's almost always 0 or almost always 1 gives no gradient to climb, so the model settles on some cheap constant behaviour that happens to score adequately.", MIDNIGHT],
  ];
  const hw = 3.93, hgap = 0.15, hy = 2.35, hh = 2.35;
  hacks.forEach(([icon, h, b, color], i) => {
    const x = 0.6 + i * (hw + hgap);
    card(s, x, hy, hw, hh);
    iconChip(s, icon, x + 0.28, hy + 0.28, 0.62, color);
    s.addText(h, { x: x + 1.05, y: hy + 0.32, w: hw - 1.3, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.28, y: hy + 1.05, w: hw - 0.56, h: hh - 1.25, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.22 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.98, w: 12.1, h: 1.75, rectRadius: 0.08, fill: { color: NAVY },
  });
  iconChip(s, "shield_halved_white", 0.95, 5.42, 0.7, TEAL);
  s.addText("The defensive question, asked before training rather than after", {
    x: 1.9, y: 5.2, w: 10.5, h: 0.35, fontSize: 14, bold: true, color: "8FD4E8", fontFace: "Calibri",
  });
  s.addText(
    "If I wanted to score well on this task without doing it, what would I try? Anything you can answer in under a minute, an optimiser running millions of attempts will certainly find. The strongest single defence is structural: make it impossible for the thing being graded to modify the thing doing the grading — not by asking it not to, but by not giving it the access.",
    { x: 1.9, y: 5.6, w: 10.5, h: 1.0, fontSize: 12, color: "CFE8F0", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  footerBrand(s); addSlideNumber(s, 5);
}

// ================= SLIDE 6: BACKGROUND 4 =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 4 of 5");
  title(s, "Changing Behaviour Without Changing Every Weight");

  s.addText(
    "Updating all the weights of a large model needs the whole model in memory, in gradient-tracking form, on hardware you have exclusively. That is the single biggest reason fine-tuning used to be out of reach for most people.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  card(s, 0.6, 2.3, 5.9, 2.5);
  iconChip(s, "layer_group_teal", 0.9, 2.58, 0.62, OFFWHITE);
  s.addText("The low-rank idea", { x: 1.65, y: 2.62, w: 4.6, h: 0.4, fontSize: 15, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
  s.addText(
    "Freeze the original weights completely. Alongside each one, train a small pair of matrices whose product has the same shape as the weight matrix but far fewer parameters. At inference the small product is simply added to the frozen weight. The adaptation is a thin patch — often well under 1% the size of the model — laid over an untouched base.",
    { x: 0.9, y: 3.3, w: 5.3, h: 1.35, fontSize: 11.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  card(s, 6.8, 2.3, 5.9, 2.5);
  iconChip(s, "boxes_stacked_teal", 7.1, 2.58, 0.62, OFFWHITE);
  s.addText("Why it changes who can train", { x: 7.85, y: 2.62, w: 4.6, h: 0.4, fontSize: 15, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
  s.addText(
    "Because the base weights never move, one loaded copy of a model can serve many different adaptations at once, swapping the small patch per request. That turns fine-tuning from “rent a machine for a week” into something a shared service can meter per token — and it means the trained result is a small file you can hand around, not a hundred gigabytes of weights.",
    { x: 7.1, y: 3.3, w: 5.3, h: 1.35, fontSize: 11.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.0, w: 12.1, h: 1.6, rectRadius: 0.08, fill: { color: "F5F0F7" }, line: { color: "C4AED6", width: 1 },
  });
  s.addText("The trade, stated honestly", {
    x: 0.9, y: 5.15, w: 11.5, h: 0.35, fontSize: 13, bold: true, color: "5B3A7A", fontFace: "Calibri",
  });
  s.addText(
    "A thin patch can steer, specialise, and sharpen a capability the base model already has somewhere in it. It is a much weaker instrument for installing a capability that isn't there at all. For most task-specific work that limitation never binds — but it's the reason full-parameter training still exists, and why platforms that offer the cheap version usually offer the expensive one too.",
    { x: 0.9, y: 5.5, w: 11.5, h: 0.95, fontSize: 11.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  footerBrand(s); addSlideNumber(s, 6);
}

// ================= SLIDE 7: BACKGROUND 5 =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background · 5 of 5");
  title(s, "A Benchmark and a Training Task Are the Same Object");

  s.addText(
    "Historically these were built by different people with different tools. But look at what each one needs and the distinction stops making sense — the only difference is whether you record the score or learn from it.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  const cols = [
    ["A benchmark needs", ["a set of problems", "a way for the model to attempt them", "a scoring function", "a number at the end"], DEEPBLUE],
    ["A training task needs", ["a set of problems", "a way for the model to attempt them", "a scoring function", "a number, many times, to learn from"], TEAL],
  ];
  cols.forEach(([h, items, color], i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 2.3, 3.95, 2.45);
    s.addText(h, { x: x + 0.25, y: 2.5, w: 3.45, h: 0.4, fontSize: 14, bold: true, color, fontFace: "Calibri" });
    items.forEach((it, j) => {
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 3.02 + j * 0.42, w: 0.14, h: 0.14, fill: { color } });
      s.addText(it, { x: x + 0.55, y: 2.93 + j * 0.42, w: 3.2, h: 0.35, fontSize: 11, color: j === 3 ? INK : MUTE, bold: j === 3, fontFace: "Calibri", valign: "middle" });
    });
  });

  card(s, 8.9, 2.3, 3.8, 2.45, "16385A");
  iconChip(s, "gauge_high_white", 9.2, 2.55, 0.6, TEAL);
  s.addText("Difficulty is the design variable", { x: 9.2, y: 3.25, w: 3.2, h: 0.6, fontSize: 13.5, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  s.addText(
    "A task everyone solves and a task nobody solves are equally useless — for ranking models and for training them. Both need attempts that sometimes succeed and sometimes don't.",
    { x: 9.2, y: 3.85, w: 3.2, h: 0.8, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 4.95, w: 12.1, h: 1.7, rectRadius: 0.08, fill: { color: "EEF4F7" }, line: { color: "AEC7D6", width: 1 },
  });
  s.addText("Two teams, arriving at nearly the same window from opposite directions", {
    x: 0.9, y: 5.1, w: 11.5, h: 0.35, fontSize: 13, bold: true, color: DEEPBLUE, fontFace: "Calibri",
  });
  s.addText(
    "The team behind one widely-used coding benchmark rebuilt it in 2024 because the old version had saturated — top models were separated by one or two problems. They selected the new problem set specifically so the strongest models would land roughly between 5% and 50%. Independently, the guidance for launching an RL training run is to check that your task scores somewhere around 10–35% before spending anything: too high and there's nothing to learn, too low and there's no signal to learn from. Same window, once for measurement and once for teaching.",
    { x: 0.9, y: 5.45, w: 11.5, h: 1.05, fontSize: 11.5, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );

  footerBrand(s); addSlideNumber(s, 7);
}

// ================= SLIDE 8: BRIDGE =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Bridge", "8FD4E8");
  title(s, "Where Each of Those Shows Up", OFFWHITE);

  s.addText(
    "Everything from here is Prime Intellect specifically. Each background idea maps onto a concrete piece of the platform — stated outright rather than left to inference.",
    { x: 0.6, y: 1.5, w: 12.1, h: 0.5, fontSize: 13, color: "9FC3D9", fontFace: "Calibri" }
  );

  const map = [
    ["3", "Learning from outcomes", "Hosted Training runs exactly this loop — and splits it across three cooperating processes you can watch separately."],
    ["4", "Where reward comes from", "A rubric is a real class you instantiate. All three scoring styles ship as built-ins; execution-based scoring is what Sandboxes exist for."],
    ["5", "Gaming the reward", "We'll read a published environment whose reward can be gamed — and find the missing check that allows it."],
    ["6", "Cheap adaptation", "Hosted Training does LoRA on shared hardware, billed per token. That pricing model is a direct consequence of slide 6."],
    ["7", "Benchmarks are training tasks", "The Environments Hub is one registry for both. Its own framing is that evals and RL environments are the same thing."],
  ];
  let ry = 2.2;
  const mh = 0.72;
  map.forEach(([num, h, b]) => {
    s.addShape(pres.shapes.OVAL, { x: 0.7, y: ry + 0.17, w: 0.46, h: 0.46, fill: { color: TEAL } });
    s.addText(num, { x: 0.7, y: ry + 0.17, w: 0.46, h: 0.46, fontSize: 13, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.38, y: ry, w: 11.32, h: mh, rectRadius: 0.06, fill: { color: MIDNIGHT } });
    s.addText(h, { x: 1.62, y: ry + 0.06, w: 3.5, h: mh - 0.12, fontSize: 12.5, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: 5.25, y: ry + 0.06, w: 7.25, h: mh - 0.12, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.15 });
    ry += mh + 0.13;
  });

  s.addText(
    "Slides that lean on one of these carry a small green pill, like this one:",
    { x: 0.6, y: ry + 0.14, w: 5.2, h: 0.34, fontSize: 11, italic: true, color: "8FA8C2", fontFace: "Calibri", valign: "middle" }
  );
  backTag(s, "Background · Slide 5, Gaming the Reward", 5.9, ry + 0.14, 4.4, true);

  footerBrand(s, true); addSlideNumber(s, 8);
}

// ================= SLIDE 9: WHAT IS PRIME INTELLECT =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Platform");
  title(s, "What Prime Intellect Is");

  s.addText(
    "A company selling GPU time, which then built a research platform on top of its own marketplace. The two halves are genuinely separable — you can rent a machine and never touch Lab, or use Lab and never think about a GPU.",
    { x: 0.6, y: 1.55, w: 12.1, h: 0.55, fontSize: 13.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  card(s, 0.6, 2.3, 7.4, 1.5, "16385A");
  iconChip(s, "flask_white", 0.9, 2.63, 0.66, TEAL);
  s.addText("Lab — the managed research platform", { x: 1.72, y: 2.5, w: 6.0, h: 0.4, fontSize: 15, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  s.addText(
    "Environments Hub, Hosted Training, Hosted Evaluations. You supply a task definition; it supplies everything else. No GPU allocation, no cluster scheduler, no RL algorithm to implement.",
    { x: 1.72, y: 2.92, w: 6.0, h: 0.8, fontSize: 11, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  card(s, 0.6, 3.95, 7.4, 1.5, CARD);
  iconChip(s, "server_teal", 0.9, 4.28, 0.66, OFFWHITE);
  s.addText("Compute — the marketplace underneath", { x: 1.72, y: 4.15, w: 6.0, h: 0.4, fontSize: 15, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
  s.addText(
    "On-demand pods, multi-node clusters, reserved capacity and persistent disks, aggregated across many providers. This is what Lab runs on — and what you rent directly if you'd rather manage it yourself.",
    { x: 1.72, y: 4.57, w: 6.0, h: 0.8, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  card(s, 8.3, 2.3, 4.4, 3.15);
  s.addText("Worth knowing", { x: 8.6, y: 2.5, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri" });
  const facts = [
    ["Open at the core", "The two libraries doing the real work — verifiers and prime-rl — are MIT-licensed and public. Lab is a managed wrapper around them, not a replacement."],
    ["One binary for everything", "A single prime command drives compute, environments, evaluation, training, sandboxes and inference."],
    ["Two separate API hosts", "Compute and inference live on different domains. Mixing them up is a common first mistake."],
  ];
  let fy = 2.95;
  facts.forEach(([h, b]) => {
    s.addText(h, { x: 8.6, y: fy, w: 3.8, h: 0.28, fontSize: 11.5, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
    s.addText(b, { x: 8.6, y: fy + 0.26, w: 3.8, h: 0.62, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
    fy += 0.85;
  });

  backTag(s, "Background · Slide 6, Cheap Adaptation", 0.6, 5.65, 4.3, false);
  s.addText(
    "Hosted Training does LoRA on shared multi-tenant hardware and bills per token — which is only possible because the base weights never move. Full-parameter training exists as a separate, closed-beta product on dedicated clusters.",
    { x: 5.1, y: 5.6, w: 7.6, h: 0.75, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 9);
}

// ================= SLIDE 10: PLATFORM MAP =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Platform");
  title(s, "The Products, and What Each One Is For");

  const prods = [
    ["box_white", "Environments Hub", "A package registry for tasks. Environments are Python wheels; you browse, install, and publish them like any other dependency.", DEEPBLUE],
    ["chart_line_white", "Hosted Evaluations", "Run an environment against a model and get a score, on Prime's infrastructure rather than your laptop.", TEAL],
    ["rocket_white", "Hosted Training", "The RL loop as a service. Point a config file at an environment and a model; get back a trained adapter.", MIDNIGHT],
    ["cubes_white", "Sandboxes", "Disposable containers for running untrusted code. CPU-only today — there is no GPU sandbox yet.", DEEPBLUE],
    ["cloud_white", "Inference", "An OpenAI-compatible endpoint. Serves stock models, and serves the adapters your training runs produce.", TEAL],
    ["microchip_white", "Compute", "Raw GPUs: on-demand pods, multi-node clusters, reserved capacity, persistent disks.", MIDNIGHT],
  ];
  const pw2 = 3.93, pg = 0.15, py0 = 1.65, ph = 1.55;
  prods.forEach(([icon, h, b, color], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * (pw2 + pg), y = py0 + row * (ph + 0.18);
    card(s, x, y, pw2, ph);
    iconChip(s, icon, x + 0.26, y + 0.26, 0.6, color);
    s.addText(h, { x: x + 1.0, y: y + 0.3, w: pw2 - 1.25, h: 0.52, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.26, y: y + 0.95, w: pw2 - 0.52, h: ph - 1.1, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.1, w: 12.1, h: 1.55, rectRadius: 0.08, fill: { color: NAVY },
  });
  s.addText("How they chain together", {
    x: 0.9, y: 5.25, w: 11.5, h: 0.35, fontSize: 13, bold: true, color: "8FD4E8", fontFace: "Calibri",
  });
  const chain = ["write an environment", "baseline-evaluate it", "configure a run", "launch", "monitor", "deploy the adapter"];
  let chx = 0.9;
  chain.forEach((c, i) => {
    const wdt = 1.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: chx, y: 5.68, w: wdt, h: 0.5, rectRadius: 0.06,
      fill: { color: i === 0 ? TEAL : MIDNIGHT }, line: { color: "3F6E8C", width: 0.75 },
    });
    s.addText(c, { x: chx + 0.04, y: 5.68, w: wdt - 0.08, h: 0.5, fontSize: 9.5, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    if (i < chain.length - 1) s.addText("→", { x: chx + wdt, y: 5.68, w: 0.24, h: 0.5, fontSize: 12, color: "8FD4E8", align: "center", valign: "middle", fontFace: "Calibri" });
    chx += wdt + 0.24;
  });
  s.addText("Nearly every guide on the platform is a variation of this sequence.", {
    x: 0.9, y: 6.25, w: 11.5, h: 0.3, fontSize: 10.5, italic: true, color: "8FA8C2", fontFace: "Calibri",
  });

  footerBrand(s); addSlideNumber(s, 10);
}

// ================= SLIDE 11: REPOSITORY STRUCTURE =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Library");
  title(s, "Repository Structure: verifiers");

  s.addText(
    "Lab is a wrapper. The thing you actually write code against is verifiers — the open-source library defining what an environment is. Worth reading directly, because every environment on the Hub is built to its contract.",
    { x: 0.6, y: 1.52, w: 6.5, h: 0.75, fontSize: 12.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.35, w: 6.5, h: 4.35, rectRadius: 0.08, fill: { color: NAVY } });
  const tree = [
    ["PrimeIntellect-ai/verifiers/", false],
    ["├── .github/workflows/", false],
    ["├── assets/", false],
    ["├── configs/", true],
    ["├── docs/", true],
    ["├── environments/", true],
    ["├── examples/", false],
    ["├── scripts/", false],
    ["├── skills/", false],
    ["├── tests/", false],
    ["├── verifiers/", true],
    ["├── AGENTS.md", false],
    ["├── CLAUDE.md", false],
    ["├── LICENSE", false],
    ["├── MANIFEST.in", false],
    ["├── README.md", false],
    ["├── pyproject.toml", false],
    ["└── uv.lock", false],
  ];
  let ty = 2.5;
  tree.forEach(([txt, hi]) => {
    if (hi) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.82, y: ty - 0.015, w: 3.1, h: 0.225, rectRadius: 0.03, fill: { color: "1E4A6E" } });
    }
    s.addText(txt, {
      x: 0.88, y: ty - 0.02, w: 5.6, h: 0.24, fontSize: 10.5,
      color: hi ? "8FD4E8" : "9FC3D9", bold: !!hi, fontFace: "Courier New", valign: "middle", margin: 0,
    });
    ty += 0.222;
  });

  const notes = [
    ["verifiers/", "The package itself. Environment types, rubrics, parsers, the CLI — everything on the next slide."],
    ["environments/", "Reference environments maintained in-repo. The best worked examples of the contract."],
    ["configs/", "Starter training and evaluation configs — the same ones the CLI copies into a new workspace."],
    ["docs/", "Short human-written architecture guides. Note the split: v0 and v1 are documented separately, because the API is mid-migration."],
  ];
  let ny = 2.45;
  notes.forEach(([f, b]) => {
    pathTag(s, f, 7.4, ny, 2.0, false);
    s.addText(b, { x: 9.55, y: ny - 0.06, w: 3.15, h: 0.9, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18 });
    ny += 1.0;
  });

  s.addText(
    "MIT · ~4.4k stars · ~615 forks · created by Will Brown (@willccbb)",
    { x: 7.4, y: 6.48, w: 5.3, h: 0.3, fontSize: 10, italic: true, color: MUTE, fontFace: "Calibri" }
  );

  footerBrand(s); addSlideNumber(s, 11);
}

// ================= SLIDE 12: REPOSITORY MAP =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Library");
  title(s, "Repository Map: What Lives Where");
  pathTag(s, "verifiers/", 11.0, 0.85, 1.7, false);

  const groups = [
    ["cubes_white", "envs/", DEEPBLUE, [
      ["environment.py", "The abstract base. Owns rollout(), run_rollout(), run_group(), generate(), evaluate()."],
      ["multiturn_env.py", "Adds env_response(), setup_state(), max_turns_reached() — the conversation loop."],
      ["tool_env.py, stateful_tool_env.py", "Native tool-calling; the stateful variant carries per-rollout state."],
      ["python_env.py, sandbox_env.py", "Execution-backed environments — a persistent REPL, or a full sandbox."],
    ]],
    ["list_check_white", "rubrics/ + parsers/", TEAL, [
      ["rubric.py", "add_reward_func(weight=1.0) vs. add_metric(weight=0.0) — scored, or merely recorded."],
      ["judge_rubric.py, math_rubric.py", "The LLM-judge and symbolic-verification scorers, ready-made."],
      ["parser.py", "parse(), parse_answer(), get_format_reward_func() — format compliance, built in."],
      ["think_parser.py, xml_parser.py", "Extractors for reasoning-tagged and structured outputs."],
    ]],
  ];
  const gw = 6.0, gx = [0.6, 6.75], gy = 1.68, gh = 3.5;
  groups.forEach(([icon, name, color, items], i) => {
    card(s, gx[i], gy, gw, gh);
    iconChip(s, icon, gx[i] + 0.25, gy + 0.22, 0.55, color);
    s.addText(name, { x: gx[i] + 0.95, y: gy + 0.24, w: gw - 1.2, h: 0.5, fontSize: 15, bold: true, color: INK, fontFace: "Courier New", valign: "middle" });
    let iy = gy + 0.86;
    items.forEach(([f, b]) => {
      s.addText(f, { x: gx[i] + 0.28, y: iy, w: gw - 0.56, h: 0.24, fontSize: 10, bold: true, color: DEEPBLUE, fontFace: "Courier New" });
      s.addText(b, { x: gx[i] + 0.28, y: iy + 0.23, w: gw - 0.56, h: 0.38, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
      iy += 0.66;
    });
  });

  card(s, 0.6, 5.3, 12.1, 1.38);
  iconChip(s, "code_branch_teal", 0.9, 5.58, 0.55, OFFWHITE);
  s.addText("One thing to notice before you read any environment", { x: 1.6, y: 5.45, w: 10.8, h: 0.32, fontSize: 13, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
  s.addText(
    "There is a v1/ directory alongside everything above, with its own env.py, harness.py, and a harnesses/ folder holding real coding agents. The library is mid-migration between two designs: the older one where you subclass an environment, and a newer one built around tasksets and harnesses. Both are supported, and published environments use both. If a method signature doesn't match the docs you're reading, check which generation you're in before assuming a bug.",
    { x: 1.6, y: 5.79, w: 10.8, h: 0.8, fontSize: 11, color: INK, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 12);
}

// ================= SLIDE 13: THE ENVIRONMENT CONTRACT =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Core Structure");
  title(s, "What an Environment Actually Is");

  s.addText(
    "A Python package exposing one function. Everything else — the Hub, the trainer, the evaluator — is built on the guarantee that this function exists and returns something with a known shape.",
    { x: 0.6, y: 1.52, w: 12.1, h: 0.5, fontSize: 13, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.15, w: 5.7, h: 1.0, rectRadius: 0.08, fill: { color: NAVY } });
  s.addText("def load_environment(**kwargs) -> vf.Environment:", {
    x: 0.8, y: 2.3, w: 5.3, h: 0.32, fontSize: 12, color: "8FD4E8", fontFace: "Courier New", bold: true,
  });
  s.addText("The entire required interface. Everything else is a choice.", {
    x: 0.8, y: 2.66, w: 5.3, h: 0.35, fontSize: 10.5, color: "9FC3D9", fontFace: "Calibri", italic: true,
  });

  s.addText("The type it returns, from general to specific:", {
    x: 0.6, y: 3.3, w: 5.7, h: 0.3, fontSize: 12, bold: true, color: INK, fontFace: "Calibri",
  });
  const hier = [
    ["Environment", "abstract base — owns the rollout loop", 0],
    ["MultiTurnEnv", "adds env_response(): the environment talks back", 0.35],
    ["SingleTurnEnv", "one exchange and done", 0.7],
    ["ToolEnv / StatefulToolEnv", "native tool calls; stateful keeps per-rollout state", 0.7],
    ["PythonEnv / SandboxEnv", "the model's code is actually executed", 0.7],
  ];
  let hy = 3.68;
  hier.forEach(([n, d, indent]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.6 + indent, y: hy, w: 2.35, h: 0.34, rectRadius: 0.05,
      fill: { color: indent === 0 ? DEEPBLUE : indent === 0.35 ? TEAL : CARD },
      line: indent > 0.4 ? { color: "AEC7D6", width: 0.75 } : undefined,
    });
    s.addText(n, {
      x: 0.68 + indent, y: hy, w: 2.25, h: 0.34, fontSize: 9.5,
      color: indent > 0.4 ? DEEPBLUE : OFFWHITE, bold: true, fontFace: "Courier New", valign: "middle", margin: 0,
    });
    s.addText(d, { x: 3.1 + indent, y: hy, w: 3.3 - indent, h: 0.34, fontSize: 9.5, color: MUTE, fontFace: "Calibri", valign: "middle" });
    hy += 0.44;
  });

  card(s, 6.6, 2.15, 6.1, 3.75);
  s.addText("Three things every environment supplies", { x: 6.9, y: 2.35, w: 5.5, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri" });
  const parts = [
    ["table_list_teal", "A dataset", "The problems. Each row carries a prompt, optionally an answer, and an info dict for anything the scorer will need later."],
    ["person_running_teal", "A way to attempt them", "The loop the model runs inside: tools it may call, how the environment responds, when the attempt ends."],
    ["clipboard_check_teal", "A rubric", "One or more scoring functions with weights. Weight 0.0 records a number without rewarding it."],
  ];
  let py = 2.85;
  parts.forEach(([icon, h, b]) => {
    iconChip(s, icon, 6.9, py, 0.55, OFFWHITE);
    s.addText(h, { x: 7.6, y: py - 0.02, w: 4.8, h: 0.32, fontSize: 12.5, bold: true, color: DEEPBLUE, fontFace: "Calibri" });
    s.addText(b, { x: 7.6, y: py + 0.28, w: 4.9, h: 0.68, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
    py += 1.02;
  });

  backTag(s, "Background · Slide 4, Where Reward Comes From", 6.6, 6.05, 5.0, false);
  s.addText(
    "State threads through the whole rollout: setup_state() initialises it, env_response() mutates it, and the rubric reads it to decide a score.",
    { x: 0.6, y: 6.02, w: 5.8, h: 0.6, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 13);
}

// ================= SLIDE 14: ANATOMY OF A REAL ENVIRONMENT =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Worked Example");
  title(s, "Anatomy of a Published Environment");
  pathTag(s, "AiderPolyglot.py", 10.55, 0.85, 2.15, false);

  s.addText(
    "primeintellect/aiderpolyglot — roughly 200 lines, on the Hub, by Prime themselves. It scores a model on coding exercises across six languages. Every piece of the contract, in one readable file.",
    { x: 0.6, y: 1.52, w: 12.1, h: 0.5, fontSize: 12.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  const steps = [
    ["1", "load_exercises_dataset()", "Walks a cloned benchmark repo. For each exercise it reads the instructions and the stub files — and deliberately filters the test files out, so the model never sees what it will be graded against."],
    ["2", "PROMPT", "Asks for each file in a specific literal format: a /// marker, then the filename, then a fenced code block."],
    ["3", "env_response()", "Applies FILE_PATTERN, a regex, to the model's reply, producing a {filename: code} dict. If nothing matches it returns silently — no feedback, no turn consumed."],
    ["4", "_test_solution()", "Copies the exercise to a temp directory, writes the model's files over it, and runs that language's test command in a container."],
    ["5", "success()", "Returns 1.0 if the test command exited 0, else 0.0. Wrapped in vf.Rubric(funcs=[success], weights=[1.0])."],
  ];
  let sy = 2.05;
  steps.forEach(([n, fn, b], i) => {
    const h = 0.72;
    card(s, 0.6, sy, 12.1, h);
    s.addShape(pres.shapes.OVAL, { x: 0.85, y: sy + (h - 0.42) / 2, w: 0.42, h: 0.42, fill: { color: i === 4 ? TEAL : DEEPBLUE } });
    s.addText(n, { x: 0.85, y: sy + (h - 0.42) / 2, w: 0.42, h: 0.42, fontSize: 12, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri" });
    s.addText(fn, { x: 1.45, y: sy + 0.06, w: 2.75, h: h - 0.12, fontSize: 11, bold: true, color: DEEPBLUE, fontFace: "Courier New", valign: "middle" });
    s.addText(b, { x: 4.35, y: sy + 0.05, w: 8.15, h: h - 0.1, fontSize: 10, color: INK, fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.15 });
    sy += h + 0.09;
  });

  s.addText(
    [
      { text: "Read steps 1 and 4 together before the next slide. ", options: { bold: true, color: INK } },
      { text: "The tests are hidden from the model in step 1 — that part is deliberate and correct. Then step 4 writes whatever filenames the model asked for into the same directory those tests live in.", options: { color: MUTE } },
    ],
    { x: 0.6, y: 6.2, w: 12.1, h: 0.55, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 14);
}

// ================= SLIDE 15: THE TRAINING LOOP =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Hosted Training");
  title(s, "The Loop, Split Across Three Processes");

  s.addText(
    "Every RL run — self-hosted or managed — is three cooperating components. Knowing which is which is what makes the logs readable, because you can ask each one separately what it was doing.",
    { x: 0.6, y: 1.52, w: 12.1, h: 0.5, fontSize: 13, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );

  const comps = [
    ["route_white", "Orchestrator", "Owns the environment. Picks problems, schedules rollouts, packs finished ones into batches with their advantages.", DEEPBLUE],
    ["cloud_white", "Inference", "Serves the model generating the rollouts — and accepts new weights mid-run without restarting.", TEAL],
    ["gears_white", "Trainer", "Consumes batches, applies the LoRA update, hands the new weights back.", MIDNIGHT],
  ];
  const cw2 = 3.93, cg = 0.15, cy = 2.15, chh2 = 2.0;
  comps.forEach(([icon, h, b, color], i) => {
    const x = 0.6 + i * (cw2 + cg);
    card(s, x, cy, cw2, chh2);
    iconChip(s, icon, x + cw2 / 2 - 0.33, cy + 0.24, 0.66, color);
    s.addText(h, { x: x + 0.2, y: cy + 1.02, w: cw2 - 0.4, h: 0.35, fontSize: 15, bold: true, color: INK, align: "center", fontFace: "Calibri" });
    s.addText(b, { x: x + 0.25, y: cy + 1.4, w: cw2 - 0.5, h: chh2 - 1.5, fontSize: 10.5, color: MUTE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.35, w: 12.1, h: 1.05, rectRadius: 0.08, fill: { color: NAVY } });
  s.addText("It runs asynchronously — rollouts for step N are generated while step N−1 is still training. That overlap is the reason it's fast, and the reason the logs interleave.", {
    x: 0.9, y: 4.5, w: 11.5, h: 0.7, fontSize: 12, color: "CFE8F0", fontFace: "Calibri", valign: "middle", lineSpacingMultiple: 1.2,
  });

  backTag(s, "Background · Slide 3, Learning From Outcomes", 0.6, 5.6, 4.6, false);
  s.addText(
    [
      { text: "The sample → score → compare → update cycle, as infrastructure. ", options: { bold: true, color: INK } },
      { text: "Under Hosted Training each run gets its own orchestrator, while trainer and inference are shared across many users' adapters at once — which is exactly what per-token pricing buys you instead of a whole GPU.", options: { color: MUTE } },
    ],
    { x: 5.4, y: 5.55, w: 7.3, h: 0.95, fontSize: 11, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 15);
}

// ================= SLIDE 16: CONFIGURATION =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Controls");
  title(s, "The Dials You Actually Turn");

  s.addText(
    "A training run is one TOML file. Four keys are required; the rest are defaults you override once you know why.",
    { x: 0.6, y: 1.52, w: 12.1, h: 0.42, fontSize: 13, color: MUTE, fontFace: "Calibri" }
  );

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.05, w: 5.9, h: 3.15, rectRadius: 0.08, fill: { color: NAVY } });
  const conf = [
    ['model = "Qwen/Qwen3.5-4B"', "8FD4E8"],
    ["max_steps = 100", "8FD4E8"],
    ["batch_size = 128", "8FD4E8"],
    ["rollouts_per_example = 8", "8FD4E8"],
    ["", MUTE],
    ["[sampling]", "9FC3D9"],
    ["max_tokens = 1024", "9FC3D9"],
    ["", MUTE],
    ["[[env]]", "9FC3D9"],
    ['id = "primeintellect/alphabet-sort"', "9FC3D9"],
    ["args = { max_turns = 5 }", "9FC3D9"],
    ["", MUTE],
    ["[eval]", "9FC3D9"],
    ["interval = 25", "9FC3D9"],
  ];
  let cfy = 2.22;
  conf.forEach(([line, col]) => {
    if (line) s.addText(line, { x: 0.85, y: cfy, w: 5.4, h: 0.22, fontSize: 10.5, color: col, fontFace: "Courier New", margin: 0 });
    cfy += 0.195;
  });

  const dials = [
    ["rollouts_per_example", "How many attempts per problem get scored together. This is the group in group-relative optimisation — raise it to 16–32 when the reward is noisy."],
    ["batch_size", "Problems per step. Bigger batches steady the signal and cost proportionally more."],
    ["[[env]] is repeatable", "List several environments with ratio weights to train one model across multiple tasks at once."],
    ["[[pre_batch_filters]]", "Drop rollouts before they reach the trainer — gibberish, repetition, or zero-advantage groups that carry no learning signal."],
  ];
  let dy = 2.05;
  dials.forEach(([n, b]) => {
    card(s, 6.75, dy, 5.95, 0.74);
    s.addText(n, { x: 6.98, y: dy + 0.06, w: 5.5, h: 0.24, fontSize: 10.5, bold: true, color: DEEPBLUE, fontFace: "Courier New" });
    s.addText(b, { x: 6.98, y: dy + 0.29, w: 5.5, h: 0.42, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 });
    dy += 0.82;
  });

  backTag(s, "Background · Slide 3, Learning From Outcomes", 6.75, 5.42, 4.7, false);

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 5.42, w: 5.9, h: 1.25, rectRadius: 0.08, fill: { color: "FFF6E5" }, line: { color: "E0C27A", width: 1 },
  });
  s.addText("Check the baseline before you spend", { x: 0.85, y: 5.55, w: 5.4, h: 0.3, fontSize: 12, bold: true, color: "7A5A10", fontFace: "Calibri" });
  s.addText(
    "Evaluate the environment first and confirm it scores roughly 10–35%. A short run with max_steps overridden to 10 is the cheap way to find out.",
    { x: 0.85, y: 5.85, w: 5.4, h: 0.72, fontSize: 10.5, color: "8A6A20", fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );
  s.addText(
    "Secrets never go in the TOML — they're linked to the environment or passed at runtime.",
    { x: 6.75, y: 5.9, w: 5.95, h: 0.5, fontSize: 10.5, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 16);
}

// ================= SLIDE 17: THE CLI =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Interaction");
  title(s, "One Binary Drives All of It");

  s.addText(
    "The whole platform is reachable from a single command. Grouped by what you're doing rather than alphabetically, the surface is small enough to hold in your head.",
    { x: 0.6, y: 1.52, w: 12.1, h: 0.45, fontSize: 13, color: MUTE, fontFace: "Calibri" }
  );

  const cli = [
    ["box_white", "Environments", DEEPBLUE, ["prime env init my-env", "prime env install owner/name", "prime env inspect owner/name FILE", "prime env push --visibility=PRIVATE"]],
    ["chart_line_white", "Evaluation", TEAL, ["prime eval run my-env -m MODEL -n 20", "prime eval run my-env --hosted --follow", "prime eval tui"]],
    ["rocket_white", "Training", MIDNIGHT, ["prime train models", "prime train run configs/rl/x.toml", "prime train logs <run-id> -f", "prime deployments create <adapter_id>"]],
    ["cubes_white", "Sandboxes & compute", DEEPBLUE, ["prime sandbox create python:3.11-slim", "prime sandbox run <id> \"python x.py\"", "prime availability list --gpu-type H100_80GB", "prime pods create --id <short-id>"]],
  ];
  const clw = 6.0, clx = [0.6, 6.75], cly = 2.0, clh = 2.1;
  cli.forEach(([icon, name, color, cmds], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = clx[col], y = cly + row * (clh + 0.16);
    card(s, x, y, clw, clh);
    iconChip(s, icon, x + 0.25, y + 0.22, 0.5, color);
    s.addText(name, { x: x + 0.88, y: y + 0.22, w: clw - 1.1, h: 0.5, fontSize: 13.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    let cy2 = y + 0.8;
    cmds.forEach((c) => {
      s.addText("$ " + c, { x: x + 0.28, y: cy2, w: clw - 0.56, h: 0.26, fontSize: 9.5, color: DEEPBLUE, fontFace: "Courier New", margin: 0 });
      cy2 += 0.3;
    });
  });

  s.addText(
    [
      { text: "prime env inspect ", options: { bold: true, color: DEEPBLUE, fontFace: "Courier New" } },
      { text: "prints any file from a published environment without installing it — so you can read someone's rubric before trusting their score.", options: { color: MUTE, fontFace: "Calibri" } },
    ],
    { x: 0.6, y: 6.5, w: 12.1, h: 0.32, fontSize: 11, lineSpacingMultiple: 1.15 }
  );

  footerBrand(s); addSlideNumber(s, 17);
}

// ================= SLIDE 18: USE CASES =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "In Practice");
  title(s, "What People Actually Use This For");

  const uses = [
    ["hammer_white", "Specialising a small model", "Take a 4B model that's mediocre at your specific task and train it until it's competitive with something far larger — then serve it at a fraction of the cost.", DEEPBLUE],
    ["magnifying_glass_white", "Domain search agents", "A published case study builds a three-level curriculum over patent documents — metadata lookup, then multi-step computation, then open-ended analysis with a judge.", TEAL],
    ["file_code_white", "Coding and tool use", "Execution-scored environments where the reward is simply whether the tests passed — a signal that needs no human labelling at all.", MIDNIGHT],
    ["comments_white", "Browser and computer use", "Agents driving real web pages, scored on task completion, in either a DOM-reading or a screenshot-reading mode.", DEEPBLUE],
    ["scale_balanced_white", "Publishing a benchmark", "Package an evaluation once and anyone can run it against any model with one command — the fragmentation problem the Hub exists to solve.", TEAL],
    ["graduation_cap_white", "Learning RL at all", "Because the infrastructure is handled, the only thing left to get right is the task and the reward — which is the part worth learning anyway.", MIDNIGHT],
  ];
  const uw = 3.93, ug = 0.15, uy0 = 1.62, uh = 1.62;
  uses.forEach(([icon, h, b, color], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * (uw + ug), y = uy0 + row * (uh + 0.2);
    card(s, x, y, uw, uh);
    iconChip(s, icon, x + 0.26, y + 0.26, 0.58, color);
    s.addText(h, { x: x + 0.98, y: y + 0.28, w: uw - 1.2, h: 0.54, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.26, y: y + 0.94, w: uw - 0.52, h: uh - 1.08, fontSize: 10.5, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 });
  });

  backTag(s, "Background · Slide 7, Benchmarks Are Training Tasks", 0.6, 5.3, 5.0, false);
  s.addText(
    "Notice that the last two entries are the same activity. Publishing a benchmark and publishing a training task produce the same artifact, in the same registry, run by the same command.",
    { x: 5.9, y: 5.25, w: 6.8, h: 0.6, fontSize: 11, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.2 }
  );

  footerBrand(s); addSlideNumber(s, 18);
}

// ================= SLIDE 19: LIMITATIONS =================
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Honest Assessment", "B5651D");
  title(s, "Limitations, Including One We Found");

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.5, w: 12.1, h: 1.72, rectRadius: 0.08, fill: { color: "FDF0EC" }, line: { color: "D98A6A", width: 1.25 },
  });
  iconChip(s, "bug_teal", 0.9, 1.95, 0.68, OFFWHITE);
  s.addText("The environment we read on slide 14 can be gamed", {
    x: 1.75, y: 1.68, w: 10.8, h: 0.35, fontSize: 14.5, bold: true, color: "A6402A", fontFace: "Calibri",
  });
  s.addText(
    "_test_solution() writes every filename the model asked for into the exercise directory, with no allowlist and no path check — including the test files it was graded against. A model that emits a test file containing a trivially passing assertion scores 1.0 without solving anything. The environment already stores the list of legitimate filenames in info['template_files'] and never checks against it. The only thing standing in the way is a sentence in the prompt asking the model not to.",
    { x: 1.75, y: 2.05, w: 10.8, h: 1.05, fontSize: 11.5, color: "8A3A26", fontFace: "Calibri", lineSpacingMultiple: 1.22 }
  );

  backTag(s, "Background · Slide 5, Gaming the Reward", 0.6, 3.32, 4.4, false);
  s.addText(
    "Textbook “reaching the scorer.” Note it is a benchmark-validity flaw, not a security hole — nothing escapes a container the model already controls.",
    { x: 5.2, y: 3.28, w: 7.5, h: 0.45, fontSize: 10.5, italic: true, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.15 }
  );

  const lims = [
    ["triangle_exclamation_white", "Documentation drifts from code", "That same environment's README disagrees with its source in eight places — default turn count, default language, every container image, and the test runner. Read the source."],
    ["lock_white", "Third-party dependencies bite", "It also depends on an outside sandbox provider, so its own automated integration test has been failing on Prime's build system for six months: no credentials there to authenticate with."],
    ["coins_white", "The free tier doesn't line up", "The models that are free to train are absent from the inference list, and the free inference model isn't trainable. There is no single model that is free for both."],
    ["cubes_white", "Platform edges", "Sandboxes are CPU-only. Full-parameter training is closed beta. The library is mid-migration between two APIs, so published environments target different generations."],
  ];
  const lw = 6.0, lx = [0.6, 6.75], ly0 = 3.92, lh = 1.32;
  lims.forEach(([icon, h, b], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = lx[col], y = ly0 + row * (lh + 0.14);
    card(s, x, y, lw, lh);
    iconChip(s, icon, x + 0.24, y + 0.22, 0.5, i % 2 === 0 ? TEAL : MIDNIGHT);
    s.addText(h, { x: x + 0.86, y: y + 0.2, w: lw - 1.1, h: 0.5, fontSize: 12, bold: true, color: INK, fontFace: "Calibri", valign: "middle" });
    s.addText(b, { x: x + 0.26, y: y + 0.72, w: lw - 0.52, h: lh - 0.85, fontSize: 10, color: MUTE, fontFace: "Calibri", lineSpacingMultiple: 1.18 });
  });

  footerBrand(s); addSlideNumber(s, 19);
}

// ================= SLIDE 20: CLOSING =================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: -1.5, y: 4.5, w: 5, h: 5, fill: { color: MIDNIGHT, transparency: 45 } });
  s.addShape(pres.shapes.OVAL, { x: 11.4, y: -1.2, w: 3.6, h: 3.6, fill: { color: DEEPBLUE, transparency: 60 } });

  s.addText("WHERE TO GO NEXT", {
    x: 0.8, y: 0.85, w: 8, h: 0.4, fontSize: 14, bold: true, color: "7FB8D6", charSpacing: 3, fontFace: "Calibri",
  });
  s.addText("Resources", {
    x: 0.75, y: 1.24, w: 10.5, h: 1.0, fontSize: 38, bold: true, color: OFFWHITE, fontFace: "Cambria", margin: 0,
  });

  const links = [
    ["book_white", "Docs", "docs.primeintellect.ai — start with the Lab guides; “Your First Model Training” is the end-to-end walkthrough.", "https://docs.primeintellect.ai/guides/rl-training"],
    ["code_branch_white", "Source", "github.com/PrimeIntellect-ai/verifiers — the environment library. prime-rl is the trainer beneath it.", "https://github.com/PrimeIntellect-ai/verifiers"],
    ["box_white", "Environments Hub", "app.primeintellect.ai/dashboard/environments — browse published environments and read their source before trusting a score.", "https://app.primeintellect.ai/dashboard/environments"],
  ];
  let ly = 2.4;
  links.forEach(([icon, h, v, url]) => {
    iconChip(s, icon, 0.8, ly, 0.5, DEEPBLUE);
    s.addText(h, { x: 1.5, y: ly - 0.02, w: 2.2, h: 0.3, fontSize: 11, color: "9FC3D9", fontFace: "Calibri" });
    s.addText([{ text: v, options: { hyperlink: { url }, color: OFFWHITE, fontFace: "Calibri" } }],
      { x: 1.5, y: ly + 0.26, w: 10.6, h: 0.55, fontSize: 12, lineSpacingMultiple: 1.2 });
    ly += 0.88;
  });

  s.addShape(pres.shapes.LINE, { x: 0.8, y: ly + 0.1, w: 6, h: 0, line: { color: TEAL, width: 1 } });
  s.addText("A Question to Sit With", { x: 0.8, y: ly + 0.3, w: 8, h: 0.35, fontSize: 13, bold: true, color: "8FD4E8", fontFace: "Calibri" });
  s.addText(
    "The environment on slide 14 asks the model, in plain English, not to edit the tests — and then hands it the ability to do so. Suppose you couldn't add the missing filename check. What else could you change about how the task is scored so that editing the tests stops being worth doing?",
    { x: 0.8, y: ly + 0.7, w: 11.3, h: 0.95, fontSize: 13, italic: true, color: "D7E9F2", fontFace: "Calibri", lineSpacingMultiple: 1.25 }
  );

  footerBrand(s, true);
}

const path = require("path");
const OUT_FILE = process.env.REPO_TEACHER_OUT || path.join(__dirname, "PrimeIntellect_Lecture.pptx");
pres.writeFile({ fileName: OUT_FILE }).then(() => console.log(`deck written → ${OUT_FILE}`));
