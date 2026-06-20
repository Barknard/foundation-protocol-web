'use strict';
// ============================================================
// PHASE + EXERCISE DEFINITIONS (carried from PDF)
// ============================================================
const BLOCKS = {
  ptFull:   { kind: 'mobility',  label: 'PT • 10 min',       title: 'Neuromuscular + Hip', detail: 'Balance • Hip • Tibialis • Calf' },
  ptLight:  { kind: 'mobility',  label: 'PT • 8 min',        title: 'Quick mobility',      detail: 'Hips + ankles • Optional' },
  walk30:   { kind: 'cardio',    label: 'Easy • 30 min',       title: 'Walk, conversational', detail: 'Talk-test pace' },
  walk40:   { kind: 'cardio',    label: 'Easy • 40 min',       title: 'Walk, conversational', detail: 'Small hills if available' },
  walk45:   { kind: 'cardio',    label: 'Easy • 45 min',       title: 'Walk, conversational', detail: 'Full sentences while walking' },
  walk60:   { kind: 'cardio',    label: 'Easy • 60 min',       title: 'Long walk',           detail: 'Mixed terrain' },
  rest:     { kind: 'rest',      label: 'Rest',              title: 'Full recovery',       detail: 'Sleep 7+ • Hydrate' },
  strA:     { kind: 'strength',  label: 'Strength • 35',     title: 'Day A — Push / Squat', detail: 'Goblet sq • Pushup • Row • Plank' },
  strB:     { kind: 'strength',  label: 'Strength • 35',     title: 'Day B — Hinge / Press', detail: 'RDL • OH press • Split sq • Plank' },
  rw1:      { kind: 'cardio',    label: 'Run-walk • 30',     title: '1 min run / 4 min walk', detail: '5 rounds • Stop if shin pain' },
  rw2:      { kind: 'cardio',    label: 'Run-walk • 35',     title: '2 min run / 3 min walk', detail: '5 rounds • Build gradually' },
  rw3:      { kind: 'cardio',    label: 'Run-walk • 40',     title: '3 min run / 2 min walk', detail: 'Form check at mile 1' },
  easyRun:  { kind: 'cardio',    label: 'Easy run • 30',     title: 'Continuous easy',        detail: 'Talk-test • HR priority' },
  longRun:  { kind: 'cardio',    label: 'Long run • 45',     title: 'Easy, continuous',        detail: 'Cap at +10% vs 30-day longest' },
  tempo:    { kind: 'cardio',    label: 'Intervals • 35',    title: '4 × 4 min hard / 3 min easy', detail: 'Max 20% of weekly volume' },
  opmAm:    { kind: 'strength',  label: 'Strength • AM',     title: 'Quality strength sets', detail: 'RIR 2-3 · 2–3 hard sets, stop shy of failure' },
  opmCore:  { kind: 'strength',  label: 'Core • PM',         title: 'Plank + carries',      detail: 'Anti-extension core' },
  loaded:   { kind: 'strength',  label: 'Loaded • 45',       title: 'Barbell / DB progression', detail: 'Switch from bodyweight stim' },
  longRun10k:{ kind: 'cardio',   label: 'Long run • 60+',    title: 'Building to 10K',      detail: 'Cap vs 30-day longest' },
  hooper:   { kind: 'milestone', label: 'Check-in',          title: 'Weekly review',        detail: 'Reflect on the week' },
};
function day(name, blocks) { return { day: name, blocks: blocks.map(k => ({ ...BLOCKS[k], key: k })) }; }

