// Render react-icons to PNGs in two explicit colors.
//   <name>.png        -> WHITE glyph  (for use INSIDE a colored/dark circle)
//   <name>_teal.png   -> NAVY glyph   (#065A82, for use on a WHITE/light circle)
// Never put a _teal icon on a colored circle -- that is the contrast bug.
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const Tb = require("react-icons/tb");

const OUT = path.join(__dirname, "icons");
fs.mkdirSync(OUT, { recursive: true });

const WANTED = {
  contrast: "TbArrowsLeftRight",
  pca: "TbChartDots3",
  plus: "TbMathSymbols",
  braces: "TbBraces",
  layers: "TbStack2",
  book: "TbBook2",
  tree: "TbBinaryTree",
  folder: "TbFolders",
  gear: "TbSettings",
  warn: "TbAlertTriangle",
  rocket: "TbRocket",
  flask: "TbFlask",
  cpu: "TbCpu",
  export: "TbFileExport",
  brain: "TbBrain",
  target: "TbTarget",
  ruler: "TbRulerMeasure",
  bridge: "TbArrowsJoin",
  chat: "TbMessageCircle",
  check: "TbCircleCheck",
  clock: "TbClock",
  shuffle: "TbArrowsShuffle",
  code: "TbCode",
  wand: "TbWand",
  scale: "TbScale",
  eye: "TbEye",
  bolt: "TbBolt",
  package: "TbPackage",
  cloud: "TbCloud",
  bug: "TbBug",
  compass: "TbCompass",
  math: "TbMathFunction",
};

const COLORS = { "": "#FFFFFF", _teal: "#065A82" };

(async () => {
  const missing = [];
  for (const [alias, comp] of Object.entries(WANTED)) {
    const Icon = Tb[comp];
    if (!Icon) { missing.push(`${alias} -> ${comp}`); continue; }
    for (const [suffix, color] of Object.entries(COLORS)) {
      const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(Icon, { color, size: 512, strokeWidth: 1.8 })
      );
      await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(
        path.join(OUT, `${alias}${suffix}.png`)
      );
    }
  }
  if (missing.length) { console.error("MISSING COMPONENTS:", missing); process.exit(1); }
  console.log("wrote", fs.readdirSync(OUT).length, "icon files to", OUT);
})();
