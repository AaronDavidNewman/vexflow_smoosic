// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
// Author: Larry Kuhns
//
// ## Description
// This file implements the `Stroke` class which renders chord strokes
// that can be arpeggiated, brushed, rasquedo, etc.

import { Vex } from './vex';
import { Modifier } from './modifier';
import { Glyph } from './glyph';

export class JazzTechnique extends Modifier {
  static get CATEGORY() {
    return 'jazztechnique';
  }
  // regardless of actual width, this is what we reports.  These symbols
  // tend to overlap the next notes
  static get Type() {
    return {
      SCOOP: 1,
      DOIT: 2,
      FALL_SHORT: 3,
      LIFT: 4,
      FALL_LONG: 5,
      BEND: 6,
      MUTE_CLOSED: 7,
      MUTE_OPEN: 8,
      FLIP: 9,
      TURN: 10,
      SMEAR: 11,
    };
  }

  // ### staffPosition
  // means the jazz ornament is typically placed just above the staff, or above
  // the note if the note has top ledger lines.
  static get staffPosition() {
    return ['flip', 'turn', 'smear'];
  }

  // ### LeftPosition
  // means the jazz ornament is placed before the note
  static get leftPosition() {
    return ['scoop'];
  }

  // ### rightPosition
  // means the jazz ornament is typically placed just to the right of the note.
  static get rightPosition() {
    return ['doit', 'fall', 'fallLong', 'doitLong', 'turn', 'smear', 'flip'];
  }

  // ### articulationPosition
  // ornaments that are typically just above or below the note
  static get articulationPosition() {
    return ['bend', 'plungerClosed', 'plungerOpen'];
  }

  static get TypeToCode() {
    return {
      1: 'brassScoop',
      2: 'brassDoitMedium',
      3: 'brassFallLipShort',
      4: 'brassLiftMedium',
      5: 'brassFallRoughMedium',
      6: 'brassBend',
      7: 'brassMuteClosed',
      8: 'brassMuteOpen',
      9: 'brassFlip',
      10: 'brassJazzTurn',
      11: 'brassSmear',
    };
  }

  static get jazzOrnamentCodes() {
    return {
      scoop: { code: 'brassScoop' },
      doit: { code: 'brassDoitMedium' },
      fall: { code: 'brassFallLipShort' },
      doitLong: { code: 'brassLiftMedium' },
      fallLong: { code: 'brassFallRoughMedium' },
      bend: { code: 'brassBend' },
      plungerClosed: { code: 'brassMuteClosed' },
      plungerOpen: { code: 'brassMuteOpen' },
      flip: { code: 'brassFlip' },
      turn: { code: 'brassJazzTurn' },
      smear: { code: 'brassSmear' },
    };
  }

  static get glyphMetrics() {
    return Vex.Flow.DEFAULT_FONT_STACK[0].metrics.glyphs.jazzOrnaments;
  }

  // Arrange strokes inside `ModifierContext`
  static format(techniques, state) {
    let left_shift = state.left_shift;
    let right_shift = state.right_shift;

    if (!techniques || techniques.length === 0) return this;

    techniques.forEach((technique) => {
      const width = technique.metrics.reportedWidth;
      if (JazzTechnique.rightPosition.indexOf(technique.type) >= 0) {
        technique.xOffset += right_shift + 2;
      }
      if (JazzTechnique.leftPosition.indexOf(technique.type) >= 0) {
        technique.xOffset -= left_shift + 2;
      }
      if (technique.xOffset < 0) {
        left_shift += width;
      } else if (technique.xOffset > 0) {
        right_shift += width;
      }
    });

    state.left_shift = left_shift;
    state.right_shift = right_shift;
    return true;
  }

  get metrics() {
    return JazzTechnique.glyphMetrics[this.ornament.code];
  }

  constructor(type, options) {
    super();
    this.setAttribute('type', 'JazzTechnique');

    this.note = null;
    this.options = Vex.Merge({}, options);

    // backwards compatibilty for smoosic
    if (typeof type === 'number') {
      type = JazzTechnique.TypeToCode[type];
      type = Object.keys(JazzTechnique.jazzOrnamentCodes).find(
        (zz) => JazzTechnique.jazzOrnamentCodes[zz].code === type
      );
    }

    // multi voice - end note of stroke, set in draw()
    this.type = type;
    this.ornament = JazzTechnique.jazzOrnamentCodes[type];
    const metrics = this.metrics;
    this.position = Modifier.Position.LEFT;
    this.xOffset = metrics.xOffset;
    this.yOffset = metrics.yOffset;
    this.scale = metrics.scale;

    // Allow user to pass in adjustments
    if (this.options.xAdjust) {
      this.xOffset += this.options.xAdjust;
    }
    if (this.options.yAdjust) {
      this.yOffset += this.options.yAdjust;
    }
    if (this.options.scaleAdjust) {
      this.scale *= this.options.scaleAdjust;
    }

    this.render_options = {
      font_scale: 38,
      stroke_px: 3,
      stroke_spacing: 10,
    };

    this.font = {
      family: 'serif',
      size: 10,
      weight: 'bold italic',
    };

    this.glyph = new Glyph(this.ornament.code, this.render_options.font_scale * this.scale, {
      category: `jazztechnique.${this.ornament.code}`,
    });

    this.setXShift(0);
    this.setWidth(10);
  }

  getCategory() {
    return JazzTechnique.CATEGORY;
  }
  getPosition() {
    return this.position;
  }
  addEndNote(note) {
    this.note_end = note;
    return this;
  }

  draw() {
    this.checkContext();
    this.setRendered();

    // Allow the application to move/locate the glyph
    this.context.save();
    const classString = Object.keys(this.getAttribute('classes')).join(' ');
    this.context.openGroup(classString, this.getAttribute('id'));

    if (!(this.note && this.index != null)) {
      throw new Vex.RERR('NoAttachedNote', "Can't draw stroke without a note and index.");
    }

    const start = this.note.getModifierStartXY(this.position, this.index);
    let y = start.y;
    const x = start.x;
    const metrics = this.metrics;

    if (this.note.hasStem()) {
      if (this.note.getStemDirection() === 1) {
        y += metrics.stemUpYOffset;
      }
    }
    if (this.note.getLineNumber() < 5 && JazzTechnique.staffPosition.indexOf(this.type) >= 0) {
      y = this.note.getStave().getBoundingBox().y + 40;
    }

    this.glyph.render(this.context, x + this.xOffset, y + this.yOffset);

    this.context.closeGroup();
  }
}
