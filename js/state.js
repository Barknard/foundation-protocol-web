'use strict';
// ============================================================
// STATE
// ============================================================
const state = {
  profile: null,
  phase: null,     // { phase, week, dayInWeek, sessionsCleared, lastDecision }
  checks: [],      // [{ ts, date, goalMet, feel, hurt, decision, phase, week, dayInWeek }]
  pending: [],
  activeUser: null, // slug of the active persona
  session: null,    // { date, done: { exKey: true } } — per-day exercise completion
  injury: null,     // { parts:[], since, riceUntil, kind } — active injury tracking
  log: [],          // audit log: [{ ts, type, text }]
  settings: { repo: '', pat: '', autoSync: true, units: 'imperial' },
  ui: { screen: 'loading', params: {}, syncStatus: 'idle', syncMessage: '', openBlocks: {} },
};

