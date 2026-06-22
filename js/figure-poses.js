'use strict';
const FIG_POSES = {
  "standing": {
    "f1": {
      "pelvis": [
        25,
        34
      ],
      "torso": 270,
      "nearArm": [
        90,
        90
      ],
      "farArm": [
        92,
        92
      ],
      "nearLeg": [
        90,
        90,
        0
      ],
      "farLeg": [
        88,
        90,
        0
      ]
    },
    "f2": {
      "pelvis": [
        25,
        34
      ],
      "torso": 270,
      "nearArm": [
        92,
        92
      ],
      "farArm": [
        90,
        90
      ],
      "nearLeg": [
        88,
        90,
        0
      ],
      "farLeg": [
        90,
        90,
        0
      ]
    }
  },
  "calf_raise": {
    "f1": {
      "pelvis": [
        25,
        33
      ],
      "torso": 270,
      "nearArm": [
        100,
        95
      ],
      "farArm": [
        100,
        95
      ],
      "nearLeg": [
        90,
        90,
        2
      ],
      "farLeg": [
        90,
        90,
        2
      ],
      "intensity": {
        "at": [
          22,
          49
        ],
        "dir": 180,
        "r": 2.6
      }
    },
    "f2": {
      "pelvis": [
        25,
        30
      ],
      "torso": 270,
      "nearArm": [
        100,
        95
      ],
      "farArm": [
        100,
        95
      ],
      "nearLeg": [
        90,
        90,
        60
      ],
      "farLeg": [
        90,
        90,
        60
      ],
      "intensity": {
        "at": [
          22,
          49
        ],
        "dir": 180,
        "r": 2.6
      }
    }
  },
  "glute_bridge": {
    "dur": 2200,
    "f1": {
      "pelvis": [
        30.04,
        52.3
      ],
      "torso": 177.64,
      "head": 175.92,
      "nearArm": [
        16,
        2
      ],
      "farArm": [
        20,
        4
      ],
      "nearLeg": [
        311.83,
        80.39,
        0
      ],
      "farLeg": [
        312.53,
        83.53,
        356.34
      ]
    },
    "f2": {
      "pelvis": [
        28.46,
        45.35
      ],
      "torso": 156.04,
      "head": 169.72,
      "nearArm": [
        22.44,
        359.34
      ],
      "farArm": [
        22.42,
        3.44
      ],
      "nearLeg": [
        353.18,
        90.46,
        0
      ],
      "farLeg": [
        352,
        89.44,
        0
      ]
    }
  },
  "calf_stretch": {
    "f1": {
      "pelvis": [
        22,
        34
      ],
      "torso": 300,
      "head": 300,
      "nearArm": [
        8,
        2
      ],
      "farArm": [
        12,
        4
      ],
      "nearLeg": [
        70,
        90,
        2
      ],
      "farLeg": [
        122,
        116,
        20.25
      ],
      "ground": 56,
      "wallX": 44,
      "propsBehind": [
        {
          "type": "wall",
          "x": 44,
          "y1": 8,
          "y2": 56
        }
      ],
      "intensity": {
        "at": [
          12,
          48
        ],
        "dir": 180,
        "r": 2.6
      }
    },
    "f2": {
      "pelvis": [
        22,
        34
      ],
      "torso": 300,
      "head": 300,
      "nearArm": [
        8,
        2
      ],
      "farArm": [
        12,
        4
      ],
      "nearLeg": [
        70,
        90,
        2
      ],
      "farLeg": [
        116.71,
        112.67,
        2.19
      ],
      "ground": 56,
      "wallX": 44,
      "propsBehind": [
        {
          "type": "wall",
          "x": 44,
          "y1": 8,
          "y2": 56
        }
      ],
      "intensity": {
        "at": [
          12,
          48
        ],
        "dir": 180,
        "r": 2.6
      }
    }
  },
  "db_row": {
    "dur": 1700,
    "f1": {
      "pelvis": [
        15,
        33
      ],
      "torso": 6,
      "head": 6,
      "farArm": [
        90,
        90
      ],
      "nearArm": [
        82,
        98
      ],
      "nearLeg": [
        100,
        90,
        4
      ],
      "farLeg": [
        96,
        90,
        4
      ],
      "ground": 56,
      "propsBehind": [
        {
          "type": "bench",
          "x": 28,
          "y": 47,
          "w": 20,
          "h": 4,
          "legs": true
        }
      ],
      "propsFront": [
        {
          "type": "dumbbell",
          "anchor": "nearHand"
        }
      ]
    },
    "f2": {
      "pelvis": [
        15,
        33
      ],
      "torso": 6,
      "head": 6,
      "farArm": [
        90,
        90
      ],
      "nearArm": [
        250,
        108
      ],
      "nearLeg": [
        100,
        90,
        4
      ],
      "farLeg": [
        96,
        90,
        4
      ],
      "ground": 56,
      "propsBehind": [
        {
          "type": "bench",
          "x": 28,
          "y": 47,
          "w": 20,
          "h": 4,
          "legs": true
        }
      ],
      "propsFront": [
        {
          "type": "dumbbell",
          "anchor": "nearHand"
        }
      ]
    }
  },
  "sl_stance": {
    "f1": {
      "pelvis": [
        25.11,
        33.01
      ],
      "torso": 271,
      "head": 271,
      "nearArm": [
        98,
        62
      ],
      "farArm": [
        108,
        57
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        345,
        98,
        0
      ]
    },
    "f2": {
      "pelvis": [
        25,
        33
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        100,
        60
      ],
      "farArm": [
        110,
        55
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        340,
        95,
        0
      ]
    }
  },
  "sl_squat": {
    "f1": {
      "pelvis": [
        24.89,
        32.58
      ],
      "torso": 272,
      "head": 272,
      "nearArm": [
        95,
        92
      ],
      "farArm": [
        98,
        92
      ],
      "nearLeg": [
        90,
        90,
        359.99
      ],
      "farLeg": [
        118,
        150,
        20
      ]
    },
    "f2": {
      "pelvis": [
        23.61,
        33.44
      ],
      "torso": 276,
      "head": 276,
      "nearArm": [
        82,
        88
      ],
      "farArm": [
        85,
        88
      ],
      "nearLeg": [
        72,
        101.14,
        358.95
      ],
      "farLeg": [
        120,
        150,
        20
      ]
    }
  },
  "sl_hop": {
    "dur": 850,
    "f1": {
      "view": "front",
      "pelvis": [
        29.68,
        35.86
      ],
      "torso": 271.19,
      "hipW": 7,
      "leftLeg": [
        130.18,
        77.71
      ],
      "rightLeg": [
        104.69,
        317.86
      ],
      "leftArm": [
        148,
        160
      ],
      "rightArm": [
        32.79,
        20
      ]
    },
    "f2": {
      "view": "front",
      "pelvis": [
        28.75,
        31.58
      ],
      "torso": 274.04,
      "hipW": 7,
      "leftLeg": [
        108.55,
        90
      ],
      "rightLeg": [
        94.95,
        314.3
      ],
      "leftArm": [
        134,
        140
      ],
      "rightArm": [
        46,
        40
      ]
    }
  },
  "hip_abd": {
    "frame": "8 34 48 28",
    "f1": {
      "pelvis": [
        33,
        52
      ],
      "torso": 178,
      "head": 178,
      "nearArm": [
        200,
        210
      ],
      "farArm": [
        185,
        185
      ],
      "nearLeg": [
        6,
        6,
        30
      ],
      "farLeg": [
        5,
        5,
        30
      ],
      "intensity": {
        "at": [
          37,
          50
        ],
        "dir": 270,
        "r": 2.4
      }
    },
    "f2": {
      "pelvis": [
        33,
        52
      ],
      "torso": 178,
      "head": 178,
      "nearArm": [
        200,
        210
      ],
      "farArm": [
        185,
        185
      ],
      "nearLeg": [
        315,
        315,
        300
      ],
      "farLeg": [
        5,
        5,
        30
      ]
    }
  },
  "band_walk": {
    "f1": {
      "view": "front",
      "pelvis": [
        24.68,
        33.58
      ],
      "torso": 269,
      "hipW": 9,
      "leftArm": [
        100,
        90
      ],
      "rightArm": [
        80,
        90
      ],
      "leftLeg": [
        100,
        84
      ],
      "rightLeg": [
        80,
        96
      ],
      "propsBehind": [
        {
          "type": "bandFront"
        }
      ],
      "intensity": {
        "at": [
          15.5,
          44.5
        ],
        "dir": 180,
        "r": 2.2
      }
    },
    "f2": {
      "view": "front",
      "pelvis": [
        24.68,
        33.36
      ],
      "torso": 269,
      "hipW": 9,
      "leftArm": [
        100,
        90
      ],
      "rightArm": [
        80,
        90
      ],
      "leftLeg": [
        109.01,
        80
      ],
      "rightLeg": [
        78,
        98
      ]
    }
  },
  "sl_calf_raise": {
    "f1": {
      "pelvis": [
        25,
        33
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        15,
        8
      ],
      "farArm": [
        40,
        200
      ],
      "nearLeg": [
        90,
        90,
        2
      ],
      "farLeg": [
        40,
        200,
        0
      ],
      "wallX": 44,
      "propsBehind": [
        {
          "type": "wall",
          "x": 44,
          "y1": 8,
          "y2": 57
        }
      ],
      "intensity": {
        "at": [
          22,
          49
        ],
        "dir": 180,
        "r": 2.4
      }
    },
    "f2": {
      "pelvis": [
        25,
        30
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        15,
        8
      ],
      "farArm": [
        40,
        200
      ],
      "nearLeg": [
        90,
        90,
        60
      ],
      "farLeg": [
        40,
        200,
        0
      ],
      "wallX": 44,
      "propsBehind": [
        {
          "type": "wall",
          "x": 44,
          "y1": 8,
          "y2": 57
        }
      ]
    }
  },
  "goblet_sq": {
    "f1": {
      "view": "front",
      "pelvis": [
        24.89,
        32.86
      ],
      "torso": 269.86,
      "hipW": 8,
      "shoulderW": 9,
      "leftArm": [
        83.76,
        88.39
      ],
      "rightArm": [
        96,
        91
      ],
      "leftLeg": [
        92,
        90
      ],
      "rightLeg": [
        88,
        90
      ],
      "propsFront": [
        {
          "type": "goblet"
        }
      ]
    },
    "f2": {
      "view": "front",
      "pelvis": [
        25.04,
        36.36
      ],
      "torso": 271,
      "hipW": 8,
      "shoulderW": 9,
      "leftArm": [
        86,
        90
      ],
      "rightArm": [
        94,
        90
      ],
      "leftLeg": [
        120,
        55
      ],
      "rightLeg": [
        60,
        125
      ],
      "propsFront": [
        {
          "type": "goblet"
        }
      ]
    }
  },
  "pushup": {
    "f1": {
      "pelvis": [
        23.32,
        45.72
      ],
      "torso": 349.34,
      "head": 8,
      "nearArm": [
        114.05,
        95
      ],
      "farArm": [
        111.41,
        97.99
      ],
      "nearLeg": [
        162.37,
        166.48,
        72.5
      ],
      "farLeg": [
        159.82,
        167.58,
        75.6
      ]
    },
    "f2": {
      "pelvis": [
        25.25,
        49.22
      ],
      "torso": 8,
      "head": 8,
      "nearArm": [
        200.71,
        79.34
      ],
      "farArm": [
        202.7,
        77.87
      ],
      "nearLeg": [
        176.58,
        173.72,
        90
      ],
      "farLeg": [
        177.15,
        174.49,
        90
      ]
    }
  },
  "plank": {
    "f1": {
      "pelvis": [
        25.54,
        44.36
      ],
      "torso": 12,
      "head": 12,
      "nearArm": [
        95,
        359.57
      ],
      "farArm": [
        92,
        359.71
      ],
      "nearLeg": [
        162,
        162,
        120
      ],
      "farLeg": [
        160,
        160,
        118
      ]
    },
    "f2": {
      "pelvis": [
        25.25,
        44.58
      ],
      "torso": 12,
      "head": 12,
      "nearArm": [
        95,
        0.63
      ],
      "farArm": [
        92,
        359.08
      ],
      "nearLeg": [
        162,
        162,
        120
      ],
      "farLeg": [
        160,
        160,
        118
      ]
    }
  },
  "rdl": {
    "f1": {
      "pelvis": [
        22.25,
        32.79
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        92,
        90
      ],
      "farArm": [
        88,
        90
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        90,
        90,
        5
      ],
      "propsFront": [
        {
          "type": "dumbbell",
          "anchor": "nearHand"
        },
        {
          "type": "dumbbell",
          "anchor": "farHand"
        }
      ],
      "intensity": {
        "at": [
          20,
          40
        ],
        "dir": 195,
        "r": 2.2
      }
    },
    "f2": {
      "pelvis": [
        22.04,
        33.08
      ],
      "torso": 20,
      "head": 12,
      "nearArm": [
        90,
        90
      ],
      "farArm": [
        90,
        90
      ],
      "nearLeg": [
        85,
        95,
        0
      ],
      "farLeg": [
        83,
        95,
        0
      ]
    }
  },
  "oh_press": {
    "f1": {
      "pelvis": [
        24.75,
        32.94
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        60,
        300
      ],
      "farArm": [
        64,
        304
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        90,
        90,
        5
      ],
      "propsFront": [
        {
          "type": "dumbbell",
          "anchor": "nearHand"
        },
        {
          "type": "dumbbell",
          "anchor": "farHand"
        }
      ]
    },
    "f2": {
      "pelvis": [
        24.75,
        33.01
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        274,
        272
      ],
      "farArm": [
        270,
        268
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        90,
        90,
        5
      ],
      "propsFront": [
        {
          "type": "dumbbell",
          "anchor": "nearHand"
        },
        {
          "type": "dumbbell",
          "anchor": "farHand"
        }
      ]
    }
  },
  "split_sq": {
    "f1": {
      "pelvis": [
        32.96,
        34.01
      ],
      "torso": 278,
      "head": 278,
      "nearArm": [
        100,
        120
      ],
      "farArm": [
        104,
        124
      ],
      "nearLeg": [
        66.79,
        100.97,
        0
      ],
      "farLeg": [
        144.96,
        179.8,
        180.06
      ],
      "ground": 57,
      "propsBehind": [
        {
          "type": "bench",
          "x": 2,
          "y": 42,
          "w": 19,
          "h": 3,
          "legs": true,
          "legH": 12
        }
      ]
    },
    "f2": {
      "pelvis": [
        28.18,
        39.36
      ],
      "torso": 280,
      "head": 280,
      "nearArm": [
        104,
        128
      ],
      "farArm": [
        108,
        132
      ],
      "nearLeg": [
        27.76,
        104,
        0
      ],
      "farLeg": [
        134.99,
        215.68,
        182.64
      ],
      "ground": 57,
      "propsBehind": [
        {
          "type": "bench",
          "x": 2,
          "y": 42,
          "w": 19,
          "h": 3,
          "legs": true,
          "legH": 12
        }
      ]
    }
  },
  "dead_bug": {
    "f1": {
      "pelvis": [
        30,
        53.5
      ],
      "torso": 180,
      "head": 180,
      "nearArm": [
        270,
        270
      ],
      "farArm": [
        270,
        270
      ],
      "nearLeg": [
        270,
        0,
        0
      ],
      "farLeg": [
        270,
        0,
        0
      ]
    },
    "f2": {
      "pelvis": [
        30,
        53.5
      ],
      "torso": 180,
      "head": 180,
      "nearArm": [
        185,
        182
      ],
      "farArm": [
        270,
        270
      ],
      "nearLeg": [
        270,
        0,
        0
      ],
      "farLeg": [
        10,
        5,
        0
      ]
    }
  },
  "kb_swing": {
    "dur": 2200,
    "f1": {
      "pelvis": [
        25.18,
        32.94
      ],
      "torso": 305,
      "head": 312,
      "nearArm": [
        112,
        114
      ],
      "farArm": [
        108,
        110
      ],
      "nearLeg": [
        83.87,
        100,
        4
      ],
      "farLeg": [
        82.89,
        98,
        4
      ],
      "propsFront": [
        {
          "type": "kettlebell",
          "anchor": "nearHand"
        }
      ]
    },
    "f2": {
      "pelvis": [
        25,
        33
      ],
      "torso": 270,
      "head": 270,
      "nearArm": [
        357,
        357
      ],
      "farArm": [
        353,
        353
      ],
      "nearLeg": [
        90,
        90,
        5
      ],
      "farLeg": [
        90,
        90,
        5
      ]
    }
  }
};
const GAIT_PARAMS = {
  "walk": {
    "dur": 1050,
    "torsoLean": 3,
    "hipFlex": 20,
    "kneeSwing": 34,
    "kneeLand": 12,
    "armSwing": 20,
    "armBend": 15,
    "hipX": 25,
    "hipY": 33,
    "kneeBase": 6,
    "footAngle": -78
  },
  "run": {
    "dur": 680,
    "torsoLean": 14,
    "hipFlex": 32,
    "kneeSwing": 58,
    "kneeLand": 26,
    "armSwing": 38,
    "armBend": 80,
    "hipX": 25,
    "hipY": 33,
    "kneeBase": 6,
    "footAngle": -78
  },
  "carry": {
    "dur": 1050,
    "nearHand": [
      84,
      88
    ],
    "farHand": [
      96,
      92
    ]
  }
};
