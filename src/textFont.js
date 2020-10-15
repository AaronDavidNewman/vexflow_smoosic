// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
//
// This file handles a registry of text font metric information, so all
// VEX modules can take advantage of font metrics in a uniform way.
//

import { Vex } from './vex';
import { PetalumaScriptMetrics } from './fonts/petalumaScript_metrics';
import { RobotoSlabMetrics } from './fonts/robotoSlab_metrics';

// To enable logging for this class. Set `Vex.Flow.TextFont.DEBUG` to `true`.
function L(...args) { if (TextFont.DEBUG) Vex.L('Vex.Flow.TextFont', args); }

export class TextFont  {
  static get CATEGORY() { return 'textFont'; }

  static get DEBUG() {
    return TextFont.debug;
  }
  static set DEBUG(val) {
    TextFont.debug = val;
  }

  static get fontRegistry() {
    if (!TextFont.registryInstance) {
      TextFont.registryInstance = {};
      TextFont.registerFont({
        name: 'PetalumaScript',
        resolution: PetalumaScriptMetrics.resolution,
        glyphs: PetalumaScriptMetrics.glyphs,
        fontFamily: PetalumaScriptMetrics.fontFamily,
        serifs: false,
        monospaced: false,
        maxSizeGlyph: 'H',
        superscriptOffset: 0.66,
        subscriptOffset: 0.66,
        description: 'Default sans-serif text font to pair with Petaluma engraving font',
      }, true);
      TextFont.registerFont({
        name: 'RobotoSlabMetrics',
        resolution: RobotoSlabMetrics.resolution,
        glyphs: RobotoSlabMetrics.glyphs,
        fontFamily: RobotoSlabMetrics.fontFamily,
        serifs: true,
        monospaced: false,
        maxSizeGlyph: 'H',
        superscriptOffset: 0.66,
        subscriptOffset: 0.66,
        description: 'Default serif text font to pair with Bravura/Gonville engraving font',
      }, true);
    }
    return TextFont.registryInstance;
  }
  static get availableFonts() {
    return Object.keys(TextFont.fontRegistry);
  }

  static getFontDataByName(fontName)  {
    return TextFont.fontRegistry[fontName];
  }

  static registerFont(fontData, overwrite) {
    const reg = TextFont.fontRegistry;
    if (overwrite || !reg[fontData.name]) {
      L('registering font ' + fontData.name);
      reg[fontData.name] = fontData;
    }
  }

  // ## Prototype Methods
  //
  // create a font instance.  Params should include name and size, if this is a
  // pre-registered font.
  constructor(params) {
    this.setAttribute('type', 'TextFont');
    if (!params.name) {
      Vex.RERR('BadArgument', 'Font constructor must specify a name');
    }
    const fontData = TextFont.getFontDataByName[name];
    if (!fontData) {
      if (params.glyphs && params.resolution) {
        TextFont.registerFont(params);
      } else {
        Vex.RERR('BadArgument', 'Unknown font, must have glyph metrics and resolution');
      }
    } else {
      Vex.Merge(this, fontData);
    }
    Vex.Merge(this, params);

    if (!this.size) {
      this.size = 14;
    }
    if (!this.maxSizeGlyph) {
      this.maxSizeGlyph = 'H';
    }
  }

  getMetricForCharacter(c) {
    if (this.glyphs[c]) {
      return this.glyphs[c];
    }
    return this.glyphs[this.maxSizeGlyph];
  }

  // ### pointsToPixels
  // The font size is specified in points, convert to 'pixels' in the svg space
  get pointsToPixels() {
    return (this.size / 72) / (1 / 96);
  }

  get superscriptOffset() {
    return this.superscriptOffset * this.pointsToPixels;
  }
  get subscriptOffset() {
    return this.subscriptOffset * this.pointsToPixels;
  }

  setFontSize(size) {
    this.size = size;
    return this;
  }
}