const PHASES = [
  {
    index: 0, name: 'Infrastructure', weeks: 'Weeks 1 – 4', totalWeeks: 4,
    summary: 'No training stress. Build the support system. Walking, daily PT, protein dialed in, baseline measurements logged.',
    focus: ['Walk daily, build to 60 min on Saturday', 'PT every morning, no skipped days', 'Protein 1.6 g/kg per day', 'Sunday review'],
    exit:  ['Walk 60 min comfortably', '30 sec single-leg eyes closed', '160 g/day protein consistent'],
    week: [ day('Mon',['ptFull','walk30']), day('Tue',['ptFull','rest']), day('Wed',['ptFull','walk30']),
            day('Thu',['ptLight','rest']), day('Fri',['ptFull','walk30']), day('Sat',['ptFull','walk40']),
            day('Sun',['ptLight','hooper']) ],
  },
  {
    index: 1, name: 'Foundation', weeks: 'Weeks 5 – 12', totalWeeks: 8,
    summary: 'Strength enters the system. Two full-body sessions per week, alternating Day A (push/squat) and Day B (hinge/press). easy, conversational-pace walking builds toward 60 minutes. Daily PT continues.',
    focus: ['Strength 2× weekly, Day A and Day B', 'Easy walks 3 – 4× weekly', 'Daily 10-min PT', 'Sunday review'],
    exit:  ['Single-leg glute bridge × 10 each side', 'Pushup with knees off the floor', 'Walk 75 min comfortably'],
    week: [ day('Mon',['ptFull','strA']), day('Tue',['ptFull','walk45']), day('Wed',['ptFull','strB']),
            day('Thu',['ptFull','walk45']), day('Fri',['ptLight','rest']), day('Sat',['ptFull','walk60']),
            day('Sun',['ptLight','hooper']) ],
  },
  {
    index: 2, name: 'Run Introduction', weeks: 'Weeks 13 – 24', totalWeeks: 12,
    summary: 'Run-walk intervals begin, 2× weekly, starting at 1 min run / 4 min walk × 5 rounds. Single-session cap: never run more than +10% over your longest run in the past 30 days. Eccentric calf protocol enters.',
    focus: ['Run-walk 2× weekly, non-consecutive days', 'Strength 2× weekly continues', '+10% rule: cap vs 30-day longest', 'Sunday review'],
    exit:  ['Run 5 min continuous × 5 rounds', 'No morning shin tenderness for 7 days', '5K total run-walk distance'],
    week: [ day('Mon',['ptFull','strA']), day('Tue',['ptFull','rw1']), day('Wed',['ptFull','strB']),
            day('Thu',['ptFull','walk45']), day('Fri',['ptLight','rest']), day('Sat',['ptFull','rw2']),
            day('Sun',['ptLight','hooper']) ],
  },
  {
    index: 3, name: 'Build', weeks: 'Weeks 25 – 40', totalWeeks: 16,
    summary: 'Continuous running becomes possible. Three running sessions per week: two easy, one harder. Polarized 80/20 distribution. Strength can move to 3× weekly.',
    focus: ['3 runs weekly: 2 easy, 1 hard', '80% easy / 20% hard distribution', 'Strength can move to 3× weekly', 'Sunday review'],
    exit:  ['5K continuous run at conversational pace', '50 pushups in one unbroken set', 'Resting HR down 5 – 10 bpm'],
    week: [ day('Mon',['ptFull','strA']), day('Tue',['ptLight','easyRun']), day('Wed',['ptFull','strB']),
            day('Thu',['ptLight','rw3']), day('Fri',['ptFull','rest']), day('Sat',['ptLight','longRun']),
            day('Sun',['ptLight','hooper']) ],
  },
  {
    index: 4, name: 'Target', weeks: 'Weeks 41+', totalWeeks: 99,
    summary: 'Build toward THE capstone — 10K run + 100 pushups + 100 situps + 100 squats, completed in a single session. You get there with quality strength sets (RIR 2-3), a little power, and the 10K build — not by grinding hundreds of reps every day, which raises injury risk at 40+ for no extra gain.',
    focus: ['Train the capstone movements with quality sets, not daily max volume', '4 runs weekly: 2 easy, 1 tempo, 1 long — building to 10K', 'Strength + a little power 2-3× weekly', '+10% session cap and the lighter week still apply'],
    exit:  ['THE CAPSTONE: 10K run + 100 pushups + 100 situps + 100 squats in one session', '10K continuous run under ~60 minutes', 'Strength + power held with a deload every ~5 weeks'],
    week: [ day('Mon',['opmAm','loaded']), day('Tue',['opmCore','easyRun']), day('Wed',['opmAm','loaded']),
            day('Thu',['opmCore','tempo']), day('Fri',['opmAm','rest']), day('Sat',['ptFull','longRun10k']),
            day('Sun',['opmCore','hooper']) ],
  },
];

