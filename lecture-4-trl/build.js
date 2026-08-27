// TRL — AI Tooling Seminar, Lecture 4: Post-Training, Six Methods, One Training Loop
// Ocean Gradient design system, shared with Lectures 1-2.
const pptxgen = require("pptxgenjs");
const path = require("path");

// Resolved relative to this script, so the deck builds from any checkout.
// Icons are shared across lessons and live at the repository root.
const ICON_DIR = process.env.REPO_TEACHER_ICONS || path.join(__dirname, "..", "icons");
const OUT_FILE = process.env.REPO_TEACHER_OUT || path.join(__dirname, "TRL_Lecture.pptx");

const NAVY = "0B2942";
const MIDNIGHT = "21295C";
const DEEPBLUE = "065A82";
const TEAL = "1C7293";
const ICE = "CFE8F0";
const OFFWHITE = "FFFFFF";
const INK = "1B2733";
const MUTE = "5C7080";
const CARD = "F2F8FA";
const MINT = "1E7A5F";   // back-reference pills (distinct from ICE path tags)
const MINTBG = "E4F4EC";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "AI Seminar";
pres.title = "Post-Training: Six Methods, One Training Loop";

const ICON = (n) => path.join(ICON_DIR, `${n}.png`);
const FOOTER = "TRL  \u00b7  AI SEMINAR, LECTURE 4";

function addSlideNumber(s, n) {
  s.addText(String(n), { x: 12.6, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: MUTE, align: "right", fontFace: "Calibri" });
}
function kicker(s, text, color = TEAL) {
  s.addText(text.toUpperCase(), { x: 0.6, y: 0.45, w: 10, h: 0.35, fontSize: 13, color, bold: true, charSpacing: 2, fontFace: "Calibri" });
}
function title(s, text, color = INK, opts = {}) {
  s.addText(text, { x: 0.6, y: 0.78, w: opts.w || 11.8, h: opts.h || 0.9, fontSize: opts.fontSize || 30, color, bold: true, fontFace: opts.fontFace || "Cambria", margin: 0 });
}
function iconChip(s, variant, x, y, size, bg) {
  s.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: bg } });
  const pad = size * 0.26;
  s.addImage({ path: ICON(variant), x: x + pad, y: y + pad, w: size - 2 * pad, h: size - 2 * pad });
}
function footerBrand(s, dark) {
  s.addText(FOOTER, { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 9, color: dark ? "8FA8C2" : MUTE, fontFace: "Calibri", charSpacing: 1 });
}
function pathTag(s, text, x, y, w, dark) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, rectRadius: 0.05, fill: { color: dark ? "16385A" : ICE } });
  s.addText(text, { x, y, w, h: 0.34, fontSize: 10, color: dark ? "8FD4E8" : DEEPBLUE, fontFace: "Courier New", align: "center", valign: "middle", margin: 0 });
}
// Back-reference pill: "\u2190 Background \u00b7 Slide N, Concept"  (U+2190 only \u2014 U+21A9 renders as tofu)
function backRef(s, n, concept, x, y, w) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.32, rectRadius: 0.05, fill: { color: MINTBG } });
  s.addText(`\u2190 Background \u00b7 Slide ${n}, ${concept}`, { x, y, w, h: 0.32, fontSize: 9.5, color: MINT, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: fill },
    shadow: { type: "outer", color: "1B2733", blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
}
function body(s, text, x, y, w, h, opts = {}) {
  s.addText(text, { x, y, w, h, fontSize: opts.fontSize || 11, color: opts.color || MUTE, fontFace: "Calibri", lineSpacingMultiple: opts.ls || 1.2, valign: opts.valign, margin: opts.margin, bold: opts.bold, italic: opts.italic, align: opts.align });
}
function codeBlock(s, lines, x, y, w, h, fontSize = 10.5) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: NAVY } });
  s.addText(lines.join("\n"), { x: x + 0.22, y: y + 0.14, w: w - 0.44, h: h - 0.28, fontSize, color: "CFE8F0", fontFace: "Courier New", lineSpacingMultiple: 1.22, margin: 0 });
}

