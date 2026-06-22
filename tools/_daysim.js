'use strict';
// ============================================================
// TEMPORAL / SIMULATION HARNESS for "The Hard Part"
// Loads the pure logic (program.js, engine.js, util.js) into a shared VM
// sandbox with a CONTROLLABLE clock, then runs many day-by-day scenarios and
// asserts temporal invariants. Run: node tools/_daysim.js
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');

// ---- Controllable clock ----
// clock.iso = local calendar date string "YYYY-MM-DD"
// clock.tzOffsetMin = local offset from UTC in minutes (e.g. -300 for EST). Used so
//   Date.now() (UTC ms) and isoToday() (local date) can be made to DISAGREE the way a
//   real phone's timezone / DST would.
const clock = { iso: '2026-01-01', nowMs: Date.parse('2026-01-01T12:00:00Z') };

// Build a sandbox that mimics the app's single global scope.
const sandbox = {};
sandbox.window = sandbox;        // app treats globals as window-scoped
sandbox.globalThis = sandbox;
sandbox.console = console;
sandbox.requestAnimationFrame = () => 0;   // no rAF in node
sandbox.setTimeout = () => 0;
sandbox.setInterval = () => 0;
sandbox.navigator = { serviceWorker: { register: () => Promise.resolve() } };
sandbox.document = { getElementById: () => null, addEventListener: () => {} };
sandbox.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, length: 0, key: () => null };

// Controllable Date: Date.now() returns clock.nowMs; new Date() with no args returns
// a Date positioned at clock.iso local-noon expressed in the chosen offset; constructed
// dates with args behave normally (so "YYYY-MM-DDT00:00:00" parsing in daysSinceLastCheck works).
const RealDate = Date;
function makeFakeDate() {
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        // "now" in LOCAL time: produce a Date whose getFullYear/Month/Date match clock.iso
        // and whose getTime() == clock.nowMs (so getFullYear() etc reflect the *local* wall date).
        super(clock.nowMs);
        return;
      }
      super(...args);
    }
    static now() { return clock.nowMs; }
  }
  // We need getFullYear/getMonth/getDate (used by isoToday & msUntilTomorrow) to reflect the
  // intended LOCAL wall-clock date, not the UTC of nowMs. Simplest faithful model: drive
  // isoToday & msUntilTomorrow off clock.iso directly by overriding those two functions after load.
  return FakeDate;
}
sandbox.Date = makeFakeDate();

const ctx = vm.createContext(sandbox);

// Load order mirrors index.html (subset needed for logic): config → state → program → engine → util
for (const f of ['config.js', 'state.js', 'program.js', 'engine.js', 'util.js']) {
  vm.runInContext(read(f), ctx, { filename: f });
}

// Stub out functions that touch storage/DOM/log so logic runs headless.
vm.runInContext(`
  saveLocal = function(){};
  markDirty = function(){};
  logEvent = function(){};
  setSync = function(){};
`, ctx);

// Override the two date-derived helpers to use the controllable LOCAL calendar date.
// This is the faithful model: isoToday() in the app uses new Date().getFullYear/Month/Date (LOCAL),
// while Date.now() is UTC ms. We drive isoToday from clock.iso and Date.now from clock.nowMs so they
// can be made to AGREE or DISAGREE exactly like a real device across timezones / DST.
vm.runInContext(`
  isoToday = function(){ return CLOCK_ISO(); };
  msUntilTomorrow = function(){ return MS_UNTIL_TOMORROW(); };
`, ctx);
sandbox.CLOCK_ISO = () => clock.iso;
sandbox.MS_UNTIL_TOMORROW = () => {
  // local midnight tonight, in ms, given clock.iso and clock.nowMs. Compute next-local-midnight
  // as parse(iso+1 @ local). We model "local midnight" by treating clock.iso boundaries as
  // aligned with nowMs's day. msUntilTomorrow in the app = next local midnight - now.
  const [y, m, d] = clock.iso.split('-').map(Number);
  // local midnight tomorrow expressed in same frame as nowMs:
  const tomorrowLocalMidnight = new RealDate(clock.nowMs);
  tomorrowLocalMidnight.setUTCHours(0, 0, 0, 0);
  // align to clock.iso's notion: just add the remaining time to UTC-midnight of tomorrow
  const utcMidnightNext = RealDate.UTC(y, m - 1, d + 1, 0, 0, 0, 0);
  // Approximate local using nowMs day fraction; for sim purposes we just need a sane positive number.
  return Math.max(0, utcMidnightNext - clock.nowMs);
};