const EXERCISES = [
  { key:'sl_stance', name:'Single-Leg Stance', rx:'3 × 45 sec each', icon:'ic-sl-stance', cat:'Neuromuscular',
    steps:['Stand tall on one foot, knee lifted to hip height.','Fix gaze on a point ahead at eye level.','Hips level, ribs stacked, ankle relaxed.','Progress to eyes closed at week 3, then to a folded towel.'],
    cue:'If you are rock-solid, eyes closed or step onto a folded towel.' },
  { key:'sl_squat', name:'Single-Leg Mini-Squat', rx:'3 × 10 each', icon:'ic-sl-squat', cat:'Neuromuscular',
    steps:['Start from single-leg stance.','Bend the standing knee to about 30 degrees.','Knee tracks over middle toe.','Stop the set when the knee caves inward.'],
    cue:'When the knee caves inward, the hip is fatigued.' },
  { key:'sl_hop', name:'Single-Leg Hop', rx:'3 × 6 each', icon:'ic-sl-hop', cat:'Neuromuscular',
    steps:['Phase 1 onward only.','Hop forward 30 – 60 cm, land on the same leg.','Stick the landing for 2 full seconds.','Reset to upright before the next rep.'],
    cue:'Quality landing beats height or distance.' },
  { key:'hip_abd', name:'Side-Lying Hip Abduction', rx:'3 × 12 each', icon:'ic-hip-abd', cat:'Hip',
    steps:['Lie on side, top leg straight and stacked.','Lift the top leg toward the ceiling, toes forward.','Pause at the top, lower over 2 – 3 seconds.','Pelvis stays still — do not roll back.'],
    cue:'Smaller range, cleaner reps.' },
  { key:'glute_bridge', name:'Glute Bridge', rx:'3 × 12', icon:'ic-glute-bridge', cat:'Hip',
    steps:['Lie on back, knees bent, feet flat hip-width.','Drive through heels, lift hips, squeeze glutes.','Body forms one line knees-hips-shoulders.','Phase 1: progress to single-leg by extending one leg.'],
    cue:'Feel it in the glutes, not the lower back.' },
  { key:'band_walk', name:'Lateral Band Walk', rx:'3 × 10 each', icon:'ic-band-walk', cat:'Hip',
    steps:['Band around knees or ankles, athletic stance.','Step sideways, knees pushed out against band.','Maintain band tension throughout.','10 steps one direction then reverse.'],
    cue:'If knees buckle inward, the band is too heavy.' },
  { key:'calf_raise', name:'Calf Raise', rx:'3 × 15', icon:'ic-calf-raise', cat:'Shin',
    steps:['Stand on flat floor or stair edge.','Rise high on toes.','Hold 1 second at top.','Lower over 3 full seconds.'],
    cue:'The slow descent is the point. Do not rush.' },
  { key:'sl_calf_raise', name:'Single-Leg Calf Raise', rx:'3 × 10 each', icon:'ic-sl-calf-raise', cat:'Shin',
    steps:['Phase 2 progression only.','One leg, hand on wall for balance.','Rise high on working foot, pause 1 sec.','Lower over 3 seconds.'],
    cue:'Running is single-leg impacts. Train single-leg.' },
  { key:'calf_stretch', name:'Calf Stretch', rx:'2 × 30 sec each', icon:'ic-calf-stretch', cat:'Shin',
    steps:["Arm's length from wall, hands flat at shoulder height.",'Step one leg back about 60 cm.','Lean forward, back knee straight.','Hold 30 sec. Bend back knee for second set (soleus).'],
    cue:'Tight calves transmit impact straight to the shin.' },
  { key:'goblet_sq', name:'Goblet Squat', rx:'3 × 8 – 12', icon:'ic-goblet-sq', cat:'Day A',
    steps:['Hold dumbbell vertically at chest.','Feet shoulder-width, toes slightly out.','Sit down and back, knees track middle toes.','Drive up through heels, torso upright.'],
    cue:'If heels lift, improve ankle mobility separately.' },
  { key:'pushup', name:'Pushup', rx:'3 × 6 – 12', icon:'ic-pushup', cat:'Day A',
    steps:['Start at incline if needed: counter, bench, box.','Hands slightly wider than shoulders.','Lower chest to within an inch of surface.','Elbows back at ~45 degrees, not flared.'],
    cue:'Sagging hips means abs disengaged. Squeeze glutes.' },
  { key:'db_row', name:'Single-Arm DB Row', rx:'3 × 10 each', icon:'ic-db-row', cat:'Day A',
    steps:['One knee and same-side hand on bench.','Other foot flat, dumbbell hangs straight.','Pull elbow back toward hip, squeeze shoulder blade.','Lower with control over 2 – 3 seconds.'],
    cue:'Pull with the back, not the arm.' },
  { key:'plank', name:'Plank Hold', rx:'3 × 30 – 60 sec', icon:'ic-plank', cat:'Day A',
    steps:['Forearms under shoulders, elbows aligned.','Hips in line with shoulders and ankles.','Squeeze glutes, ribs stacked over hips.','Hold for time, stop when form drops.'],
    cue:'30 seconds perfect beats 90 seconds leaky.' },
  { key:'rdl', name:'Romanian Deadlift, DB', rx:'3 × 8 – 12', icon:'ic-rdl', cat:'Day B',
    steps:['Stand hip-width, dumbbells in front of thighs.','Hinge from hips, push them backward.','Dumbbells travel close to legs.','Drive hips forward to stand, squeeze glutes at top.'],
    cue:'If you feel it in the lower back, you are bending the spine.' },
  { key:'oh_press', name:'Overhead Press, DB', rx:'3 × 8 – 10', icon:'ic-oh-press', cat:'Day B',
    steps:['Stand tall, dumbbells at shoulder height.','Brace core, ribs down, glutes squeezed.','Press straight up overhead.','Biceps align with ears at top.'],
    cue:'If you cannot press without leaning back, drop the weight.' },
  { key:'split_sq', name:'Bulgarian Split Squat', rx:'3 × 8 each', icon:'ic-split-sq', cat:'Day B',
    steps:['Rear foot on bench, laces down.','Front foot far enough forward to track over mid-foot.','~70 percent of bodyweight on front leg.','Drive through front heel to stand.'],
    cue:'Start bodyweight. Add DBs only after 8 clean per leg.' },
  { key:'dead_bug', name:'Dead Bug', rx:'2 × 6 each, slow', icon:'ic-dead-bug', cat:'Mobility',
    steps:['On back, arms up over shoulders, knees over hips.','Press lower back gently flat against the floor.','Slowly reach opposite arm and leg away, breathing out.','Return with control. Easy and slow — a mobilizer, not a grind.'],
    cue:'A gentle spine mobilizer. Keep it slow and pain-free.' },
  { key:'walk', name:'Easy Walk', rx:'30 – 60 min', icon:'ic-walking', cat:'Cardio',
    steps:['Conversational pace. Full sentences while moving.','Talk test is the only intensity gauge needed.','Mixed terrain when ready.'],
    cue:'If you cannot finish a sentence, you are over pace.' },
  { key:'run', name:'Easy Run', rx:'30 – 60 min', icon:'ic-running', cat:'Cardio',
    steps:['Easy, conversational pace — you can talk in full sentences.','HR over pace as the priority.','+10% rule: never more than 110% of 30-day longest.'],
    cue:'Easy runs feel suspiciously slow. That is the point.' },
  { key:'kb_swing', name:'Kettlebell Swing', rx:'3 × 12 – 15', icon:'ic-kb-swing', cat:'Kettlebell',
    steps:['Hinge at the hips (not a squat) — push hips back, soft knees.','Hike the bell back between your legs, then snap hips forward to float it to chest height.','Arms stay relaxed — hips do the work, not shoulders.','Start ~15 lb; go up (20, 25) as it feels easy. Stop if your low back rounds.'],
    cue:'It is a hip snap, not a lift. Glutes finish the swing.' },
  { key:'kb_carry', name:'Farmer Carry', rx:'3 × 30 – 40 sec', icon:'ic-kb-carry', cat:'Kettlebell',
    steps:['A kettlebell in each hand, arms straight, shoulders down and back.','Stand tall, ribs down, brace, and walk slow and even.','Start ~20 – 25 lb per hand; lighter if grip or posture slips.','Builds grip, core, and tall posture — straight carryover to running.'],
    cue:'Walk like a book is balanced on your head — tall and steady.' },
];

