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

## Slide flow (the standalone-background pattern)

This is the structural core of the format. Deviating from it (e.g. burying tool-specific references inside the "background" slides) was an actual bug fixed mid-project — see below.

1. **Title** — tool name, one-line description, a short "how we'll get there" roadmap sentence.
2. **Preview / intro teaser** — one paragraph defining the tool in plain language, explicitly flagging that the next few slides won't mention it by name and will come back to this sentence once the background is built up. A small illustrative graphic helps (doesn't need to be the final version of anything shown later).
3–N. **Background section** — one slide per concept the tool depends on that hasn't already been taught in Lecture 1 or an earlier lesson. **These slides must be fully standalone**: no reference to the tool's name, no tool-specific examples, nothing that would be confusing if someone saw only this slide with zero context. If a background slide needs an example, use a generic/well-known one, not the tool's own recommended setup.
   - *Actual bug this section prevents*: an earlier draft's background slides referenced the tool by name in supposedly-generic explanations, and cited the tool's specific backend/API setup details inside a "base vs. instruct" concept slide. Both were moved out into the tool-specific sections; the background slides were rewritten to use generic examples instead.
4. **Bridge slide** — explicit, one row per background slide: which slide, which concept, and exactly how it shows up in the tool. This is the payoff for having gone standalone — state it outright rather than assuming the connection is obvious. Announce here that later slides will carry small "back-reference" pills pointing to specific background slides when relevant.
5. **What is [Tool]** — fuller intro: author, what it technically is, where to use it, scale/maturity. Can carry a back-reference pill to whichever background slide is most conceptually central to the tool.
6. **Repository Structure** — an *actual* file tree, reflecting the real GitHub file listing order (fetch the repo page, don't invent plausible-looking structure). Render with box-drawing characters (`├── ` / `└── `), monospace font, on a dark card. Highlight (background-tint + bold) the 3-5 core files that matter for the lesson; annotate them with a one-line purpose note. Don't skip this even if a "repository map" slide (below) seems redundant with it — the tree gives real structure/orientation, the map gives grouped meaning; they serve different purposes and pair well back-to-back.
7. **Repository Map** — the same core files, now grouped by function (e.g. "core algorithm" vs. "app shell & tooling"), each with a longer description. Cite real function/method names pulled from actually reading the source.
8. **Core data structure** — the central object/type the tool is built around, if there is one. A simple diagram (a small tree/graph) often helps more than prose here.
9. **Algorithm/workflow walkthrough** — numbered steps, each citing the real function name responsible (from having read the source). A small monospace path tag at the top of the slide (`file.ts`) is enough; per-step function names go inline.
10. **Configuration/controls** — the user-facing settings/dials and what each one actually does mechanically. Tie back to background concepts explicitly with a back-reference pill wherever a control is a direct implementation of something taught earlier (e.g. a "Top P" slider *is* nucleus sampling from the background section — say so).
11. **Interaction features** — the actions a user takes on the tool's main UI objects (buttons, node actions, etc.), each with the real underlying function/method cited.
12. **Backend/setup requirements** — what's needed to actually run the tool (API shape requirements, recommended providers/configs pulled verbatim from the README), plus a back-reference pill to whatever background concept explains *why* those requirements exist.
13. **Use cases** — concrete, varied scenarios someone would actually reach for this tool for. Icons + short descriptions work well in a grid.
14. **Limitations** — be honest: known bugs (cite the exact source, e.g. a comment in the code or a maintainer's own public statement), scaling/performance limits, backend narrowness, project maturity. Don't soften real caveats found while reading the repo.
15. **Closing / resources** — links, and a genuine open-ended discussion question (not a comprehension check — that's the quiz's job).

## Back-reference pills

Small, visually distinct from the monospace path tags (different color scheme, e.g. a soft green vs. the path tag's ice blue) — a pill reading `↩ Background · Slide N, [Concept Name]`. Use these liberally on tool-specific slides once the bridge slide has established the pattern; they're cheap to add and are exactly what makes "explicitly reference back to background when relevant" (a specific, repeated user request in this project) work at a glance instead of requiring the reader to remember.

## Build & QA process

1. Write the build script (`build.js`), run with `node build.js`.
2. Recompress: `python3 /mnt/skills/public/pptx/scripts/rezip.py <file>.pptx`.
3. Render to images for visual QA — **do this for every slide, every time, including after small edits**: `soffice --headless --convert-to pdf` then `pdftoppm -jpeg -r 100`.
4. `view` each rendered slide. Check specifically for: icon contrast (see above), text overflowing into the footer (a very common failure when adding a new paragraph/pill to an existing slide without re-checking vertical space), slide-number correctness after inserting/removing a slide (renumber everything downstream), and back-reference pills actually rendering on a light or dark background appropriately.
5. Only then copy to `/mnt/user-data/outputs/` and present.

Inserting a new slide into an existing deck means renumbering every `addSlideNumber()` call after it — check this explicitly, it's an easy miss.
