// [VexFlow](http://vexflow.com) - Copyright (c) Mohit Muthanna 2010.
//
// ## Description
//
// This file implements the formatting and layout algorithms that are used
// to position notes in a voice. The algorithm can align multiple voices both
// within a stave, and across multiple staves.
//
// To do this, the formatter breaks up voices into a grid of rational-valued
// `ticks`, to which each note is assigned. Then, minimum widths are assigned
// to each tick based on the widths of the notes and modifiers in that tick. This
// establishes the smallest amount of space required for each tick.
//
// Finally, the formatter distributes the left over space proportionally to
// all the ticks, setting the `x` values of the notes in each tick.
//
// See `tests/formatter_tests.js` for usage examples. The helper functions included
// here (`FormatAndDraw`, `FormatAndDrawTab`) also serve as useful usage examples.

import { Vex } from './vex';
import { Beam } from './beam';
import { Flow } from './tables';
import { Fraction } from './fraction';
import { Voice } from './voice';
import { StaveConnector } from './staveconnector';
import { StaveNote } from './stavenote';
import { ModifierContext } from './modifiercontext';
import { TickContext } from './tickcontext';

// To enable logging for this class. Set `Vex.Flow.Formatter.DEBUG` to `true`.
function L(...args) { if (Formatter.DEBUG) Vex.L('Vex.Flow.Formatter', args); }

// Helper function to locate the next non-rest note(s).
function lookAhead(notes, restLine, i, compare) {
  // If no valid next note group, nextRestLine is same as current.
  let nextRestLine = restLine;

  // Get the rest line for next valid non-rest note group.
  for (i += 1; i < notes.length; i += 1) {
    const note = notes[i];
    if (!note.isRest() && !note.shouldIgnoreTicks()) {
      nextRestLine = note.getLineForRest();
      break;
    }
  }

  // Locate the mid point between two lines.
  if (compare && restLine !== nextRestLine) {
    const top = Math.max(restLine, nextRestLine);
    const bot = Math.min(restLine, nextRestLine);
    nextRestLine = Vex.MidLine(top, bot);
  }
  return nextRestLine;
}

// Take an array of `voices` and place aligned tickables in the same context. Returns
// a mapping from `tick` to `ContextType`, a list of `tick`s, and the resolution
// multiplier.
//
// Params:
// * `voices`: Array of `Voice` instances.
// * `ContextType`: A context class (e.g., `ModifierContext`, `TickContext`)
// * `addToContext`: Function to add tickable to context.
function createContexts(voices, ContextType, addToContext) {
  if (!voices || !voices.length) {
    throw new Vex.RERR('BadArgument', 'No voices to format');
  }

  // Find out highest common multiple of resolution multipliers.
  // The purpose of this is to find out a common denominator
  // for all fractional tick values in all tickables of all voices,
  // so that the values can be expanded and the numerator used
  // as an integer tick value.
  const totalTicks = voices[0].getTotalTicks();
  const resolutionMultiplier = voices.reduce((resolutionMultiplier, voice) => {
    if (!voice.getTotalTicks().equals(totalTicks)) {
      throw new Vex.RERR(
        'TickMismatch', 'Voices should have same total note duration in ticks.'
      );
    }

    if (voice.getMode() === Voice.Mode.STRICT && !voice.isComplete()) {
      throw new Vex.RERR(
        'IncompleteVoice', 'Voice does not have enough notes.'
      );
    }

    return Math.max(
      resolutionMultiplier,
      Fraction.LCM(resolutionMultiplier, voice.getResolutionMultiplier())
    );
  }, 1);

  // Initialize tick maps.
  const tickToContextMap = {};
  const tickList = [];
  const contexts = [];

  // For each voice, extract notes and create a context for every
  // new tick that hasn't been seen before.
  voices.forEach((voice, voiceIndex) => {
    // Use resolution multiplier as denominator to expand ticks
    // to suitable integer values, so that no additional expansion
    // of fractional tick values is needed.
    const ticksUsed = new Fraction(0, resolutionMultiplier);

    voice.getTickables().forEach(tickable => {
      const integerTicks = ticksUsed.numerator;

      // If we have no tick context for this tick, create one.
      if (!tickToContextMap[integerTicks]) {
        const newContext = new ContextType({ tickID: integerTicks });
        contexts.push(newContext);
        tickToContextMap[integerTicks] = newContext;
      }

      // Add this tickable to the TickContext.
      addToContext(tickable, tickToContextMap[integerTicks], voiceIndex);

      // Maintain a sorted list of tick contexts.
      tickList.push(integerTicks);
      ticksUsed.add(tickable.getTicks());
    });
  });

  return {
    map: tickToContextMap,
    array: contexts,
    list: Vex.SortAndUnique(tickList, (a, b) => a - b, (a, b) => a === b),
    resolutionMultiplier,
  };
}