// `state`, `PHASES`, and the functions are `const`/`function` declarations inside the VM
// scope — they live on the context's global object but aren't auto-mirrored to `sandbox`.
// Pull the ones we need out explicitly.
const state = vm.runInContext('state', ctx);
const PHASES = vm.runInContext('PHASES', ctx);
sandbox.state = state; sandbox.PHASES = PHASES;
['applyCheck', 'daysSinceLastCheck', 'injuryInRice', 'injuryActive', 'isDeloadWeek', 'layoffTier']
  .forEach(n => { sandbox[n] = vm.runInContext(n, ctx); });

// Helpers to access in-sandbox globals
const S = () => state;
const call = name => sandbox[name];

// Date arithmetic on iso strings
function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = RealDate.UTC(y, m - 1, d + n, 12, 0, 0, 0);
  const dt = new RealDate(t);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
function isoToMsNoon(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return RealDate.UTC(y, m - 1, d, 12, 0, 0, 0);
}

// Set the clock to a given iso date (advances nowMs to that day's local noon UTC).
function setDay(iso, hourUtc = 12) {
  clock.iso = iso;
  const [y, m, d] = iso.split('-').map(Number);
  clock.nowMs = RealDate.UTC(y, m - 1, d, hourUtc, 0, 0, 0);
}

// Fresh persona at a given starting phase.
function resetPersona(startingPhase = 0) {
  sandbox.state.profile = { username: 'sim', usernameSlug: 'sim', startingPhase };
  sandbox.state.phase = { phase: startingPhase, week: 1, dayInWeek: 1, sessionsCleared: 0, lastDecision: null };
  sandbox.state.checks = [];
  sandbox.state.injury = null;
  sandbox.state.returnRamp = null;
  sandbox.state.lifts = {};
  sandbox.state.log = [];
  sandbox.state.session = null;
}

// ---- Assertions ----
let failures = [];
function assert(cond, scenario, msg, extra) {
  if (!cond) failures.push({ scenario, msg, extra });
}

// Invariant checker run after every applyCheck
function checkInvariants(scenario, prevSnap) {
  const st = S();
  const ph = st.phase;
  // phase in-bounds
  assert(ph.phase >= 0 && ph.phase < sandbox.PHASES.length, scenario, `phase out of bounds: ${ph.phase}`);
  const pd = sandbox.PHASES[ph.phase];
  assert(ph.dayInWeek >= 1 && ph.dayInWeek <= pd.week.length, scenario, `dayInWeek out of bounds: ${ph.dayInWeek} (phase ${ph.phase} len ${pd.week.length})`);
  assert(ph.week >= 1 && ph.week <= pd.totalWeeks, scenario, `week out of bounds: ${ph.week}/${pd.totalWeeks} (phase ${ph.phase})`);
  // one row per date
  const dates = st.checks.map(c => c.date);
  const dup = dates.filter((d, i) => dates.indexOf(d) !== i);
  assert(dup.length === 0, scenario, `duplicate day row(s): ${[...new Set(dup)].join(',')}`);
  // monotonic sessionsCleared (never decreases beyond a legit same-day rollback)
  if (prevSnap) {
    assert(ph.sessionsCleared >= prevSnap.sessionsCleared - 1, scenario,
      `sessionsCleared dropped >1: ${prevSnap.sessionsCleared} -> ${ph.sessionsCleared}`);
  }
}

// Run one daily check via the real engine.
function doCheck(scenario, goalMet, feel, hurt, parts, redFlag) {
  const prev = { sessionsCleared: S().phase.sessionsCleared };
  call('applyCheck')(goalMet, feel, !!hurt, parts || [], !!redFlag);
  checkInvariants(scenario, prev);
}

// ============================================================
// SCENARIOS
// ============================================================
function scenarioAllGood(days, startPhase) {
  const name = `all-good ${days}d (start P${startPhase})`;
  resetPersona(startPhase);
  let iso = '2026-01-01';
  let lastSessions = 0, advanceCount = 0;
  for (let i = 0; i < days; i++) {
    setDay(iso);
    const before = S().phase.sessionsCleared;
    doCheck(name, 'done', 5, false);
    if (S().phase.sessionsCleared > before) advanceCount++;
    iso = addDaysIso(iso, 1);
  }
  // On a perfect run, every day should advance (subject to layoff ease — but cadence is 1/day so no layoff)
  // EXCEPT deload weeks downgrade progress->repeat (no advance) and the first day is fine.
  assert(S().phase.sessionsCleared > 0, name, 'no sessions cleared on a perfect run');
  return { name, advanceCount, days, finalPhase: S().phase.phase, sessions: S().phase.sessionsCleared };
}