/* ===================== 1 · TITLE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addText("AI Tooling Seminar \u00b7 Lecture 4", { x: 0.9, y: 1.5, w: 10, h: 0.4, fontSize: 14, color: "8FD4E8", bold: true, charSpacing: 2, fontFace: "Calibri" });
  s.addText("Post-Training", { x: 0.9, y: 2.05, w: 11.5, h: 1.0, fontSize: 52, bold: true, color: OFFWHITE, fontFace: "Cambria", margin: 0 });
  s.addText("Six Methods, One Training Loop", { x: 0.9, y: 3.0, w: 11.5, h: 0.7, fontSize: 30, color: "8FD4E8", fontFace: "Cambria", margin: 0 });
  s.addText("Read through huggingface/trl \u2014 the library where SFT, reward modeling, DPO, KTO, GRPO and RLOO all live side by side, one trainer class each.",
    { x: 0.9, y: 4.0, w: 10.6, h: 0.8, fontSize: 15, color: "9FC3D9", fontFace: "Calibri", lineSpacingMultiple: 1.25 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.9, y: 5.05, w: 10.6, h: 0.75, rectRadius: 0.06, fill: { color: MIDNIGHT } });
  s.addText("How we'll get there: six background ideas first \u2014 no tool names \u2014 then the repository, and finally the one question that organizes all of it.",
    { x: 1.15, y: 5.05, w: 10.1, h: 0.75, fontSize: 12, color: ICE, fontFace: "Calibri", valign: "middle", margin: 0 });
  footerBrand(s, true);
}

/* ===================== 2 · PREVIEW / TEASER ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Where We're Headed");
  title(s, "What TRL Is, in One Paragraph");

  card(s, 0.6, 1.85, 7.5, 2.05);
  body(s, [
    { text: "TRL is a Python library for post-training language models. ", options: { bold: true, color: INK } },
    { text: "It packages each major post-training method as its own trainer class \u2014 you hand it a model and a dataset in the shape that method expects, and it runs the training loop. Its real teaching value is that all the methods sit in one directory, written against one interface, so the differences between them can be inspected directly, with everything else held constant.", options: { color: MUTE } },
  ], 0.95, 2.1, 6.8, 1.6, { fontSize: 12.5, ls: 1.3 });

  card(s, 8.4, 1.85, 4.3, 2.05, "16385A");
  iconChip(s, "signal", 8.75, 2.15, 0.55, TEAL);
  body(s, "The next six slides won't mention TRL at all. They build the ideas the library is organized around. We'll come back to the paragraph on the left once they're in place.", 8.75, 2.9, 3.6, 0.9, { fontSize: 11.5, color: "9FC3D9", ls: 1.25 });

  // The organizing question, previewed as a strip
  s.addText("The question that organizes everything that follows:", { x: 0.6, y: 4.15, w: 12.1, h: 0.35, fontSize: 12, bold: true, color: INK, fontFace: "Calibri" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.6, w: 12.1, h: 0.85, rectRadius: 0.08, fill: { color: DEEPBLUE } });
  s.addText("Where does the training signal come from?", { x: 0.6, y: 4.6, w: 12.1, h: 0.85, fontSize: 22, bold: true, color: OFFWHITE, fontFace: "Cambria", align: "center", valign: "middle", margin: 0 });

  const three = [
    ["cap", "A demonstration", "Someone wrote down the answer you want. Copy it."],
    ["balance", "A judgment", "Someone said which of two answers is better. Learn the preference."],
    ["check", "A verifier", "A program can check the answer. Let it score."],
  ];
  three.forEach(([ic, h, b], i) => {
    const x = 0.6 + i * 4.13;
    card(s, x, 5.58, 3.85, 1.32);
    iconChip(s, ic, x + 0.25, 5.76, 0.5, DEEPBLUE);
    s.addText(h, { x: x + 0.9, y: 5.76, w: 2.8, h: 0.5, fontSize: 15, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, b, x + 0.25, 6.30, 3.35, 0.5, { fontSize: 11, ls: 1.1 });
  });
  footerBrand(s); addSlideNumber(s, 2);
}

/* ===================== 3 · BG: THE SIGNAL ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 1 of 6");
  title(s, "Three Kinds of Training Signal");
  body(s, "Pretraining has exactly one signal: the next token in the corpus. Everything after pretraining has to get its signal from somewhere else, and there are only a few places it can come from. Each choice implies a different kind of data, a different cost, and a different failure mode.",
    0.6, 1.55, 12.1, 0.65, { fontSize: 13.5, ls: 1.2 });

  const rows = [
    ["cap", "A demonstration", "A human (or a stronger model) wrote the response you want. Training copies it token by token.",
      "Cheap to train on, expensive to collect. Caps out at the quality of whoever wrote the demonstrations \u2014 the model can imitate the target, not exceed it.", DEEPBLUE],
    ["balance", "A judgment", "Nobody wrote the ideal answer, but someone compared two candidate answers and said which was better. Comparisons are far easier to elicit than gold responses.",
      "A discrete comparison has to become a continuous signal before it can be optimized. One route is to fit a scalar scorer to the comparisons and then optimize against that scorer. The other is to optimize the comparisons directly, never fitting a scorer at all \u2014 that choice is what separates the two large families of preference methods.", TEAL],
    ["check", "A verifier", "The task has a checkable answer: the equation balances, the unit test passes, the output parses. A program decides.",
      "Costless to evaluate, deterministic, and substantially more robust to reward hacking than a learned judge, since there is no fitted approximation to exploit. Not immune \u2014 a loosely specified check can be satisfied without solving the task \u2014 and available only where correctness is mechanically decidable.", MIDNIGHT],
  ];
  let y = 2.35;
  rows.forEach(([ic, h, b, note, col]) => {
    card(s, 0.6, y, 12.1, 1.42);
    iconChip(s, ic, 0.9, y + 0.42, 0.58, col);
    s.addText(h, { x: 1.68, y: y + 0.18, w: 3.0, h: 0.42, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, b, 1.68, y + 0.62, 3.1, 0.7, { fontSize: 9.5, ls: 1.15 });
    s.addShape(pres.shapes.LINE, { x: 5.0, y: y + 0.2, w: 0, h: 1.02, line: { color: "C9D8E0", width: 1 } });
    body(s, note, 5.25, y + 0.22, 7.2, 1.0, { fontSize: 11.5, ls: 1.25, valign: "middle" });
    y += 1.55;
  });
  footerBrand(s); addSlideNumber(s, 3);
}

/* ===================== 4 · BG: REWARD MODELS ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 2 of 6");
  title(s, "Reward Models — Fitting a Judge to Comparisons");
  body(s, "A comparison is discrete \u2014 A beat B. Optimization wants a continuous score. A reward model is the bridge: a copy of the network with its language-modeling head replaced by a single scalar output, trained so that better responses score higher.",
    0.6, 1.55, 12.1, 0.6, { fontSize: 13.5, ls: 1.2 });

  card(s, 0.6, 2.3, 5.9, 2.5);
  s.addText("How it's trained", { x: 0.95, y: 2.5, w: 5.2, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri" });
  const steps = [
    "Show the model both responses to the same prompt.",
    "Get a scalar out for each: r(chosen), r(rejected).",
    "Push the gap between them to be large and positive.",
    "That's it \u2014 there is no target value for either score.",
  ];
  steps.forEach((t, i) => {
    const yy = 2.95 + i * 0.42;
    s.addShape(pres.shapes.OVAL, { x: 0.95, y: yy + 0.02, w: 0.26, h: 0.26, fill: { color: DEEPBLUE } });
    s.addText(String(i + 1), { x: 0.95, y: yy + 0.02, w: 0.26, h: 0.26, fontSize: 9, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    body(s, t, 1.35, yy, 4.9, 0.38, { fontSize: 10.5 });
  });

  card(s, 6.8, 2.3, 5.9, 2.5, "16385A");
  s.addText("Only the difference is learned", { x: 7.15, y: 2.5, w: 5.2, h: 0.35, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  body(s, "Because the objective only ever sees r(chosen) \u2212 r(rejected), the absolute scale is arbitrary. Add 100 to every score and the loss is unchanged. A reward model tells you the ordering of responses, never their intrinsic worth \u2014 which is exactly why its numbers are meaningless across two separately-trained reward models.",
    7.15, 2.95, 5.25, 1.6, { fontSize: 11.5, color: "9FC3D9", ls: 1.25 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.05, w: 12.1, h: 1.55, rectRadius: 0.08, fill: { color: "FDF3E3" } });
  iconChip(s, "warning_teal", 0.95, 5.35, 0.5, OFFWHITE);
  s.addText("The failure mode that defines this whole field", { x: 1.6, y: 5.28, w: 8, h: 0.4, fontSize: 13, bold: true, color: "8A5A12", fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, [
    { text: "A reward model is a learned approximation of human judgment, fitted to a finite sample. Optimize hard enough against it and the policy finds inputs where the approximation and the judgment come apart \u2014 responses that score beautifully and are bad. This is " },
    { text: "reward hacking", options: { bold: true } },
    { text: ", and it is the reason every method downstream carries some mechanism for not straying too far." },
  ], 1.6, 5.72, 10.8, 0.75, { fontSize: 11.5, color: "6B4A12", ls: 1.2 });
  footerBrand(s); addSlideNumber(s, 4);
}

/* ===================== 5 · BG: DATA FORMATS ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 3 of 6");
  title(s, "Feedback Data Formats");
  body(s, "Before any algorithm runs, the feedback has to be written down, and it takes only a handful of formats. In practice this is the first constraint that binds: the format you already have rules most of the field out before any other consideration is reached.",
    0.6, 1.55, 12.1, 0.6, { fontSize: 13.5, ls: 1.2 });

  const shapes = [
    ["file", "Full text", "One field: the finished text. No notion of who produced it or whether it was good.", ["{ text }"], DEEPBLUE,
      "Used by: supervised fine-tuning"],
    ["balance", "Paired", "Same prompt, two responses, one marked better. The classic comparison.", ["{ prompt,", "  chosen,", "  rejected }"], TEAL,
      "Used by: reward modeling, direct preference methods"],
    ["check", "Unpaired", "One response, a thumbs up or down. No partner to compare against.", ["{ prompt,", "  completion,", "  label }"], MIDNIGHT,
      "Used by: unpaired preference methods"],
    ["signal", "Prompt only", "Just the question. No response at all \u2014 the model has to produce its own.", ["{ prompt }"], "1E7A5F",
      "Used by: on-policy RL methods"],
  ];
  shapes.forEach(([ic, h, b, code, col, users], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 2.35, 2.85, 4.0);
    iconChip(s, ic, x + 0.25, 2.6, 0.55, col);
    s.addText(h, { x: x + 0.25, y: 3.28, w: 2.35, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    body(s, b, x + 0.25, 3.66, 2.35, 0.95, { fontSize: 10.5, ls: 1.2 });
    codeBlock(s, code, x + 0.25, 4.7, 2.35, 1.15, 9.5);
    body(s, users, x + 0.25, 5.92, 2.35, 0.4, { fontSize: 9, color: col, bold: true, ls: 1.1 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.45, w: 12.1, h: 0.5, rectRadius: 0.06, fill: { color: ICE } });
  body(s, "Notice the last one carries no answer at all. Any method that trains on prompt-only data must generate its own responses first \u2014 which is what makes it expensive, and which is the subject of the next slide.",
    0.85, 6.45, 11.6, 0.5, { fontSize: 11, color: DEEPBLUE, valign: "middle", margin: 0 });
  footerBrand(s); addSlideNumber(s, 5);
}

/* ===================== 6 · BG: ON- VS OFF-POLICY ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 4 of 6");
  title(s, "Whose Text Are You Learning From?");
  body(s, "A post-training method updates a model using some text and a score for that text. The pivotal question is who wrote the text: someone else, earlier \u2014 or the model itself, just now.",
    0.6, 1.55, 12.1, 0.55, { fontSize: 13.5, ls: 1.2 });

  const cols = [
    ["swap", "Off-policy", DEEPBLUE, [
      ["The text", [{ text: "Collected in advance and frozen", options: { bold: true, color: INK } }, { text: ". A fixed file on disk." }]],
      ["The loop", "Load a batch, compute a loss, step. Same shape as ordinary supervised training."],
      ["Cost", "One forward and backward pass per example. Predictable."],
      ["The catch", [{ text: "The data describes responses the model may no longer produce. As it " }, { text: "drifts", options: { bold: true, color: INK } }, { text: ", the corrections apply to a model that no longer exists." }]],
    ]],
    ["spin", "On-policy", MIDNIGHT, [
      ["The text", [{ text: "Generated during training", options: { bold: true, color: INK } }, { text: ", by the model being trained, from prompts alone." }]],
      ["The loop", "Generate several completions, score them, then step. Generation is inside the loop."],
      ["Cost", "Dominated by generation, not gradients \u2014 often many completions per prompt, per step."],
      ["The catch", [{ text: "Vastly more compute, and a moving target: the data distribution shifts every step, which is precisely what makes it " }, { text: "powerful and unstable", options: { bold: true, color: INK } }, { text: "." }]],
    ]],
  ];
  cols.forEach(([ic, h, col, rows], i) => {
    const x = 0.6 + i * 6.25;
    card(s, x, 2.3, 5.85, 4.15, i === 1 ? "EDF1FA" : CARD);
    iconChip(s, ic, x + 0.3, 2.55, 0.6, col);
    s.addText(h, { x: x + 1.05, y: 2.55, w: 4.5, h: 0.6, fontSize: 17, bold: true, color: INK, fontFace: "Cambria", valign: "middle", margin: 0 });
    let yy = 3.35;
    rows.forEach(([lab, txt]) => {
      s.addText(lab, { x: x + 0.3, y: yy, w: 1.25, h: 0.35, fontSize: 10.5, bold: true, color: col, fontFace: "Calibri", margin: 0 });
      body(s, txt, x + 1.6, yy, 3.95, 0.72, { fontSize: 10.5, ls: 1.18 });
      yy += 0.78;
    });
  });
  footerBrand(s); addSlideNumber(s, 6);
}

/* ===================== 7 · BG: VERIFIABLE REWARDS ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 5 of 6");
  title(s, "When You Can Skip the Judge Entirely");
  body(s, "A learned reward model exists because \u201cis this response good?\u201d has no closed form. But for a large and growing class of tasks it does: the arithmetic is right or wrong, the code compiles or doesn't, the output matches the required format or doesn't. There, the reward is a function you write.",
    0.6, 1.55, 12.1, 0.62, { fontSize: 13.5, ls: 1.2 });

  card(s, 0.6, 2.35, 6.0, 2.3);
  s.addText("What you give up", { x: 0.95, y: 2.55, w: 5.3, h: 0.35, fontSize: 14, bold: true, color: INK, fontFace: "Calibri" });
  body(s, "Coverage. A verifier can score a proof or a parser, and has nothing to say about whether a piece of writing is tactful, or a refusal was warranted, or an explanation was honest. The overwhelming majority of what we want from a model is not mechanically checkable.",
    0.95, 3.0, 5.3, 1.5, { fontSize: 11.5, ls: 1.25 });

  card(s, 6.9, 2.35, 5.8, 2.3, "16385A");
  s.addText("What you get", { x: 7.25, y: 2.55, w: 5.1, h: 0.35, fontSize: 14, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  body(s, [
    { text: "A signal that cannot be hacked in the reward-model sense", options: { bold: true, color: ICE } },
    { text: "*", options: { bold: true, color: "8FD4E8" } },
    { text: ", because there is no fitted approximation to exploit \u2014 the check is the ground truth. It costs nothing to evaluate, never needs retraining, and stays correct no matter how far the policy drifts." },
  ], 7.25, 3.0, 5.1, 1.5, { fontSize: 11.5, color: "9FC3D9", ls: 1.25 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.85, w: 12.1, h: 1.5, rectRadius: 0.08, fill: { color: MINTBG } });
  iconChip(s, "check_teal", 0.95, 5.12, 0.5, OFFWHITE);
  s.addText("Why this reorganized the field", { x: 1.6, y: 5.05, w: 8, h: 0.4, fontSize: 13, bold: true, color: "14533D", fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, "Verifiable rewards made it practical to run reinforcement learning on language models at scale without a reward model in the loop at all \u2014 no preference data to collect, no learned judge to drift. Reasoning-focused training runs lean on this heavily, because mathematics and code are exactly the domains where a checker is easy to write.",
    1.6, 5.48, 10.8, 0.8, { fontSize: 11.5, color: "14533D", ls: 1.22 });

  body(s, [
    { text: "* Not immune, only differently exposed. ", options: { bold: true, color: INK } },
    { text: "Removing the learned judge removes one class of exploit and creates another: a check that can be satisfied without solving the task relocates the hacking into the checker itself. Worked through, with a real example, on slide 18." },
  ], 0.6, 6.45, 12.1, 0.45, { fontSize: 10.5, ls: 1.15, valign: "middle", margin: 0 });
  footerBrand(s); addSlideNumber(s, 7);
}

/* ===================== 8 · BG: REFERENCE MODEL / KL ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Background \u00b7 6 of 6");
  title(s, "The Anchor Prices Change, It Doesn't Forbid It", INK, { fontSize: 28 });
  body(s, "Changing the model is the point of training, so a penalty on change needs justifying. The justification: what is being optimized is not what you want but a proxy for it, and the proxy is only trustworthy near the text it was built from.",
    0.6, 1.55, 12.1, 0.6, { fontSize: 13.5, ls: 1.2 });

  // Diagram: policy vs frozen reference
  card(s, 0.6, 2.25, 12.1, 1.75);
  const dY = 2.5;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.1, y: dY, w: 3.0, h: 1.05, rectRadius: 0.08, fill: { color: DEEPBLUE } });
  s.addText("Policy\n(training)", { x: 1.1, y: dY, w: 3.0, h: 1.05, fontSize: 13, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: dY, w: 3.0, h: 1.05, rectRadius: 0.08, fill: { color: MUTE } });
  s.addText("Reference\n(frozen copy of the model as it entered this stage)", { x: 9.2, y: dY, w: 3.0, h: 1.05, fontSize: 11, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.45, y: dY + 0.21, w: 4.4, h: 0.62, rectRadius: 0.06, fill: { color: ICE } });
  s.addText("penalty \u221d divergence between them", { x: 4.45, y: dY + 0.21, w: 4.4, h: 0.62, fontSize: 12, bold: true, color: DEEPBLUE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
  body(s, "Both score the same text. The penalty grows with the distance between the two token distributions \u2014 over the output distribution as a whole, not over any particular topic.", 1.1, 3.6, 11.1, 0.32, { fontSize: 10.5, align: "center" });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.1, w: 12.1, h: 1.15, rectRadius: 0.08, fill: { color: MINTBG } });
  s.addText("So isn't it stopping the model from learning?", { x: 0.95, y: 4.18, w: 11.4, h: 0.34, fontSize: 12.5, bold: true, color: "14533D", fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, "It does not forbid change; it prices it. A gain now has to be worth the divergence it costs. What that rules out is the cheap kind of change \u2014 the policy discovering text the scorer rates highly and a reader would not, which is precisely the region the scorer was never fitted on. Read it as a trust region for the proxy, not as a target to stay at.",
    0.95, 4.54, 11.4, 0.62, { fontSize: 11, color: "14533D", ls: 1.2 });

  const notes = [
    ["The knob", "A coefficient, conventionally \u03b2, sets the exchange rate. Large \u03b2 and the model barely moves; at zero the term vanishes and nothing in the loss bounds the drift. It is a dial, not a switch, and its useful value is found empirically."],
    ["The cost", "A second full copy of the model in memory, and a second forward pass per batch \u2014 unless the method can avoid materializing it, which some can."],
    ["The blunt instrument", "It cannot separate useful drift from harmful drift: it is one scalar over the whole distribution. You cannot ask it to hold register fixed while letting reasoning improve. That selectivity is exactly what it does not have."],
  ];
  notes.forEach(([h, b], i) => {
    const x = 0.6 + i * 4.13;
    card(s, x, 5.35, 3.85, 1.5, i === 2 ? "EDF1FA" : CARD);
    s.addText(h, { x: x + 0.25, y: 5.46, w: 3.35, h: 0.3, fontSize: 12, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    body(s, b, x + 0.25, 5.78, 3.35, 1.0, { fontSize: 9.5, ls: 1.16 });
  });
  footerBrand(s); addSlideNumber(s, 8);
}

/* ===================== 9 · BRIDGE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Coming Back to It", "8FD4E8");
  title(s, "Six Ideas, and Where Each One Surfaces", OFFWHITE);
  body(s, "Each background idea has a specific address in the repository.",
    0.6, 1.55, 12.1, 0.4, { fontSize: 12.5, color: "9FC3D9" });

  const bridge = [
    ["3", "Three kinds of signal", "The organizing axis of the whole library \u2014 it's why there are six trainer classes and not one."],
    ["4", "Reward models", "RewardTrainer, and its loss is a single line you can read on slide 17."],
    ["5", "Data formats", "The documented trainer\u2192dataset-type table. Choosing a method is mostly choosing a data format."],
    ["6", "On- vs off-policy", "Visible structurally: which trainers generate inside the training step and which don't."],
    ["7", "Verifiable rewards", "trl/rewards/ \u2014 reward functions shipped as ordinary Python, passed straight to a trainer."],
    ["8", "The anchor", "A \u03b2 parameter on nearly every config, and compute_ref_log_probs() on the offline trainers."],
  ];
  let y = 2.15;
  bridge.forEach(([n, concept, where]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.63, rectRadius: 0.06, fill: { color: MIDNIGHT } });
    s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + 0.13, w: 0.42, h: 0.42, fill: { color: TEAL } });
    s.addText(n, { x: 0.85, y: y + 0.13, w: 0.42, h: 0.42, fontSize: 12, bold: true, color: OFFWHITE, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(concept, { x: 1.45, y, w: 3.3, h: 0.63, fontSize: 12, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, where, 4.9, y, 7.6, 0.63, { fontSize: 10.5, color: "9FC3D9", valign: "middle", margin: 0, ls: 1.1 });
    y += 0.72;
  });

  s.addText("From here on, slides carry a green pill like this one when they lean on something taught above.",
    { x: 0.6, y: 6.5, w: 8.3, h: 0.35, fontSize: 10.5, italic: true, color: "8FA8C2", fontFace: "Calibri", valign: "middle", margin: 0 });
  backRef(s, 4, "Reward models", 9.1, 6.52, 3.6);
  footerBrand(s, true); addSlideNumber(s, 9);
}

/* ===================== 10 · WHAT IS TRL ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Tool");
  title(s, "TRL \u2014 Transformer Reinforcement Learning");
  body(s, [
    { text: "Maintained by Hugging Face. The README describes it as ", options: { color: MUTE } },
    { text: "\u201ca comprehensive library to post-train foundation models\u201d", options: { color: INK, italic: true } },
    { text: " \u2014 a wider claim than the name makes. RL is one family of post-training methods, and several trainers here involve none of it. The acronym records where the project started, not what it covers.", options: { color: MUTE } },
  ], 0.6, 1.55, 12.1, 0.6, { fontSize: 13.5, ls: 1.2 });

  const facts = [
    ["cubes", "Six stable trainers", "SFT, Reward, DPO, KTO, GRPO, RLOO \u2014 one class each, plus a matching config dataclass.", DEEPBLUE],
    ["layers", "Built on Transformers", "Each trainer is a thin subclass of the Transformers Trainer, so Accelerate, DeepSpeed, FSDP and PEFT all work unchanged.", TEAL],
    ["branch", "Apache 2.0, version 1.10.0.dev0", "Past its 1.0, with a written migration guide for the v0\u2192v1 breaking changes.", MIDNIGHT],
    ["chip", "Actively moving", "Commits land daily. 86 issues were open on 8 August 2026, when this deck was last checked against the repository. Verify specifics against the source.", "1E7A5F"],
  ];
  facts.forEach(([ic, h, b, col], i) => {
    const x = 0.6 + (i % 2) * 6.25, y = 2.35 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 5.85, 1.55);
    iconChip(s, ic, x + 0.28, y + 0.28, 0.55, col);
    s.addText(h, { x: x + 1.0, y: y + 0.28, w: 4.6, h: 0.55, fontSize: 13.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, b, x + 0.28, y + 0.92, 5.3, 0.55, { fontSize: 10.5, ls: 1.18 });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.95, w: 12.1, h: 0.72, rectRadius: 0.06, fill: { color: ICE } });
  body(s, "What makes it a good object of study, as opposed to a good dependency: the methods aren't scattered across six research repos with six conventions. They're in one directory, written against one interface, which makes the differences between them legible instead of anecdotal.",
    0.85, 5.95, 11.6, 0.72, { fontSize: 11.5, color: DEEPBLUE, valign: "middle", margin: 0, ls: 1.15 });
  footerBrand(s); addSlideNumber(s, 10);
}

/* ===================== 11 · WHAT THE ACRONYMS MEAN ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Decoding the Names");
  title(s, "What the Acronyms Stand For");
  body(s, "The library's own name expands to Transformer Reinforcement Learning. Its trainers are named on the same principle: each name records the one idea that distinguishes that method from its neighbours, which makes the list a compressed summary of the whole field.",
    0.6, 1.5, 12.1, 0.45, { fontSize: 12.5, ls: 1.15 });

  const names = [
    ["SFT", "Supervised Fine-Tuning", DEEPBLUE,
      "Supervised because every example carries its own target text; fine-tuning because it adjusts an already-pretrained model rather than training one from scratch."],
    ["RM", "Reward Model", TEAL,
      "Named for what it emits: a scalar reward, one number per response. It scores text; it does not produce any."],
    ["DPO", "Direct Preference Optimization", TEAL,
      "Direct because it optimizes the preference pairs themselves, removing the intermediate step of first fitting a reward model and then optimizing against it."],
    ["KTO", "Kahneman–Tversky Optimization", TEAL,
      "After the prospect-theory model of human utility. People weigh losses more heavily than equivalent gains, so desirable and undesirable examples enter the loss asymmetrically."],
    ["GRPO", "Group Relative Policy Optimization", MIDNIGHT,
      "Several completions are sampled per prompt; each one's advantage is its reward minus the mean of that group. The group is the baseline — hence group relative."],
    ["RLOO", "REINFORCE Leave-One-Out", MIDNIGHT,
      "REINFORCE is the classical policy-gradient estimator. Each sample's baseline is the mean reward of its siblings with itself excluded — leave one out."],
    ["PPO", "Proximal Policy Optimization", MUTE,
      "Proximal because each update is clipped to stay close to the policy that generated the data. Long treated as the canonical RLHF algorithm; in this library it is experimental."],
  ];
  names.forEach(([ac, full, col, why], i) => {
    const x = 0.6 + (i % 2) * 6.25, y = 2.05 + Math.floor(i / 2) * 1.22;
    card(s, x, y, 5.85, 1.15);
    s.addText(ac, { x: x + 0.25, y: y + 0.12, w: 1.05, h: 0.34, fontSize: 15, bold: true, color: col, fontFace: "Courier New", valign: "middle", margin: 0 });
    s.addText(full, { x: x + 1.4, y: y + 0.12, w: 4.3, h: 0.34, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, why, x + 0.25, y + 0.5, 5.35, 0.58, { fontSize: 9.5, ls: 1.14 });
  });

  // Eighth cell: the caveat, in the slot the seventh acronym leaves free.
  {
    const x = 0.6 + 6.25, y = 2.05 + 3 * 1.22;
    card(s, x, y, 5.85, 1.15, "FDF3E3");
    iconChip(s, "warning_teal", x + 0.25, y + 0.28, 0.42, OFFWHITE);
    s.addText("An expansion is not a citation", { x: x + 0.82, y: y + 0.12, w: 4.85, h: 0.34, fontSize: 12.5, bold: true, color: "8A5A12", fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, "TRL's own paper_index.md heads the DPO section “Direct Policy Optimization”. The paper it links to on the next line is titled Direct Preference Optimization. Names drift even inside the repository that implements them.",
      x + 0.82, y + 0.5, 4.78, 0.58, { fontSize: 9.5, ls: 1.14, color: "6B4A12" });
  }
  footerBrand(s); addSlideNumber(s, 11);
}
/* ===================== 12 · USE CASES ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "What It's Actually For");
  title(s, "Where You'd Reach For This");

  const uses = [
    ["cap", "Teaching a format", "You need a model that answers in your schema, your tone, your citation style. SFT on a few thousand examples. The most common real use, and the least glamorous.", DEEPBLUE],
    ["balance", "Aligning to taste", "You have thumbs-up/down from users or annotators and want the model to internalize it. DPO if the feedback is paired; KTO if it isn't.", TEAL],
    ["check", "Training reasoning", "The task has checkable answers \u2014 maths, code, structured extraction. GRPO with a verifier, no preference data collected at all.", MIDNIGHT],
    ["balance", "Building a judge", "Sometimes the reward model is the product: an automatic evaluator to rank outputs or filter a dataset. RewardTrainer alone, no policy training.", "1E7A5F"],
    ["code", "Reading it to learn", "Six implementations of one interface is a rare teaching object. Diffing two compute_loss functions teaches more than most papers about how the methods differ.", DEEPBLUE],
    ["chip", "A baseline to modify", "Subclass a trainer, override the loss, keep every piece of distributed plumbing. This is what trl/experimental/ is \u2014 the library's own extension mechanism, used in public.", TEAL],
  ];
  uses.forEach(([ic, h, b, col], i) => {
    const x = 0.6 + (i % 3) * 4.13, y = 1.85 + Math.floor(i / 3) * 2.45;
    card(s, x, y, 3.85, 2.25);
    iconChip(s, ic, x + 0.25, y + 0.25, 0.55, col);
    s.addText(h, { x: x + 0.25, y: y + 0.92, w: 3.35, h: 0.38, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", margin: 0 });
    body(s, b, x + 0.25, y + 1.32, 3.35, 0.85, { fontSize: 10.5, ls: 1.2 });
  });
  footerBrand(s); addSlideNumber(s, 12);
}

/* ===================== 13 · REPOSITORY STRUCTURE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Orientation");
  title(s, "Repository Structure");
  body(s, "The real listing at the repository root, and one level into the package. Four paths carry this lesson; they're highlighted.",
    0.6, 1.55, 12.1, 0.4, { fontSize: 12.5 });

  const tree = [
    ["huggingface/trl", 0],
    ["\u251c\u2500\u2500 docs/            ", 1, "Every trainer has a page here \u2014 including paper_index.md"],
    ["\u251c\u2500\u2500 examples/        ", 1, "Runnable scripts, notebooks and accelerate configs"],
    ["\u251c\u2500\u2500 tests/           ", 1, "One test module per trainer"],
    ["\u2514\u2500\u2500 trl/             ", 1, "The package itself"],
    ["    \u251c\u2500\u2500 trainer/     ", 2, "The six stable trainers + their configs", true],
    ["    \u251c\u2500\u2500 experimental/", 2, "27 further methods, under a stability contract", true],
    ["    \u251c\u2500\u2500 rewards/     ", 2, "Verifiable reward functions, ready to pass in", true],
    ["    \u251c\u2500\u2500 scripts/     ", 2, "sft.py, dpo.py, grpo.py, kto.py, reward.py, rloo.py", true],
    ["    \u251c\u2500\u2500 models/      ", 2, "Model wrappers, create_reference_model()"],
    ["    \u251c\u2500\u2500 cli/         ", 2, "The trl command"],
    ["    \u2514\u2500\u2500 data_utils.py", 2, "apply_chat_template, pack_dataset, unpair_preference_dataset"],
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.1, w: 5.6, h: 4.5, rectRadius: 0.08, fill: { color: NAVY } });
  let ty = 2.32;
  tree.forEach(([label, depth, , hot]) => {
    if (hot) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.75, y: ty - 0.03, w: 5.3, h: 0.32, rectRadius: 0.04, fill: { color: "16385A" } });
    s.addText(label, { x: 0.85, y: ty, w: 5.2, h: 0.28, fontSize: 10.5, color: hot ? "8FD4E8" : (depth === 0 ? OFFWHITE : "9FC3D9"), bold: hot || depth === 0, fontFace: "Courier New", margin: 0, valign: "middle" });
    ty += 0.35;
  });

  let ay = 2.1;
  tree.filter((t) => t[2]).forEach(([label, , note, hot]) => {
    const name = label.replace(/[\u2502\u251c\u2514\u2500\s]/g, "");
    s.addText(name, { x: 6.55, y: ay, w: 2.2, h: 0.34, fontSize: 10, color: hot ? DEEPBLUE : MUTE, bold: hot, fontFace: "Courier New", valign: "middle", margin: 0 });
    body(s, note, 8.75, ay, 3.95, 0.34, { fontSize: 10, valign: "middle", margin: 0, color: hot ? INK : MUTE });
    ay += 0.4;
  });
  footerBrand(s); addSlideNumber(s, 13);
}

/* ===================== 14 · CORE ABSTRACTION ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Central Idea");
  title(s, "One Training Loop, Six Losses");
  pathTag(s, "trl/trainer/base_trainer.py", 9.6, 0.85, 3.1, false);
  body(s, "Read the trainer directory and the same shape appears six times. Every stable trainer subclasses the same private base, which itself subclasses the Transformers Trainer. None of them reimplements batching, checkpointing, logging, or distribution. What each one actually contributes is an override of compute_loss().",
    0.6, 1.55, 12.1, 0.62, { fontSize: 13.5, ls: 1.2 });

  codeBlock(s, [
    "class _BaseTrainer(Trainer):        # trl/trainer/base_trainer.py",
    "    ...",
    "",
    "class SFTTrainer(_BaseTrainer):     # sft_trainer.py",
    "    def compute_loss(self, model, inputs, ...):  ...",
    "",
    "class RewardTrainer(_BaseTrainer):  # reward_trainer.py",
    "    def compute_loss(self, model, inputs, ...):  ...",
    "",
    "class DPOTrainer(_BaseTrainer):     # dpo_trainer.py",
    "    def compute_ref_log_probs(self, model, inputs):  ...",
    "    def compute_loss(self, model, inputs, ...):  ...",
  ], 0.6, 2.35, 7.3, 3.15, 10.5);

  card(s, 8.2, 2.35, 4.5, 3.15, "16385A");
  s.addText("Why this matters for reading it", { x: 8.5, y: 2.55, w: 3.9, h: 0.4, fontSize: 13.5, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  body(s, "You do not have to understand six training loops. There is one loop, inherited. The entire intellectual content of a method \u2014 what it thinks a good response is and how it pushes the model toward one \u2014 lives in that one overridden function.\n\nSo the way to read this library is to open two trainers and diff their compute_loss. Everything else is shared scaffolding.",
    8.5, 3.05, 3.9, 2.3, { fontSize: 11.5, color: "9FC3D9", ls: 1.28 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.7, w: 12.1, h: 0.72, rectRadius: 0.06, fill: { color: ICE } });
  body(s, "There is a second override worth watching for: training_step(). On four of the six it's a thin wrapper that calls super(). On the other two it isn't \u2014 and that difference is the whole on-policy story, made visible in the class definitions. We'll come back to it on slide 19.",
    0.85, 5.7, 11.6, 0.72, { fontSize: 11.5, color: DEEPBLUE, valign: "middle", margin: 0, ls: 1.15 });
  footerBrand(s); addSlideNumber(s, 14);
}

/* ===================== 15 · THE SIX TRAINERS ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Taxonomy");
  title(s, "Six Trainers, Sorted by Signal Source");
  backRef(s, 3, "Three kinds of signal", 8.95, 1.55, 3.75);
  body(s, "Dataset types below are the library's own documented requirements, not a paraphrase \u2014 they come from the trainer\u2192dataset-type table in the docs.",
    0.6, 1.5, 8.2, 0.4, { fontSize: 11.5 });

  const hdr = ["Trainer", "Expected dataset", "Signal", "What the loss rewards"];
  const widths = [2.05, 2.55, 1.85, 5.65];
  let x0 = 0.6;
  hdr.forEach((h, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x0, y: 2.12, w: widths[i] - 0.08, h: 0.42, rectRadius: 0.04, fill: { color: DEEPBLUE } });
    s.addText(h, { x: x0 + 0.12, y: 2.12, w: widths[i] - 0.3, h: 0.42, fontSize: 10.5, bold: true, color: OFFWHITE, fontFace: "Calibri", valign: "middle", margin: 0 });
    x0 += widths[i];
  });

  // Row fill encodes the signal source: the three background categories from slide 3.
  const SIG = {
    Demonstration: { fill: "E4EFF8", ink: DEEPBLUE },
    Judgment:      { fill: "E4F4EC", ink: "14533D" },
    "Verifier or RM": { fill: "E9E8F6", ink: MIDNIGHT },
  };

  const rows = [
    ["SFTTrainer", "Language modeling\nor prompt-completion", "Demonstration", "Reproducing the reference text token by token. The plain fine-tuning objective."],
    ["RewardTrainer", "Preference\n(implicit prompt)", "Judgment", "Scoring the preferred response above the other. Trains a judge, not a generator."],
    ["DPOTrainer", "Preference\n(explicit prompt)", "Judgment", "Raising the chosen response's likelihood relative to the rejected one, measured against the frozen reference. No reward model."],
    ["KTOTrainer", "Unpaired preference\nor preference", "Judgment", "Same goal, from a thumbs up or down on a single response. Drops the requirement that feedback come in pairs."],
    ["GRPOTrainer", "Prompt-only", "Verifier or RM", "Completions that beat their own group's average on the same prompt. The group is the baseline."],
    ["RLOOTrainer", "Prompt-only", "Verifier or RM", "The same idea with a leave-one-out baseline \u2014 each sample is compared against the mean of its siblings."],
  ];
  let y = 2.64;
  rows.forEach((r) => {
    const h = 0.58;
    const sig = SIG[r[2]];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h, rectRadius: 0.05, fill: { color: sig.fill } });
    let cx = 0.6;
    r.forEach((cell, ci) => {
      s.addText(cell, {
        x: cx + 0.12, y, w: widths[ci] - 0.3, h,
        fontSize: ci === 3 ? 9.5 : (ci === 1 ? 9 : 10.5),
        bold: ci === 0 || ci === 2, color: ci === 0 ? DEEPBLUE : (ci === 2 ? sig.ink : MUTE),
        fontFace: ci === 0 ? "Courier New" : "Calibri", valign: "middle", margin: 0, lineSpacingMultiple: 1.05,
      });
      cx += widths[ci];
    });
    y += 0.63;
  });

  // Key: one swatch per signal source, matching the row fills above.
  const key = [
    ["Demonstration", "E4EFF8", DEEPBLUE, "the answer is in the dataset", 0.6, 3.15],
    ["Judgment", "E4F4EC", "14533D", "a preference is in the dataset", 3.85, 3.3],
    ["Verifier or RM", "E9E8F6", MIDNIGHT, "no response in the dataset \u2014 these two generate their own, then score it", 7.25, 5.45],
  ];
  key.forEach(([lab, fill, ink, note, kx, kw]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: kx, y: 6.48, w: 0.3, h: 0.3, rectRadius: 0.04, fill: { color: fill }, line: { color: ink, width: 0.75 } });
    s.addText([
      { text: lab + " \u00b7 ", options: { bold: true, color: ink } },
      { text: note, options: { color: MUTE, italic: true } },
    ], { x: kx + 0.4, y: 6.48, w: kw - 0.4, h: 0.3, fontSize: 9.5, fontFace: "Calibri", valign: "middle", margin: 0 });
  });
  footerBrand(s); addSlideNumber(s, 15);
}

/* ===================== 16 · DATASET TYPES ARE THE API ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Practical Constraint");
  title(s, "Your Data Chooses Your Method");
  backRef(s, 5, "Data formats", 9.9, 0.92, 2.8);
  body(s, "In practice you rarely pick a method and then go collect data for it. You have data, in some format, and that format rules most of the library out. These are the exact record formats the library documents.",
    0.6, 1.5, 8.9, 0.55, { fontSize: 12.5, ls: 1.2 });

  const specs = [
    ["Language modeling", "SFTTrainer", ['{"text": "The sky is blue."}'], DEEPBLUE],
    ["Preference", "RewardTrainer \u00b7 DPOTrainer", ['{"prompt": "The sky is",', ' "chosen": " blue.",', ' "rejected": " green."}'], TEAL],
    ["Unpaired preference", "KTOTrainer", ['{"prompt": "The sky is",', ' "completion": " blue.",', ' "label": True}'], MIDNIGHT],
    ["Prompt-only", "GRPOTrainer \u00b7 RLOOTrainer", ['{"prompt": "The sky is"}'], "1E7A5F"],
  ];
  let y = 2.12;
  specs.forEach(([name, users, code, col]) => {
    card(s, 0.6, y, 5.5, 0.98);
    s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + 0.36, w: 0.32, h: 0.32, fill: { color: col } });
    s.addText(name, { x: 1.32, y: y + 0.14, w: 4.5, h: 0.42, fontSize: 13, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    s.addText(users, { x: 1.32, y: y + 0.55, w: 4.5, h: 0.35, fontSize: 10, color: col, fontFace: "Courier New", valign: "middle", margin: 0 });
    codeBlock(s, code, 6.35, y, 6.35, 0.98, 10);
    y += 1.06;
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.4, w: 12.1, h: 0.52, rectRadius: 0.06, fill: { color: ICE } });
  body(s, "The library ships converters between most of these formats \u2014 unpair_preference_dataset() in data_utils.py turns a paired set into an unpaired one, for instance. Conversions that add information, though, don't exist: nothing turns prompt-only data into preference data.",
    0.85, 6.4, 11.6, 0.52, { fontSize: 10.5, color: DEEPBLUE, valign: "middle", margin: 0 });
  footerBrand(s); addSlideNumber(s, 16);
}

/* ===================== 17 · REWARD LOSS IN ONE LINE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Reading the Source");
  title(s, "reward_trainer.py", INK, { fontFace: "Courier New", fontSize: 28 });
  pathTag(s, "compute_loss()", 9.35, 0.85, 3.35, false);
  backRef(s, 4, "Reward models", 9.35, 1.28, 3.35);
  body(s, "Slide 4 described reward modeling in prose. Here it is as the library actually implements it \u2014 the arithmetic is smaller than the explanation.",
    0.6, 1.5, 8.5, 0.45, { fontSize: 12.5 });

  codeBlock(s, [
    "outputs = model(**inputs)",
    "",
    "# one scalar per response; the batch holds both, stacked",
    "rewards_chosen, rewards_rejected = torch.chunk(",
    "    outputs.logits.squeeze(-1), chunks=2)",
    "",
    "loss = -nn.functional.logsigmoid(",
    "    rewards_chosen - rewards_rejected).mean()",
  ], 0.6, 2.15, 7.0, 2.5, 11);

  card(s, 7.9, 2.15, 4.8, 2.5, "16385A");
  s.addText("What to notice", { x: 8.2, y: 2.35, w: 4.2, h: 0.35, fontSize: 13.5, bold: true, color: OFFWHITE, fontFace: "Calibri" });
  body(s, "Only the difference appears. Never an individual score, never a target value. The loss falls as the gap widens and can always fall further \u2014 there is no point at which the model is finished being right.\n\nThis is the reward-model scale-invariance from slide 4, visible in one expression.",
    8.2, 2.8, 4.2, 1.7, { fontSize: 11.5, color: "9FC3D9", ls: 1.28 });

  const notes = [
    ["squeeze(-1)", "The language-modeling head is gone. What comes out per response is one number, not a distribution over the vocabulary."],
    ["chunk(..., 2)", "Chosen and rejected travel through the network as one batch, then get split apart. Both are scored by the same weights in the same step."],
    ["Two optional terms", "A margin can be subtracted to demand a minimum gap, and center_rewards_coefficient can penalize scores drifting from zero \u2014 pinning down the arbitrary scale."],
  ];
  notes.forEach(([h, b], i) => {
    const x = 0.6 + i * 4.13;
    card(s, x, 4.85, 3.85, 1.75);
    s.addText(h, { x: x + 0.25, y: 5.0, w: 3.35, h: 0.32, fontSize: 11, bold: true, color: DEEPBLUE, fontFace: "Courier New", margin: 0 });
    body(s, b, x + 0.25, 5.38, 3.35, 1.1, { fontSize: 10.5, ls: 1.2 });
  });
  footerBrand(s); addSlideNumber(s, 17);
}

/* ===================== 18 · VERIFIABLE REWARD AS CODE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Reading the Source");
  title(s, "Verifiable Rewards");
  pathTag(s, "trl/rewards/format_rewards.py", 9.5, 0.85, 3.2, false);
  backRef(s, 7, "Verifiable rewards", 9.5, 1.28, 3.2);
  body(s, "The whole of think_format_reward: it checks that a completion wrapped its reasoning in the expected tags, and returns 1.0 or 0.0. No model, no training, no data.",
    0.6, 1.5, 8.6, 0.45, { fontSize: 12.5 });

  codeBlock(s, [
    "def think_format_reward(completions, **kwargs) -> list[float]:",
    "    pattern = r\"^<think>(?!.*<think>)(.*?)</think>.*$\"",
    "    contents = [c[0][\"content\"] for c in completions]",
    "    matches  = [re.match(pattern, c, re.DOTALL | re.MULTILINE)",
    "                for c in contents]",
    "    return [1.0 if m else 0.0 for m in matches]",
  ], 0.6, 2.15, 12.1, 1.95, 11.5);

  const notes = [
    ["signal", "It is just a function", "Any callable with this signature works. A reward function can shell out to a unit-test runner, a compiler, or a symbolic checker \u2014 the trainer only requires a list of floats back.", DEEPBLUE],
    ["stack", "They compose", "GRPOTrainer accepts a list of reward functions and sums them, so format compliance, correctness and a length penalty can each be a separate small function.", TEAL],
    ["warning", "This is where hacking moves", "Remove the learned judge and you have not removed the problem \u2014 you've moved it into the regex. A model can satisfy this checker with empty think tags. Verifiers are exploitable too; they're just exploitable in ways you can read.", MIDNIGHT],
  ];
  notes.forEach(([ic, h, b, col], i) => {
    const x = 0.6 + i * 4.13;
    card(s, x, 4.35, 3.85, 2.25, i === 2 ? "FDF3E3" : CARD);
    iconChip(s, ic, x + 0.25, 4.58, 0.5, col);
    s.addText(h, { x: x + 0.9, y: 4.58, w: 2.75, h: 0.5, fontSize: 12, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, b, x + 0.25, 5.2, 3.35, 1.25, { fontSize: 10.5, ls: 1.2, color: i === 2 ? "6B4A12" : MUTE });
  });
  footerBrand(s); addSlideNumber(s, 18);
}

/* ===================== 19 · OFFLINE VS ONLINE, IN THE CODE ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Structure as Evidence");
  title(s, "The On-Policy Split, Visible in the Class Bodies");
  backRef(s, 6, "On- vs off-policy", 9.6, 0.92, 3.1);
  body(s, "You don't need documentation to tell you which trainers generate. Compare what each class overrides and the split falls out on its own.",
    0.6, 1.5, 8.8, 0.45, { fontSize: 12.5 });

  card(s, 0.6, 2.1, 5.85, 3.5);
  iconChip(s, "swap", 0.9, 2.35, 0.55, DEEPBLUE);
  s.addText("SFT \u00b7 Reward \u00b7 DPO \u00b7 KTO", { x: 1.62, y: 2.35, w: 4.6, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  codeBlock(s, [
    "def training_step(self, *args, **kwargs):",
    "    with self.maybe_activation_offload_context:",
    "        return super().training_step(*args,",
    "                                     **kwargs)",
  ], 0.9, 3.05, 5.25, 1.35, 9.5);
  body(s, "A passthrough. It adds a memory-management context and hands straight back to the parent. Nothing happens here that wasn't already going to happen \u2014 the batch arrived complete from the dataset.",
    0.9, 4.55, 5.25, 0.95, { fontSize: 11, ls: 1.22 });

  card(s, 6.85, 2.1, 5.85, 3.5, "EDF1FA");
  iconChip(s, "spin", 7.15, 2.35, 0.55, MIDNIGHT);
  s.addText("GRPO \u00b7 RLOO", { x: 7.87, y: 2.35, w: 4.6, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  codeBlock(s, [
    "def _prepare_inputs(self, generation_batch):",
    "    ...",
    "    inputs = self._generate_and_score_completions(",
    "        generation_batch)",
    "",
    "def _calculate_rewards(self, inputs, prompts,",
    "                       completions, ...):",
  ], 7.15, 3.05, 5.25, 1.75, 9.5);
  body(s, "A real generation stage. The batch arrives as prompts only and has to be completed and scored before any gradient exists.",
    7.15, 4.95, 5.25, 0.55, { fontSize: 11, ls: 1.22 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.85, w: 12.1, h: 0.85, rectRadius: 0.06, fill: { color: ICE } });
  body(s, "The size difference says the same thing. grpo_trainer.py runs to roughly 3,400 lines, against 800\u20131,900 for every other trainer in the directory \u2014 and most of that excess is generation machinery: batching completions, sharing a vLLM server, masking, computing group-relative advantages.",
    0.85, 5.85, 11.6, 0.85, { fontSize: 11.5, color: DEEPBLUE, valign: "middle", margin: 0, ls: 1.18 });
  footerBrand(s); addSlideNumber(s, 19);
}

/* ===================== 20 · STABLE VS EXPERIMENTAL ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "The Frontier, as a Directory");
  title(s, "Stable and Experimental");
  body(s, "Alongside the six stable trainers sits trl/experimental/, holding twenty-seven further methods. The boundary between the two directories is a real, documented contract \u2014 and reading it is the fastest way to see which ideas the field has actually settled on.",
    0.6, 1.55, 12.1, 0.6, { fontSize: 13.5, ls: 1.2 });

  card(s, 0.6, 2.3, 5.85, 2.5);
  iconChip(s, "cubes", 0.9, 2.55, 0.55, DEEPBLUE);
  s.addText("trl/trainer/  \u2014  stable", { x: 1.62, y: 2.55, w: 4.5, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, "Six methods. Public API, deprecation cycles, maintained. Breaking changes are documented in MIGRATION.md before they ship.",
    0.9, 3.25, 5.25, 0.8, { fontSize: 11.5, ls: 1.22 });
  s.addText("SFT \u00b7 Reward \u00b7 DPO \u00b7 KTO \u00b7 GRPO \u00b7 RLOO", { x: 0.9, y: 4.15, w: 5.25, h: 0.4, fontSize: 10.5, color: DEEPBLUE, fontFace: "Courier New", margin: 0 });

  card(s, 6.85, 2.3, 5.85, 2.5, "EDF1FA");
  iconChip(s, "flask", 7.15, 2.55, 0.55, MIDNIGHT);
  s.addText("trl/experimental/  \u2014  volatile", { x: 7.87, y: 2.55, w: 4.5, h: 0.55, fontSize: 14, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, "May change or disappear in any release, including a patch. Maintainers explicitly do not commit to fixing issues here. Not for production.",
    7.15, 3.25, 5.25, 0.8, { fontSize: 11.5, ls: 1.22 });
  s.addText("ppo \u00b7 orpo \u00b7 cpo \u00b7 bco \u00b7 online_dpo \u00b7 xpo \u00b7 gkd \u00b7 prm \u00b7 \u2026", { x: 7.15, y: 4.15, w: 5.25, h: 0.4, fontSize: 10, color: MIDNIGHT, fontFace: "Courier New", margin: 0 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.0, w: 12.1, h: 1.6, rectRadius: 0.08, fill: { color: "FDF3E3" } });
  iconChip(s, "warning_teal", 0.95, 5.3, 0.5, OFFWHITE);
  s.addText("PPO is in the experimental directory", { x: 1.6, y: 5.23, w: 8, h: 0.4, fontSize: 13, bold: true, color: "8A5A12", fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, [
    { text: "The algorithm most tutorials still present as the canonical way to do RLHF is not part of this library's stable API, and its dataset requirement \u2014 pre-tokenized text \u2014 is unlike every other trainer's. Meanwhile KTO was promoted into stable only recently. Treat any external description of \u201cwhat TRL supports\u201d " },
    { text: "\u2014 including this slide, last checked against the repository on 8 August 2026 \u2014", options: { bold: true } },
    { text: " as a claim about one particular version, and check the directory yourself." },
  ], 1.6, 5.68, 10.8, 0.85, { fontSize: 11, color: "6B4A12", ls: 1.18 });
  footerBrand(s); addSlideNumber(s, 20);
}

/* ===================== 21 · LIMITATIONS ===================== */
{
  const s = pres.addSlide();
  s.background = { color: OFFWHITE };
  kicker(s, "Honest Caveats");
  title(s, "Limitations");
  body(s, "Some of these are the library's; most are the field's, and the library simply doesn't hide them.",
    0.6, 1.55, 12.1, 0.4, { fontSize: 12.5 });

  const lims = [
    ["chip", "It assumes you have GPUs", "Every stable trainer expects CUDA and real memory. The on-policy trainers additionally want vLLM \u2014 colocated in-process by default as of v1. Nothing here runs meaningfully on a laptop."],
    ["shuffleX", "The API moves under you", "v1 changed defaults (vllm_mode from server to colocate), renamed config values, and dropped the automatic None-stripping that trainers used to apply to datasets. A tutorial from a year ago will mislead you in specifics."],
    ["warning", "Thin wrappers leak", "Because each trainer is a light layer over the Transformers Trainer, failures often surface as Transformers, Accelerate or DeepSpeed errors with no obvious connection to the method you invoked."],
    ["signal", "Ease of use is not safety", "Four lines will start a GRPO run. Nothing in those four lines tells you whether your reward function is measuring what you meant, and a well-optimized wrong objective is worse than no training."],
    ["flask", "Most methods are experimental", "Six stable against twenty-seven experimental. If your paper's method is in this library, the odds favour it being in the volatile half."],
    ["code", "The algorithm is buried in infrastructure", "grpo_trainer.py is around 3,400 lines, with vLLM integration, distributed coordination and multimodal handling interleaved with the method itself. Locating the part that is the algorithm is a task in its own right."],
  ];
  lims.forEach(([ic, h, b], i) => {
    const x = 0.6 + (i % 2) * 6.25, y = 2.1 + Math.floor(i / 2) * 1.6;
    card(s, x, y, 5.85, 1.42);
    iconChip(s, ic === "shuffleX" ? "shuffle" : ic, x + 0.28, y + 0.25, 0.5, MIDNIGHT);
    s.addText(h, { x: x + 0.92, y: y + 0.22, w: 4.7, h: 0.4, fontSize: 12.5, bold: true, color: INK, fontFace: "Calibri", valign: "middle", margin: 0 });
    body(s, b, x + 0.28, y + 0.68, 5.3, 0.65, { fontSize: 10, ls: 1.15 });
  });
  footerBrand(s); addSlideNumber(s, 21);
}

