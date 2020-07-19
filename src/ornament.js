// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
// Author: Cyril Silverman
//
// ## Description
//
// This file implements ornaments as modifiers that can be
// attached to notes. The complete list of ornaments is available in
// `tables.js` under `Vex.Flow.ornamentCodes`.
//
// See `tests/ornament_tests.js` for usage examples.

import { Vex } from './vex';
import { Flow } from './tables';
import { Modifier } from './modifier';
import { TickContext } from './tickcontext';
import { StaveNote } from './stavenote';
import { Glyph } from './glyph';

// To enable logging for this class. Set `Vex.Flow.Ornament.DEBUG` to `true`.
function L(...args) { if (Ornament.DEBUG) Vex.L('Vex.Flow.Ornament', args); }

export class Ornament extends Modifier {
  static get CATEGORY() { return 'ornaments'; }

  // ## Static Methods
  // Arrange ornaments inside `ModifierContext`
  static format(ornaments, state) {
    if (!ornaments || ornaments.length === 0) return false;

    let width = 0;  // width is used by ornaments, which are always centered on the note head
    let right_shift = state.right_shift;  // jazz ornaments calculate r/l shift separately
    let left_shift = state.left_shift;

    for (let i = 0; i < ornaments.length; ++i) {
      const ornament = ornaments[i];
      const increment = 2;

      if (ornament.jazzMetrics) {
        const reportedWidth = ornament.metrics.reportedWidth;
        if (Ornament.rightPosition.indexOf(ornament.type) >= 0) {
          ornament.render_options.xOffset += (right_shift + 2);
        }
        if (Ornament.leftPosition.indexOf(ornament.type) >= 0) {
          ornament.render_options.xOffset -= (left_shift + 2);
        }
        if (ornament.render_options.xOffset < 0) {
          left_shift += reportedWidth;
        } else if (ornament.render_options.xOffset > 0) {
          right_shift += reportedWidth;
        }
      } else {
        width = Math.max(ornament.getWidth(), width);
        if (ornament.getPosition() === Modifier.Position.ABOVE) {
          ornament.setTextLine(state.top_text_line);
          state.top_text_line += increment;
        } else {
          ornament.setTextLine(state.text_line);
          state.text_line += increment;
        }
      }
    }
    // Note: 'legit' ornaments don't consider other modifiers when calculating their
    // X position, but jazz ornaments sometimes need to.
    state.left_shift = left_shift + (width / 2);
    state.right_shift = right_shift + (width / 2);
    return true;
  }

  // NOTE: other ornamenct codes are in tables.js.  I think
  // that is not the way we do things now, so these jazz codes are here
  // and we union them to figure out which set we want based on the type
  static get jazzOrnamentCodes() {
    return {
      'scoop': { code: 'brassScoop' },
      'doit': { code: 'brassDoitMedium' },
      'fall': { code: 'brassFallLipShort' },
      'doitLong': { code: 'brassLiftMedium' },
      'fallLong': { code: 'brassFallRoughMedium' },
      'bend': { code: 'brassBend' },
      'plungerClosed': { code: 'brassMuteClosed' },
      'plungerOpen': { code: 'brassMuteOpen' },
      'flip': { code: 'brassFlip' },
      'jazzTurn': { code: 'brassJazzTurn' },
      'smear': { code: 'brassSmear' }
    };
  }

  // ### staffPosition
  // means the jazz ornament is typically placed just above the staff, or above
  // the note if the note has top ledger lines.
  static get staffPosition() {
    return ['flip', 'jazzTurn', 'smear'];
  }

  // ### LeftPosition
  // means the jazz ornament is placed before the note
  static get leftPosition() {
    return ['scoop'];
  }

  // ### rightPosition
  // means the jazz ornament is typically placed just to the right of the note.
  static get rightPosition() {
    return [
      'doit', 'fall', 'fallLong', 'doitLong', 'jazzTurn', 'smear', 'flip'
    ];
  }

  // ### articulationPosition
  // ornaments that are typically just above or below the note
  static get articulationPosition() {
    return ['bend', 'plungerClosed', 'plungerOpen'];
  }

  static get glyphMetrics() {
    return Vex.Flow.DEFAULT_FONT_STACK[0].metrics.glyphs.jazzOrnaments;
  }

  get metrics() {
    return Ornament.glyphMetrics[this.ornament.code];
  }

  // Create a new ornament of type `type`, which is an entry in
  // `Vex.Flow.ornamentCodes` in `tables.js`.
  constructor(type) {
    super();
    this.setAttribute('type', 'Ornament');

    this.note = null;
    this.index = null;
    this.type = type;
    this.delayed = false;

    this.accidentalUpper = null;
    this.accidentalLower = null;

    this.render_options = {
      font_scale: 38,
      accidentalLowerPadding: 3,
      accidentalUpperPadding: 3,
      xOffset: 0, // offsets used for jazz ornaments
      yOffset: 0
    };

    this.ornament = Flow.ornamentCodes(this.type) ?
      Flow.ornamentCodes(this.type) :
      Ornament.jazzOrnamentCodes[this.type];

    // Jazz ornaments have different metrics used to place them correctly
    this.jazzMetrics = this.metrics;

    if (!this.ornament) {
      throw new Vex.RERR('ArgumentError', `Ornament not found: '${this.type}'`);
    }

    this.render_options.xOffset = this.jazzMetrics ? this.jazzMetrics.xOffset : 0;
    this.render_options.yOffset = this.jazzMetrics ? this.jazzMetrics.yOffset : 0;

    this.glyph = new Glyph(this.ornament.code, this.render_options.font_scale, { category: `ornament.${this.ornament.code}` });

    // Is this a jazz ornament that goes between this note and the next note.
    if (Ornament.staffPosition.indexOf(this.type) >= 0) {
      this.delayed = true;
    }

    // Jazz ornaments have their own metrics and don't rely on this offset
    if (!this.jazzMetrics) {
      this.position = Modifier.Position.ABOVE;
      this.glyph.setOrigin(0.5, 1.0); // FIXME: SMuFL won't require a vertical origin shift
    }
  }