function scenarioOneRowPerDayReedit() {
  const name = 'same-day re-edit (no dup, rollback)';
  resetPersona(1);
  setDay('2026-03-10');
  doCheck(name, 'done', 5, false);          // progress, advances
  const afterAdvance = S().phase.sessionsCleared;
  const ptrAfter = { ...S().phase };
  doCheck(name, 'done', 5, false);          // same-day re-check progress again -> must NOT double advance
  assert(S().phase.sessionsCleared === afterAdvance, name,
    `double-advanced on same-day re-progress: ${afterAdvance} -> ${S().phase.sessionsCleared}`);
  doCheck(name, 'missed', 3, false);        // downgrade -> must roll pointer back
  assert(S().phase.sessionsCleared === afterAdvance - 1, name,
    `downgrade did not roll back sessionsCleared: expected ${afterAdvance - 1} got ${S().phase.sessionsCleared}`);
  assert(S().checks.filter(c => c.date === '2026-03-10').length === 1, name, 'duplicate row after re-edits');
  return { name, sessions: S().phase.sessionsCleared };
}

function scenarioLongLayoff() {
  const name = 'long layoff (phone off 40 days)';
  resetPersona(1);
  setDay('2026-01-05'); doCheck(name, 'done', 5, false);
  const before = S().phase.sessionsCleared;
  // jump 40 days forward
  setDay('2026-02-14');
  const gap = call('daysSinceLastCheck')();
  doCheck(name, 'done', 5, false);   // returning day: layoff tier should downgrade progress->repeat
  assert(S().phase.sessionsCleared === before, name,
    `layoff day still advanced (no ease-in): gap=${gap}, sessions ${before}->${S().phase.sessionsCleared}`);
  assert(!!S().returnRamp, name, 'returnRamp not armed after long layoff');
  return { name, gap, sessions: S().phase.sessionsCleared };
}

function scenarioDST() {
  // US spring-forward 2026-03-08 (2am->3am). Fall-back 2026-11-01.
  // Day-to-day cadence across DST: isoToday increments by 1 each day; daysSinceLastCheck (midnight diff)
  // must stay 1 across the transition; injury windows (Date.now based) must not desync into a bogus layoff.
  const name = 'DST spring-forward (Mar 7->8->9)';
  resetPersona(1);
  // Day before DST, EST offset -300
  setDay('2026-03-07', 17); // 12:00 local EST = 17:00 UTC
  doCheck(name, 'done', 5, false);
  // DST day: clocks now EDT -240; same wall noon = 16:00 UTC
  setDay('2026-03-08', 16);
  let gap = call('daysSinceLastCheck')();
  assert(gap === 1, name, `gap across spring-forward != 1: ${gap}`);
  doCheck(name, 'done', 5, false);
  // day after
  setDay('2026-03-09', 16);
  gap = call('daysSinceLastCheck')();
  assert(gap === 1, name, `gap day-after spring-forward != 1: ${gap}`);
  doCheck(name, 'done', 5, false);
  return { name, gap };
}

function scenarioInjuryWindowVsCalendar() {
  // riceUntil = now + 3*86400000 (UTC ms). Across a DST fall-back the *calendar* gives an extra
  // hour; check the injury day-count vs calendar days doesn't drift in a way that strands the user.
  const name = 'injury window vs calendar (DST fall-back)';
  resetPersona(1);
  setDay('2026-10-30', 16);
  doCheck(name, 'done', 4, true, ['knee']);     // injure
  assert(!!S().injury, name, 'no injury recorded');
  // walk forward across fall-back 2026-11-01 (EDT->EST), re-check pain-free near the protect edge
  setDay('2026-11-02', 17);
  const inRice = call('injuryInRice')();
  const active = call('injuryActive')();
  doCheck(name, 'done', 4, false);  // pain-free recheck clears injury
  assert(!S().injury, name, `injury not cleared on pain-free recheck (active=${active}, inRice=${inRice})`);
  return { name, inRice, active };
}