export class Formatter {
  // Helper function to layout "notes" one after the other without
  // regard for proportions. Useful for tests and debugging.
  static SimpleFormat(notes, x = 0, { paddingBetween = 10 } = {}) {
    notes.reduce((x, note) => {
      note.addToModifierContext(new ModifierContext());
      const tick = new TickContext().addTickable(note).preFormat();
      const metrics = tick.getMetrics();
      tick.setX(x + metrics.totalLeftPx);

      return x + tick.getWidth() + metrics.totalRightPx + paddingBetween;
    }, x);
  }

  // Helper function to plot formatter debug info.
  static plotDebugging(ctx, formatter, xPos, y1, y2, options) {
    options = {
      stavePadding: Vex.Flow.DEFAULT_FONT_STACK[0].lookupMetric('stave.padding'),
      ...options,
    };

    const x = xPos + options.stavePadding;
    const contextGaps = formatter.contextGaps;
    function stroke(x1, x2, color) {
      ctx.beginPath();
      ctx.setStrokeStyle(color);
      ctx.setFillStyle(color);
      ctx.setLineWidth(1);
      ctx.fillRect(x1, y1, Math.max(x2 - x1, 0), y2 - y1);
    }

    ctx.save();
    ctx.setFont('Arial', 8, '');

    contextGaps.gaps.forEach(gap => {
      stroke(x + gap.x1, x + gap.x2, 'rgba(100,200,100,0.4)');
      ctx.setFillStyle('green');
      ctx.fillText(Math.round(gap.x2 - gap.x1), x + gap.x1, y2 + 12);
    });

    ctx.setFillStyle('red');
    ctx.fillText(`Loss: ${(formatter.totalCost || 0).toFixed(2)} Shift: ${(formatter.totalShift || 0).toFixed(2)} Gap: ${contextGaps.total.toFixed(2)}`, x - 20, y2 + 27);
    ctx.restore();
  }

  // Helper function to format and draw a single voice. Returns a bounding
  // box for the notation.
  //
  // Parameters:
  // * `ctx` - The rendering context
  // * `stave` - The stave to which to draw (`Stave` or `TabStave`)
  // * `notes` - Array of `Note` instances (`StaveNote`, `TextNote`, `TabNote`, etc.)
  // * `params` - One of below:
  //    * Setting `autobeam` only `(context, stave, notes, true)` or
  //      `(ctx, stave, notes, {autobeam: true})`
  //    * Setting `align_rests` a struct is needed `(context, stave, notes, {align_rests: true})`
  //    * Setting both a struct is needed `(context, stave, notes, {
  //      autobeam: true, align_rests: true})`
  //
  // `autobeam` automatically generates beams for the notes.
  // `align_rests` aligns rests with nearby notes.
  static FormatAndDraw(ctx, stave, notes, params) {
    const options = {
      auto_beam: false,
      align_rests: false,
    };

    if (typeof params === 'object') {
      Vex.Merge(options, params);
    } else if (typeof params === 'boolean') {
      options.auto_beam = params;
    }

    // Start by creating a voice and adding all the notes to it.
    const voice = new Voice(Flow.TIME4_4)
      .setMode(Voice.Mode.SOFT)
      .addTickables(notes);

    // Then create beams, if requested.
    const beams = options.auto_beam ? Beam.applyAndGetBeams(voice) : [];

    // Instantiate a `Formatter` and format the notes.
    new Formatter()
      .joinVoices([voice], { align_rests: options.align_rests })
      .formatToStave([voice], stave, { align_rests: options.align_rests, stave });

    // Render the voice and beams to the stave.
    voice.setStave(stave).draw(ctx, stave);
    beams.forEach(beam => beam.setContext(ctx).draw());

    // Return the bounding box of the voice.
    return voice.getBoundingBox();
  }