  getCategory() { return Ornament.CATEGORY; }

  // Set whether the ornament is to be delayed
  setDelayed(delayed) { this.delayed = delayed; return this; }

  // Set the upper accidental for the ornament
  setUpperAccidental(accid) {
    const scale = this.render_options.font_scale / 1.3;
    this.accidentalUpper = new Glyph(Flow.accidentalCodes(accid).code, scale);
    this.accidentalUpper.setOrigin(0.5, 1.0);
    return this;
  }

  // Set the lower accidental for the ornament
  setLowerAccidental(accid) {
    const scale = this.render_options.font_scale / 1.3;
    this.accidentalLower = new Glyph(Flow.accidentalCodes(accid).code, scale);
    this.accidentalLower.setOrigin(0.5, 1.0);
    return this;
  }

  // Render ornament in position next to note.
  draw() {
    this.checkContext();

    if (!this.note || this.index == null) {
      throw new Vex.RERR('NoAttachedNote', "Can't draw Ornament without a note and index.");
    }

    this.setRendered();

    const ctx = this.context;
    const stemDir = this.note.getStemDirection();
    const stave = this.note.getStave();

    const classString = Object.keys(this.getAttribute('classes')).join(' ');
    this.context.openGroup(classString, this.getAttribute('id'));

    // Get stem extents
    const stemExtents = this.note.getStem().getExtents();
    let y = stemDir === StaveNote.STEM_DOWN ? stemExtents.baseY : stemExtents.topY;

    // TabNotes don't have stems attached to them. Tab stems are rendered
    // outside the stave.
    if (this.note.getCategory() === 'tabnotes') {
      if (this.note.hasStem()) {
        if (stemDir === StaveNote.STEM_DOWN) {
          y = stave.getYForTopText(this.text_line);
        }
      } else { // Without a stem
        y = stave.getYForTopText(this.text_line);
      }
    }

    const isPlacedOnNoteheadSide = stemDir === StaveNote.STEM_DOWN;
    const spacing = stave.getSpacingBetweenLines();
    let lineSpacing = 1;

    // Beamed stems are longer than quarter note stems, adjust accordingly
    if (!isPlacedOnNoteheadSide && this.note.beam) {
      lineSpacing += 0.5;
    }

    const totalSpacing = spacing * (this.text_line + lineSpacing);
    const glyphYBetweenLines = y - totalSpacing;

    // Get initial coordinates for the modifier position
    const start = this.note.getModifierStartXY(this.position, this.index);
    let glyphX = start.x;
    let glyphY = this.jazzMetrics ? start.y :
      Math.min(stave.getYForTopText(this.text_line), glyphYBetweenLines);
    glyphY += this.y_shift;

    // Ajdust x position if ornament is delayed
    if (this.delayed) {
      let delayXShift = 0;
      const startX = glyphX - (stave.getX() - 10);
      if (this.delayXShift !== undefined) {
        delayXShift = this.delayXShift;
      } else {
        delayXShift += this.glyph.getMetrics().width / 2;
        const nextContext = TickContext.getNextContext(this.note.getTickContext());
        if (nextContext) {
          delayXShift += (nextContext.getX() - startX) * 0.5;
        } else {
          delayXShift += (stave.x + stave.width - startX) * 0.5;
        }
        this.delayXShift = delayXShift;
      }
      glyphX += delayXShift;
    }

    L('Rendering ornament: ', this.ornament, glyphX, glyphY);

    if (this.accidentalLower) {
      this.accidentalLower.render(ctx, glyphX, glyphY);
      glyphY -= this.accidentalLower.getMetrics().height;
      glyphY -= this.render_options.accidentalLowerPadding;
    }

    if (this.jazzMetrics) {
      if (this.note.hasStem()) {
        if (this.note.getStemDirection() === 1) {
          glyphY += this.jazzMetrics.stemUpYOffset;
        }
      }
      if (this.note.getLineNumber() < 5 && Ornament.staffPosition.indexOf(this.type) >= 0) {
        glyphY = this.note.getStave().getBoundingBox().y + 40;
      }
    }

    this.glyph.render(ctx, glyphX + this.render_options.xOffset, glyphY + this.render_options.yOffset);

    if (this.accidentalUpper) {
      glyphY -= (this.glyph.getMetrics().height + this.render_options.accidentalUpperPadding);
      this.accidentalUpper.render(ctx, glyphX, glyphY);
    }
    this.context.closeGroup();
  }
}
