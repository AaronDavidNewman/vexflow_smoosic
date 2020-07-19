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
        const dot = duration.indexOf('d') >= 0;
        const rv =  new VF.StaveNote({ keys, duration })
          .addModifier(0, modifier)
          .addAccidental(0, new VF.Accidental('b'));
        if (dot) {
          rv.addDotToAll();
        }
        return rv;
      }

      var xStart = 10;
      var xWidth = 300;
      var yStart = 10;
      var staffHeight = 70;

      function draw(modifiers, keys, x, width, y) {
        var notes = [];

        var stave = new VF.Stave(x, y, width)
          .addClef('treble').setContext(ctx).draw();

        notes.push(newNote(keys, '4d', modifiers[0]));
        notes.push(newNote(keys, '8', modifiers[1]));
        notes.push(newNote(keys, '4d', modifiers[2]));
        notes.push(newNote(keys, '8', modifiers[3]));

        VF.Beam.generateBeams(notes);
        const voice = new VF.Voice({
          num_beats: 4,
          beat_value: 4
        }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(notes);
        const formatter = new VF.Formatter({ softmaxFactor: 2 }).joinVoices([voice]);
        formatter.format([voice], xWidth);
        stave.setContext(ctx).draw();
        voice.draw(ctx, stave);
      }
      var mods = [];
      var curX = xStart;
      var curY = yStart;
      mods.push(new VF.JazzTechnique('scoop'));
      mods.push(new VF.JazzTechnique('doit'));
      mods.push(new VF.JazzTechnique('fall'));
      mods.push(new VF.JazzTechnique('doitLong'));

      draw(mods, ['a/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('fallLong'));
      mods.push(new VF.JazzTechnique('bend'));
      mods.push(new VF.JazzTechnique('plungerClosed'));
      mods.push(new VF.JazzTechnique('plungerOpen'));
      draw(mods, ['a/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('flip'));
      mods.push(new VF.JazzTechnique('turn'));
      mods.push(new VF.JazzTechnique('smear'));
      mods.push(new VF.JazzTechnique('doit'));
      draw(mods, ['a/5'], curX, xWidth, curY);

      curX = xStart;
      curY += staffHeight;

      mods = [];
      mods.push(new VF.JazzTechnique('scoop'));
      mods.push(new VF.JazzTechnique('doit'));
      mods.push(new VF.JazzTechnique('fall'));
      mods.push(new VF.JazzTechnique('doitLong'));

      draw(mods, ['e/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('fallLong'));
      mods.push(new VF.JazzTechnique('bend'));
      mods.push(new VF.JazzTechnique('plungerClosed'));
      mods.push(new VF.JazzTechnique('plungerOpen'));
      draw(mods, ['e/5'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('flip'));
      mods.push(new VF.JazzTechnique('turn'));
      mods.push(new VF.JazzTechnique('smear'));
      mods.push(new VF.JazzTechnique('doit'));
      draw(mods, ['e/5'], curX, xWidth, curY);

      curX = xStart;
      curY += staffHeight;

      mods = [];
      mods.push(new VF.JazzTechnique('scoop'));
      mods.push(new VF.JazzTechnique('doit'));
      mods.push(new VF.JazzTechnique('fall'));
      mods.push(new VF.JazzTechnique('doitLong'));

      draw(mods, ['e/4'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('fallLong'));
      mods.push(new VF.JazzTechnique('bend'));
      mods.push(new VF.JazzTechnique('plungerClosed'));
      mods.push(new VF.JazzTechnique('plungerOpen'));
      draw(mods, ['e/4'], curX, xWidth, curY);
      curX += xWidth;

      mods = [];
      mods.push(new VF.JazzTechnique('flip'));
      mods.push(new VF.JazzTechnique('turn'));
      mods.push(new VF.JazzTechnique('smear'));
      mods.push(new VF.JazzTechnique('doit'));
      draw(mods, ['e/4'], curX, xWidth, curY);

      ok(true, 'Jazz Ornaments');
    },
  };
  return JazzTechnique;
}());