  // Helper function to format and draw aligned tab and stave notes in two
  // separate staves.
  //
  // Parameters:
  // * `ctx` - The rendering context
  // * `tabstave` - A `TabStave` instance on which to render `TabNote`s.
  // * `stave` - A `Stave` instance on which to render `Note`s.
  // * `notes` - Array of `Note` instances for the stave (`StaveNote`, `BarNote`, etc.)
  // * `tabnotes` - Array of `Note` instances for the tab stave (`TabNote`, `BarNote`, etc.)
  // * `autobeam` - Automatically generate beams.
  // * `params` - A configuration object:
  //    * `autobeam` automatically generates beams for the notes.
  //    * `align_rests` aligns rests with nearby notes.
  static FormatAndDrawTab(ctx, tabstave, stave, tabnotes, notes, autobeam, params) {
    const opts = {
      auto_beam: autobeam,
      align_rests: false,
    };

    if (typeof params === 'object') {
      Vex.Merge(opts, params);
    } else if (typeof params === 'boolean') {
      opts.auto_beam = params;
    }

    // Create a `4/4` voice for `notes`.
    const notevoice = new Voice(Flow.TIME4_4)
      .setMode(Voice.Mode.SOFT)
      .addTickables(notes);

    // Create a `4/4` voice for `tabnotes`.
    const tabvoice = new Voice(Flow.TIME4_4)
      .setMode(Voice.Mode.SOFT)
      .addTickables(tabnotes);

    // Then create beams, if requested.
    const beams = opts.auto_beam ? Beam.applyAndGetBeams(notevoice) : [];

    // Instantiate a `Formatter` and align tab and stave notes.
    new Formatter()
      .joinVoices([notevoice], { align_rests: opts.align_rests })
      .joinVoices([tabvoice])
      .formatToStave([notevoice, tabvoice], stave, { align_rests: opts.align_rests });

    // Render voices and beams to staves.
    notevoice.draw(ctx, stave);
    tabvoice.draw(ctx, tabstave);
    beams.forEach(beam => beam.setContext(ctx).draw());

    // Draw a connector between tab and note staves.
    new StaveConnector(stave, tabstave).setContext(ctx).draw();
  }

  // Auto position rests based on previous/next note positions.
  //
  // Params:
  // * `notes`: An array of notes.
  // * `alignAllNotes`: If set to false, only aligns non-beamed notes.
  // * `alignTuplets`: If set to false, ignores tuplets.
  static AlignRestsToNotes(notes, alignAllNotes, alignTuplets) {
    notes.forEach((note, index) => {
      if (note instanceof StaveNote && note.isRest()) {
        if (note.tuplet && !alignTuplets) return;

        // If activated rests not on default can be rendered as specified.
        const position = note.getGlyph().position.toUpperCase();
        if (position !== 'R/4' && position !== 'B/4') return;

        if (alignAllNotes || note.beam != null) {
          // Align rests with previous/next notes.
          const props = note.getKeyProps()[0];
          if (index === 0) {
            props.line = lookAhead(notes, props.line, index, false);
            note.setKeyLine(0, props.line);
          } else if (index > 0 && index < notes.length) {
            // If previous note is a rest, use its line number.
            let restLine;
            if (notes[index - 1].isRest()) {
              restLine = notes[index - 1].getKeyProps()[0].line;
              props.line = restLine;
            } else {
              restLine = notes[index - 1].getLineForRest();
              // Get the rest line for next valid non-rest note group.
              props.line = lookAhead(notes, restLine, index, true);
            }
            note.setKeyLine(0, props.line);
          }
        }
      }
    });

    return this;
  }

  constructor(options) {
    this.options = {
      softmaxFactor: null,
      maxIterations: 10,
      ...options
    };

    // Minimum width required to render all the notes in the voices.
    this.minTotalWidth = 0;

    // This is set to `true` after `minTotalWidth` is calculated.
    this.hasMinTotalWidth = false;

    // Total number of ticks in the voice.
    this.totalTicks = new Fraction(0, 1);

    // Arrays of tick and modifier contexts.
    this.tickContexts = null;
    this.modiferContexts = null;

    // Gaps between contexts, for free movement of notes post
    // formatting.
    this.contextGaps = {
      total: 0,
      gaps: [],
    };

    this.voices = [];
    this.iterationsCompleted = 0;
    this.lossHistory = [];
  }

  // Find all the rests in each of the `voices` and align them
  // to neighboring notes. If `alignAllNotes` is `false`, then only
  // align non-beamed notes.
  alignRests(voices, alignAllNotes) {
    if (!voices || !voices.length) {
      throw new Vex.RERR('BadArgument', 'No voices to format rests');
    }

    voices.forEach(voice =>
      Formatter.AlignRestsToNotes(voice.getTickables(), alignAllNotes));
  }

