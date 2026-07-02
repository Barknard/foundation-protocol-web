'use strict';
/* Multi-day check-in simulator — runs the REAL app modules (config/state/util/storage/program/engine)
   under Node with browser stubs and a controllable clock, and replays whole training timelines.
   Companion to tools/_daysim.js (the broad temporal-invariant harness): this suite pins the
   four 2026-07 engine fixes (deload deadlock, evening→morning history, return-day edit,
   layoff dismissal) plus the protections that must survive them. Run BOTH before shipping.

   Run:  node tools/_daysim.js
   Exit: 0 = all scenarios pass, 1 = failures (prints a PASS/FAIL line per scenario).

   Scenarios assert the INTENDED behavior:
     S0 baseline            — daily Done/5 advances the pointer one session per day
     S1 deload deadlock     — the scheduled deload week must self-expire (pointer keeps moving, lighter)
     S2 evening→morning     — a new local day <12h after the last check keeps BOTH history rows and holds
                              the pointer one day (recovery gate) — it must never erase yesterday's row
     S3 return-day edit     — re-editing the first check after a 20-day layoff keeps the Repeat hold
     S4 layoff dismissal    — "I didn't take time off" must suppress ramp + forced Repeat + phase regression
     S5 same-date re-edit   — editing today's answer replaces the row (no growth) and rolls back an advance
     S6 backward clock      — date moved backward <12h after a check re-edits (no phantom advance)
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Works from both layouts: the web repo (js/ at the root) and the Capacitor copy (www/js).
const JS = fs.existsSync(path.join(__dirname, '..', 'www', 'js'))
  ? path.join(__dirname, '..', 'www', 'js')
  : path.join(__dirname, '..', 'js');
const FILES = ['config.js', 'state.js', 'util.js', 'storage.js', 'program.js', 'engine.js'];

// ---------- browser stubs ----------
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ click() {}, remove() {}, style: {}, setAttribute() {} }),
  body: { appendChild() {}, insertAdjacentHTML() {} },
  addEventListener() {},
};

// ---------- controllable clock (must exist before the app modules bind to Date) ----------
const RealDate = Date;
let simNow = new RealDate('2026-01-05T08:00:00').getTime();
class SimDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(simNow); else super(...a); }
  static now() { return simNow; }
}
global.Date = SimDate;
const setNow = (ms) => { simNow = ms; };
const DAY = 86400000, HOUR = 3600000;
const at = (iso) => new RealDate(iso).getTime();

// ---------- load the real app code ----------
const src = FILES.map((f) => fs.readFileSync(path.join(JS, f), 'utf8')).join('\n;\n');
vm.runInThisContext(src, { filename: 'app-modules.js' });
/* global state, applyCheck, PHASES, isoToday, globalWeek, isDeloadWeek, layoffTier */

// ---------- helpers ----------
function resetPersona(phase) {
  store.clear();
  state.profile = { username: 'sim', usernameSlug: 'sim', weightKg: 80, maxPushup: 10, longestWalkMin: 30, age: 45, startingPhase: phase, createdAt: Date.now() };
  state.activeUser = 'sim';
  state.phase = { phase, week: 1, dayInWeek: 1, sessionsCleared: 0, lastDecision: null };
  state.checks = []; state.session = null; state.injury = null; state.log = []; state.lifts = {};
  state.returnRamp = null; state.targetReachedAt = null; state.celebrationSeen = false;
  state.layoffDismissedOn = null;
}
const ptr = () => `P${state.phase.phase} W${state.phase.week} D${state.phase.dayInWeek}`;
const results = [];
function scenario(name, fn) {
  try { const r = fn(); results.push({ name, ...r }); }
  catch (e) { results.push({ name, pass: false, detail: `threw: ${e.message}` }); }
}

// ---------- S0: baseline — daily Done/5 advances one session per day ----------
scenario('S0 baseline daily progress', () => {
  resetPersona(0);
  let t = at('2026-01-05T08:00:00');
  for (let d = 0; d < 10; d++) { setNow(t + d * DAY); applyCheck('done', 5, false, [], false); }
  const ok = state.phase.sessionsCleared === 10 && state.checks.length === 10;
  return { pass: ok, detail: `sessionsCleared=${state.phase.sessionsCleared} rows=${state.checks.length} (${ptr()})` };
});

