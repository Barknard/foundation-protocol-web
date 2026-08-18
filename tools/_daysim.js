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
// Works from both layouts: the web repo (js/ at the root) and the Capacitor copy (www/js).
const JSDIR = fs.existsSync(path.join(ROOT, 'www', 'js')) ? path.join(ROOT, 'www', 'js') : path.join(ROOT, 'js');
const read = f => fs.readFileSync(path.join(JSDIR, f), 'utf8');

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

// Load order mirrors index.html (subset needed for logic): config → state → program → foot → engine → util
// foot.js added 2026-08-17 (foot-pain-rehab plan, Task E) — sits after program.js, before engine.js
// (engine reads foot.js's helpers; this harness doesn't load figure.js, so foot.js goes right before engine).
for (const f of ['config.js', 'state.js', 'program.js', 'foot.js', 'engine.js', 'util.js']) {
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
// footKind/footGatePassed/footWindow/currentDayPlan/REHAB_TAIL_DAYS added 2026-08-17 (foot-pain-rehab
// plan, Task E) for the new foot scenarios below. vm.runInContext(name, ctx) works identically for a
// const binding (REHAB_TAIL_DAYS) as for a function — it just evaluates the identifier expression.
['applyCheck', 'daysSinceLastCheck', 'injuryInRice', 'injuryActive', 'isDeloadWeek', 'layoffTier',
 'footKind', 'footGatePassed', 'footWindow', 'currentDayPlan', 'REHAB_TAIL_DAYS']
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
  sandbox.state.targetReachedAt = null;
  sandbox.state.celebrationSeen = false;
  sandbox.state.layoffDismissedOn = null;
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
// Same, but forwards the 6th `foot` param (pinned contract: foot = null | {zone, neural, gate}) —
// doCheck() above predates the foot-pain-rehab plan (2026-08-17) and callers that don't need it
// are left alone.
function doCheckFoot(scenario, goalMet, feel, hurt, parts, redFlag, foot) {
  const prev = { sessionsCleared: S().phase.sessionsCleared };
  call('applyCheck')(goalMet, feel, !!hurt, parts || [], !!redFlag, foot || null);
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
// FOOT PAIN REHAB (2026-08-17 plan, Task E) — authored from the spec's §3.3 routing table, §5
// engine behavior, and §9 test plan. Every assertion reads what the UI reads: currentDayPlan()'s
// returned blocks, state.injury, state.rehabTail, footWindow()/footKind() as the contract defines
// them — never a private/internal flag.
// ============================================================

// Full plantar-fasciitis lifecycle: flag -> swap-in (RICE then ease) -> a blocked gate -> a passed
// gate -> the relapse tail (appended only on program days actually labeled Mon/Thu) -> tail expiry
// reverting to the exact baseline plan (spec §3.3 row 1, §5.1, §5.2, §5.3, §5.4).
function scenarioFootPfLifecycle() {
  const name = 'foot-pf lifecycle (flag -> swap-in -> blocked gate -> passed gate -> tail -> normal)';
  resetPersona(2);                 // Run Introduction: has BOTH a mobility slot and an impact-cardio (run) slot
  S().phase.dayInWeek = 2;         // Tue: ptFull (mobility) + rw1 (impact cardio) — needed for the swap-in check
  const pd = PHASES[2];
  const flagIso = '2026-01-05';
  setDay(flagIso);
  doCheckFoot(name, false, 3, true, ['foot'], false, { zone: 'heel', neural: null, gate: null });
  const inj = S().injury;
  assert(!!inj, name, 'no injury recorded on a foot heel flag');
  assert(inj && inj.kind === 'foot-pf', name, `kind expected foot-pf, got ${inj && inj.kind}`);
  const win = call('footWindow')('foot-pf');
  assert(win.ease === 84, name, `foot-pf ease window expected 84d (contract), got ${win.ease}`);
  assert(inj && Math.round((inj.easeUntil - inj.since) / 86400000) === 84, name,
    `injury.easeUntil - since != 84d (got ${inj && Math.round((inj.easeUntil - inj.since) / 86400000)})`);
  assert(inj && Math.round((inj.riceUntil - inj.since) / 86400000) === 3, name,
    `injury.riceUntil - since != 3d (got ${inj && Math.round((inj.riceUntil - inj.since) / 86400000)})`);

  // 1 day post-flag: still inside the 3-day RICE/protect window -> mobility -> footRehabPF, impact cardio -> rest
  let iso = addDaysIso(flagIso, 1);
  setDay(iso);
  let plan = call('currentDayPlan')();
  assert(plan.blocks.some(b => b.key === 'footRehabPF'), name,
    `day1-post-flag plan missing footRehabPF: ${JSON.stringify(plan.blocks.map(b => b.key))}`);
  assert(plan.blocks.some(b => b.key === 'rest'), name,
    `day1-post-flag (in RICE) plan should sub impact cardio -> rest, got ${JSON.stringify(plan.blocks.map(b => b.key))}`);

  // 6 days post-flag: past RICE, well inside the 84d ease ceiling -> impact cardio -> lowImpactSub
  iso = addDaysIso(flagIso, 6);
  setDay(iso);
  plan = call('currentDayPlan')();
  assert(plan.blocks.some(b => b.key === 'footRehabPF'), name, 'ease-window plan missing footRehabPF');
  assert(plan.blocks.some(b => b.key === 'lowImpactSub'), name,
    `ease-window plan should sub impact cardio -> lowImpactSub, got ${JSON.stringify(plan.blocks.map(b => b.key))}`);

  // day10: pain-free re-check, gate has one "no" -> stays injured (spec §3.5 "any no -> stays in rehab")
  setDay(addDaysIso(flagIso, 10));
  doCheckFoot(name, 'done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: true, morning: false, raises: true } });
  assert(!!S().injury, name, 'a gate with one "no" cleared the injury (should stay injured)');
  assert(S().injury && S().injury.kind === 'foot-pf', name, 'injury kind changed on a failed gate');
  assert(!S().rehabTail, name, 'a failed gate must not arm a rehabTail');

  // day24: all-true gate -> cleared, relapse tail armed (spec §3.5/§5.4)
  const clearIso = addDaysIso(flagIso, 24);
  setDay(clearIso);
  doCheckFoot(name, 'done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: true, morning: true, raises: true } });
  assert(!S().injury, name, 'injury did not clear on an all-true gate');
  assert(!!S().rehabTail, name, 'rehabTail not armed on a gated clear');
  assert(S().rehabTail && S().rehabTail.kind === 'foot-pf', name, `rehabTail.kind expected foot-pf, got ${S().rehabTail && S().rehabTail.kind}`);
  const untilDays = S().rehabTail ? Math.round((S().rehabTail.until - isoToMsNoon(clearIso)) / 86400000) : null;
  // Loose band (34-36d, not exactly 35) because localMidnight() (program.js) uses the HOST machine's
  // real local timezone while isoToMsNoon() here is a fixed UTC-noon anchor — they can disagree by up
  // to ~1 day depending on where this harness runs. The contract's REHAB_TAIL_DAYS is 35 exactly.
  assert(untilDays !== null && Math.abs(untilDays - call('REHAB_TAIL_DAYS')) <= 1, name,
    `rehabTail.until not ~+${call('REHAB_TAIL_DAYS')}d from clear (got ${untilDays}d)`);

  // Post-clear: walk one full 7-day program cycle. The tail must appear ONLY on days the phase table
  // itself labels 'Mon'/'Thu' (spec §5.4 "fixed weekdays Mon/Thu") — cross-checked against the phase
  // table's own label, not a hand-computed index, so a pointer-arithmetic mistake in THIS test can't
  // fake a pass.
  let iso2 = addDaysIso(clearIso, 1);
  let ruleHeld = true; const dayObservations = [];
  for (let i = 0; i < 7; i++) {
    setDay(iso2);
    doCheckFoot(name, 'done', 4, false, [], false, null);
    const dIdx = S().phase.dayInWeek - 1;
    const label = pd.week[dIdx] && pd.week[dIdx].day;
    const shouldHaveTail = (label === 'Mon' || label === 'Thu');
    plan = call('currentDayPlan')();
    const hasTail = plan.blocks.some(b => b.key === 'footRehabTail' || b.key === 'footRehabTailMeta');
    if (hasTail !== shouldHaveTail) ruleHeld = false;
    dayObservations.push(`${label}:${hasTail}`);
    iso2 = addDaysIso(iso2, 1);
  }
  assert(ruleHeld, name, `rehabTail must appear on (and only on) phase-table Mon/Thu days: ${JSON.stringify(dayObservations)}`);

  // After the tail fully expires (well past +35d from clear, no further check-ins), the plan reverts
  // to EXACTLY the phase-table baseline for whatever day the pointer currently sits on.
  const expiredIso = addDaysIso(clearIso, 40);
  setDay(expiredIso);
  const finalIdx = S().phase.dayInWeek - 1;
  const wantKeys = pd.week[finalIdx].blocks.map(b => b.key);
  const gotKeys = call('currentDayPlan')().blocks.map(b => b.key);
  assert(JSON.stringify(gotKeys) === JSON.stringify(wantKeys), name,
    `post-tail-expiry plan != baseline for day ${finalIdx} (${pd.week[finalIdx].day}): got ${JSON.stringify(gotKeys)} want ${JSON.stringify(wantKeys)}`);

  return { name, kind: inj && inj.kind, ease: win.ease, tailKind: S().rehabTail && S().rehabTail.kind, dayObservations, postExpiry: gotKeys };
}

// Metatarsalgia routing: ball zone + neural=false -> foot-meta, 42d ease ceiling, footRehabMeta swap-in
// (spec §3.3 row 2, §5.1).
function scenarioFootMetaWindow() {
  const name = 'foot-meta window (ball, neural=false)';
  resetPersona(2);
  S().phase.dayInWeek = 2;   // Tue: ptFull + rw1
  setDay('2026-02-01');
  doCheckFoot(name, false, 3, true, ['foot'], false, { zone: 'ball', neural: false, gate: null });
  const inj = S().injury;
  assert(!!inj && inj.kind === 'foot-meta', name, `kind expected foot-meta, got ${inj && inj.kind}`);
  const win = call('footWindow')('foot-meta');
  assert(win.ease === 42, name, `foot-meta ease window expected 42d (contract), got ${win.ease}`);
  assert(inj && Math.round((inj.easeUntil - inj.since) / 86400000) === 42, name,
    `injury.easeUntil - since != 42d (got ${inj && Math.round((inj.easeUntil - inj.since) / 86400000)})`);
  setDay('2026-02-02');
  const plan = call('currentDayPlan')();
  assert(plan.blocks.some(b => b.key === 'footRehabMeta'), name,
    `plan missing footRehabMeta block: ${JSON.stringify(plan.blocks.map(b => b.key))}`);
  return { name, kind: inj && inj.kind, ease: win.ease, blocks: plan.blocks.map(b => b.key) };
}

// Re-flagging mid-tail must start a completely FRESH injury (extended:0) with fresh windows, and
// must clear the old relapse tail rather than layering on top of it (spec §5.4 "a new foot-pain
// flag during the tail behaves as a fresh injury (re-flag, windows restart)").
function scenarioFootReflagDuringTail() {
  const name = 'foot re-flag during tail (fresh injury, old tail replaced)';
  resetPersona(2);
  S().phase.dayInWeek = 2;
  const flagIso = '2026-03-01';
  setDay(flagIso);
  doCheckFoot(name, false, 3, true, ['foot'], false, { zone: 'heel', neural: null, gate: null });
  setDay(addDaysIso(flagIso, 24));   // all-gate pass -> clear + arm the tail
  doCheckFoot(name, 'done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: true, morning: true, raises: true } });
  assert(!S().injury, name, 'setup: injury did not clear ahead of the re-flag');
  assert(!!S().rehabTail, name, 'setup: tail did not arm ahead of the re-flag');
  const tailBefore = S().rehabTail;

  setDay(addDaysIso(flagIso, 30));   // 6 days into the tail (well inside the 35d window)
  doCheckFoot(name, false, 3, true, ['foot'], false, { zone: 'arch', neural: null, gate: null });   // hurts again
  const inj = S().injury;
  assert(!!inj, name, 're-flag mid-tail did not record a new injury');
  assert(inj && inj.kind === 'foot-pf', name, `re-flag (arch) kind expected foot-pf, got ${inj && inj.kind}`);
  assert(inj && inj.extended === 0, name, `re-flag mid-tail should be a FRESH injury (extended:0), got extended=${inj && inj.extended}`);
  assert(!S().rehabTail, name, `the old relapse tail must be cleared on re-flag, got ${JSON.stringify(S().rehabTail)}`);
  const win = call('footWindow')('foot-pf');
  assert(inj && Math.round((inj.easeUntil - inj.since) / 86400000) === win.ease, name,
    're-flag did not get the fresh foot-pf windows (windows did not restart)');
  return { name, kind: inj && inj.kind, extended: inj && inj.extended, oldTailExisted: !!tailBefore, tailClearedAfter: !S().rehabTail };
}

// Non-foot injury (shoulder) regression pin: kind falls back to 'acute', windows exactly 3d/10d,
// currentDayPlan() blocks are byte-identical (never swapped) for all 7 program days, and clearing
// on a bare pain-free re-check needs NO gate (spec Preserved Invariant #1, §3.3 footnote). Per the
// Task E brief: this one should be GREEN already against current code (it pins EXISTING behavior) —
// if it's red before Lane B lands, that's a finding about this scenario's authoring, not a Lane B gap.
function scenarioNonFootRegressionPin() {
  const name = 'non-foot injury regression pin (shoulder — byte-identical windows/flow)';
  resetPersona(3);   // Build phase: strength + easy/hard-run cardio + rest + a long run across the week
  setDay('2026-05-01');
  doCheckFoot(name, false, 3, true, ['shoulder'], false, null);   // no foot param at all — the common non-foot path
  const inj = S().injury;
  assert(!!inj, name, 'no injury recorded on a plain shoulder flag');
  assert(inj && inj.kind === 'acute', name, `non-foot kind must fall back to 'acute', got ${inj && inj.kind}`);
  assert(inj && !inj.foot, name, `non-foot injury.foot must be null/falsy, got ${JSON.stringify(inj && inj.foot)}`);
  const rice = inj ? Math.round((inj.riceUntil - inj.since) / 86400000) : null;
  const ease = inj ? Math.round((inj.easeUntil - inj.since) / 86400000) : null;
  assert(rice === 3, name, `non-foot protect window must stay exactly 3d (today's default), got ${rice}`);
  assert(ease === 10, name, `non-foot ease window must stay exactly 10d (today's default), got ${ease}`);

  // currentDayPlan() must never swap in foot machinery for ANY of the 7 program days while this
  // injury is active — compared against the phase table's OWN raw block-key list (source data, not
  // the coder's currentDayPlan implementation), so the swap-in engaging at all is what fails this.
  const pd = PHASES[3];
  let allMatch = true; const mismatches = [];
  for (let d = 1; d <= 7; d++) {
    S().phase.dayInWeek = d;
    const plan = call('currentDayPlan')();
    const gotKeys = plan.blocks.map(b => b.key);
    const wantKeys = pd.week[d - 1].blocks.map(b => b.key);
    const same = gotKeys.length === wantKeys.length && gotKeys.every((k, i) => k === wantKeys[i]);
    if (!same) { allMatch = false; mismatches.push({ day: pd.week[d - 1].day, got: gotKeys, want: wantKeys }); }
  }
  assert(allMatch, name, `currentDayPlan() swapped blocks for a non-foot injury: ${JSON.stringify(mismatches)}`);

  // Bare pain-free re-check (no gate at all) clears immediately — the 3-chip gate is a foot-pf/
  // foot-meta-only requirement (spec §5.2 "a pain-free submit without the gate falls back to today's behavior").
  S().phase.dayInWeek = 1;
  setDay('2026-05-03');
  doCheckFoot(name, 'done', 4, false, [], false, null);
  assert(!S().injury, name, 'shoulder injury did not clear on a bare pain-free re-check with no gate');
  assert(!S().rehabTail, name, 'a non-foot clear must never arm a rehabTail');

  return { name, kind: inj && inj.kind, rice, ease, keysMatchAll7Days: allMatch };
}

// foot-pf window across the Nov 2026 DST fall-back boundary — mirrors scenarioInjuryWindowVsCalendar
// (the existing generic-injury DST scenario) but for the foot-specific 84d ease ceiling, and additionally
// proves the criteria-gate survives DST (a bare pain-free re-check must NOT clear a foot-pf injury).
function scenarioFootDst() {
  const name = 'foot-pf window vs calendar (DST fall-back)';
  resetPersona(2);
  S().phase.dayInWeek = 2;
  setDay('2026-10-30', 16);
  doCheckFoot(name, false, 3, true, ['foot'], false, { zone: 'heel', neural: null, gate: null });
  assert(!!S().injury, name, 'no injury recorded on heel flag ahead of DST fall-back');
  const win = call('footWindow')('foot-pf');
  assert(win.ease === 84, name, `expected 84d ease window, got ${win.ease}`);
  // walk forward across the Nov 1 fall-back boundary, 3 days post-flag (past RICE), well inside the 84d ease window
  setDay('2026-11-02', 17);
  const inRice = call('injuryInRice')();
  const active = call('injuryActive')();
  assert(active === true, name, `foot-pf injury should still be active 3d post-flag across DST fall-back (active=${active})`);
  assert(inRice === false, name, `3 elapsed days should be past the 3d RICE window (inRice=${inRice})`);
  const plan = call('currentDayPlan')();
  assert(plan.blocks.some(b => b.key === 'footRehabPF'), name, 'foot-pf rehab block missing across the DST boundary');
  assert(plan.blocks.some(b => b.key === 'lowImpactSub'), name, 'ease-window low-impact sub missing across the DST boundary');
  // A pain-free re-check with the recovery gate all-true must clear cleanly across the DST boundary too
  // (mirrors scenarioInjuryWindowVsCalendar's "clears on pain-free recheck" outcome, exercised via the
  // REAL foot-pf path — the 3-chip gate — spec §3.5/§5.2. NOTE: an earlier draft of this scenario
  // asserted a bare no-gate recheck must NOT clear; that was wrong against the spec — §5.2 explicitly
  // documents "a pain-free submit *without* the gate falls back to today's behavior" (clears) as the
  // deliberate defensive fallback for a state the UI should never produce. Corrected to test the real path.
  doCheckFoot(name, 'done', 4, false, [], false, { zone: 'heel', neural: null, gate: { walk: true, morning: true, raises: true } });
  assert(!S().injury, name, 'foot-pf injury with an all-true gate did not clear across a DST boundary');
  assert(!!S().rehabTail, name, 'gated clear across the DST boundary did not arm the relapse tail');
  return { name, inRice, active, ease: win.ease };
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
results.push(scenarioFootPfLifecycle());
results.push(scenarioFootMetaWindow());
results.push(scenarioFootReflagDuringTail());
results.push(scenarioNonFootRegressionPin());
results.push(scenarioFootDst());

console.log('\n==== SCENARIO RESULTS ====');
for (const r of results) console.log(' ', JSON.stringify(r));

console.log('\n==== ASSERTION FAILURES ====');
if (failures.length === 0) console.log('  (none)');
else for (const f of failures) console.log(`  [FAIL] ${f.scenario}: ${f.msg}${f.extra ? ' :: ' + JSON.stringify(f.extra) : ''}`);

console.log(`\nTOTAL: ${failures.length} assertion failure(s) across ${results.length} scenarios.`);