  // Calculate the minimum width required to align and format `voices`.
  preCalculateMinTotalWidth(voices) {
    // Cache results.
    if (this.hasMinTotalWidth) return this.minTotalWidth;

    // Create tick contexts if not already created.
    if (!this.tickContexts) {
      if (!voices) {
        throw new Vex.RERR(
          'BadArgument', "'voices' required to run preCalculateMinTotalWidth"
        );
      }

      this.createTickContexts(voices);
    }

    const { list: contextList, map: contextMap } = this.tickContexts;

    // Go through each tick context and calculate total width.
    this.minTotalWidth = contextList
      .map(tick => {
        const context = contextMap[tick];
        context.preFormat();
        const width =  context.getWidth();
        const metrics = context.getMetrics();
        return width + metrics.totalLeftPx;
      })
      .reduce((a, b) => a + b, 0);

    this.hasMinTotalWidth = true;

    return this.minTotalWidth;
  }

  // Get minimum width required to render all voices. Either `format` or
  // `preCalculateMinTotalWidth` must be called before this method.
  getMinTotalWidth() {
    if (!this.hasMinTotalWidth) {
      throw new Vex.RERR(
        'NoMinTotalWidth',
        "Call 'preCalculateMinTotalWidth' or 'preFormat' before calling 'getMinTotalWidth'"
      );
    }

    return this.minTotalWidth;
  }

  // Create `ModifierContext`s for each tick in `voices`.
  createModifierContexts(voices) {
    const contexts = createContexts(
      voices,
      ModifierContext,
      (tickable, context) => tickable.addToModifierContext(context)
    );

    this.modiferContexts = contexts;
    return contexts;
  }

  // Create `TickContext`s for each tick in `voices`. Also calculate the
  // total number of ticks in voices.
  createTickContexts(voices) {
    const contexts = createContexts(
      voices,
      TickContext,
      (tickable, context, voiceIndex) => context.addTickable(tickable, voiceIndex)
    );

    contexts.array.forEach(context => {
      context.tContexts = contexts.array;
    });

    this.totalTicks = voices[0].getTicksUsed().clone();
    this.tickContexts = contexts;
    return contexts;
  }

  computeVoiceFormatting() {
    this.voices.forEach((voice) => {
      voice.widthTicksUsed = voice.tickables.map((tickable) => tickable.widthTicks)
        .reduce((a, b) => a + b);
      const exp = (tickable) => Math.pow(voice.options.softmaxFactor, tickable.widthTicks / voice.widthTicksUsed);
      voice.expTicksUsed = voice.tickables.map(exp).reduce((a, b) => a + b);
    });
  }
  computeMaxWidthEstimate(ideals) {
    const voiceWidths = [];
    this.voices.forEach((voice, index) => {
      voiceWidths.push(0);
      ideals.forEach((ideal, idIx) => {
        if (idIx > 0) {
          const tickByVoice = ideal.fromTickable.tickContext.getTickablesByVoice();
          if (tickByVoice[index]) {
            voiceWidths[index] += ideal.expectedDistance;
            if (ideal.overlap > 0) {
              voiceWidths[index] += ideal.overlap;
            }
          }
        }
      });
      const lastContext = voice.tickables[voice.tickables.length - 1].getTickContext();
      const metrics = lastContext.getMetrics();
      voiceWidths[index] += metrics.notePx + metrics.totalLeftPx + metrics.totalRightPx;
    });
    return voiceWidths.reduce((a, b) => a > b ? a : b);
  }

  softmax(voice, tickValue) {
    const exp = (v) => Math.pow(voice.options.softmaxFactor, v / voice.widthTicksUsed);
    return exp(tickValue) / voice.expTicksUsed;
  }

