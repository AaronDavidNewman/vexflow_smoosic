/*
Convert text font to Vexflow glyph metrics.

Usage: node fontgen.js myFont.otf ../../src/fonts/myFont_metrics.js
*/

const fs = require('fs');
const process = require('process');
// eslint-disable-next-line
const opentype = require('opentype.js');

function LogError(...args) {
  // eslint-disable-next-line
  console.error(...args)
}

// Converte OTF glyph path to Vexflow glyph path
function toVFPath(glyph) {
  const pointSize = 72;
  const scale = 72 * 20;
  const bb = glyph.getBoundingBox();
  const path = glyph.getPath(0, 0, pointSize);
  function fix(f, invert = false) {
    return Math.round((f / pointSize) * scale) * (invert ? -1 : 1);
  }

  const ops = path.commands.map((p) => {
    switch (p.type) {
      case 'M': return `m ${fix(p.x)} ${fix(p.y, true)}`;
      case 'L': return `l ${fix(p.x)} ${fix(p.y, true)}`;
      case 'C': // Note Vexflow uses 'b' instead of 'c' to represent bezier curves.
        return `b ${fix(p.x)} ${fix(p.y, true)} ${fix(p.x1)} ${fix(p.y1, true)} ${fix(p.x2)} ${fix(p.y2, true)}`;
      case 'Q': return `q ${fix(p.x)} ${fix(p.y, true)} ${fix(p.x1)} ${fix(p.y1, true)}`;
      case 'Z': return 'z';
      default: throw new Error(`unsupported path type: ${p.type}: ${p}`);
    }
  });

  const pathStr = ops.join(' ');

  return {
    'x_min': bb.x1,
    'x_max': bb.x2,
    'y_min': bb.y1,
    'y_max': bb.y2,
    'ha': bb.y2 - bb.y1,
    'leftSideBearing': glyph.leftSideBearing,
    'advanceWidth': glyph.advanceWidth
  };
}

const args = process.argv.slice(2);
if (args.length < 2) {
  LogError('Usage: node fontgen.js [fontfile.otf] [outfile.json]');
  LogError('E.g: node fontgen.js bravura-v1.otf bravura.smufl.js');
  process.exit(255);
}

const fontFile = args[0];
const outFile = args[1];

const font = opentype.loadSync(fontFile);
const glyphNamesData = fs.readFileSync('./config/glyphnames.json');
const glyphNames = JSON.parse(glyphNamesData);

const fontData = {};
let code = 32;

for (; code < 127; ++code) {
  const ch = String.fromCharCode(code);
  const glyph = font.charToGlyph(ch);
  fontData[ch] = toVFPath(glyph);
}

// File format for fonts/font_glyphs.js
const fileData = {
  glyphs: fontData,
  fontFamily: font.names.fontFamily.en,
  resolution: font.unitsPerEm,
  generatedOn: new Date().toISOString(),
};

// Set the variable name to the font family name
const varName = fileData.fontFamily.replace(/\s+/, '_');

LogError('Writing to file:', outFile);
fs.writeFileSync(outFile,
  `export const ${varName}Font = ${JSON.stringify(fileData, null, 2)};\n`);