// Maps each session block to the library exercises it contains (Today tap-to-reveal)
const BLOCK_EX = {
  ptFull:  ['sl_stance','hip_abd','glute_bridge','band_walk','calf_raise','calf_stretch'],
  ptLight: ['sl_stance','hip_abd','calf_stretch','dead_bug'],
  walk30:  ['walk'], walk40: ['walk'], walk45: ['walk'], walk60: ['walk'],
  strA:    ['goblet_sq','pushup','db_row','plank'],
  strB:    ['rdl','oh_press','split_sq','kb_swing','plank'],
  rw1:     ['run','walk'], rw2: ['run','walk'], rw3: ['run','walk'],
  easyRun: ['run'], longRun: ['run'], tempo: ['run'], longRun10k: ['run'],
  opmAm:   ['pushup','goblet_sq','kb_swing'], opmCore: ['plank','kb_carry'],
  loaded:  ['goblet_sq','rdl','oh_press'],
  rest:    [], hooper: [],
};
function exercisesForBlock(key) { return (BLOCK_EX[key] || []).map(k => EXERCISES.find(e => e.key === k)).filter(Boolean); }

// ---- Per-day exercise completion (workout flow) ----
function ensureSession() { const d = isoToday(); if (!state.session || state.session.date !== d) state.session = { date: d, done: {} }; return state.session; }
function todayExerciseKeys() { const ks = []; currentDayPlan().blocks.forEach(b => exercisesForBlock(b.key).forEach(ex => { if (!ks.includes(ex.key)) ks.push(ex.key); })); return ks; }
function exDone(key) { return !!(state.session && state.session.done && state.session.done[key]); }
function toggleEx(key) { ensureSession(); if (state.session.done[key]) delete state.session.done[key]; else state.session.done[key] = true; saveLocal(); }
function markBlockDone(blockKey) { ensureSession(); exercisesForBlock(blockKey).forEach(ex => { state.session.done[ex.key] = true; }); saveLocal(); }
function sessionCounts() { ensureSession(); const ks = todayExerciseKeys(); return { done: ks.filter(k => state.session.done[k]).length, total: ks.length }; }

