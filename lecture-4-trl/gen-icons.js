// Generates the icon set for the TRL lecture deck.
// Convention (see repo-teacher lecture-structure.md, "Critical bug: icon contrast"):
//   <name>       -> WHITE   : for use inside a colored/dark circle
//   <name>_teal  -> #065A82 : for use on a white/light circle only
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const Fa = require("react-icons/fa6");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Resolved relative to this script. Icons are shared across lessons and live at
// the repository root, so a rebuild works from any checkout.
const OUT = process.env.REPO_TEACHER_ICONS || path.join(__dirname, "..", "icons");
fs.mkdirSync(OUT, { recursive: true });

const MAP = {
  signal: "FaBullseye",            // where the training signal comes from
  balance: "FaScaleBalanced",      // reward model / preference comparison
  database: "FaDatabase",          // dataset shapes
  shuffle: "FaShuffle",            // on-policy vs off-policy
  check: "FaCircleCheck",          // verifiable reward
  anchor: "FaAnchor",              // reference model / KL anchoring
  map: "FaMap",                    // repository map
  tree: "FaFolderTree",            // repository structure
  layers: "FaLayerGroup",          // core abstraction
  code: "FaCode",                  // source citation
  flask: "FaFlask",                // experimental
  sliders: "FaSliders",            // configuration
  warning: "FaTriangleExclamation",// limitations
  book: "FaBook",                  // docs / resources
  chip: "FaMicrochip",             // compute
  branch: "FaCodeBranch",          // promotion path
  terminal: "FaTerminal",          // CLI
  spin: "FaArrowsSpin",            // online generation loop
  swap: "FaArrowRightArrowLeft",   // offline / static batch
  cubes: "FaCubes",                // trainers
  route: "FaRoute",                // bridge
  cap: "FaGraduationCap",          // SFT
  file: "FaFileLines",             // dataset record
  rocket: "FaRocket",              // use cases
  bulb: "FaLightbulb",             // closing question
  stack: "FaBoxesStacked",         // taxonomy
  project: "FaDiagramProject",     // pipeline
};

const COLORS = { "": "#FFFFFF", _teal: "#065A82" };

(async () => {
  for (const [name, comp] of Object.entries(MAP)) {
    const Icon = Fa[comp];
    if (!Icon) throw new Error(`missing react-icon: ${comp}`);
    for (const [suffix, color] of Object.entries(COLORS)) {
      const svg = renderToStaticMarkup(
        React.createElement(Icon, { color, size: 256, style: { color } })
      );
      const file = `${OUT}/${name}${suffix}.png`;
      await sharp(Buffer.from(svg)).resize(256, 256, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      }).png().toFile(file);
    }
  }
  console.log(`wrote ${Object.keys(MAP).length * 2} icons to ${OUT}`);
})();
