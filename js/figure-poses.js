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
        26.46,
        42.29
      ],
      "torso": 140.93,
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
        11.29,
        86.03,
        0
      ],
      "farLeg": [
        13.04,
        84.33,
        354.93
      ]
    },
    "f2": {
      "pelvis": [
        29.32,
        48.2
      ],
      "torso": 163.43,
      "head": 176.33,
      "nearArm": [
        14.54,
        359.34
      ],
      "farArm": [
        15.78,
        356.65
      ],
      "nearLeg": [
        341.63,
        90.46,
        0
      ],
      "farLeg": [
        340.46,
        93.5,
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
        130,
        6
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
        122,
        118,
        12
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
        25,
        34
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
        25,
        33
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
        5
      ],
      "farLeg": [
        118,
        150,
        20
      ]
    },
    "f2": {
      "pelvis": [
        25,
        35.36
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
        100,
        5
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
        25,
        35.1
      ],
      "torso": 266,
      "hipW": 7,
      "leftLeg": [
        93,
        97
      ],
      "rightLeg": [
        80,
        300
      ],
      "leftArm": [
        148,
        160
      ],
      "rightArm": [
        32,
        20
      ]
    },
    "f2": {
      "view": "front",
      "pelvis": [
        25,
        32
      ],
      "torso": 270,
      "hipW": 7,
      "leftLeg": [
        90,
        90
      ],
      "rightLeg": [
        83,
        296
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
        25,
        35.23
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
          18,
          47
        ],
        "dir": 180,
        "r": 2.2
      }
    },
    "f2": {
      "view": "front",
      "pelvis": [
        25,
        35.35
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
        114,
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
        25,
        33
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
        25,
        38.46
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
        24.89,
        46.45
      ],
      "torso": 349.34,
      "head": 8,
      "nearArm": [
        100,
        95
      ],
      "farArm": [
        100,
        89.73
      ],
      "nearLeg": [
        167.58,
        167.61,
        80.02
      ],
      "farLeg": [
        169.06,
        163.19,
        75.6
      ]
    },
    "f2": {
      "pelvis": [
        27,
        45.5
      ],
      "torso": 8,
      "head": 8,
      "nearArm": [
        150,
        70
      ],
      "farArm": [
        150,
        70
      ],
      "nearLeg": [
        161.7,
        170,
        90
      ],
      "farLeg": [
        163.72,
        164,
        90
      ]
    }
  },
  "plank": {
    "f1": {
      "pelvis": [
        26,
        45.94
      ],
      "torso": 12,
      "head": 12,
      "nearArm": [
        95,
        180
      ],
      "farArm": [
        92,
        180
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
        26,
        45.94
      ],
      "torso": 12,
      "head": 12,
      "nearArm": [
        95,
        180
      ],
      "farArm": [
        92,
        180
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
        25,
        33
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
          22,
          40
        ],
        "dir": 200,
        "r": 2.4
      }
    },
    "f2": {
      "pelvis": [
        22,
        35.08
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
        25,
        34.65
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
        25,
        34.65
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
        26,
        35.09
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
        86,
        96,
        0
      ],
      "farLeg": [
        120,
        195,
        5
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
        25,
        36.44
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
        64,
        104,
        0
      ],
      "farLeg": [
        121.5,
        200.22,
        0.13
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
        54
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
        54
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
        26,
        40
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
        98,
        100,
        4
      ],
      "farLeg": [
        94,
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