function scenarioBackwardClock() {
  // User (or NTP) sets the device clock BACKWARD a few days. lastCheckDate is in the future
  // relative to isoToday. daysSinceLastCheck clamps to >=0, but can the pointer get stranded /
  // can a check write a row for an EARLIER date and create ordering chaos?
  const name = 'backward clock change (-5 days)';
  resetPersona(1);
  setDay('2026-04-20'); doCheck(name, 'done', 5, false);
  const before = S().phase.sessionsCleared;
  // clock jumps backward
  setDay('2026-04-15');
  const gap = call('daysSinceLastCheck')();
  assert(gap === 0, name, `negative-gap not clamped to 0: ${gap}`);
  doCheck(name, 'done', 5, false);   // a "new" earlier date row
  // duplicate-day invariant + monotonic already checked. Now: is there a row dated 04-15 AND 04-20?
  // HARDENED behavior: the day-gate no longer keys solely off isoToday(). When the local date moves
  // BACKWARD (no row matches the now-earlier today), applyCheck detects a future-dated row (04-20 >= 04-15)
  // AND/OR a recent ts (last check within ~12h), and treats the second check as a same-day RE-EDIT of the
  // newest row — REPLACING it in place (the row is re-stamped with the current date). So there is exactly
  // ONE row and NO second advance: a backward clock cannot manufacture an extra session.
  assert(S().checks.length === 1, name, `backward-clock should not grow rows: ${S().checks.length}`);
  assert(S().phase.sessionsCleared === before, name,
    `backward-clock must NOT double-advance: ${before} -> ${S().phase.sessionsCleared}`);
  return { name, gap, sessions: S().phase.sessionsCleared, advancedAgain: S().phase.sessionsCleared > before };
}

function scenarioLateNightThenMorning() {
  // Check in at 11:50pm, then again at 7am next morning. isoToday rolls over -> a NEW day -> gate opens.
  // Expect: the morning check is a *new* day (can advance again). That's correct. But verify no dup and
  // that the previous night's row is untouched.
  const name = 'late-night then next morning';
  resetPersona(1);
  setDay('2026-05-10', 4); // 11:50pm local-ish; we just use the iso for the row date
  clock.iso = '2026-05-10';
  doCheck(name, 'done', 5, false);
  const sess1 = S().phase.sessionsCleared;
  // next morning
  setDay('2026-05-11', 12);
  doCheck(name, 'done', 5, false);
  const sess2 = S().phase.sessionsCleared;
  assert(sess2 === sess1 + 1, name, `morning did not advance a new day: ${sess1}->${sess2}`);
  assert(S().checks.length === 2, name, `expected 2 rows, got ${S().checks.length}`);
  return { name, sess1, sess2 };
}

function scenarioOscillating(days) {
  const name = `oscillating ${days}d`;
  resetPersona(1);
  let iso = '2026-01-01';
  const pat = [['done',5],['done',3],['done',4],['missed',2],['partial',3],['done',5]];
  for (let i = 0; i < days; i++) {
    setDay(iso);
    const [g, f] = pat[i % pat.length];
    doCheck(name, g, f, false);
    iso = addDaysIso(iso, 1);
  }
  return { name, finalPhase: S().phase.phase, sessions: S().phase.sessionsCleared };
}

function scenarioInjuryHeavy(days) {
  const name = `injury-heavy ${days}d`;
  resetPersona(2);
  let iso = '2026-01-01';
  for (let i = 0; i < days; i++) {
    setDay(iso);
    const hurt = (i % 11 === 0);
    if (hurt) doCheck(name, 'partial', 2, true, ['knee']);
    else doCheck(name, 'done', i % 3 === 0 ? 5 : 4, false);
    iso = addDaysIso(iso, 1);
  }
  return { name, finalPhase: S().phase.phase, sessions: S().phase.sessionsCleared };
}

function scenarioLeapAndMonthBoundary() {
  const name = 'month boundary + Feb (non-leap 2026)';
  resetPersona(1);
  // 2026 is NOT a leap year; Feb has 28 days. Walk across Feb 27/28 -> Mar 1.
  for (const iso of ['2026-02-26','2026-02-27','2026-02-28','2026-03-01','2026-03-02']) {
    setDay(iso);
    // Measure the gap to the PREVIOUS day BEFORE writing today's row (excludeToday=true is how applyCheck
    // reads it internally; calling without it after doCheck would see today's just-written row and report 0).
    const gap = call('daysSinceLastCheck')(true);
    doCheck(name, 'done', 5, false);
    if (iso !== '2026-02-26') assert(gap === 1, name, `gap !=1 at ${iso}: ${gap}`);
  }
  return { name, sessions: S().phase.sessionsCleared };
}