// ---------- S1: the scheduled deload week must self-expire ----------
scenario('S1 deload week self-expires', () => {
  resetPersona(1);   // phase 1: deload at phase-week 5 (loaded week 5)
  let t = at('2026-01-05T08:00:00');
  let frozen = 0, maxFrozen = 0, prev = '';
  for (let d = 0; d < 60; d++) {
    setNow(t + d * DAY);
    applyCheck('done', 5, false, [], false);
    const p = ptr();
    if (p === prev) { frozen++; maxFrozen = Math.max(maxFrozen, frozen); } else frozen = 0;
    prev = p;
  }
  // 60 perfect days from P1W1D1 must clear the week-5 deload and land in week 6+.
  const cleared = state.phase.week >= 6 || state.phase.phase > 1;
  return { pass: cleared && maxFrozen < 7, detail: `end=${ptr()} maxConsecutiveFrozenDays=${maxFrozen + 1}` };
});

// ---------- S2: evening→morning (<12h across midnight) keeps both rows, holds one day ----------
scenario('S2 evening→morning keeps history', () => {
  resetPersona(0);
  setNow(at('2026-01-05T21:00:00')); applyCheck('done', 5, false, [], false);   // Mon 9pm → Progress
  const rowsAfterMon = state.checks.length, clearedAfterMon = state.phase.sessionsCleared;
  setNow(at('2026-01-06T08:00:00')); applyCheck('done', 5, false, [], false);   // Tue 8am (11h later)
  const bothRows = state.checks.length === 2;
  const monSurvives = state.checks.some((c) => c.date === '2026-01-05');
  const held = state.phase.sessionsCleared === clearedAfterMon;   // <12h of recovery → no second advance
  return { pass: bothRows && monSurvives && held, detail: `rows=${state.checks.length} (after Mon: ${rowsAfterMon}) monSurvives=${monSurvives} cleared=${state.phase.sessionsCleared}` };
});

// ---------- S3: re-editing the return-day check keeps the layoff hold ----------
scenario('S3 return-day edit keeps hold', () => {
  resetPersona(1);
  setNow(at('2026-01-05T08:00:00')); applyCheck('done', 5, false, [], false);   // day 1, then 20 days off
  setNow(at('2026-01-25T09:00:00'));
  const first = applyCheck('done', 5, false, [], false);                        // return day → held to Repeat
  const clearedAfterFirst = state.phase.sessionsCleared;
  setNow(at('2026-01-25T09:05:00'));
  const edit = applyCheck('done', 5, false, [], false);                         // 5-min re-edit, same answers
  const stillHeld = edit.key !== 'progress' && state.phase.sessionsCleared === clearedAfterFirst;
  return { pass: first.key === 'repeat' && stillHeld, detail: `first=${first.key} edit=${edit.key} cleared=${state.phase.sessionsCleared}` };
});

// ---------- S4: "I didn't take time off" suppresses ramp, hold, and regression ----------
scenario('S4 layoff dismissal honored', () => {
  resetPersona(3);
  state.phase = { phase: 3, week: 2, dayInWeek: 3, sessionsCleared: 40, lastDecision: null };
  setNow(at('2026-01-05T08:00:00')); applyCheck('done', 5, false, [], false);
  state.phase = { phase: 3, week: 2, dayInWeek: 4, sessionsCleared: 41, lastDecision: null };   // where they really are
  setNow(at('2026-03-06T08:00:00'));   // 61 days later (clock-manufactured, per the user)
  state.layoffDismissedOn = isoToday();   // user tapped "I didn't take time off" (as clearLayoff does)
  state.returnRamp = null;
  const out = applyCheck('done', 5, false, [], false);
  const noRegress = state.phase.phase === 3;
  const noRamp = !state.returnRamp;
  return { pass: out.key === 'progress' && noRegress && noRamp, detail: `out=${out.key} phase=${state.phase.phase} ramp=${!!state.returnRamp}` };
});

