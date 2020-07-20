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
    let yOffset = 0;

    for (let i = 0; i < ornaments.length; ++i) {
      const ornament = ornaments[i];
      const increment = 2;

      // Jazz ornaments have their own metrics, and their position depends generally on
      // the ornament.  So we calculate their position differently.
      if (ornament.jazzMetrics) {
        const reportedWidth = ornament.metrics.reportedWidth;
        if (Ornament.ornamentRelease.indexOf(ornament.type) >= 0) {
          ornament.render_options.xOffset += (right_shift + 2);
        }
        if (Ornament.ornamentAttack.indexOf(ornament.type) >= 0) {
          ornament.render_options.xOffset -= (left_shift + 2);
        }
        if (ornament.render_options.xOffset < 0) {
          left_shift += reportedWidth;
        } else if (ornament.render_options.xOffset > 0) {
          right_shift += reportedWidth;
        }

        // articulations above/below the line can be stacked.
        if (Ornament.ornamentArticulation.indexOf(ornament.type) >= 0) {
          // Unfortunately we con't know the stem direction.  So we base it
          // on the line number, but also allow it to be overridden.
          if (ornament.note.getLineNumber() >= 3 || ornament.getPosition() === Modifier.Position.ABOVE) {
            state.top_text_line += increment;
            ornament.render_options.yOffset += yOffset;
            yOffset -= ornament.glyph.bbox.h;
          } else {
            state.text_line += increment;
            ornament.render_options.yOffset += yOffset;
            yOffset += ornament.glyph.bbox.h;
          }
        }
      } else { // logic for classical ornament formatting.
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

  // ### ornamentNoteTransition
  // means the jazz ornament represents an effect from one note to another,
  // these are generally on the top of the staff.
  static get ornamentNoteTransition() {
    return ['flip', 'jazzTurn', 'smear'];
  }

  // ### ornamentAttack
  // Indicates something that happens in the attach, placed before the note and
  // any accidentals
  static get ornamentAttack() {
    return ['scoop'];
  }

  // ### ornamentRelease
  // An ornament that happens on the release of the note, generally placed after the
  // note and overlapping the next beat/measure..
  static get ornamentRelease() {
    return [
      'doit', 'fall', 'fallLong', 'doitLong', 'jazzTurn', 'smear', 'flip'
    ];
  }

  // ### ornamentArticulation
  // goes above/below the note based on space availablity
  static get ornamentArticulation() {
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

    this.ornament = Flow.ornamentCodes(this.type);

    // Jazz ornaments have different metrics used to place them correctly
    this.jazzMetrics = this.metrics;

    if (!this.ornament) {
      throw new Vex.RERR('ArgumentError', `Ornament not found: '${this.type}'`);
    }

    this.render_options.xOffset = this.jazzMetrics ? this.jazzMetrics.xOffset : 0;
    this.render_options.yOffset = this.jazzMetrics ? this.jazzMetrics.yOffset : 0;

    this.glyph = new Glyph(this.ornament.code, this.render_options.font_scale, { category: `ornament.${this.ornament.code}` });

    // Is this a jazz ornament that goes between this note and the next note.
    if (Ornament.ornamentNoteTransition.indexOf(this.type) >= 0) {
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
      if (this.note.getLineNumber() < 5 && Ornament.ornamentNoteTransition.indexOf(this.type) >= 0) {
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