  calculateWidthMap(adjustedJustifyWidth) {
    const widthMap = {};
    const previousWidthByVoice = {};
    const contexts = this.tickContexts;
    let i = 0;
    const voiceMap = {};
    let foundOverlappingLine = false;
    // Calculate softmax basis based on current widthTick levels
    this.computeVoiceFormatting();
    const { list: contextList, map: contextMap } = contexts;

    contextList.forEach((tick) => {
      const context = contextMap[tick];
      widthMap[tick] = {
        context,
        tick,
        widthData: {}
      };
      const voicesInContext = context.getTickablesByVoice();
      Object.keys(voicesInContext).forEach((voiceKey) => {
        if (typeof(previousWidthByVoice[voiceKey]) === 'undefined') {
          previousWidthByVoice[voiceKey] = null;
        }
        const widthEntry = {
          expectedDistance: 0,
          previousWidth: previousWidthByVoice[voiceKey],
          nextWidth: null,
          overlap: 0,
          voiceKey,
          tick,
          x: 0,
          tickable: voicesInContext[voiceKey]
        };
        // Keep track of existing voices for backtrack
        if (!voiceMap[voiceKey]) {
          voiceMap[voiceKey] = true;
        }
        const tickableMetrics = widthEntry.tickable.getMetrics();
        widthEntry.width = tickableMetrics.notePx + tickableMetrics.modRightPx + tickableMetrics.rightDisplacedHeadPx;
        if (widthEntry.previousWidth) {
          widthEntry.previousWidth.nextWidth = widthEntry;
          const previousMetrics = widthEntry.previousWidth.tickable.getMetrics();
          widthEntry.expectedDistance =
            this.softmax(widthEntry.previousWidth.tickable.getVoice(), widthEntry.previousWidth.tickable.widthTicks) * adjustedJustifyWidth;
          widthEntry.overlap = (previousMetrics.notePx + previousMetrics.rightDisplacedHeadPx + previousMetrics.modRightPx) -
            (widthEntry.expectedDistance - widthEntry.tickable.tickContext.totalLeftPx);
          widthEntry.x = widthEntry.previousWidth.x + widthEntry.expectedDistance;
          if (widthEntry.overlap > 0) {
            foundOverlappingLine = true;
          }
        } else {
          widthEntry.x = context.getX();
        }
        L('expectedDistance/overlap/x/tick/ticks/voice', widthEntry.expectedDistance, widthEntry.overlap, widthEntry.x,
          tick, widthEntry.tickable.ticks.value(), widthEntry.voiceKey);
        previousWidthByVoice[voiceKey] = widthEntry;
        widthMap[tick].widthData[voiceKey] = widthEntry;
      });
    });
    // If we haven't found any collisions per voice, look for overlaps between voices (unaligned/misaligned voices)
    if (!foundOverlappingLine) {
      // We start by a 'dress rehearsal' where each tickable is put at what it's X would be - max X of tickables at a context
      let j = 0;
      for (i = 0; i < contextList.length; ++i) {
        const widthData = widthMap[contextList[i]].widthData;
        const voiceKeys = Object.keys(widthData);
        let maxX = 0;
        for (j = 0; j < voiceKeys.length; ++j) {
          const widthEntry = widthData[voiceKeys[j]];
          const x = widthEntry.previousWidth ? widthEntry.previousWidth.x + widthEntry.expectedDistance : widthEntry.x;
          maxX = x > maxX ? x : maxX;
        }
        for (j = 0; j < voiceKeys.length; ++j) {
          widthData[voiceKeys[j]].x = maxX;
        }
      }
      const voiceCount = Object.keys(voiceMap).length;
      const ticksSoFar = [0];
      // Now see if any tickable is to the left of a tickable earlier in the measure, in a different voice
      for (i = 1; i < contextList.length; ++i) {
        const tick = contextList[i];
        const widthData = widthMap[tick].widthData;
        const voicesInContext = Object.keys(widthData);
        const checkedVoices = {};
        let p = 0;
        for (p = 0; p < voicesInContext.length; ++p) {
          const widthEntry = widthData[voicesInContext[p]];
          // Go backwards from this tick context to find previous notes per voice
          // and compare x with our x
          for (j = ticksSoFar.length - 1; j >= 0; --j) {
            const previousWidths = widthMap[contextList[j]];
            let k = 0;
            const prevKeys = Object.keys(previousWidths.widthData);
            for (k = 0; k < prevKeys.length; ++k) {
              const prevKey = prevKeys[k];
              const prevEntry = previousWidths.widthData[prevKey];
              checkedVoices[prevKey] = true;
              if (prevEntry.x >= widthEntry.x && prevEntry.x - widthEntry.x > widthEntry.overlap) {
                widthEntry.overlap = prevEntry.x - widthEntry.x + 1;
                // foundOverlappingVoice = true;
                L('alternate overlap from tick/voice/newVal',
                  prevEntry.tick, prevEntry.voiceKey, widthEntry.overlap);
              }
            }
            if (Object.keys(checkedVoices).length === voiceCount) {
              break; // we've searched all voices at this tick
            }
          }
        }
        ticksSoFar.push(tick);
      }
    }
    return widthMap;
  }
  adjustOverlaps(contextList, widthMap, istats) {
    let overlaps = false;
    let maxUnderlap = null;
    contextList.forEach((tick) => {
      const widthContext = widthMap[tick];
      Object.keys(widthContext.widthData).forEach((voiceKey) => {
        const widthEntry = widthContext.widthData[voiceKey];
        if (widthEntry.overlap > 0 && istats.stdDev > 1) {
          overlaps = true;
          widthEntry.previousWidth.tickable.widthTicks =
            widthEntry.previousWidth.tickable.widthTicks * (1 + (widthEntry.overlap / istats.stdDev));
        } else if ((widthEntry.overlap < istats.mean - istats.stdDev || widthEntry.overlap < 2 * istats.mean)
          && (maxUnderlap === null || widthEntry.overlap < maxUnderlap.overlap)
          && widthEntry.overlap < 0 && istats.stdDev > 1 && overlaps) {
          maxUnderlap = widthEntry;
        }
      });
    });
    // If there were overlaps, reduce the greatest overlap to make room for the additional ticks
    if (overlaps && maxUnderlap && maxUnderlap.previousWidth) {
      maxUnderlap.previousWidth.tickable.widthTicks = maxUnderlap.previousWidth.tickable.widthTicks * 0.85;
    }
    return overlaps;
  }
  // This is the core formatter logic. Format voices and justify them
  // to `justifyWidth` pixels. `renderingContext` is required to justify elements
  // that can't retreive widths without a canvas. This method sets the `x` positions
  // of all the tickables/notes in the formatter.
  preFormat(justifyWidth = 0, renderingContext, voices, stave) {
    // Initialize context maps.
    const contexts = this.tickContexts;
    const { list: contextList, map: contextMap } = contexts;
    let widthMap = null;

    // Reset loss history for evaluator.
    this.lossHistory = [];

    // If voices and a stave were provided, set the Stave for each voice
    // and preFormat to apply Y values to the notes;
    if (voices && stave) {
      voices.forEach(voice => voice.setStave(stave).preFormat());
    }

    // Now distribute the ticks to each tick context, and assign them their
    // own X positions.
    let x = 0;
    let shift = 0;
    this.minTotalWidth = 0;

    // Step 1: Calculate starting X based on the widths and time-order alone
    // The music will be aligned vertically and fully left-justified
    contextList.forEach((tick) => {
      const context = contextMap[tick];
      if (renderingContext) context.setContext(renderingContext);

      // Make sure that all tickables in this context have calculated their
      // space requirements.
      context.preFormat();

      const width = context.getWidth();
      this.minTotalWidth += width;

      const metrics = context.getMetrics();
      x = x + shift + metrics.totalLeftPx;
      context.setX(x);

      // Calculate shift for the next tick.
      shift = width - metrics.totalLeftPx;
    });

    this.minTotalWidth = x + shift;
    this.hasMinTotalWidth = true;

    // If we are not justifying, we are done.  Leave music left-justified.
    if (justifyWidth <= 0) return this.evaluate();

    // Start justification. Subtract the right extra pixels of the final context because the formatter
    // justifies based on the context's X position, which is the left-most part of the note head.
    const lastContext = contextMap[contextList[contextList.length - 1]];
    const lastMetrics = lastContext.getMetrics();
    const adjustedJustifyWidth = justifyWidth -
      lastMetrics.notePx -
      lastMetrics.totalRightPx -
      lastMetrics.totalLeftPx;

    // step 1: Format the music proportionally
    widthMap = this.calculateWidthMap(adjustedJustifyWidth);

    function shiftToIdealDistances(widthMap) {
      // Distribute ticks to the contexts based on the calculated distance error.
      const centerX = adjustedJustifyWidth / 2;

      contextList.forEach((tick) => {
        const widthData = widthMap[tick].widthData;
        let contextX = 0;
        Object.keys(widthData).forEach((widthKey) => {
          const widthEntry = widthData[widthKey];
          const startX = widthEntry.previousWidth ? widthEntry.previousWidth.tickable.getX() :
            widthMap[tick].context.getX();
          const total = startX + widthEntry.expectedDistance;
          if (total > contextX) {
            contextX = total;
          }
        });
        widthMap[tick].context.setX(contextX);
        // Move center aligned tickables to middle
        widthMap[tick].context.getCenterAlignedTickables().forEach(tickable => { // eslint-disable-line
          tickable.center_x_shift = centerX - widthMap[tick].context.getX();
        });
      });
    }

    const targetWidth = adjustedJustifyWidth;
    let overlapIterations = this.options.maxIterations;
    const maxOverlap = (wd) => Object.keys(wd.widthData).map((key) => wd.widthData[key].overlap).reduce((a, b) => a > b ? a : b);
    const maxOverlaps = contextList.map((tick) => maxOverlap(widthMap[tick]));
    maxOverlaps.splice(0, 1);
    const std = (numArray) => {
      if (numArray.length < 1) {
        return { mean: 1, stdDev: 1 };
      }
      const sum = numArray.reduce((a, b) => a + b);
      const mean = sum / numArray.length;
      const variance = numArray.map((a) => Math.pow(a - mean, 2)).reduce((a, b) => a + b) / numArray.length;
      return { mean, stdDev: Math.sqrt(variance) };
    };
    const istats = std(maxOverlaps);
    L('ideal means/stdDev', istats.mean, istats.stdDev);

    // Step 2: alignment
    // If any notes collide with their left neighbor (overlap is > 0), do 2 things:
    // 1. add ticks to those notes to make the distance between them and left neighbor greater
    // 2. remove ticks from notes that have an extra large space between them and their neihbor, to give the crowded notes more room
    let overlaps = this.adjustOverlaps(contextList, widthMap, istats);
    while (overlaps && overlapIterations) {
      overlapIterations -= 1;
      // recalculate softMax based on new ticks
      widthMap = this.calculateWidthMap(targetWidth);
      overlaps = this.adjustOverlaps(contextList, widthMap, istats);
    }

    // Assign X positions based on the formatting.
    shiftToIdealDistances(widthMap);

    // Just one context. Done formatting.
    if (contextList.length === 1) return null;

    const actualWidth = lastContext.getX() + lastContext.totalRightPx + lastContext.notePx + lastContext.rightDisplacedHeadPx + 10;
    const ratio = (justifyWidth - actualWidth - 10);
    const ccount = contextList.length;
    contextList.forEach((tick, i) => {
      const context = contextMap[tick];
      const oldX = context.getX();
      context.setX(oldX + (ratio / ccount) * i);
    });

    this.justifyWidth = justifyWidth;
    return this.evaluate();
  }