// ---- Time-aware detraining / layoff (evidence: tendon de-adapts ~2mo; run restarts more conservatively than strength) ----
// excludeToday: ignore a row already logged for today, so a same-day edit can't collapse the gap to 0 (the return-from-layoff ease-back must survive editing today's check).
function lastCheckDate(excludeToday) { const t = excludeToday ? isoToday() : null; for (let i = state.checks.length - 1; i >= 0; i--) { const c = state.checks[i]; if (c && c.date && c.date !== t) return c.date; } return null; }
// Whole-calendar-day math (midnight-to-midnight) so the 15/29/57-day tier boundaries don't jitter with time-of-day or DST.
function daysSinceLastCheck(excludeToday) { const d = lastCheckDate(excludeToday); if (!d) return 0; const a = new Date(d + 'T00:00:00').getTime(), b = new Date(isoToday() + 'T00:00:00').getTime(); return Math.max(0, Math.round((b - a) / 86400000)); }
function layoffTier(gap) {
  const g = (gap == null) ? daysSinceLastCheck() : gap;
  if (g < 15) return null;
  if (g < 29) return { gap: g, level: 1, pct: 85, title: 'Welcome back', msg: `${g} days off. Ease in: ~15% lighter today, rebuild over a week. Hold running at your last tolerated run-walk, not your best.` };
  if (g < 57) return { gap: g, level: 2, pct: 70, title: 'Easing back in', msg: `${g} days off (~1-2 months). Start ~30% lighter, higher reps, +10%/week. Running throttles back to early run-walk intervals — tendons de-adapt faster than your heart and muscle.` };
  return { gap: g, level: 3, pct: 60, title: 'Restart, smartly', msg: `${g}+ days off. Start ~40% lighter and rebuild running from the run-walk start, regardless of your old level. Muscle memory means it comes back much faster the second time.` };
}