/* ===================== 22 · CLOSING ===================== */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  kicker(s, "Wrapping Up", "8FD4E8");
  title(s, "Conclusion", OFFWHITE);

  card(s, 0.6, 1.75, 6.0, 2.4, MIDNIGHT);
  s.addText("The one-sentence version", { x: 0.9, y: 1.95, w: 5.4, h: 0.4, fontSize: 14, bold: true, color: "8FD4E8", fontFace: "Calibri" });
  body(s, "Post-training methods differ mainly in where their signal comes from and whether the model generates its own training data. Every other difference \u2014 the losses, the configs, the compute profiles \u2014 follows from those two choices.",
    0.9, 2.45, 5.4, 1.5, { fontSize: 12.5, color: ICE, ls: 1.3 });

  card(s, 6.9, 1.75, 5.8, 2.4, MIDNIGHT);
  s.addText("Resources", { x: 7.2, y: 1.95, w: 5.2, h: 0.4, fontSize: 14, bold: true, color: "8FD4E8", fontFace: "Calibri" });
  const links = [
    ["huggingface/trl", "https://github.com/huggingface/trl"],
    ["docs/source/paper_index.md \u2014 method \u2192 paper, with hyperparameters", "https://github.com/huggingface/trl/blob/main/docs/source/paper_index.md"],
    ["docs/source/dataset_formats.md \u2014 the trainer\u2192dataset table", "https://github.com/huggingface/trl/blob/main/docs/source/dataset_formats.md"],
  ];
  let ly = 2.45;
  links.forEach(([t, u]) => {
    s.addText([{ text: t, options: { hyperlink: { url: u }, color: "8FD4E8", underline: true, fontFace: "Calibri" } }],
      { x: 7.2, y: ly, w: 5.2, h: 0.5, fontSize: 10.5, valign: "middle", lineSpacingMultiple: 1.1 });
    ly += 0.53;
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.28, w: 12.1, h: 1.32, rectRadius: 0.08, fill: { color: "16385A" } });
  iconChip(s, "bulb", 0.95, 4.52, 0.5, TEAL);
  s.addText("A question to sit with", { x: 1.65, y: 4.45, w: 8, h: 0.36, fontSize: 13, bold: true, color: "8FD4E8", fontFace: "Calibri", valign: "middle", margin: 0 });
  body(s, "Every method here optimizes a proxy: a learned judge, a regex, a pair of human clicks. None of them can represent what we actually want. Given that, is the KL anchor a principled solution or an admission that we don't know how to specify the objective \u2014 and what would it mean to need it less?",
    1.65, 4.84, 10.75, 0.7, { fontSize: 11.5, color: ICE, ls: 1.22 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.7, w: 12.1, h: 0.62, rectRadius: 0.06, fill: { color: MIDNIGHT } });
  body(s, [
    { text: "Before you go: ", options: { bold: true, color: "8FD4E8" } },
    { text: "take ", options: { color: ICE } },
    { text: "quiz.py --mode post", options: { fontFace: "Courier New", color: "8FD4E8" } },
    { text: " to compare against your pre-lecture score, then work the assignment \u2014 Part 1 reads the repository at a terminal, Part 2 runs four trainers in the Kaggle notebook.", options: { color: ICE } },
  ], 0.95, 5.7, 11.4, 0.62, { fontSize: 11.5, valign: "middle", margin: 0, ls: 1.15 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.42, w: 12.1, h: 0.55, rectRadius: 0.06, fill: { color: MIDNIGHT } });
  body(s, "Next: Lecture 5 goes down one level, into grpo_trainer.py \u2014 policy gradients, group-relative advantage, and why the value network disappeared.",
    0.95, 6.42, 11.4, 0.55, { fontSize: 11.5, color: "9FC3D9", valign: "middle", margin: 0, bold: true });
  footerBrand(s, true); addSlideNumber(s, 22);
}

pres.writeFile({ fileName: OUT_FILE }).then(() => console.log(`deck written → ${OUT_FILE}`));
