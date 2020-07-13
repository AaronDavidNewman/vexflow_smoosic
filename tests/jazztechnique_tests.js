/**
 * VexFlow - Stroke Tests
 * Copyright Mohit Muthanna 2010 <mohit@muthanna.com>
 */

VF.Test.JazzTechnique = (function() {
  var JazzTechnique = {
    Start: function() {
      var runSVG = VF.Test.runSVGTest;
      QUnit.module('JazzTechniques');
      runSVG('JazzTechnique', JazzTechnique.testAll);
    },

    testAll: function(options) {
      var vf = VF.Test.makeFactory(options, 900, 400);
      var ctx = vf.getContext();
      ctx.scale(1, 1); ctx.fillStyle = '#221'; ctx.strokeStyle = '#221';

      function newNote(keys, duration, modifier) {
        return new VF.StaveNote({ keys, duration }).addModifier(0, modifier);
      }

      var xStart = 10;
      var xWidth = 300;
      var yStart = 10;
      var staffHeight = 70;

      function draw(modifiers, keys, x, width, y) {
        var notes = [];

        var stave = new VF.Stave(x, y, width)
          .addClef('treble').setContext(ctx).draw();

        notes.push(newNote(keys, 'q', modifiers[0]));
        notes.push(newNote(keys, 'q', modifiers[1]));
        notes.push(newNote(keys, 'q', modifiers[2]));
        notes.push(newNote(keys, 'q', modifiers[3]));

        VF.Beam.generateBeams(notes);
        VF.Formatter.FormatAndDraw(ctx, stave, notes);
      }
      /*
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
      SMEAR: 11*/
      var mods = [];
      var curX = xStart;
      var curY = yStart;
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SCOOP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_SHORT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.LIFT));

      draw(mods, ['a/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_LONG));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.BEND));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_CLOSED));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_OPEN));
      draw(mods, ['a/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FLIP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.TURN));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SMEAR));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      draw(mods, ['a/5'], curX, xWidth, curY);

      curX = xStart;
      curY += staffHeight;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SCOOP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_SHORT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.LIFT));

      draw(mods, ['e/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_LONG));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.BEND));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_CLOSED));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_OPEN));
      draw(mods, ['e/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FLIP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.TURN));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SMEAR));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      draw(mods, ['e/5'], curX, xWidth, curY);

      curX = xStart;
      curY += staffHeight;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SCOOP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_SHORT));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.LIFT));

      draw(mods, ['e/4'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FALL_LONG));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.BEND));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_CLOSED));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.MUTE_OPEN));
      draw(mods, ['e/4'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.FLIP));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.TURN));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.SMEAR));
      mods.push(new VF.JazzTechnique(VF.JazzTechnique.Type.DOIT));
      draw(mods, ['e/4'], curX, xWidth, curY);

      ok(true, 'Jazz Technique');
    },
  };
  return JazzTechnique;
}());