// ---- Deload (evidence: lighter week every ~4-6 weeks; or early on under-recovery trend) ----
function underRecoveryTrend() {
  const recent = state.checks.slice(-7);
  if (recent.length < 5) return false;
  // 'repeat' just means "held steady / not fully completed" — not under-recovery — so it must NOT count here,
  // or steady training at feel 3 would trip a spurious deload. Also EXCLUDE injury (hurt) entries: an acute
  // injury is its own regime, and a re-flagged injury writes decision:'rest' which would otherwise self-trip
  // the trend. Count only genuine slow-fatigue/distress signals from non-injury days.
  const flags = recent.filter(c => !c.hurt && (c.feel <= 2 || c.decision === 'modify' || c.decision === 'rest')).length;
  return flags >= 3;
}
// Cumulative program week (sums all completed phases) so the deload cadence is CONTINUOUS, not reset to 1 at
// every phase boundary (which previously opened ~9-week gaps across phase seams).
function globalWeek() { const ph = state.phase?.phase ?? 0; let w = state.phase?.week ?? 1; for (let i = 0; i < ph; i++) w += PHASES[i].totalWeeks; return w; }
// A scheduled lighter week every ~5 weeks of LOADED training (Phase 1+; Phase 0 carries no training load).
function isDeloadWeek() { const ph = state.phase?.phase ?? 0; if (ph < 1) return false; const loadedWk = globalWeek() - PHASES[0].totalWeeks; return loadedWk > 0 && loadedWk % 5 === 0; }
// Suppressed during an active injury — acute-injury management is a separate regime from slow-fatigue deload.
function deloadActive() { return !injuryActive() && (isDeloadWeek() || underRecoveryTrend()); }

// ---- Injury (PEACE & LOVE / overuse loading; red-flag screen) ----
const BODY_PARTS = ['neck','shoulder','upper back','lower back','elbow','wrist','hip','groin','glute','quad','hamstring','knee','shin','calf','ankle','foot'];
function injuryEnd(inj) { return (inj && inj.easeUntil) || (inj ? inj.since + 10 * 86400000 : 0); }   // overall recovery-window end
function injuryActive() { return !!(state.injury && !state.injury.clearedAt && Date.now() <= injuryEnd(state.injury)); }   // false once out of range
function injuryInRice() { return injuryActive() && state.injury.riceUntil && Date.now() < state.injury.riceUntil; }
function clearInjury() { if (state.injury) { state.injury.clearedAt = Date.now(); } state.injury = null; saveLocal(); }
// Auto-expire a stale injury whose recovery window has fully elapsed (out of range → exclude it).
function pruneInjury() {
  if (state.injury && !state.injury.clearedAt && Date.now() > injuryEnd(state.injury)) {
    logEvent('injury', `Recovery window ended (${fmtDate(state.injury.since)}–${fmtDate(injuryEnd(state.injury))}) — back to normal training`);
    clearInjury();
  }
}
// A call that persists across the days it covers, bounded by explicit start/end dates.
function standingCall() {
  if (!injuryActive()) return null;
  const inj = state.injury, since = inj.since || Date.now(), D = 86400000;
  const days = Math.max(1, Math.round((inj.riceUntil - since) / D));
  const dayNum = Math.min(days, Math.floor((Date.now() - since) / D) + 1);
  const parts = (inj.parts || []).join(', ') || 'injury';
  const ext = inj.extended ? ` · extended ×${inj.extended}` : '';
  if (injuryInRice()) return { cls: 'strength', label: `Recovering · ${parts} · day ${dayNum} of ${days}${ext}`, title: 'Rest & protect', action: `Protect &amp; gently load the area — keep moving everything that does not hurt (PEACE &amp; LOVE). Protect window through ${fmtDate(inj.riceUntil)}.` };
  return { cls: 'milestone', label: `Recovering · ${parts} · easing back${ext}`, title: 'Ease back in', action: `Pain-monitored loading — keep pain at or under ~3–5/10 and gone by next morning. Re-check by ${fmtDate(injuryEnd(inj))}.` };
}

