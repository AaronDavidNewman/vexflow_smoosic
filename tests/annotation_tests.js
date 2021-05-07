/**
 * VexFlow - Annotation Tests
 * Copyright Mohit Muthanna 2010 <mohit@muthanna.com>
 */

VF.Test.Annotation = (function () {
  var runTests = VF.Test.runTests;
  var Annotation = {
    Start: function () {
      QUnit.module('Annotation');
      runTests('Lyrics', Annotation.lyrics);
      runTests('Simple Annotation', Annotation.simple);
      runTests('Standard Notation Annotation', Annotation.standard);
      runTests('Harmonics', Annotation.harmonic);
      runTests('Fingerpicking', Annotation.picking);
      runTests('Bottom Annotation', Annotation.bottom);
      runTests('Bottom Annotations with Beams', Annotation.bottomWithBeam);
      runTests('Test Justification Annotation Stem Up', Annotation.justificationStemUp);
      runTests('Test Justification Annotation Stem Down', Annotation.justificationStemDown);
      runTests('TabNote Annotations', Annotation.tabNotes);
    },
    lyrics: function (options) {
      const id = (ii) => {
        return registry.getElementById(ii);
      };
      let fontSize = 10;
      let x = 10;
      let width = 170;
      let ratio = 1;
      var registry = new VF.Registry();
      VF.Registry.enableDefaultRegistry(registry);
      var vf = VF.Test.makeFactory(options, 750, 260);
      for (var i = 0; i < 3; ++i) {
        var score = vf.EasyScore();
        score.set({ time: '3/4' });
        var system = vf.System({ width, x });
        system.addStave({
          voices: [
            score.voice(
              score
                .notes('(C4 F4)/2[id="n0"]')
                .concat(score.beam(score.notes('(C4 A4)/8[id="n1"], (C#4 A4)/8[id="n2"]')))
            ),
          ],
        });
        system.addStave({
          voices: [score.voice(score.notes('(F4 D5)/2').concat(score.beam(score.notes('(F4 F5)/8, (F4 F5)/8'))))],
        });
        ['hand,', 'and', 'me', 'pears', 'lead', 'the'].forEach((text, ix) => {
          const verse = Math.floor(ix / 3);
          const nid = 'n' + (ix % 3);
          id(nid).addModifier(vf.Annotation({ text }).setFont('Roboto Slab', fontSize, 'normal'), verse);
        });
        vf.draw();
        ratio = (fontSize + 2) / fontSize;
        width = width * ratio;
        x = x + width;
        fontSize = fontSize + 2;
      }
      ok(true);
    },
    simple: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';
      ctx.font = ' 10pt Arial';
      var stave = new VF.TabStave(10, 10, 450).addTabGlyph().setContext(ctx).draw();

      function newNote(tab_struct) {
        return new VF.TabNote(tab_struct);
      }
      function newBend(text) {
        return new VF.Bend(text);
      }
      function newAnnotation(text) {
        return new VF.Annotation(text);
      }

      var notes = [
        newNote({
          positions: [
            { str: 2, fret: 10 },
            { str: 4, fret: 9 },
          ],
          duration: 'h',
        }).addModifier(newAnnotation('T'), 0),
        newNote({
          positions: [{ str: 2, fret: 10 }],
          duration: 'h',
        })
          .addModifier(newAnnotation('T'), 0)
          .addModifier(newBend('Full'), 0),
      ];

      VF.Formatter.FormatAndDraw(ctx, stave, notes, 200);
      ok(true, 'Simple Annotation');
    },

    standard: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';
      var stave = new VF.Stave(10, 10, 450).addClef('treble').setContext(ctx).draw();

      function newNote(note_struct) {
        return new VF.StaveNote(note_struct);
      }
      function newAnnotation(text) {
        return new VF.Annotation(text).setFont('Times', VF.Test.Font.size, 'italic');
      }

      var notes = [
        newNote({ keys: ['c/4', 'e/4'], duration: 'h' }).addAnnotation(0, newAnnotation('quiet')),
        newNote({ keys: ['c/4', 'e/4', 'c/5'], duration: 'h' }).addAnnotation(2, newAnnotation('Allegro')),
      ];

      VF.Formatter.FormatAndDraw(ctx, stave, notes, 200);
      ok(true, 'Standard Notation Annotation');
    },

    harmonic: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';
      ctx.font = ' 10pt Arial';
      var stave = new VF.TabStave(10, 10, 450).addTabGlyph().setContext(ctx).draw();

      function newNote(tab_struct) {
        return new VF.TabNote(tab_struct);
      }
      function newAnnotation(text) {
        return new VF.Annotation(text);
      }

      var notes = [
        newNote({
          positions: [
            { str: 2, fret: 12 },
            { str: 3, fret: 12 },
          ],
          duration: 'h',
        }).addModifier(newAnnotation('Harm.'), 0),
        newNote({
          positions: [{ str: 2, fret: 9 }],
          duration: 'h',
        })
          .addModifier(newAnnotation('(8va)').setFont('Times', VF.Test.Font.size, 'italic'), 0)
          .addModifier(newAnnotation('A.H.'), 0),
      ];

      VF.Formatter.FormatAndDraw(ctx, stave, notes, 200);
      ok(true, 'Simple Annotation');
    },

    picking: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.setFillStyle('#221');
      ctx.setStrokeStyle('#221');
      ctx.setFont('Arial', VF.Test.Font.size, '');
      var stave = new VF.TabStave(10, 10, 450).addTabGlyph().setContext(ctx).draw();

      function newNote(tab_struct) {
        return new VF.TabNote(tab_struct);
      }
      function newAnnotation(text) {
        return new VF.Annotation(text).setFont('Times', VF.Test.Font.size, 'italic');
      }

      var notes = [
        newNote({
          positions: [
            { str: 1, fret: 0 },
            { str: 2, fret: 1 },
            { str: 3, fret: 2 },
            { str: 4, fret: 2 },
            { str: 5, fret: 0 },
          ],
          duration: 'h',
        }).addModifier(new VF.Vibrato().setVibratoWidth(40)),
        newNote({
          positions: [{ str: 6, fret: 9 }],
          duration: '8',
        }).addModifier(newAnnotation('p'), 0),
        newNote({
          positions: [{ str: 3, fret: 9 }],
          duration: '8',
        }).addModifier(newAnnotation('i'), 0),
        newNote({
          positions: [{ str: 2, fret: 9 }],
          duration: '8',
        }).addModifier(newAnnotation('m'), 0),
        newNote({
          positions: [{ str: 1, fret: 9 }],
          duration: '8',
        }).addModifier(newAnnotation('a'), 0),
      ];

      VF.Formatter.FormatAndDraw(ctx, stave, notes, 200);
      ok(true, 'Fingerpicking');
    },

    bottom: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';
      var stave = new VF.Stave(10, 10, 300).addClef('treble').setContext(ctx).draw();

      function newNote(note_struct) {
        return new VF.StaveNote(note_struct);
      }
      function newAnnotation(text) {
        return new VF.Annotation(text)
          .setFont('Times', VF.Test.Font.size)
          .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
      }

      var notes = [
        newNote({ keys: ['f/4'], duration: 'w' }).addAnnotation(0, newAnnotation('F')),
        newNote({ keys: ['a/4'], duration: 'w' }).addAnnotation(0, newAnnotation('A')),
        newNote({ keys: ['c/5'], duration: 'w' }).addAnnotation(0, newAnnotation('C')),
        newNote({ keys: ['e/5'], duration: 'w' }).addAnnotation(0, newAnnotation('E')),
      ];

      VF.Formatter.FormatAndDraw(ctx, stave, notes, 100);
      ok(true, 'Bottom Annotation');
    },

    bottomWithBeam: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 500, 240);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';
      var stave = new VF.Stave(10, 10, 300).addClef('treble').setContext(ctx).draw();

      // Create some notes
      var notes = [
        new VF.StaveNote({ keys: ['a/3'], duration: '8' }).addModifier(
          new VF.Annotation('good').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
          0
        ),

        new VF.StaveNote({ keys: ['g/3'], duration: '8' }).addModifier(
          new VF.Annotation('even').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
          0
        ),

        new VF.StaveNote({ keys: ['c/4'], duration: '8' }).addModifier(
          new VF.Annotation('under').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
          0
        ),

        new VF.StaveNote({ keys: ['d/4'], duration: '8' }).addModifier(
          new VF.Annotation('beam').setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
          0
        ),
      ];

      var beam = new VF.Beam(notes.slice(1));

      VF.Formatter.FormatAndDraw(ctx, stave, notes);
      beam.setContext(ctx).draw();
      ok(true, 'Bottom Annotation with Beams');
    },

    justificationStemUp: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 650, 950);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';

      function newNote(note_struct) {
        return new VF.StaveNote(note_struct);
      }
      function newAnnotation(text, hJustifcation, vJustifcation) {
        return new VF.Annotation(text)
          .setFont('Arial', VF.Test.Font.size)
          .setJustification(hJustifcation)
          .setVerticalJustification(vJustifcation);
      }

      for (var v = 1; v <= 4; ++v) {
        var stave = new VF.Stave(10, (v - 1) * 150 + 40, 400).addClef('treble').setContext(ctx).draw();

        var notes = [];

        notes.push(newNote({ keys: ['c/3'], duration: 'q' }).addAnnotation(0, newAnnotation('Text', 1, v)));
        notes.push(newNote({ keys: ['c/4'], duration: 'q' }).addAnnotation(0, newAnnotation('Text', 2, v)));
        notes.push(newNote({ keys: ['c/5'], duration: 'q' }).addAnnotation(0, newAnnotation('Text', 3, v)));
        notes.push(newNote({ keys: ['c/6'], duration: 'q' }).addAnnotation(0, newAnnotation('Text', 4, v)));

        VF.Formatter.FormatAndDraw(ctx, stave, notes, 100);
      }

      ok(true, 'Test Justification Annotation');
    },

    justificationStemDown: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 650, 1000);
      ctx.scale(1.5, 1.5);
      ctx.fillStyle = '#221';
      ctx.strokeStyle = '#221';

      function newNote(note_struct) {
        return new VF.StaveNote(note_struct);
      }
      function newAnnotation(text, hJustifcation, vJustifcation) {
        return new VF.Annotation(text)
          .setFont('Arial', VF.Test.Font.size)
          .setJustification(hJustifcation)
          .setVerticalJustification(vJustifcation);
      }

      for (var v = 1; v <= 4; ++v) {
        var stave = new VF.Stave(10, (v - 1) * 150 + 40, 400).addClef('treble').setContext(ctx).draw();

        var notes = [];

        notes.push(
          newNote({ keys: ['c/3'], duration: 'q', stem_direction: -1 }).addAnnotation(0, newAnnotation('Text', 1, v))
        );
        notes.push(
          newNote({ keys: ['c/4'], duration: 'q', stem_direction: -1 }).addAnnotation(0, newAnnotation('Text', 2, v))
        );
        notes.push(
          newNote({ keys: ['c/5'], duration: 'q', stem_direction: -1 }).addAnnotation(0, newAnnotation('Text', 3, v))
        );
        notes.push(
          newNote({ keys: ['c/6'], duration: 'q', stem_direction: -1 }).addAnnotation(0, newAnnotation('Text', 4, v))
        );

        VF.Formatter.FormatAndDraw(ctx, stave, notes, 100);
      }

      ok(true, 'Test Justification Annotation');
    },

    tabNotes: function (options, contextBuilder) {
      var ctx = contextBuilder(options.elementId, 600, 200);
      ctx.font = '10pt Arial';
      var stave = new VF.TabStave(10, 10, 550);
      stave.setContext(ctx);
      stave.draw();

      var specs = [
        {
          positions: [
            { str: 3, fret: 6 },
            { str: 4, fret: 25 },
          ],
          duration: '8',
        },
        {
          positions: [
            { str: 2, fret: 10 },
            { str: 5, fret: 12 },
          ],
          duration: '8',
        },
        {
          positions: [
            { str: 1, fret: 6 },
            { str: 3, fret: 5 },
          ],
          duration: '8',
        },
        {
          positions: [
            { str: 1, fret: 6 },
            { str: 3, fret: 5 },
          ],
          duration: '8',
        },
      ];

      var notes = specs.map(function (noteSpec) {
        var tabNote = new VF.TabNote(noteSpec);
        tabNote.render_options.draw_stem = true;
        return tabNote;
      });

      var notes2 = specs.map(function (noteSpec) {
        var tabNote = new VF.TabNote(noteSpec);
        tabNote.render_options.draw_stem = true;
        tabNote.setStemDirection(-1);
        return tabNote;
      });

      var notes3 = specs.map(function (noteSpec) {
        var tabNote = new VF.TabNote(noteSpec);
        return tabNote;
      });

      notes[0].addModifier(new VF.Annotation('Text').setJustification(1).setVerticalJustification(1), 0); // U
      notes[1].addModifier(new VF.Annotation('Text').setJustification(2).setVerticalJustification(2), 0); // D
      notes[2].addModifier(new VF.Annotation('Text').setJustification(3).setVerticalJustification(3), 0); // U
      notes[3].addModifier(new VF.Annotation('Text').setJustification(4).setVerticalJustification(4), 0); // D

      notes2[0].addModifier(new VF.Annotation('Text').setJustification(3).setVerticalJustification(1), 0); // U
      notes2[1].addModifier(new VF.Annotation('Text').setJustification(3).setVerticalJustification(2), 0); // D
      notes2[2].addModifier(new VF.Annotation('Text').setJustification(3).setVerticalJustification(3), 0); // U
      notes2[3].addModifier(new VF.Annotation('Text').setJustification(3).setVerticalJustification(4), 0); // D

      notes3[0].addModifier(new VF.Annotation('Text').setVerticalJustification(1), 0); // U
      notes3[1].addModifier(new VF.Annotation('Text').setVerticalJustification(2), 0); // D
      notes3[2].addModifier(new VF.Annotation('Text').setVerticalJustification(3), 0); // U
      notes3[3].addModifier(new VF.Annotation('Text').setVerticalJustification(4), 0); // D

      var voice = new VF.Voice(VF.Test.TIME4_4).setMode(VF.Voice.Mode.SOFT);

      voice.addTickables(notes);
      voice.addTickables(notes2);
      voice.addTickables(notes3);

      new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);

      voice.draw(ctx, stave);

      ok(true, 'TabNotes successfully drawn');
    },
  };

  return Annotation;
})();
