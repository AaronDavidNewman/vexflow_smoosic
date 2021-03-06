/**
 * VexFlow - TickContext Tests
 * Copyright Mohit Muthanna 2010 <mohit@muthanna.com>
 */

VF.Test.Formatter = (function() {
  var run = VF.Test.runTests;
  var runSVG = VF.Test.runSVGTest;

  var Formatter = {
    Start: function() {
      QUnit.module('Formatter');
      runSVG('overflow ', Formatter.overflow);
      runSVG('formatAccidentalSpaces ', Formatter.formatAccidentalSpaces);
      runSVG('Align many notes', Formatter.alignManyNotes, { justify: true, maxIterations: 10, debug: true });
      runSVG('Align notes with accidentals', Formatter.alignAccidentals, { justify: true, maxIterations: 5, debug: true });
      runSVG('Multiple Staves - Justified', Formatter.multiStaves, { justify: true, maxIterations: 5, debug: true });
      runSVG('Alignment issue 1', Formatter.alignmentIssue1, { justify: true, debug: true });
      test('TickContext Building', Formatter.buildTickContexts);
      runSVG('StaveNote - No Justification', Formatter.formatStaveNotes);
      runSVG('StaveNote - Justification', Formatter.justifyStaveNotes, { debug: true });
      runSVG('Notes with Tab', Formatter.notesWithTab);
      runSVG('Multiple Staves - No Justification', Formatter.multiStaves, { justify: false, iterations: 0, debug: true });
      runSVG('Multiple Staves - Justified - 6 Iterations', Formatter.multiStaves, { justify: true, iterations: 4, alpha: 0.01 });
      runSVG('Softmax', Formatter.softMax);
      runSVG('Mixtime', Formatter.mixTime);
      runSVG('Tight', Formatter.tightNotes);
      runSVG('Tight 2', Formatter.tightNotes2);
      runSVG('Annotations', Formatter.annotations);
      runSVG('Proportional Formatting - No Justification', Formatter.proportionalFormatting, { justify: false, debug: true, iterations: 0 });
      run('Proportional Formatting - No Tuning', Formatter.proportionalFormatting, { debug: true, iterations: 0 });

      VF.Test.runSVGTest('Proportional Formatting (20 iterations)',
        Formatter.proportionalFormatting,
        { debug: true, iterations: 20, alpha: 0.5 }
      );
    },
    buildNotesFromJson: function(json) {
      const rv = {
        notes: [],
        beamGroups: []
      };
      let currentBeam = [];
      const beamNotes = () => {
        if (currentBeam.length > 1) {
          rv.beamGroups.push(new VF.Beam(currentBeam));
        }
        currentBeam = [];
      };
      json.notes.forEach((nn) => {
        const keys = nn.pitches.map((pp) => pp.pitch.key);
        const params = {
          duration: nn.duration,
          keys,
          clef: nn.clef
        };
        const note = new VF.StaveNote(params);
        if (nn.duration.indexOf('d') >= 0) {
          note.addDotToAll();
        }
        if (note.ticks.value() <= 2048) {
          currentBeam.push(note);
          if (nn.endBeam) {
            beamNotes();
          }
        } else {
          beamNotes();
        }
        nn.pitches.forEach((pp, ix) => {
          if (pp.pitch.accidental) {
            note.addAccidental(ix, new VF.Accidental(pp.pitch.accidental));
          }
        });
        rv.notes.push(note);
      });
      beamNotes();
      rv.voice = new VF.Voice({
        num_beats: json.beats.num_beats,
        beat_value: json.beats.beat_value
      });
      rv.voice.addTickables(rv.notes);
      return rv;
    },

    buildTickContexts: function() {
      function createTickable() {
        return new VF.Test.MockTickable();
      }

      var R = VF.RESOLUTION;
      var BEAT = 1 * R / 4;

      var tickables1 = [
        createTickable().setTicks(BEAT).setWidth(10),
        createTickable().setTicks(BEAT * 2).setWidth(20),
        createTickable().setTicks(BEAT).setWidth(30),
      ];

      var tickables2 = [
        createTickable().setTicks(BEAT * 2).setWidth(10),
        createTickable().setTicks(BEAT).setWidth(20),
        createTickable().setTicks(BEAT).setWidth(30),
      ];

      var voice1 = new VF.Voice(VF.Test.TIME4_4);
      var voice2 = new VF.Voice(VF.Test.TIME4_4);

      voice1.addTickables(tickables1);
      voice2.addTickables(tickables2);

      var formatter = new VF.Formatter();
      var tContexts = formatter.createTickContexts([voice1, voice2]);

      equal(tContexts.list.length, 4, 'Voices should have four tick contexts');

      // TODO: add this after pull request #68 is merged to master
      // throws(
      //   function() { formatter.getMinTotalWidth(); },
      //   Vex.RERR,
      //   "Expected to throw exception"
      // );

      ok(formatter.preCalculateMinTotalWidth([voice1, voice2]), 'Successfully runs preCalculateMinTotalWidth');
      equal(formatter.getMinTotalWidth(), 88, 'Get minimum total width without passing voices');

      formatter.preFormat();

      equal(formatter.getMinTotalWidth(), 88, 'Minimum total width');
      equal(tickables1[0].getX(), tickables2[0].getX(), 'First notes of both voices have the same X');
      equal(tickables1[2].getX(), tickables2[2].getX(), 'Last notes of both voices have the same X');
      ok(tickables1[1].getX() < tickables2[1].getX(), 'Second note of voice 2 is to the right of the second note of voice 1');
    },
    alignManyNotes: function(options) {
      console.warn('alignManyNotes, font ', VF.DEFAULT_FONT_STACK[0].name);
      var notes1 = [
        new VF.StaveNote({ keys: ['b/4'], duration: '8r' }),
        new VF.StaveNote({ keys: ['g/4'], duration: '16' }),
        new VF.StaveNote({ keys: ['c/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['e/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['g/4'], duration: '16' }),
        new VF.StaveNote({ keys: ['c/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['e/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['b/4'], duration: '8r' }),
        new VF.StaveNote({ keys: ['g/4'], duration: '16' }),
        new VF.StaveNote({ keys: ['c/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['e/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['g/4'], duration: '16' }),
        new VF.StaveNote({ keys: ['c/5'], duration: '16' }),
        new VF.StaveNote({ keys: ['e/5'], duration: '16' }),
      ];
      var notes2 = [
        new VF.StaveNote({ keys: ['a/4'], duration: '16r' }),
        new VF.StaveNote({ keys: ['e/4.'], duration: '8d' }).addDotToAll(),
        new VF.StaveNote({ keys: ['e/4'], duration: '4' }),
        new VF.StaveNote({ keys: ['a/4'], duration: '16r' }),
        new VF.StaveNote({ keys: ['e/4.'], duration: '8d' }).addDotToAll(),
        new VF.StaveNote({ keys: ['e/4'], duration: '4' }),
      ];
      var vf = VF.Test.makeFactory(options, 750, 280);
      const context = vf.getContext();
      var voice1 = new VF.Voice({ num_beats: 4,  beat_value: 4 });
      voice1.addTickables(notes1);
      var voice2 = new VF.Voice({ num_beats: 4,  beat_value: 4 });
      voice2.addTickables(notes2);
      var formatter = new VF.Formatter();
      formatter.joinVoices([voice1]);
      formatter.joinVoices([voice2]);
      var width = formatter.preCalculateMinTotalWidth([voice1, voice2]);
      formatter.format([voice1, voice2], width + 20);
      var stave1 = new VF.Stave(10, 40, width + 30);
      var stave2 = new VF.Stave(10, 100, width + 30);
      stave1.setContext(context).draw();
      stave2.setContext(context).draw();
      voice1.draw(context, stave1);
      voice2.draw(context, stave2);
      VF.Formatter.DEBUG = false;
      ok(true);
    },
    overflow: function(options) {
      console.warn('overflow, font ', VF.DEFAULT_FONT_STACK[0].name);
      const json1 = [
        {
          'notes': [
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'bn/4'
                  }
                }
              ],
              'duration': 'wr',
              'clef': 'treble',
              'endBeam': false
            }
          ],
          'beats': {
            'num_beats': 2,
            'beat_value': 2
          }
        }
      ];

      const json2 =
      [
        {
          'notes': [
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'eb/4'
                  }
                }
              ],
              'duration': '4d',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'fn/4'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/4'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': true
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'ab/4'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'bb/4'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'cn/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'dn/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': true
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'eb/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'fn/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'ab/5'
                  }
                }
              ],
              'duration': '16',
              'clef': 'treble',
              'endBeam': true
            }
          ],
          'beats': {
            'num_beats': 2,
            'beat_value': 2
          }
        }
      ];
      const json3 = [
        {
          'notes': [
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'bb/2'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'eb/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': true
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'bb/2'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'eb/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': false
            },
            {
              'pitches': [
                {
                  'pitch': {
                    'key': 'gn/3'
                  }
                }
              ],
              'duration': '8',
              'clef': 'bass',
              'endBeam': true
            }
          ],
          'beats': {
            'num_beats': 2,
            'beat_value': 2
          }
        }
      ];
      var vf = VF.Test.makeFactory(options, 750, 280);
      const context = vf.getContext();
      const music1 = Formatter.buildNotesFromJson(json1[0]);
      const music2 = Formatter.buildNotesFromJson(json2[0]);
      const music3 = Formatter.buildNotesFromJson(json3[0]);
      const voice1 = music1.voice;
      const voice2 = music2.voice;
      const voice3 = music3.voice;
      const formatter = new VF.Formatter({
        softmaxFactor: 100
      });
      formatter.joinVoices([voice1]);
      formatter.joinVoices([voice2]);
      formatter.joinVoices([voice3]);
      const width = formatter.preCalculateMinTotalWidth([voice1, voice2, voice3]);
      formatter.format([voice1, voice2, voice3], width + 10);
      const stave1 = new VF.Stave(10, 40, width + 20);
      const stave2 = new VF.Stave(10, 120, width + 20);
      const stave3 = new VF.Stave(10, 200, width + 20);
      stave1.setContext(context).draw();
      stave2.setContext(context).draw();
      stave3.setContext(context).draw();
      voice1.draw(context, stave1);
      voice2.draw(context, stave2);
      voice3.draw(context, stave3);
      music1.beamGroups.forEach((beam) => {
        beam.setContext(context).draw();
      });
      music2.beamGroups.forEach((beam) => {
        beam.setContext(context).draw();
      });
      music3.beamGroups.forEach((beam) => {
        beam.setContext(context).draw();
      });
      VF.Formatter.DEBUG = false;
      ok(true);
    },
    alignAccidentals: function(options) {
      console.warn('alignAccidentals, font ', VF.DEFAULT_FONT_STACK[0].name);
      const json1 = [{
        'notes': [{
          'pitches': [{
            'pitch': {
              'key': 'gn/4'
            }
          }],
          'duration': '8',
          'clef': 'treble',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/4'
            }
          }],
          'duration': '8r',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'bn/4'
            }
          }],
          'duration': '4r',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/4'
            }
          }],
          'duration': '16r',
          'clef': 'treble',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'an/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'bn/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'cn/5'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'an/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'bn/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/4'
            }
          }],
          'duration': '16',
          'clef': 'treble',
          'endBeam': true
        }],
        'beats': {
          'num_beats': 4,
          'beat_value': 4
        }
      }];

      const json2 = [{
        'notes': [{
          'pitches': [{
            'pitch': {
              'key': 'gn/2'
            }
          }],
          'duration': '16r',
          'clef': 'bass',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'an/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'bn/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'cn/3'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'an/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'bn/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/2'
            }
          }],
          'duration': '16',
          'clef': 'bass',
          'endBeam': true
        }, {
          'pitches': [{
            'pitch': {
              'key': 'dn/3'
            }
          }],
          'duration': '8',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/3'
            }
          }],
          'duration': '8',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'f#/3',
              'accidental': '#'
            }
          }],
          'duration': '8',
          'clef': 'bass',
          'endBeam': false
        }, {
          'pitches': [{
            'pitch': {
              'key': 'gn/3'
            }
          }],
          'duration': '8',
          'clef': 'bass',
          'endBeam': true
        }],
        'beats': {
          'num_beats': 4,
          'beat_value': 4
        }
      }];

      const createVexNotes = (json) => {
        const rv = {
          notes: [],
          beamGroups: []
        };
        let currentBeam = [];
        const beamNotes = () => {
          if (currentBeam.length > 1) {
            rv.beamGroups.push(new VF.Beam(currentBeam));
          }
          currentBeam = [];
        };
        json.notes.forEach((nn) => {
          const keys = nn.pitches.map((pp) => pp.pitch.key);
          const params = {
            duration: nn.duration,
            keys,
            clef: nn.clef
          };
          const note = new VF.StaveNote(params);
          if (note.ticks.value() <= 2048) {
            currentBeam.push(note);
            if (nn.endBeam) {
              beamNotes();
            }
          } else {
            beamNotes();
          }
          nn.pitches.forEach((pp, ix) => {
            if (pp.pitch.accidental) {
              note.addAccidental(ix, new VF.Accidental(pp.pitch.accidental));
            }
          });
          rv.notes.push(note);
        });
        beamNotes();
        rv.voice = new VF.Voice({
          num_beats: json.beats.num_beats,
          beat_value: json.beats.beat_value
        });
        rv.voice.addTickables(rv.notes);
        return rv;
      };
      var vf = VF.Test.makeFactory(options, 750, 280);
      const context = vf.getContext();
      const music1 = createVexNotes(json1[0]);
      const music2 = createVexNotes(json2[0]);
      const voice1 = music1.voice;
      const voice2 = music2.voice;
      const formatter = new VF.Formatter({
        softmaxFactor: 100
      });
      formatter.joinVoices([voice1]);
      formatter.joinVoices([voice2]);
      const width = formatter.preCalculateMinTotalWidth([voice1, voice2]);
      formatter.format([voice1, voice2], width);
      const stave1 = new VF.Stave(10, 40, width + 20);
      const stave2 = new VF.Stave(10, 120, width + 20);
      stave1.setContext(context).draw();
      stave2.setContext(context).draw();
      voice1.draw(context, stave1);
      voice2.draw(context, stave2);
      music1.beamGroups.forEach((beam) => {
        beam.setContext(context).draw();
      });
      music2.beamGroups.forEach((beam) => {
        beam.setContext(context).draw();
      });
      VF.Formatter.DEBUG = false;
      ok(true);
    },
    formatAccidentalSpaces: function(options) {
      console.warn('formatAccidentalSpaces, font ', VF.DEFAULT_FONT_STACK[0].name);
      var vf = VF.Test.makeFactory(options, 750, 280);
      const context = vf.getContext();
      var softmaxFactor = 100;
      // Create the notes
      var notes = [
        new VF.StaveNote({
          keys: ['e##/5'],
          duration: '8d'
        }).addAccidental(0, new VF.Accidental('##')).addDotToAll(),
        new VF.StaveNote({
          keys: ['b/4'],
          duration: '16'
        }).addAccidental(0, new VF.Accidental('b')),
        new VF.StaveNote({
          keys: ['f/3'],
          duration: '8'
        }),
        new VF.StaveNote({
          keys: ['a/3'],
          duration: '16'
        }),
        new VF.StaveNote({
          keys: ['e/4', 'g/4'],
          duration: '16'
        }).addAccidental(0, new VF.Accidental('bb')).addAccidental(1, new VF.Accidental('bb')),
        new VF.StaveNote({
          keys: ['d/4'],
          duration: '16'
        }),
        new VF.StaveNote({
          keys: ['e/4', 'g/4'],
          duration: '16'
        }).addAccidental(0, new VF.Accidental('#')).addAccidental(1, new VF.Accidental('#')),
        new VF.StaveNote({
          keys: ['g/4'],
          duration: '32'
        }),
        new VF.StaveNote({
          keys: ['a/4'],
          duration: '32'
        }),
        new VF.StaveNote({
          keys: ['g/4'],
          duration: '16'
        }),
        new VF.StaveNote({
          keys: ['d/4'],
          duration: 'q'
        })
      ];
      var beams = VF.Beam.generateBeams(notes);
      var voice = new VF.Voice({
        num_beats: 4,
        beat_value: 4
      });
      voice.addTickables(notes);
      var formatter = new VF.Formatter({ softmaxFactor }).joinVoices([voice]);
      var width = formatter.preCalculateMinTotalWidth([voice]);
      var stave = new VF.Stave(10, 40, width + 20);
      stave.setContext(context).draw();
      formatter.format([voice], width);
      voice.draw(context, stave);
      beams.forEach(function(b) {
        b.setContext(context).draw();
      });

      notes.forEach(function(note) {
        VF.Test.plotNoteWidth(context, note, 30);
      });

      VF.Test.plotLegendForNoteWidth(context, 300, 150);
      VF.Formatter.DEBUG = false;
      ok(true);
    },
    formatStaveNotes: function(options) {
      var vf = VF.Test.makeFactory(options, 500, 280);
      var score = vf.EasyScore();

      vf.Stave({ y: 50 });

      var notes1 = score.notes(
        '(cb4 e#4 a4)/2, (d4 e4 f4)/4, (cn4 f#4 a4)',
        { stem: 'down' }
      );
      var notes2 = score.notes(
        '(cb5 e#5 a5)/2, (d5 e5 f5)/4, (cn5 f#5 a5)',
        { stem: 'up' }
      );

      // test: allow classes to be added to a note.
      notes1.forEach((note) => {
        note.attrs.classes = 'voice1';
      });
      notes1.forEach((note) => {
        note.attrs.classes = 'voice2';
      });

      var voices = [notes1, notes2].map(score.voice.bind(score));

      vf.Formatter()
        .joinVoices(voices)
        .format(voices);

      vf.draw();

      var ctx = vf.getContext();

      notes1.forEach(function(note) {
        VF.Test.plotNoteWidth(ctx, note, 190);
      });

      notes2.forEach(function(note) {
        VF.Test.plotNoteWidth(ctx, note, 35);
      });

      VF.Test.plotLegendForNoteWidth(ctx, 300, 180);

      ok(true);
    },

    justifyStaveNotes: function(options) {
      var vf = VF.Test.makeFactory(options, 420, 580);
      var ctx = vf.getContext();
      var score = vf.EasyScore();

      var y = 30;
      function justifyToWidth(width) {
        vf.Stave({ y: y }).addTrebleGlyph();

        var voices = [
          score.voice(score.notes(
            '(cbb4 en4 a4)/2, (d4 e4 f4)/8, (d4 f4 a4)/8, (cn4 f#4 a4)/4',
            { stem: 'down' }
          )),
          score.voice(score.notes(
            '(bb4 e#5 a5)/4, (d5 e5 f5)/2, (c##5 fb5 a5)/4',
            { stem: 'up' }
          )),
        ];

        vf.Formatter()
          .joinVoices(voices)
          .format(voices, width);

        voices[0].getTickables().forEach(function(note) {
          VF.Test.plotNoteWidth(ctx, note, y + 140);
        });

        voices[1].getTickables().forEach(function(note) {
          VF.Test.plotNoteWidth(ctx, note, y - 20);
        });
        y += 210;
      }

      justifyToWidth(0);
      justifyToWidth(300);
      justifyToWidth(400);

      vf.draw();

      ok(true);
    },

    notesWithTab: function(options) {
      var vf = VF.Test.makeFactory(options, 420, 580);
      var score = vf.EasyScore();

      var y = 10;
      function justifyToWidth(width) {
        var stave = vf.Stave({ y: y }).addTrebleGlyph();

        var voice = score.voice(score.notes(
          'd#4/2, (c4 d4)/8, d4/8, (c#4 e4 a4)/4',
          { stem: 'up' }
        ));

        y += 100;

        vf.TabStave({ y: y })
          .addTabGlyph()
          .setNoteStartX(stave.getNoteStartX());

        var tabVoice = score.voice([
          vf.TabNote({ positions: [{ str: 3, fret: 6 }], duration: '2' }).addModifier(new VF.Bend('Full'), 0),
          vf.TabNote({
            positions: [{ str: 2, fret: 3 },
              { str: 3, fret: 5 }], duration: '8',
          }).addModifier(new VF.Bend('Unison'), 1),
          vf.TabNote({ positions: [{ str: 3, fret: 7 }], duration: '8' }),
          vf.TabNote({
            positions: [{ str: 3, fret: 6 },
              { str: 4, fret: 7 },
              { str: 2, fret: 5 }], duration: '4',
          }),

        ]);

        vf.Formatter()
          .joinVoices([voice])
          .joinVoices([tabVoice])
          .format([voice, tabVoice], width);

        y += 150;
      }

      justifyToWidth(0);
      justifyToWidth(300);

      vf.draw();

      ok(true);
    },

    multiStaves: function(options) {
      console.warn('Multiple Staves, justified, font ', VF.DEFAULT_FONT_STACK[0].name);

      var vf = VF.Test.makeFactory(options, 600, 300);
      var score = vf.EasyScore();

      var notes11 = score.notes('a4/2, a4/4, a4/8, ab4/16, an4/16');
      var voice11 = score.voice(notes11, { time: '4/4' });

      var notes21 = score.notes('c4/2, d4/8, d4/8, e4/8, e4/8');
      var voice21 = score.voice(notes21, { time: '4/4' });

      var beams = VF.Beam.generateBeams(notes11.slice(2));
      beams = beams.concat(beams, VF.Beam.generateBeams(notes21.slice(1, 3)));
      beams = beams.concat(VF.Beam.generateBeams(notes21.slice(3)));
      var formatter = vf.Formatter(options.params)
        .joinVoices([voice11])
        .joinVoices([voice21]);

      var width = formatter.preCalculateMinTotalWidth([voice11, voice21]);
      var stave11 = vf.Stave({ y: 20, width: width + 20 });
      var stave21 = vf.Stave({ y: 130, width: width + 20 });
      formatter.format([voice11, voice21], width);
      vf.StaveConnector({
        top_stave: stave11,
        bottom_stave: stave21,
        type: 'brace',
      });
      var ctx = vf.getContext();
      stave11.setContext(ctx).draw();
      stave21.setContext(ctx).draw();
      voice11.draw(ctx, stave11);
      voice21.draw(ctx, stave21);
      beams.forEach(function(b) {
        b.setContext(ctx).draw();
      });

      notes11.forEach(function(note) {
        VF.Test.plotNoteWidth(ctx, note, 35);
      });

      notes21.forEach(function(note) {
        VF.Test.plotNoteWidth(ctx, note, 190);
      });

      VF.Test.plotLegendForNoteWidth(ctx, 300, 180);
      ok(true);
    },
    alignmentIssue1: function(options) {
      console.warn('alignmentIssue1, font ', VF.DEFAULT_FONT_STACK[0].name);
      var vf = VF.Test.makeFactory(options, 600, 400);
      var score = vf.EasyScore();

      var notes11 = [
        new VF.StaveNote({ keys: ['a/4'], duration: '8' }),
        new VF.StaveNote({ keys: ['b/4'], duration: '4' }),
        new VF.StaveNote({ keys: ['b/4'], duration: '8' })
      ];
      var notes21 = [
        new VF.StaveNote({ keys: ['a/4'], duration: '16' }),
        new VF.StaveNote({ keys: ['b/4.'], duration: '4' }),
        new VF.StaveNote({ keys: ['a/4'], duration: '8d' }).addDotToAll()
      ];

      var ctx = vf.getContext();
      var voice11 = score.voice(notes11, { time: '2/4' }).setMode(VF.Voice.Mode.SOFT);
      var voice21 = score.voice(notes21, { time: '2/4' }).setMode(VF.Voice.Mode.SOFT);
      var beams21 = VF.Beam.generateBeams(notes21);
      var beams11 = VF.Beam.generateBeams(notes11);
      var formatter = new VF.Formatter();
      formatter.joinVoices([voice11]);
      formatter.joinVoices([voice21]);
      var width = formatter.preCalculateMinTotalWidth([voice11, voice21]);
      var stave11 = vf.Stave({ y: 20, width: width + 20 });
      var stave21 = vf.Stave({ y: 130, width: width + 20 });
      formatter.format([voice11, voice21], width);
      stave11.setContext(ctx).draw();
      stave21.setContext(ctx).draw();
      voice11.draw(ctx, stave11);
      voice21.draw(ctx, stave21);
      beams21.forEach(function(b) {
        b.setContext(ctx).draw();
      });
      beams11.forEach(function(b) {
        b.setContext(ctx).draw();
      });
      ok(true);
    },

    proportionalFormatting: function(options) {
      var debug = options.params.debug;
      VF.Registry.enableDefaultRegistry(new VF.Registry());

      var vf = VF.Test.makeFactory(options, 650, 750);
      var system = vf.System({
        x: 50,
        width: 500,
        debugFormatter: debug,
        noJustification: !(options.params.justify === undefined && true),
        formatIterations: options.params.iterations,
        options: { alpha: options.params.alpha }
      });

      var score = vf.EasyScore();

      var newVoice = function(notes) {
        return score.voice(notes, { time: '1/4' });
      };

      var newStave = function(voice) {
        return system
          .addStave({ voices: [voice], debugNoteMetrics: debug })
          .addClef('treble')
          .addTimeSignature('1/4');
      };

      var voices = [
        score.notes('c5/8, c5'),
        score.tuplet(score.notes('a4/8, a4, a4'), { notes_occupied: 2 }),
        score.notes('c5/16, c5, c5, c5'),
        score.tuplet(score.notes('a4/16, a4, a4, a4, a4'), { notes_occupied: 4 }),
        score.tuplet(score.notes('a4/32, a4, a4, a4, a4, a4, a4'), { notes_occupied: 8 }),
      ];

      voices.map(newVoice).forEach(newStave);
      system.addConnector().setType(VF.StaveConnector.type.BRACKET);

      vf.draw();

      // var typeMap = VF.Registry.getDefaultRegistry().index.type;
      // var table = Object.keys(typeMap).map(function(typeName) {
      //   return typeName + ': ' + Object.keys(typeMap[typeName]).length;
      // });

      // console.log(table);
      VF.Registry.disableDefaultRegistry();
      ok(true);
    },

    softMax: function(options) {
      var vf = VF.Test.makeFactory(options, 550, 500);
      vf.getContext().scale(0.8, 0.8);

      function draw(y, factor) {
        var score = vf.EasyScore();
        var system = vf.System({
          x: 100,
          y,
          width: 500,
          details: { softmaxFactor: factor }
        });

        system.addStave({
          voices: [
            score.voice(
              score.notes('C#5/h, a4/q')
                .concat(score.beam(score.notes('Abb4/8, A4/8')))
                .concat(score.beam(score.notes('A4/16, A#4, A4, Ab4/32, A4'))),
              { time: '5/4' })
          ]
        }).addClef('treble').addTimeSignature('5/4');

        vf.draw();
        ok(true);
      }

      draw(50, 1);
      draw(150, 2);
      draw(250, 10);
      draw(350, 20);
      draw(450, 200);
    },

    mixTime: function(options) {
      var vf = VF.Test.makeFactory(options, 420, 250);
      vf.getContext().scale(0.8, 0.8);
      var score = vf.EasyScore();
      var system = vf.System({
        details: { softmaxFactor: 100 },
        width: 500, debugFormatter: true
      });

      system.addStave({
        voices: [
          score.voice(
            score.notes('C#5/q, B4')
              .concat(score.beam(score.notes('A4/8, E4, C4, D4')))
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      system.addStave({
        voices: [
          score.voice(
            score.notes('C#5/q, B4, B4')
              .concat(
                score.tuplet(score.beam(score.notes('A4/8, E4, C4'))))
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      vf.draw();
      ok(true);
    },

    tightNotes: function(options) {
      var vf = VF.Test.makeFactory(options, 420, 250);
      vf.getContext().scale(0.8, 0.8);
      var score = vf.EasyScore();
      var system = vf.System({
        width: 400, debugFormatter: true
      });

      system.addStave({
        voices: [
          score.voice(
            score.beam(score.notes('B4/16, B4, B4, B4, B4, B4, B4, B4'))
              .concat(score.notes('B4/q, B4'))
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      system.addStave({
        voices: [
          score.voice(
            score.notes('B4/q, B4').concat(score.beam(score.notes('B4/16, B4, B4, B4, B4, B4, B4, B4')))
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      vf.draw();
      ok(true);
    },

    tightNotes2: function(options) {
      var vf = VF.Test.makeFactory(options, 420, 250);
      vf.getContext().scale(0.8, 0.8);
      var score = vf.EasyScore();
      var system = vf.System({
        width: 400, debugFormatter: true
      });

      system.addStave({
        voices: [
          score.voice(
            score.beam(score.notes('B4/16, B4, B4, B4, B4, B4, B4, B4'))
              .concat(score.notes('B4/q, B4'))
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      system.addStave({
        voices: [
          score.voice(
            score.notes('B4/w')
          )
        ]
      }).addClef('treble').addTimeSignature('4/4');

      vf.draw();
      ok(true);
    },

    annotations: function(options) {
      const pageWidth = 816;
      const pageHeight = 600;
      const vf = VF.Test.makeFactory(options, pageWidth, pageHeight);
      const context = vf.getContext();

      var lyrics1 = ['ipso', 'ipso-', 'ipso', 'ipso', 'ipsoz', 'ipso-', 'ipso', 'ipso', 'ipso', 'ip', 'ipso'];
      var lyrics2 = ['ipso', 'ipso-', 'ipsoz', 'ipso', 'ipso', 'ipso-', 'ipso', 'ipso', 'ipso', 'ip', 'ipso'];

      var smar = [{
        sm: 5,
        width: 450,
        lyrics: lyrics1,
        title: '450px,softMax:5'
      }, {
        sm: 5,
        width: 450,
        lyrics: lyrics2,
        title: '450px,softmax:5,different word order'
      },
      {
        sm: 5,
        width: 460,
        lyrics: lyrics2,
        title: '460px,softmax:5'
      }, {
        sm: 100,
        width: 460,
        lyrics: lyrics2,
        title: '460px,softmax:100'
      }];

      var rowSize = 140;
      var beats = 12;
      var beatsPer = 8;
      var beamGroup = 3;

      var durations = ['8d', '16', '8', '8d', '16', '8', '8d', '16', '8', '4', '8'];
      var beams = [];
      var y = 40;

      smar.forEach((sm) => {
        var stave = new VF.Stave(10, y, sm.width);
        var notes = [];
        var iii = 0;
        context.fillText(sm.title, 100, y);
        y += rowSize;

        durations.forEach((dd) => {
          var newNote = new VF.StaveNote({ keys: ['b/4'], duration: dd });
          if (dd.indexOf('d') >= 0) { newNote.addDotToAll(); }
          if (sm.lyrics.length > iii) {
            newNote.addAnnotation(0,
              new VF.Annotation(sm.lyrics[iii])
                .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM)
                .setFont('Times', 12, 'normal'));
          }
          notes.push(newNote);
          iii += 1;
        });

        notes.forEach((note) => { if (note.duration.indexOf('d') >= 0) { note.addDotToAll(); } });

        // Don't beam the last group
        var beam = [];
        notes.forEach((note) => {
          if (note.intrinsicTicks < 4096) {
            beam.push(note);
            if (beam.length >= beamGroup) {
              beams.push(
                new VF.Beam(beam)
              );
              beam = [];
            }
          } else {
            beam = [];
          }
        });

        var voice1 = new VF.Voice({ num_beats: beats, beat_value: beatsPer }).setMode(Vex.Flow.Voice.Mode.SOFT).addTickables(notes);

        var fmt = new VF.Formatter({ softmaxFactor: sm.sm }).joinVoices([voice1]);
        fmt.format([voice1], sm.width - 11);

        stave.setContext(context).draw();
        voice1.draw(context, stave);

        beams.forEach(function(b) {
          b.setContext(context).draw();
        });
      });

      ok(true);
    }
  };

  return Formatter;
})();