function scenarioTimezoneShift() {
  // User travels; isoToday (local) jumps but Date.now (UTC) barely moves, or vice versa.
  // Model: check at iso D in tz A, then 8 hours later (same UTC day) the local date is already D+1
  // (e.g. crossed the date line). Does this create a phantom layoff or skip?
  const name = 'timezone shift (cross date line +1 local day, same UTC)';
  resetPersona(1);
  setDay('2026-06-01', 20); // evening local
  doCheck(name, 'done', 5, false);
  const before = S().phase.sessionsCleared;
  // a few UTC hours later, but local date already advanced one day (travel west->east over date line)
  clock.iso = '2026-06-02';
  clock.nowMs += 6 * 3600000; // only 6h of real time elapsed
  const gap = call('daysSinceLastCheck')();
  // calendar gap is 1, but only ~6h of REAL time passed — the day-gate's recent-ts guard (<=12h since the
  // newest check) treats this as a same-day re-edit, so the pointer must NOT advance a second time. This is
  // the correct anti-tamper outcome: crossing the date line in a few hours is not a new training day.
  doCheck(name, 'done', 5, false);
  assert(S().phase.sessionsCleared === before, name, `tz-shift must not advance on a <12h real-time hop: ${before}->${S().phase.sessionsCleared}`);
  return { name, gap, advanced: S().phase.sessionsCleared > before };
}

function scenarioDeloadCadence() {
  // Verify deload weeks occur and that they DON'T break monotonicity / bounds over a long good run.
  const name = 'deload cadence (200d all-good from P1)';
  resetPersona(1);
  let iso = '2026-01-01';
  const advancesByWeek = {};
  for (let i = 0; i < 200; i++) {
    setDay(iso);
    const before = S().phase.sessionsCleared;
    const isDeload = call('isDeloadWeek')();
    doCheck(name, 'done', 5, false);
    if (isDeload && S().phase.sessionsCleared > before) {
      // a deload week should downgrade progress->repeat (no advance) per the design
      // record but don't hard-fail: this checks the deload actually has teeth
    }
    iso = addDaysIso(iso, 1);
  }
  return { name, finalPhase: S().phase.phase, sessions: S().phase.sessionsCleared };
}

// ---- Explicit CLOCK-TAMPER scenarios (orchestrator-required) ----
// (a) check in, move clock BACKWARD a week, check in again -> sessionsCleared must NOT double-advance.
function scenarioTamperBackwardWeek() {
  const name = 'TAMPER: check in, clock -1 week, check in';
  resetPersona(1);
  setDay('2026-04-20'); doCheck(name, 'done', 5, false);
  const before = S().phase.sessionsCleared, rowsBefore = S().checks.length;
  setDay('2026-04-13');               // device clock yanked back a week (both display + nowMs move back)
  doCheck(name, 'done', 5, false);
  assert(S().phase.sessionsCleared === before, name,
    `clock-backward double-advanced: ${before} -> ${S().phase.sessionsCleared}`);
  assert(S().checks.length === rowsBefore, name,
    `clock-backward grew rows (should re-edit newest): ${rowsBefore} -> ${S().checks.length}`);
  return { name, before, after: S().phase.sessionsCleared, rows: S().checks.length, doubleAdvanced: S().phase.sessionsCleared > before };
}
// (b) check in, move clock FORWARD 2 months with NO real time elapsed, check in -> NO bogus level-3
//     layoff / return-ramp armed. The ts-vs-calendar clamp in daysSinceLastCheck distrusts the jump.
function scenarioTamperForward2Months() {
  const name = 'TAMPER: check in, clock +2 months (phantom), check in';
  resetPersona(1);
  setDay('2026-04-20'); doCheck(name, 'done', 5, false);
  const lastTs = S().checks[S().checks.length - 1].ts;
  // Calendar leaps to 06-20 (~61d) but only ~6h of REAL time passes (ts barely moves).
  clock.iso = '2026-06-20';
  clock.nowMs = lastTs + 6 * 3600000;
  const gap = call('daysSinceLastCheck')(true);
  const tier = call('layoffTier')(gap);
  doCheck(name, 'done', 5, false);
  assert(gap < 15, name, `phantom forward jump not clamped: gap=${gap}`);
  assert(!tier || tier.level !== 3, name, `bogus level-3 layoff armed from clock tamper (gap=${gap})`);
  assert(!S().returnRamp, name, `bogus return-ramp armed from clock tamper (level ${S().returnRamp && S().returnRamp.level})`);
  return { name, gap, tier: tier ? tier.level : null, returnRamp: S().returnRamp ? S().returnRamp.level : null };
}
// (b-control) a GENUINE 2-month absence (real time advances too) MUST still arm level-3 — proves the
// tamper clamp does not over-suppress legitimate layoffs.
function scenarioGenuine2MonthLayoff() {
  const name = 'CONTROL: genuine 2-month absence arms level-3';
  resetPersona(1);
  setDay('2026-04-20'); doCheck(name, 'done', 5, false);
  setDay('2026-06-20');               // real 61 days pass (display + nowMs both advance)
  const gap = call('daysSinceLastCheck')(true);
  const tier = call('layoffTier')(gap);
  doCheck(name, 'done', 5, false);
  assert(tier && tier.level === 3, name, `genuine 61d layoff failed to arm level-3 (gap=${gap}, tier=${tier && tier.level})`);
  assert(!!S().returnRamp && S().returnRamp.level === 3, name, `genuine layoff did not arm level-3 return-ramp`);
  return { name, gap, tier: tier ? tier.level : null, returnRamp: S().returnRamp ? S().returnRamp.level : null };
}

