# Lecture Deck Structure & Design System

Built with `pptxgenjs`. Read this whole file before writing a build script — most of the mistakes in this project so far were things this file now explicitly calls out.

## Series design system (keep consistent across every lecture)

```js
const NAVY = "0B2942";      // deep background navy
const MIDNIGHT = "21295C";  // accent
const DEEPBLUE = "065A82";  // primary
const TEAL = "1C7293";      // secondary
const ICE = "CFE8F0";       // light tint
const OFFWHITE = "FFFFFF";
const INK = "1B2733";       // body text on white
const MUTE = "5C7080";      // muted gray-blue
const CARD = "F2F8FA";      // light card fill
```

- Typography: Cambria for titles/headings, Calibri for body, Courier New for code/function-name citations.
- Layout: `LAYOUT_WIDE` (13.3 × 7.5in).
- Recurring elements: icon chips (colored circle + icon), small monospace "path tags" (file/function citations), "back-reference" pills (see below), a consistent footer (`TOOL NAME · AI SEMINAR, LECTURE N`) and slide-number pagination on every content slide.

## Critical bug: icon contrast

Icons live in two color variants: a plain/no-suffix version (rendered **white**) and a `_teal`-suffixed version (rendered **navy/dark blue**, `#065A82`). The `_teal` variant exists for placing a dark icon on a *light* background (e.g. a white circle on a light card). It is **not** for placing inside a colored circle sitting on a colored/dark background — a `_teal` icon on a navy or teal circle is nearly invisible (same color family, low contrast), and this bug shipped silently into a full deck before being caught on a later pass.

**Rule:** before calling the icon-chip helper, check the circle's fill color and the icon variant's rendered color are meaningfully different in lightness. On a colored circle, always use the plain/`_white` icon. On a white/light circle, use the `_teal` (or other colored) variant. When in doubt, render the icon PNG standalone and check its actual pixel color (not just its filename) — filenames in a hurriedly-generated icon set aren't a reliable guarantee of what actually got drawn.

If a needed icon doesn't exist in the right color yet, generate it (react-icons + sharp → PNG), don't reuse a wrong-contrast one out of convenience.

## Critical bug: unicode glyph rendering