  // Calculate the total cost of this formatting decision.
  evaluate() {
    const justifyWidth = this.justifyWidth;
    // Calculate available slack per tick context. This works out how much freedom
    // to move a context has in either direction, without affecting other notes.
    this.contextGaps = { total: 0, gaps: [] };
    this.tickContexts.list.forEach((tick, index) => {
      if (index === 0) return;
      const prevTick = this.tickContexts.list[index - 1];
      const prevContext = this.tickContexts.map[prevTick];
      const context = this.tickContexts.map[tick];
      const prevMetrics = prevContext.getMetrics();
      const currMetrics = context.getMetrics();

      // Calculate X position of right edge of previous note
      const insideRightEdge = prevContext.getX() + prevMetrics.notePx + prevMetrics.totalRightPx;
      // Calculate X position of left edge of current note
      const insideLeftEdge = context.getX() - (currMetrics.totalLeftPx);
      const gap = insideLeftEdge - insideRightEdge;
      this.contextGaps.total += gap;
      this.contextGaps.gaps.push({ x1: insideRightEdge, x2: insideLeftEdge });

      // Tell the tick contexts how much they can reposition themselves.
      context.getFormatterMetrics().freedom.left = gap;
      prevContext.getFormatterMetrics().freedom.right = gap;
    });

    // Calculate mean distance in each voice for each duration type, then calculate
    // how far each note is from the mean.
    const durationStats = this.durationStats = {};

    function updateStats(duration, space) {
      const stats = durationStats[duration];
      if (stats === undefined) {
        durationStats[duration] = { mean: space, count: 1 };
      } else {
        stats.count += 1;
        stats.mean = (stats.mean + space) / 2;
      }
    }

    this.voices.forEach(voice => {
      voice.getTickables().forEach((note, i, notes) => {
        const duration = note.getTicks().clone().simplify().toString();
        const metrics = note.getMetrics();
        const formatterMetrics = note.getFormatterMetrics();
        const leftNoteEdge = note.getX() + metrics.notePx + metrics.totalRightPx;
        let space = 0;

        if (i < (notes.length - 1)) {
          const rightNote = notes[i + 1];
          const rightMetrics = rightNote.getMetrics();
          const rightNoteEdge = rightNote.getX() - rightMetrics.totalLeftPx;

          space = rightNoteEdge - leftNoteEdge;
          formatterMetrics.space.used = rightNote.getX() - note.getX();
          rightNote.getFormatterMetrics().freedom.left = space;
        } else {
          space = justifyWidth - leftNoteEdge;
          formatterMetrics.space.used = justifyWidth - note.getX();
        }

        formatterMetrics.freedom.right = space;
        updateStats(duration, formatterMetrics.space.used);
      });
    });

    // Calculate how much each note deviates from the mean. Loss function is square
    // root of the sum of squared deviations.
    let totalDeviation = 0;
    this.voices.forEach(voice => {
      voice.getTickables().forEach((note) => {
        const duration = note.getTicks().clone().simplify().toString();
        const metrics = note.getFormatterMetrics();

        metrics.space.mean = durationStats[duration].mean;
        metrics.duration = duration;
        metrics.iterations += 1;
        metrics.space.deviation = metrics.space.used - metrics.space.mean;

        totalDeviation += Math.pow(metrics.space.deviation, 2);
      });
    });

    this.totalCost = Math.sqrt(totalDeviation);
    this.lossHistory.push(this.totalCost);
    return this.totalCost;
  }

