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
// foot.js added 2026-08-17 (foot-pain-rehab plan, Task E) — sits after program.js, before engine.js
// (engine.js reads foot.js's footKind/footWindow/footGatePassed/footRehabKind/REHAB_TAIL_DAYS/
// FOOT_GATES/FOOT_CONDITION_NAMES helpers; this harness doesn't load figure.js separately at this
// point, so foot.js goes directly before engine.js, matching index.html's relative order).
const FILES = ['config.js', 'state.js', 'util.js', 'storage.js', 'program.js', 'foot.js', 'engine.js'];

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

// ---------- S10: every exercise resolves to a live figure (gait, FIG_POSES skeleton, or a hand- ----------
// ---------- authored foot close-up — spec §7.3 adds a THIRD branch: gait -> skeleton -> foot close-up) ----
scenario('S10 figure coverage', () => {
  const poses = fs.readFileSync(path.join(JS, 'figure-poses.js'), 'utf8');
  vm.runInThisContext(poses, { filename: 'figure-poses.js' });
  /* global FIG_POSES, EXERCISES, footCloseupFigure */
  const GAIT = ['walk', 'run', 'kb_carry'];
  // footCloseupFigure is a foot.js markup BUILDER (pf_stretch/foot_intrinsic only) — resolves an
  // exercise key only if it actually returns markup (null for every other key), same as
  // util.js's animatedFigure() routing (gait -> skeleton pose -> foot close-up -> legacy, §7.3).
  const hasFootCloseup = (key) => (typeof footCloseupFigure === 'function') && !!footCloseupFigure(key, 44);
  const missing = EXERCISES.filter((e) => !GAIT.includes(e.key) && !FIG_POSES[e.key] && !hasFootCloseup(e.key)).map((e) => e.key);
  return { pass: missing.length === 0, detail: missing.length ? `no figure for: ${missing.join(', ')}` : `${EXERCISES.length} exercises covered (gait/pose/foot-closeup)` };
});

// ---------- S11: ball zone + neural=yes routes to foot-refer (neuroma pattern) with generic windows ----------
// (spec §3.3 row 3: "ball, neural=yes -> clinician (neuroma copy) -> injury.kind foot-refer -> generic
// injury window", contract footKind: neural-yes on a ball zone wins over the meta routing).
scenario('S11 ball + neural=yes routes to foot-refer + generic windows', () => {
  resetPersona(1);
  setNow(at('2026-01-05T08:00:00'));
  applyCheck('done', 3, true, ['foot'], false, { zone: 'ball', neural: true, gate: null });
  const inj = state.injury;
  const kindOk = !!inj && inj.kind === 'foot-refer';
  const rice = inj ? Math.round((inj.riceUntil - inj.since) / DAY) : null;
  const ease = inj ? Math.round((inj.easeUntil - inj.since) / DAY) : null;
  const windowsOk = rice === 3 && ease === 10;
  return { pass: kindOk && windowsOk, detail: `kind=${inj && inj.kind} rice=${rice} ease=${ease}` };
});

// ---------- S12: a red flag (any zone) routes to the INJURY_FLAG clinician outcome + foot-refer ----------
// (spec §3.3 last row: "any zone, red flag -> clinician (INJURY_FLAG) -> injury.kind foot-refer".
// INJURY_FLAG and INJURY_REST share outcome.key:'rest' — the distinguishing, UI-visible field is the
// title/action copy, so that's what this reads, matching "every assertion reads what the UI reads.")
scenario('S12 red flag routes to the clinician outcome + foot-refer', () => {
  resetPersona(1);
  setNow(at('2026-01-05T08:00:00'));
  const out = applyCheck('done', 3, true, ['foot'], true, { zone: 'heel', neural: null, gate: null });
  const inj = state.injury;
  const outcomeOk = !!out && out.title === 'See a clinician first';
  const kindOk = !!inj && inj.kind === 'foot-refer';
  return { pass: outcomeOk && kindOk, detail: `outcomeTitle="${out && out.title}" kind=${inj && inj.kind}` };
});