Not every Unicode arrow or symbol renders identically through this pipeline. `→` (U+2192, rightwards arrow) renders fine via LibreOffice with Calibri. `↩` (U+21A9, leftwards arrow with hook) does not — it silently renders as a tofu box (empty rectangle) in the exact same font/pipeline, even though both are ordinary, common Unicode arrows. This is invisible to any purely textual check (`extract-text` won't catch it, since the character is technically "there" in the file) — only a rendered visual QA pass catches it.

**Rule:** for back-reference pills (see below) and any other decorative arrow, use `←` (U+2190, plain leftwards arrow) — confirmed to render correctly. If a different glyph is needed and hasn't been used in this project before, render one test slide with it and visually confirm before using it throughout a deck; don't assume a Unicode character renders correctly just because it displays fine in your own editor or terminal.

## Critical bug: a text box overflows upward as well as downward

`addText` boxes in this design system are vertically centred by default. A paragraph that grows from two lines to three does **not** simply extend downward into the whitespace below — it expands in both directions, and the extra half-line rises into the slide title. The result is a title and an intro paragraph that visibly collide, on a slide where nothing moved except one sentence getting longer.

This bit three slides in a single editing pass, each time because an intro paragraph was rewritten slightly longer without re-checking its line count.

**Rule:** when you lengthen any body paragraph, count the resulting lines against the box's `h`. If it now needs more room, either shorten the sentence (usually right — these are intros) or lower `y` *and* raise `h` together. Then look at the render: the symptom is a title with no breathing room beneath it, which is easy to dismiss as "dense" rather than recognized as overflow.

## Critical bug: diagonal line direction in hand-drawn diagrams

Any tree/node diagram drawn with `pres.shapes.LINE` (connecting two arbitrary points, e.g. a parent to a child at a different x and y) needs its `flipV` set correctly, or the line silently connects the *wrong* two corners of its bounding box.

pptxgenjs draws a `LINE` shape's default diagonal from the top-left to the bottom-right corner of its bounding box (`{x, y, w, h}`). A naive heuristic like `flipV: y2 < y1` happens to look correct for diagrams that only ever grow strictly left-to-right (every child's x is greater than its parent's x) — but it silently draws the *wrong* diagonal (crossing lines, or a line connecting empty space rather than the two actual node positions) as soon as a child can appear to the *left* of its parent, which is common in a centered, top-down tree layout where siblings fan out on both sides.

**Correct rule:** compute the bounding box as usual (`x: min(x1,x2), y: min(y1,y2), w: abs(dx), h: abs(dy)`), and set `flipV: true` exactly when `x1 > x2` (i.e., the target point is to the *left* of the source point) — the y-relationship doesn't matter for this decision. Test with a small tree that has at least one child branching to the left of its parent (not just a straight left-to-right layout) before trusting a connector-drawing helper.

```js
function connect(x1, y1, x2, y2) {
  const bx = Math.min(x1, x2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  const opts = { x: bx, y: Math.min(y1, y2), w, h, line: { color: "8FAAB8", width: 1.25 } };
  if (x1 > x2) opts.flipV = true;
  s.addShape(pres.shapes.LINE, opts);
}
```

## A recurring trap: differentiating one card among siblings

The pptx skill's rule against decorative accent stripes (thin colored bars along one edge of a slide or card) is easy to forget in one specific, recurring situation: wanting one card to visually read as "a different *kind* of thing" than the cards next to it — e.g., a background-concept card that works differently from its siblings, or a control that behaves differently from the others on a configuration slide. The instinct is to add a colored top-bar to mark it, which is exactly the pattern the pptx skill prohibits.

**Default fix:** give the differentiated card a distinct background *tint* (a light, different-hued fill) instead of a stripe, leaving the others on the standard card fill. This reads as intentional without tripping the accent-stripe rule. (Whether a horizontal top-bar is acceptable at all is a per-project styling call the user can make explicitly — but it isn't the default here, and a vertical edge stripe should be avoided regardless.)

## Encode a table's categorical column as row fill, not as a footnote

If a comparison table has a column whose values repeat and group the rows — a "signal source", a "tier", a "status" — colour the row backgrounds by that value and put a small swatch key beneath the table. Don't shade a couple of rows and explain the shading in a sentence underneath; the sentence is doing work the eye should be doing, and it forces the reader to hold a rule in their head while scanning.

A concrete before/after: a six-trainer table originally shaded its last two rows and carried the note *"the last two are shaded because they are the only ones whose dataset carries no response at all."* It now fills rows in three tints keyed to the three background categories from the concept slide, with a three-swatch key below — and the swatch for the shaded category carries the same information as a five-word gloss. The key also **ties the table back to the concept slide that introduced the categories**, which the footnote never did.

Watch the vertical budget when you do this: the key needs its own band. Tighten row height rather than letting the key collide with the last row — that collision already shipped once, invisible in text extraction.

## Slide flow (the standalone-background pattern)

This is the structural core of the format. Deviating from it (e.g. burying tool-specific references inside the "background" slides) was an actual bug fixed mid-project — see below.

1. **Title** — tool name, one-line description, a short "how we'll get there" roadmap sentence. The subtitle is the deck's name everywhere else (build script, assignment header, quiz docstring, README roadmap), so make it denotative before you propagate it.
2. **Preview / intro teaser** — one paragraph defining the tool in plain language, explicitly flagging that the next few slides won't mention it by name and will come back to this sentence once the background is built up. A small illustrative graphic helps (doesn't need to be the final version of anything shown later).
3–N. **Background section** — one slide per concept the tool depends on that hasn't already been taught in Lecture 1 or an earlier lesson. **These slides must be fully standalone**: no reference to the tool's name, no tool-specific examples, nothing that would be confusing if someone saw only this slide with zero context. If a background slide needs an example, use a generic/well-known one, not the tool's own recommended setup.
   - *Actual bug this section prevents*: an earlier draft's background slides referenced the tool by name in supposedly-generic explanations, and cited the tool's specific backend/API setup details inside a "base vs. instruct" concept slide. Both were moved out into the tool-specific sections; the background slides were rewritten to use generic examples instead.
   - *Expect counter-pressure on this rule, and know the compromise in advance.* A reviewer will, reasonably, ask for the concrete mapping on a background slide — "under each data format, could you add which trainers accept it?" The answer is not simply no. **Name the generic method families on the background slide** ("reward modeling, direct preference methods") and **carry the concrete class names on the tool-specific slide that already does that mapping**, then say which slide that is. The request is usually really "does a slide like this exist anywhere?" — and if it doesn't, build it, in the tool-specific half.
4. **Bridge slide** — explicit, one row per background slide: which slide, which concept, and exactly how it shows up in the tool. This is the payoff for having gone standalone — state it outright rather than assuming the connection is obvious. Announce here that later slides will carry small "back-reference" pills pointing to specific background slides when relevant. Don't overclaim on this slide: "everything above was written without naming the library" is false if the teaser named it, and a reviewer will catch it.
5. **What is [Tool]** — fuller intro: author, what it technically is, where to use it, scale/maturity. Can carry a back-reference pill to whichever background slide is most conceptually central to the tool.
6. **The names** *(when the tool's vocabulary is acronyms)* — expand every acronym the deck will lean on, each with one line on *why it is named that*, because for most methods the name is a compression of the whole idea ("the group is the baseline — hence group relative"). Place it **before the first slide that uses the acronyms as though they were known**, not at the end as a glossary. Verify each expansion against the paper, not the repo's own docs (see SKILL.md). If a repo mis-expands its own acronym, that discrepancy makes an excellent card on this slide — it teaches the habit the whole course is about.
7. **Use cases** — concrete, varied scenarios someone would actually reach for this tool for. Icons + short descriptions work well in a grid. **This slide belongs here, early — motivation before mechanism.** It sat second-to-last in earlier decks and was moved forward on review: a student who knows what the tool is *for* reads the repository deep-dive as answers to questions they now have, rather than as trivia. Don't also repeat it at the end; the closing slide carries the synthesis.
8. **Repository Structure** — an *actual* file tree, reflecting the real GitHub file listing order (fetch the repo page, don't invent plausible-looking structure). Render with box-drawing characters (`├── ` / `└── `), monospace font, on a dark card. Highlight (background-tint + bold) the 3-5 core files that matter for the lesson; annotate them with a one-line purpose note. Don't skip this even if a "repository map" slide (below) seems redundant with it — the tree gives real structure/orientation, the map gives grouped meaning; they serve different purposes and pair well back-to-back.
9. **Repository Map** — the same core files, now grouped by function (e.g. "core algorithm" vs. "app shell & tooling"), each with a longer description. Cite real function/method names pulled from actually reading the source.
10. **Core data structure or central abstraction** — the object, type, or base class the tool is built around, if there is one. A simple diagram (a small tree/graph) or a stripped-down class skeleton often helps more than prose.
11. **Algorithm/workflow walkthrough** — numbered steps, each citing the real function name responsible (from having read the source). A small monospace path tag at the top of the slide (`file.ts`) is enough; per-step function names go inline.
12. **Reading the source** *(one or more)* — the actual lines that implement the thing, quoted from the repo. Title these with the file path, in monospace. These are usually the highest-value slides in the deck: a loss function that turns out to be one line, a reward function that turns out to be four, is worth more than a paragraph describing it.
13. **Configuration/controls** — the user-facing settings/dials and what each one actually does mechanically. Tie back to background concepts explicitly with a back-reference pill wherever a control is a direct implementation of something taught earlier (e.g. a "Top P" slider *is* nucleus sampling from the background section — say so).
14. **Interaction features** — the actions a user takes on the tool's main UI objects (buttons, node actions, etc.), each with the real underlying function/method cited.
15. **Backend/setup requirements** — what's needed to actually run the tool (API shape requirements, recommended providers/configs pulled verbatim from the README), plus a back-reference pill to whatever background concept explains *why* those requirements exist.
16. **Limitations** — be honest: known bugs (cite the exact source, e.g. a comment in the code or a maintainer's own public statement), scaling/performance limits, backend narrowness, project maturity. Don't soften real caveats found while reading the repo. Describe the *code*, not the reader: "the algorithm is buried in infrastructure" is a limitation; "reading it is genuinely hard" is a comment on the student and was cut on review.
17. **Conclusion** — the one-sentence version, resources, a genuine open-ended discussion question (not a comprehension check — that's the quiz's job), **an explicit pointer to the quiz and the assignment**, and what the next lecture covers. Call the slide "Conclusion"; evocative closing titles ("What to Carry Forward") get flagged.

Not every lesson needs every numbered slide — a library with no UI has no "interaction features" — but the *order* is the load-bearing part. Background → bridge → identity → vocabulary → motivation → structure → source.

## Back- and forward-references

**Back-reference pills.** Small, visually distinct from the monospace path tags (different color scheme, e.g. a soft green vs. the path tag's ice blue) — a pill reading `← Background · Slide N, [Concept Name]` (see the glyph-rendering bug above for why `←` and not `↩`). Use these liberally on tool-specific slides once the bridge slide has established the pattern; they're cheap to add and are exactly what makes "explicitly reference back to background when relevant" (a specific, repeated user request in this project) work at a glance instead of requiring the reader to remember.

**Forward references, in prose.** The pill system only points backwards, which leaves a real gap: a background slide that raises a problem the deck resolves properly forty minutes later reads as unfinished. When a slide names something it will treat in full later, say where — "worked through, with a real example, on slide 18" — in a footnote or the closing line of the relevant card. This is not the same as a forward-reference to a later *lecture*, which the project bans in foundational slides; an intra-deck pointer is fine and was explicitly asked for.

A forward reference from a background slide is allowed as long as the pointer itself carries no tool-specific content — "on slide 18" is neutral; "in `trl/rewards/` on slide 18" is not.

**Every one of these is a number that goes stale.** See the renumbering rule in SKILL.md's cross-artifact section: moving a slide means fixing `addSlideNumber()`, every prose "slide N", and every `*(slide N)*` in the assignment. Grep, don't remember.

## Citing measurements on a slide

Decks in this series increasingly carry real numbers — timings, similarity scores, per-setting comparison tables — measured while reading the repo. Two habits keep them honest.

**Name the configuration in the same breath as the number.** "Measured on <model>, one <subject> vector, held constant, applied at ±1.5" is the caption; the table is the payload. An unlabelled figure is what goes stale silently when a later pass changes a default, and it's what lets a slide and its companion assignment drift into quoting different numbers for nominally the same experiment.

**Replicate a qualitative ordering before generalising it.** If a table's *ranking* is the lesson ("this configuration beats that one"), run it on a second subject and say so on the slide — one extra line of text, and the claim gets much stronger. Where it doesn't replicate, that's more interesting than the original finding and belongs in the assignment.

## Build & QA process

1. Write the build script (`build.js`), run with `node build.js`. Paths resolve from `__dirname` — never absolute.
2. Validate: `python3 <pptx-skill>/scripts/office/validate.py <file>.pptx`. The pptx skill's mount point has moved between sessions (`/mnt/skills/public/pptx`, `~/.claude/skills/pptx`) — locate it rather than pasting a path from an old note.
3. Render to images for visual QA — **do this for every slide, every time, including after small edits**: `soffice --headless --convert-to pdf` then `pdftoppm -jpeg -r 100`.
4. `view` **each** rendered slide. Check specifically for:
   - icon contrast (see above);
   - any decorative glyph rendering as a tofu box (text extraction won't catch it);
   - text overflowing into the footer, **and text overflowing upward into the title** — the second is the one that gets missed, because it looks like dense layout rather than a bug;
   - slide-number correctness after inserting/removing/moving a slide, and every in-deck "see slide N";
   - back-reference pills rendering legibly on whichever background they landed on;
   - a table's last row colliding with whatever sits beneath it.
5. Re-run every count the deck asserts (line counts, file counts, issue counts) and date-stamp them — see SKILL.md.
6. Only then deliver.

**Confirm the build script and the shipped `.pptx` still agree** before editing either. `node build.js` into a scratch path and diff the unzipped trees against the committed deck: everything except `docProps/core.xml` (timestamps) should be byte-identical. If they differ, someone edited slide XML in place without folding the change back into the script, and a rebuild will silently discard it. Do this check *first*, not after you've made changes.