// ---------- S8: a same-day pencil re-edit cannot unlock the <12h hold (and it expires by evening) ----------
scenario('S8 tooSoon survives re-edit, expires by evening', () => {
  resetPersona(0);
  setNow(at('2026-01-05T21:00:00')); applyCheck('done', 5, false, [], false);   // Mon 9pm → Progress
  setNow(at('2026-01-06T08:00:00'));
  const first = applyCheck('done', 5, false, [], false);                        // Tue 8am → held (11h)
  setNow(at('2026-01-06T08:05:00'));
  const reEdit = applyCheck('done', 5, false, [], false);                       // pencil edit 5 min later
  const heldOnReEdit = reEdit.key !== 'progress' && state.phase.sessionsCleared === 1;
  setNow(at('2026-01-06T21:30:00'));
  const evening = applyCheck('done', 5, false, [], false);                      // 24.5h since Mon 9pm → allowed
  const advancedByEvening = evening.key === 'progress' && state.phase.sessionsCleared === 2;
  return { pass: first.key === 'repeat' && heldOnReEdit && advancedByEvening,
    detail: `first=${first.key} reEdit=${reEdit.key} evening=${evening.key} cleared=${state.phase.sessionsCleared} rows=${state.checks.length}` };
});

// ---------- S9: dismissal covers the bogus gap but NOT real absence afterwards ----------
scenario('S9 dismissal ages out for real layoffs', () => {
  resetPersona(3);
  state.phase = { phase: 3, week: 2, dayInWeek: 3, sessionsCleared: 40, lastDecision: null };
  setNow(at('2026-01-05T08:00:00')); applyCheck('done', 5, false, [], false);
  setNow(at('2026-03-07T08:00:00'));                       // bogus 61-day gap appears
  state.layoffDismissedOn = isoToday();                    // dismissed
  applyCheck('done', 5, false, [], false);                 // covered → progress (S4 asserts this)
  const phaseAfterDismiss = state.phase.phase;
  setNow(at('2026-04-06T08:00:00'));                       // then GENUINELY away 30 days
  const back = applyCheck('done', 5, false, [], false);
  const rampArmed = !!state.returnRamp;                    // 30d = tier 2: must ease back in
  const noRegress = state.phase.phase === phaseAfterDismiss;   // 30 < 57: no stage reset
  return { pass: back.key === 'repeat' && rampArmed && noRegress,
    detail: `back=${back.key} ramp=${rampArmed} phase=${state.phase.phase}` };
});

// ---------- S5: same-date re-edit replaces the row and rolls back an advance ----------
scenario('S5 same-date re-edit + rollback', () => {
  resetPersona(0);
  setNow(at('2026-01-05T08:00:00')); applyCheck('done', 5, false, [], false);   // Progress → advance
  const afterProgress = state.phase.sessionsCleared;
  setNow(at('2026-01-05T12:00:00')); applyCheck('missed', 2, false, [], false); // downgrade same day
  const rolledBack = state.phase.sessionsCleared === afterProgress - 1;
  return { pass: state.checks.length === 1 && rolledBack, detail: `rows=${state.checks.length} cleared=${state.phase.sessionsCleared}` };
});

// ---------- S6: backward clock (<12h, date rolled back) re-edits — no phantom advance ----------
scenario('S6 backward clock re-edits', () => {
  resetPersona(0);
  setNow(at('2026-01-06T00:30:00')); applyCheck('done', 5, false, [], false);   // just past midnight Tue
  const cleared = state.phase.sessionsCleared;
  setNow(at('2026-01-05T23:45:00'));   // clock fixed backward to Mon night (45 min earlier real time)
  applyCheck('done', 5, false, [], false);
  const ok = state.checks.length === 1 && state.phase.sessionsCleared === cleared;
  return { pass: ok, detail: `rows=${state.checks.length} cleared=${state.phase.sessionsCleared}` };
});

// ---------- S10: every exercise resolves to a live figure (gait or FIG_POSES skeleton) ----------
scenario('S10 figure coverage', () => {
  const poses = fs.readFileSync(path.join(JS, 'figure-poses.js'), 'utf8');
  vm.runInThisContext(poses, { filename: 'figure-poses.js' });
  /* global FIG_POSES, EXERCISES */
  const GAIT = ['walk', 'run', 'kb_carry'];
  const missing = EXERCISES.filter((e) => !GAIT.includes(e.key) && !FIG_POSES[e.key]).map((e) => e.key);
  return { pass: missing.length === 0, detail: missing.length ? `no figure for: ${missing.join(', ')}` : `${EXERCISES.length} exercises covered` };
});

// ---------- report ----------
let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  —  ${r.detail}`);
}
console.log(fails ? `\n${fails}/${results.length} scenario(s) FAILED` : `\nAll ${results.length} scenarios passed`);
process.exit(fails ? 1 : 0);
