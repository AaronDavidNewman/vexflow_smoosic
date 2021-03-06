import { Vex } from './vex';
import { Formatter } from './formatter';

// To enable logging for this class. Set `Vex.Flow.Formatter.DEBUG` to `true`.
function L(...args) { if (WidthFormatter.DEBUG) Vex.L('Vex.Flow.WidthFormatter', args); }

export class WidthFormatter extends Formatter {
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
}
