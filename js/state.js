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
  lifts: {},        // { exKey: { kind, load, unit, step, reps, range:[lo,hi], goodStreak, variation } } — RIR double-progression state
  log: [],          // audit log: [{ ts, type, text }]
  returnRamp: null,       // post-injury return-to-load ramp state (set by engine.js)
  targetReachedAt: null,  // ts the user first reached their target (set by engine.js)
  celebrationSeen: false, // has the target-reached celebration been shown (set by ui.js)
  capstoneReached: false, // has the capstone milestone been reached (set by engine.js)
  settings: { repo: '', pat: '', autoSync: true, units: 'imperial', storagePersisted: false, lastBackupAt: null },
  ui: { screen: 'loading', params: {}, syncStatus: 'idle', syncMessage: '', openBlocks: {} },
  _saveError: false,      // set true by saveLocal() when localStorage quota is exceeded
};

