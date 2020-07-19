export const PetalumaMetrics = {
  name: 'Petaluma',
  smufl: true,

  stave: {
    padding: 15,
  },

  clef: {
    default: {
      point: 32,
      width: 26,
    },
    small: {
      point: 26,
      width: 20,
    },

    annotations: {
      '8va': {
        smuflCode: 'timeSig8',
        default: {
          point: 18,
          treble: {
            line: -1.4,
            shiftX: 12,
          },
        },
        small: {
          point: 16,
          treble: {
            line: -0.2,
            shiftX: 8,
          },
        }
      },
      '8vb': {
        smuflCode: 'timeSig8',
        default: {
          point: 18,
          treble: {
            line: 6,
            shiftX: 10,
          },
          bass: {
            line: 3.5,
            shiftX: 1,
          }
        },
        small: {
          point: 16,
          treble: {
            line: 5.3,
            shiftX: 6,
          },
          bass: {
            line: 3.1,
            shiftX: 0.5,
          }
        }
      }
    },

    // These may no longer be necessary
    lineCount: {
      '8': { point: 55, shiftY: 14 },
      '7': { point: 47, shiftY: 8 },
      '6': { point: 32, shiftY: 1 },
      '5': { point: 30, shiftY: -6 },
      '4': { point: 23, shiftY: -12 },
    }
  },

  pedalMarking: {
    up: {
      point: 40
    },
    down: {
      point: 34
    }
  },

  // These are for numeric digits, such as in time signatures
  digits: {
    // used by timesig
    shiftLine: -1,
    point: 22,

    // used by tuplets
    tupletPoint: 16,
    shiftY: -2,
  },

  articulation: {
    articStaccatissimoAbove: {
      padding: 2,
    },
    articStaccatissimoBelow: {
      padding: 2,
    }
  },

  tremolo: {
    default: {
      point: 25,
      spacing: 5,
      offsetYStemUp: -5,
      offsetYStemDown: 5,
      offsetXStemUp: 11,
      offsetXStemDown: 1,
    },
    grace: {
      point: 18,
      spacing: 4,
      offsetYStemUp: -5,
      offsetYStemDown: 5,
      offsetXStemUp: 7,
      offsetXStemDown: 1,
    }
  },

  noteHead: {
    displaced: {
      shiftX: -2,
    },
  },

  stem: {
    // These are stem (Y) offsets to the note heads. To shift the
    // noteheads (x-position) themselves, see glyphs.notehead.custom.
    noteHead: {
      noteheadTriangleUpHalf: {
        offsetYBaseStemUp: 5,
        offsetYBaseStemDown: 4,
      },
      noteheadTriangleUpBlack: {
        offsetYBaseStemUp: 5,
        offsetYBaseStemDown: 4,
      },
      noteheadTriangleUpWhole: {
        offsetYBaseStemUp: 5,
        offsetYBaseStemDown: 4,
      },
      noteheadXHalf: {
        offsetYBaseStemUp: -4,
        offsetYBaseStemDown: 4,
      },
      noteheadXBlack: {
        offsetYBaseStemUp: -4,
        offsetYBaseStemDown: 4,
      },
      noteheadXWhole: {
        offsetYBaseStemUp: -4,
        offsetYBaseStemDown: 4,
      },
      noteheadBlack: {
        offsetYBaseStemDown: 2,
        offsetYBaseStemUp: -2,
      },
      noteheadSquareWhite: {
        offsetYBaseStemDown: -5,
        offsetYBaseStemUp: 5,
      }
    }
  },

  // Values under here are used by the Glyph class to reposition and rescale
  // glyphs based on their category. This should be the first stop for
  // custom font glyph repositioning.
  //
  // The glyph loader first looks up a specific set of settings based on the
  // glyph code, and if not found, uses the defaults from the category. See
  // glyphs.textNote for an example of this.
  //
  // Details in Glyph.lookupFontMetrics.
  glyphs: {
    coda: {
      point: 20,
      shiftX: -7,
      shiftY: 8,
    },
    segno: {
      shiftX: -7,
    },
    flag: {
      shiftX: -0.75,
      tabStem: {
        shiftX: -1.75,
      },
      staveTempo: {
        shiftX: -1,
      }
    },
    clef: {
      gClef: {
        default: { scale: 1.1, shiftY: 1 },
        small: { shiftY: 1.5 }
      },
      fClef: {
        default: { shiftY: -0.5 }
      }
    },
    ornament: {
      ornamentTurn: {
        scale: 1.2,
      },
      ornamentTurnSlash: {
        scale: 1.2,
      },
    },
    stroke: {
      arrowheadBlackDown: {
        straight: {
          shiftX: -4.5,
        },
        wiggly: {
          shiftX: -1,
          shiftY: 1,
        }
      },
      arrowheadBlackUp: {
        straight: {
          shiftX: -0.85,
        },
        wiggly: {
          shiftX: -1,
          shiftY: 1,
        }
      }
    },
    textNote: {
      point: 34,
      breathMarkTick: {
        point: 36,
        shiftY: 9,
      },
      breathMarkComma: {
        point: 36,
      },
      segno: {
        point: 30,
        shiftX: -7,
        shiftY: 8,
      },
      coda: {
        point: 20,
        shiftX: -7,
        shiftY: 8,
      },
      ornamentTrill: {
        shiftX: -10,
        shiftY: 8,
      },
      ornamentMordent: {
        shiftX: -8,
      },
      ornamentShortTrill: {
        shiftX: -8,
      }
    },
    noteHead: {
      standard: {
        noteheadBlackStemUp: {
          shiftX: 1.5,
          point: 34,
        },
        noteheadBlackStemDown: {
          point: 34,
        },
        noteheadHalfStemUp: {
          shiftX: 1,
          point: 34,
        },
        noteheadHalfStemDown: {
          point: 34,
        },
        noteheadWholeStemUp: {
          shiftX: 1,
          point: 34,
        },
        noteheadWholeStemDown: {
          point: 34,
        },
        restQuarterStemUp: {
          point: 35,
        },
        restQuarterStemDown: {
          point: 35,
        },
      },
      custom: {
        'noteheadCircleXStemUp': {
          shiftX: -1,
        },
        'noteheadCircleXStemDown': {
          shiftX: 0.25,
        },
        'noteheadDiamondHalfStemUp': {
          shiftX: 1.5,
        },
        'noteheadDiamondBlackStemUp': {
          shiftX: 1.5,
        },
        'noteheadDiamondWholeStemUp': {
          shiftX: 1,
        },
        'noteheadXBlackStemUp': {
          shiftX: 1,
        },
        'noteheadXHalfStemUp': {
          shiftX: -3,
        },
        'noteheadXHalfStemDown': {
          shiftX: 1,
        },
        'noteheadXWholeStemUp': {
          shiftX: -7,
        },
        'noteheadXWholeStemDown': {
          shiftX: 1,
        },
        'noteheadSquareWhiteStemDown': {
          shiftX: 0.25,
        },
        'noteheadSquareWhiteStemUp': {
          shiftX: -0.75,
        },
        'noteheadSquareBlackStemUp': {
          shiftX: -0.75,
        },
        'noteheadTriangleUpWholeStemUp': {
          shiftX: -0.75,
        }
      },
    },
    chordSymbol: {
      global: {
        superscriptOffset: -400,
        subscriptOffset: 300,
        kerningOffset: -150,
        lowerKerningText:  ['D', 'F', 'P', 'T', 'V', 'Y'],
        upperKerningText:  ['L'],
        spacing: 20,
        superSubRatio: 0.73
      },
      csymDiminished: {
        scale: 0.8,
        leftSideBearing: -95,
        advanceWidth: 506,
        yOffset: 0
      },
      csymHalfDiminished: {
        scale: 0.8,
        leftSideBearing: -32,
        advanceWidth: 506,
        yOffset: 0
      },
      csymAugmented: {
        scale: 1,
        leftSideBearing: -25,
        advanceWidth: 530,
        yOffset: 0
      },
      csymParensLeftTall: {
        scale: 0.8,
        leftSideBearing: 0,
        advanceWidth: 155,
        yOffset: 150
      },
      csymParensRightTall: {
        scale: 0.8,
        leftSideBearing: 40,
        advanceWidth: 189,
        yOffset: 150
      },
      csymBracketLeftTall: {
        scale: 0.8,
        leftSideBearing: 0,
        advanceWidth: 328,
        yOffset: 0
      },
      csymBracketRightTall: {
        scale: 0.8,
        leftSideBearing: 1,
        advanceWidth: 600,
        yOffset: 0
      },
      csymParensLeftVeryTall: {
        scale: 0.95,
        leftSideBearing: 0,
        advanceWidth: 200,
        yOffset: 250
      },
      csymParensRightVeryTall: {
        scale: 0.9,
        leftSideBearing: -100,
        advanceWidth: 111,
        yOffset: 250
      },
      csymDiagonalArrangementSlash: {
        scale: 0.6,
        leftSideBearing: -1,
        advanceWidth: 990,
        yOffset: 0
      },
      csymMinor: {
        scale: 0.8,
        leftSideBearing: 0,
        advanceWidth: 482,
        yOffset: 0
      },
      csymMajorSeventh: {
        scale: 1,
        leftSideBearing: 0,
        yOffset: 0,
        advanceWidth: 600
      },
      accidentalSharp: {
        scale: 0.7,
        leftSideBearing: 0,
        advanceWidth: 425,
        yOffset: -422
      },
      accidentalFlat: {
        scale: 0.8,
        leftSideBearing: -10,
        advanceWidth: 228,
        yOffset: -284
      }
    },
    jazzOrnaments: {
      brassScoop: {
        scale: 1.0,
        xOffset: -12,
        yOffset: 0,
        stemUpYOffset: 0,
        reportedWidth: 10
      },
      brassDoitMedium: {
        scale: 1.0,
        xOffset: 16,
        yOffset: 0,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassFallLipShort: {
        scale: 1.0,
        xOffset: 16,
        yOffset: 0,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassLiftMedium: {
        scale: 1.0,
        xOffset: 16,
        yOffset: 5,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassFallRoughMedium: {
        scale: 1.0,
        xOffset: 16,
        yOffset: 26,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassBend: {
        scale: 1.0,
        xOffset: 0,
        yOffset: -8,
        stemUpYOffset: 28,
        reportedWidth: 5
      },
      brassMuteClosed: {
        scale: 1.0,
        xOffset: 3,
        yOffset: -8,
        stemUpYOffset: 26,
        reportedWidth: 5
      },
      brassMuteOpen: {
        scale: 1.0,
        xOffset: 4,
        yOffset: -8,
        stemUpYOffset: 27,
        reportedWidth: 5
      },
      brassFlip: {
        scale: 1.0,
        xOffset: 10,
        yOffset: -4,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassJazzTurn: {
        scale: 1.0,
        xOffset: 6,
        yOffset: -4,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
      brassSmear: {
        scale: 1.0,
        xOffset: 10,
        yOffset: -4,
        stemUpYOffset: 0,
        reportedWidth: 5
      },
    }
  }
};