  // Run a single iteration of rejustification. At a high level, this method calculates
  // the overall "loss" (or cost) of this layout, and repositions tickcontexts in an
  // attempt to reduce the cost. You can call this method multiple times until it finds
  // and oscillates around a global minimum.
  //
  // Alpha is the "learning rate" for the formatter. It determines how much of a shift
  // the formatter should make based on its cost function.
  tune(options) {
    options = {
      alpha: 0.5,
      ...options,
    };

    const sum = (arr) => arr.reduce((a, b) => a + b);

    // Move `current` tickcontext by `shift` pixels, and adjust the freedom
    // on adjacent tickcontexts.
    function move(current, prev, next, shift) {
      current.setX(current.getX() + shift);
      current.getFormatterMetrics().freedom.left += shift;
      current.getFormatterMetrics().freedom.right -= shift;

      if (prev) prev.getFormatterMetrics().freedom.right += shift;
      if (next) next.getFormatterMetrics().freedom.left -= shift;
    }

    let shift = 0;
    this.totalShift = 0;
    this.tickContexts.list.forEach((tick, index, list) => {
      const context = this.tickContexts.map[tick];
      const prevContext = (index > 0) ? this.tickContexts.map[list[index - 1]] : null;
      const nextContext = (index < list.length - 1) ? this.tickContexts.map[list[index + 1]] : null;

      move(context, prevContext, nextContext, shift);

      const cost = -sum(
        context.getTickables().map(t => t.getFormatterMetrics().space.deviation));

      if (cost > 0) {
        shift = -Math.min(context.getFormatterMetrics().freedom.right, Math.abs(cost));
      } else if (cost < 0) {
        if (nextContext) {
          shift = Math.min(nextContext.getFormatterMetrics().freedom.right, Math.abs(cost));
        } else {
          shift = 0;
        }
      }

      shift *= options.alpha;
      this.totalShift += shift;
    });

    this.iterationsCompleted++;
    return this.evaluate();
  }