// ---------- S13: toes/top zones get the generic 3d/10d windows and NO rehab swap-in ----------
// (spec §3.3 rows 4-5: "toes -> guidance card -> foot-toes -> generic injury window"; "top -> guidance
// card -> foot-top -> generic injury window". §3.3 footnote: "foot-refer/foot-toes/foot-top reuse
// today's generic 3d/10d windows and load reduction — no new engine mechanics".)
scenario('S13 toes/top zones: generic windows, no rehab swap', () => {
  resetPersona(2);
  state.phase.dayInWeek = 2;   // a day with both a mobility slot and an impact-cardio slot present
  setNow(at('2026-01-05T08:00:00'));
  applyCheck('done', 3, true, ['foot'], false, { zone: 'toes', neural: null, gate: null });
  const inj1 = state.injury;
  const kind1Ok = !!inj1 && inj1.kind === 'foot-toes';
  const win1Ok = !!inj1 && Math.round((inj1.riceUntil - inj1.since) / DAY) === 3 && Math.round((inj1.easeUntil - inj1.since) / DAY) === 10;
  const plan1Keys = currentDayPlan().blocks.map((b) => b.key);
  const noSwap1 = !plan1Keys.some((k) => ['footRehabPF', 'footRehabMeta', 'lowImpactSub'].includes(k));

  resetPersona(2);
  state.phase.dayInWeek = 2;
  setNow(at('2026-02-05T08:00:00'));
  applyCheck('done', 3, true, ['foot'], false, { zone: 'top', neural: null, gate: null });
  const inj2 = state.injury;
  const kind2Ok = !!inj2 && inj2.kind === 'foot-top';
  const win2Ok = !!inj2 && Math.round((inj2.riceUntil - inj2.since) / DAY) === 3 && Math.round((inj2.easeUntil - inj2.since) / DAY) === 10;
  const plan2Keys = currentDayPlan().blocks.map((b) => b.key);
  const noSwap2 = !plan2Keys.some((k) => ['footRehabPF', 'footRehabMeta', 'lowImpactSub'].includes(k));

  const pass = kind1Ok && win1Ok && noSwap1 && kind2Ok && win2Ok && noSwap2;
  return { pass, detail: `toes: kind=${inj1 && inj1.kind} rice/ease ok=${win1Ok} swap=${!noSwap1} plan=${JSON.stringify(plan1Keys)} | top: kind=${inj2 && inj2.kind} rice/ease ok=${win2Ok} swap=${!noSwap2} plan=${JSON.stringify(plan2Keys)}` };
});

// ---------- S14: the recovery gate with ANY "no" cannot clear a foot-pf injury ----------
// (spec §3.5: "Any no => stays in rehab; the 'no' is logged; copy: which criterion isn't met".
// All-false is the strongest form of "any no".)
scenario('S14 gate all-no cannot clear a foot-pf injury', () => {
  resetPersona(1);
  setNow(at('2026-01-05T08:00:00'));
  applyCheck('done', 3, true, ['foot'], false, { zone: 'heel', neural: null, gate: null });
  setNow(at('2026-01-08T08:00:00'));   // still well inside the 84d ease window
  const out = applyCheck('done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: false, morning: false, raises: false } });
  const stillInjured = !!state.injury && state.injury.kind === 'foot-pf';
  const noTail = !state.rehabTail;
  return { pass: stillInjured && noTail, detail: `injury=${!!state.injury} kind=${state.injury && state.injury.kind} outcomeTitle="${out && out.title}" tail=${!!state.rehabTail}` };
});

// ---------- S15: rehabTail survives a fullBackup() -> applyBackup() round-trip ----------
// (spec §4: "rehabTail must be added to all five persistence points ... Old backups import cleanly".
// This is the export/import point specifically — S15's job is proving the JSON round-trip, not just
// that the five call sites reference the field.)
scenario('S15 rehabTail survives backup export -> import round-trip', () => {
  resetPersona(1);
  setNow(at('2026-01-05T08:00:00'));
  applyCheck('done', 3, true, ['foot'], false, { zone: 'heel', neural: null, gate: null });
  setNow(at('2026-01-29T08:00:00'));   // ~24d later: all-true gate clears + arms the relapse tail
  applyCheck('done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: true, morning: true, raises: true } });
  const tailBefore = state.rehabTail;
  const backup = fullBackup();
  resetPersona(0);   // simulate importing into a freshly-reset slot
  const ok = applyBackup(backup);
  const tailAfter = state.rehabTail;
  const roundTripOk = ok && !!tailBefore && !!tailAfter && tailAfter.kind === tailBefore.kind && tailAfter.until === tailBefore.until;
  return { pass: !!roundTripOk, detail: `applyOk=${ok} before=${JSON.stringify(tailBefore)} after=${JSON.stringify(tailAfter)}` };
});

// ---------- report ----------
let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}  —  ${r.detail}`);
}
console.log(fails ? `\n${fails}/${results.length} scenario(s) FAILED` : `\nAll ${results.length} scenarios passed`);
process.exit(fails ? 1 : 0);