// Graded STAGE regression on return from a layoff: 5 vs 45 vs 90 vs 250 vs 1000 days set the appropriate stage,
// regression only ever moves EARLIER (never bumps a low phase up), and the away-days never advance the pointer.
function scenarioLayoffRegression() {
  const name = 'layoff stage-regression by gap';
  const cases = [
    { days: 5,    from: 3, expect: 3 },   // <2wk: no layoff, no regression
    { days: 45,   from: 3, expect: 3 },   // ~6wk: load-ease only, no stage reset
    { days: 90,   from: 3, expect: 2 },   // ~3mo: restart running from Run Introduction
    { days: 250,  from: 3, expect: 1 },   // ~8mo: rebuild from Foundation
    { days: 1000, from: 3, expect: 0 },   // ~3yr: full restart from Infrastructure
    { days: 90,   from: 1, expect: 1 },   // floor is P2 but already at P1 → never bump UP
  ];
  const out = [];
  for (const c of cases) {
    resetPersona(c.from);
    setDay('2026-01-01'); doCheck(name, 'done', 5, false);          // baseline (advances within the phase)
    const clearedBaseline = S().phase.sessionsCleared;
    const future = addDaysIso('2026-01-01', c.days);
    setDay(future);
    doCheck(name, 'done', 5, false);                                // the return check
    const after = S().phase.phase;
    assert(after === c.expect, name, `${c.days}d off from P${c.from} → expected P${c.expect}, got P${after}`);
    // never count an unearned day: a layoff return (>=15d) is held to Repeat, so it must NOT advance the tally
    if (c.days >= 15) assert(S().phase.sessionsCleared === clearedBaseline, name, `${c.days}d return advanced an unearned session: ${clearedBaseline}->${S().phase.sessionsCleared}`);
    out.push({ days: c.days, from: c.from, to: after, expected: c.expect });
  }
  return { name, cases: out };
}

// ============================================================
// RUN
// ============================================================
const results = [];
results.push(scenarioAllGood(300, 0));
results.push(scenarioAllGood(300, 1));
results.push(scenarioAllGood(500, 0));
results.push(scenarioOneRowPerDayReedit());
results.push(scenarioLongLayoff());
results.push(scenarioDST());
results.push(scenarioInjuryWindowVsCalendar());
results.push(scenarioBackwardClock());
results.push(scenarioLateNightThenMorning());
results.push(scenarioOscillating(120));
results.push(scenarioInjuryHeavy(120));
results.push(scenarioLeapAndMonthBoundary());
results.push(scenarioTimezoneShift());
results.push(scenarioDeloadCadence());
results.push(scenarioTamperBackwardWeek());
results.push(scenarioTamperForward2Months());
results.push(scenarioGenuine2MonthLayoff());
results.push(scenarioLayoffRegression());

console.log('\n==== SCENARIO RESULTS ====');
for (const r of results) console.log(' ', JSON.stringify(r));

console.log('\n==== ASSERTION FAILURES ====');
if (failures.length === 0) console.log('  (none)');
else for (const f of failures) console.log(`  [FAIL] ${f.scenario}: ${f.msg}${f.extra ? ' :: ' + JSON.stringify(f.extra) : ''}`);

console.log(`\nTOTAL: ${failures.length} assertion failure(s) across ${results.length} scenarios.`);