  // This is the top-level call for all formatting logic completed
  // after `x` *and* `y` values have been computed for the notes
  // in the voices.
  postFormat() {
    const postFormatContexts = (contexts) =>
      contexts.list.forEach(tick => contexts.map[tick].postFormat());

    postFormatContexts(this.modiferContexts);
    postFormatContexts(this.tickContexts);

    return this;
  }

  // Take all `voices` and create `ModifierContext`s out of them. This tells
  // the formatters that the voices belong on a single stave.
  joinVoices(voices) {
    this.createModifierContexts(voices);
    this.hasMinTotalWidth = false;
    return this;
  }

  // Align rests in voices, justify the contexts, and position the notes
  // so voices are aligned and ready to render onto the stave. This method
  // mutates the `x` positions of all tickables in `voices`.
  //
  // Voices are full justified to fit in `justifyWidth` pixels.
  //
  // Set `options.context` to the rendering context. Set `options.align_rests`
  // to true to enable rest alignment.
  format(voices, justifyWidth, options) {
    const opts = {
      align_rests: false,
      context: null,
      stave: null,
      ...options,
    };

    this.voices = voices;
    if (this.options.softmaxFactor) {
      this.voices.forEach(v => v.setSoftmaxFactor(this.options.softmaxFactor));
    }

    this.alignRests(voices, opts.align_rests);
    this.createTickContexts(voices);
    this.preFormat(justifyWidth, opts.context, voices, opts.stave);

    // Only postFormat if a stave was supplied for y value formatting
    if (opts.stave) this.postFormat();

    return this;
  }

  // This method is just like `format` except that the `justifyWidth` is inferred
  // from the `stave`.
  formatToStave(voices, stave, options) {
    options = {
      padding: 10,
      ...options
    };

    const justifyWidth = stave.getNoteEndX() - stave.getNoteStartX() - options.padding;
    L('Formatting voices to width: ', justifyWidth);
    return this.format(voices, justifyWidth, { context: stave.getContext(), ...options });
  }
}