// ---- Graded return ramp (after a layoff) + unified load reduction ----
// A layoff arms a ramp (set in applyCheck); while it is active the prescription is shown lighter and rebuilds
// to baseline over the tier's window — a graded return, not a single eased day, then auto-expires.
function returnRampActive() { if (state.returnRamp && Date.now() >= state.returnRamp.until) state.returnRamp = null; return !!state.returnRamp; }
// The single source of truth for "should today's prescription be lighter, and why" — injury > layoff-ramp > deload.
function loadReduction() {
  if (injuryActive()) return injuryInRice()
    ? { reason: 'injury', pct: 0,  note: 'Protect — offload the painful movement; keep pain-free movement going (PEACE & LOVE)' }
    : { reason: 'injury', pct: 50, note: 'Pain-monitored ease-back — keep pain ≤ ~3–5/10 and gone by next morning' };
  if (returnRampActive()) { const r = state.returnRamp, left = Math.max(1, Math.ceil((r.until - Date.now()) / 86400000)); return { reason: 'layoff', pct: r.pct, note: `Easing back from time off — about ${r.pct}% of normal load, rebuild over ~${left} more day${left > 1 ? 's' : ''}` }; }
  if (deloadActive()) return { reason: 'deload', pct: 60, note: 'Lighter week — about 2 working sets, ~40% less volume; keep cardio easy' };
  return null;
}
// Lighten a loaded (strength/cardio) block with the active reduction note; mobility/rest unchanged.
function lightenBlock(b, lr) { return (b.kind === 'strength' || b.kind === 'cardio') ? Object.assign({}, b, { deload: true, detail: (b.detail ? b.detail + ' · ' : '') + lr.note }) : b; }

// ---- Audit / activity log ----
function logEvent(type, text) {
  if (!state.log) state.log = [];
  state.log.push({ ts: Date.now(), type, text });
  if (state.log.length > 500) state.log = state.log.slice(-500);
  saveLocal();
}
function fmtLogTime(ts) {
  try { return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch (_) { return ''; }
}
function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch (_) { return ''; }
}
// Animation frames per exercise (frame A = base icon, frame B = authored complementary pose)
const FRAMES = {
  'ic-sl-stance': ['ic-sl-stance','ic-sl-stance-2'],
  'ic-sl-squat': ['ic-sl-squat','ic-sl-squat-2'],
  'ic-sl-hop': ['ic-sl-hop','ic-sl-hop-2'],
  'ic-hip-abd': ['ic-hip-abd','ic-hip-abd-2'],
  'ic-glute-bridge': ['ic-glute-bridge','ic-glute-bridge-2'],
  'ic-band-walk': ['ic-band-walk','ic-band-walk-2'],
  'ic-calf-raise': ['ic-calf-raise','ic-calf-raise-2'],
  'ic-sl-calf-raise': ['ic-sl-calf-raise','ic-sl-calf-raise-2'],
  'ic-calf-stretch': ['ic-calf-stretch','ic-calf-stretch-2'],
  'ic-goblet-sq': ['ic-goblet-sq','ic-goblet-sq-2'],
  'ic-pushup': ['ic-pushup','ic-pushup-2'],
  'ic-db-row': ['ic-db-row','ic-db-row-2'],
  'ic-plank': ['ic-plank','ic-plank-2'],
  'ic-rdl': ['ic-rdl','ic-rdl-2'],
  'ic-oh-press': ['ic-oh-press','ic-oh-press-2'],
  'ic-split-sq': ['ic-split-sq','ic-split-sq-2'],
  'ic-dead-bug': ['ic-dead-bug','ic-dead-bug-2'],
  'ic-walking': ['ic-walking-1','ic-walking-2','ic-walking-3','ic-walking-4'],
  'ic-running': ['ic-running-1','ic-running-2','ic-running-3','ic-running-4'],
  'ic-kb-swing': ['ic-kb-swing','ic-kb-swing-2'],
  'ic-kb-carry': ['ic-kb-carry','ic-kb-carry-2'],
};
EXERCISES.forEach(e => { e.frames = FRAMES[e.icon] || [e.icon]; });

