'use strict';
// ============================================================
// STATE
// ============================================================
const state = {
  profile: null,
  phase: null,     // { phase, week, dayInWeek, sessionsCleared, lastDecision }
  checks: [],      // [{ ts, date, goalMet, feel, hurt, decision, phase, week, dayInWeek, footZone }] — footZone: string|null,
                    // set when a check-in's hurt drill-down picked a foot zone (foot-pain-rehab plan, 2026-08-17)
  activeUser: null, // slug of the active persona
  session: null,    // { date, done: { exKey: true } } — per-day exercise completion
  // { parts:[], since, riceUntil, easeUntil, kind, foot, redFlag, extended, firstSince, clearedAt } — active injury.
  // kind: 'acute' (default, incl. every non-foot injury) | 'foot-pf'|'foot-meta'|'foot-refer'|'foot-toes'|'foot-top'.
  // foot: {zone, neural} | null — set only when kind starts with 'foot-' (null for 'acute'/non-foot injuries).
  injury: null,
  lifts: {},        // { exKey: { kind, load, unit, step, reps, range:[lo,hi], goodStreak, variation } } — RIR double-progression state
  log: [],          // audit log: [{ ts, type, text }]
  returnRamp: null,       // post-injury return-to-load ramp state (set by engine.js)
  rehabTail: null,        // { kind, until } | null — relapse-prevention window after a gated foot-pf/foot-meta
                           // clear (set by engine.js applyCheck; pruned silently by program.js pruneInjury())
  targetReachedAt: null,  // ts the user first reached their target (set by engine.js)
  celebrationSeen: false, // has the target-reached celebration been shown (set by ui.js)
  layoffDismissedOn: null, // "I didn't take time off": local date the user asserted they were active (caps gap math in effectiveLayoffGap)
  settings: { units: 'imperial', storagePersisted: false, lastBackupAt: null },
  ui: { screen: 'loading', params: {}, openBlocks: {} },
  _saveError: false,      // set true by saveLocal() when localStorage quota is exceeded
  // state._chk (draft check-in state, screens.js-managed, NOT declared here / not persisted):
  //   ._chk.footZone: 'heel'|'arch'|'ball'|'toes'|'top'|null; ._chk.footNeural: true|false|null (ball zone only);
  //   ._chk.redFlag already existed. See docs/superpowers/plans/2026-08-17-foot-pain-rehab.md pinned contract.
};

