'use strict';
// ============================================================
// PHASE + EXERCISE DEFINITIONS (carried from PDF)
// ============================================================
const BLOCKS = {
  ptFull:   { kind: 'mobility',  label: 'PT • 10 min',       title: 'Neuromuscular + Hip', detail: 'Balance • Hip • Shin • Calf' },
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
  // --- Foot rehab (2026-08-17 foot-pain-rehab plan, Task B) — swapped into the day plan by currentDayPlan()
  //     (engine.js) only while a foot-pf/foot-meta injury or its relapse-prevention tail is active. Names are
  //     the ones pinned in the plan; do not rename. ---
  footRehabPF:   { kind: 'mobility', label: 'Foot rehab • 12 min', title: 'Plantar Heel Rehab',       detail: 'Heel raise • Fascia stretch • Calf • Foot core' },
  footRehabMeta: { kind: 'mobility', label: 'Foot rehab • 8 min',  title: 'Forefoot Rehab',           detail: 'Calf • Foot core' },
  footRehabTail: { kind: 'mobility', label: 'Foot upkeep • 6 min', title: 'Foot Relapse-Prevention',  detail: 'Key exercise • Calf' },
  lowImpactSub:  { kind: 'cardio',   label: 'Low-impact • 25 min', title: 'Low-Impact Cardio',        detail: 'Brisk walk (bike/swim if you have them)' },
};
function day(name, blocks) { return { day: name, blocks: blocks.map(k => ({ ...BLOCKS[k], key: k })) }; }
// Impact-cardio block keys (running) — enumerated explicitly so currentDayPlan()'s foot-rehab swap-in can match
// on the key list rather than sniffing block.title/label text (plan Task B). Walking cardio (walk30/40/45/60)
// and lowImpactSub itself are deliberately excluded — they are already low/no-impact.
const RUN_BLOCK_KEYS = ['rw1', 'rw2', 'rw3', 'easyRun', 'longRun', 'tempo', 'longRun10k'];

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
    summary: 'Build toward THE capstone — 10K run + 100 pushups + a 2-minute plank + 100 squats, completed in a single session. You get there with quality strength sets (RIR 2-3), a little power, and the 10K build — not by grinding hundreds of reps every day, which raises injury risk at 40+ for no extra gain.',
    focus: ['Train the capstone movements with quality sets, not daily max volume', '4 runs weekly: 2 easy, 1 tempo, 1 long — building to 10K', 'Strength + a little power 2-3× weekly', '+10% session cap and the lighter week still apply'],
    exit:  ['THE CAPSTONE: 10K run + 100 pushups + a 2-minute plank + 100 squats in one session', '10K continuous run under ~60 minutes', 'Strength + power held with a deload every ~5 weeks'],
    week: [ day('Mon',['opmAm','loaded']), day('Tue',['opmCore','easyRun']), day('Wed',['opmAm','loaded']),
            day('Thu',['opmCore','tempo']), day('Fri',['opmAm','rest']), day('Sat',['ptFull','longRun10k']),
            day('Sun',['opmCore','hooper']) ],
  },
];

const EXERCISES = [
  { key:'sl_stance', name:'Single-Leg Stance', rx:'3 × 45 sec each', cat:'Neuromuscular',
    steps:['Stand tall on one foot, knee lifted to hip height.','Fix gaze on a point ahead at eye level.','Hips level, ribs stacked, ankle relaxed.','Progress to eyes closed at week 3, then to a folded towel.'],
    cue:'If you are rock-solid, eyes closed or step onto a folded towel.' },
  { key:'sl_squat', name:'Single-Leg Mini-Squat', rx:'3 × 10 each', cat:'Neuromuscular',
    steps:['Start from single-leg stance.','Bend the standing knee to about 30 degrees.','Knee tracks over middle toe.','Stop the set when the knee caves inward.'],
    cue:'When the knee caves inward, the hip is fatigued.' },
  { key:'sl_hop', name:'Single-Leg Hop', rx:'3 × 6 each', cat:'Neuromuscular',
    steps:['Phase 1 onward only.','Hop forward 30 – 60 cm, land on the same leg.','Stick the landing for 2 full seconds.','Reset to upright before the next rep.'],
    cue:'Quality landing beats height or distance.' },
  { key:'hip_abd', name:'Side-Lying Hip Abduction', rx:'3 × 12 each', cat:'Hip',
    steps:['Lie on side, top leg straight and stacked.','Lift the top leg toward the ceiling, toes forward.','Pause at the top, lower over 2 – 3 seconds.','Pelvis stays still — do not roll back.'],
    cue:'Smaller range, cleaner reps.' },
  { key:'glute_bridge', name:'Glute Bridge', rx:'3 × 12', cat:'Hip',
    steps:['Lie on back, knees bent, feet flat hip-width.','Drive through heels, lift hips, squeeze glutes.','Body forms one line knees-hips-shoulders.','Phase 1: progress to single-leg by extending one leg.'],
    cue:'Feel it in the glutes, not the lower back.' },
  { key:'band_walk', name:'Lateral Band Walk', rx:'3 × 10 each', cat:'Hip',
    steps:['Band around knees or ankles, athletic stance.','Step sideways, knees pushed out against band.','Maintain band tension throughout.','10 steps one direction then reverse.'],
    cue:'If knees buckle inward, the band is too heavy.' },
  { key:'calf_raise', name:'Calf Raise', rx:'3 × 15', cat:'Shin',
    steps:['Stand on flat floor or stair edge.','Rise high on toes.','Hold 1 second at top.','Lower over 3 full seconds.'],
    cue:'The slow descent is the point. Do not rush.' },
  { key:'sl_calf_raise', name:'Single-Leg Calf Raise', rx:'3 × 10 each', cat:'Shin',
    steps:['Phase 2 progression only.','One leg, hand on wall for balance.','Rise high on working foot, pause 1 sec.','Lower over 3 seconds.'],
    cue:'Running is single-leg impacts. Train single-leg.' },
  { key:'calf_stretch', name:'Calf Stretch', rx:'2 × 30 sec each', cat:'Shin',
    steps:["Arm's length from wall, hands flat at shoulder height.",'Step one leg back about 60 cm.','Lean forward, back knee straight.','Hold 30 sec. Bend back knee for second set (soleus).'],
    cue:'Tight calves transmit impact straight to the shin.' },
  { key:'goblet_sq', name:'Goblet Squat', rx:'3 × 8 – 12', cat:'Day A',
    steps:['Hold dumbbell vertically at chest.','Feet shoulder-width, toes slightly out.','Sit down and back, knees track middle toes.','Drive up through heels, torso upright.'],
    cue:'If heels lift, improve ankle mobility separately.' },
  { key:'pushup', name:'Pushup', rx:'3 × 6 – 12', cat:'Day A',
    steps:['Start at incline if needed: counter, bench, box.','Hands slightly wider than shoulders.','Lower chest to within an inch of surface.','Elbows back at ~45 degrees, not flared.'],
    cue:'Sagging hips means abs disengaged. Squeeze glutes.' },
  { key:'db_row', name:'Single-Arm DB Row', rx:'3 × 10 each', cat:'Day A',
    steps:['One knee and same-side hand on bench.','Other foot flat, dumbbell hangs straight.','Pull elbow back toward hip, squeeze shoulder blade.','Lower with control over 2 – 3 seconds.'],
    cue:'Pull with the back, not the arm.' },
  { key:'plank', name:'Plank Hold', rx:'3 × 30 – 60 sec', cat:'Day A',
    steps:['Forearms under shoulders, elbows aligned.','Hips in line with shoulders and ankles.','Squeeze glutes, ribs stacked over hips.','Hold for time, stop when form drops.'],
    cue:'30 seconds perfect beats 90 seconds leaky.' },
  { key:'rdl', name:'Romanian Deadlift, DB', rx:'3 × 8 – 12', cat:'Day B',
    steps:['Stand hip-width, dumbbells in front of thighs.','Hinge from hips, push them backward.','Dumbbells travel close to legs.','Drive hips forward to stand, squeeze glutes at top.'],
    cue:'If you feel it in the lower back, you are bending the spine.' },
  { key:'oh_press', name:'Overhead Press, DB', rx:'3 × 8 – 10', cat:'Day B',
    steps:['Stand tall, dumbbells at shoulder height.','Brace core, ribs down, glutes squeezed.','Press straight up overhead.','Biceps align with ears at top.'],
    cue:'If you cannot press without leaning back, drop the weight.' },
  { key:'split_sq', name:'Bulgarian Split Squat', rx:'3 × 8 each', cat:'Day B',
    steps:['Rear foot on bench, laces down.','Front foot far enough forward to track over mid-foot.','~70 percent of bodyweight on front leg.','Drive through front heel to stand.'],
    cue:'Start bodyweight. Add DBs only after 8 clean per leg.' },
  { key:'dead_bug', name:'Dead Bug', rx:'2 × 6 each, slow', cat:'Mobility',
    steps:['On back, arms up over shoulders, knees over hips.','Press lower back gently flat against the floor.','Slowly reach opposite arm and leg away, breathing out.','Return with control. Easy and slow — a mobilizer, not a grind.'],
    cue:'A gentle spine mobilizer. Keep it slow and pain-free.' },
  { key:'walk', name:'Easy Walk', rx:'30 – 60 min', cat:'Cardio',
    steps:['Conversational pace. Full sentences while moving.','Talk test is the only intensity gauge needed.','Mixed terrain when ready.'],
    cue:'If you cannot finish a sentence, you are over pace.' },
  { key:'run', name:'Easy Run', rx:'30 – 60 min', cat:'Cardio',
    steps:['Easy, conversational pace — you can talk in full sentences.','Let heart rate, not pace, set the effort.','+10% rule: never more than 110% of 30-day longest.'],
    cue:'Easy runs feel suspiciously slow. That is the point.' },
  { key:'kb_swing', name:'Kettlebell Swing', rx:'3 × 12 – 15', cat:'Kettlebell',
    steps:['Hinge at the hips (not a squat) — push hips back, soft knees.','Hike the bell back between your legs, then snap hips forward to float it to chest height.','Arms stay relaxed — hips do the work, not shoulders.','Start ~15 lb; go up (20, 25) as it feels easy. Stop if your low back rounds.'],
    cue:'It is a hip snap, not a lift. Glutes finish the swing.' },
  { key:'kb_carry', name:'Farmer Carry', rx:'3 × 30 – 40 sec', cat:'Kettlebell',
    steps:['A kettlebell in each hand, arms straight, shoulders down and back.','Stand tall, ribs down, brace, and walk slow and even.','Start ~20 – 25 lb per hand; lighter if grip or posture slips.','Builds grip, core, and tall posture — straight carryover to running.'],
    cue:'Walk like a book is balanced on your head — tall and steady.' },
  // --- Foot rehab exercises (2026-08-17 foot-pain-rehab plan §6.1 — evidence: docs/EVIDENCE-FOOT.md) ---
  { key:'pf_heel_raise', name:'Towel Heel Raise', rx:'every other day · 3×12, building to 5×8 heavier', cat:'Foot',
    steps:['Roll a towel and place it under your toes on a step edge.','Rise on one leg over 3 seconds.','Hold 2 seconds at the top.','Lower over 3 seconds.','Rest between sets.','When 12 feel easy, add a loaded backpack and drop the reps.'],
    cue:'The towel is the point — it tensions the arch so the raise trains the fascia, not just the calf. The rest day is part of the dose.' },
  { key:'pf_stretch', name:'Plantar Fascia Stretch', rx:'10 sec × 10, three times a day', cat:'Foot',
    steps:['Sit and cross the sore foot over the other knee.','Grip the base of the toes.','Pull the toes back toward the shin until the arch band tightens.','Hold 10 seconds.'],
    cue:'Do the first set before your feet touch the floor in the morning.' },
  { key:'foot_intrinsic', name:'Foot Core', rx:'daily · 5×5-sec arch holds + 2×15 towel curls', cat:'Foot',
    steps:['Bare foot flat on the ground.','Draw the ball of the foot toward the heel to dome the arch WITHOUT curling the toes — hold 5 seconds.','Then scrunch a towel toward you with the toes.'],
    cue:"Commonly recommended and safe — the evidence here is still thin, and that's the honest truth." },
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
  // Foot rehab (plan Task B §6.2). footRehabTailMeta is a lookup-only alias for the tail block when the cleared
  // kind was foot-meta — currentDayPlan() (engine.js) picks it via key so foot_intrinsic replaces pf_heel_raise
  // as the tail's key exercise; the visible block stays the single BLOCKS.footRehabTail entry either way.
  footRehabPF:       ['pf_heel_raise','pf_stretch','calf_stretch','foot_intrinsic'],
  footRehabMeta:     ['calf_stretch','foot_intrinsic'],
  footRehabTail:     ['pf_heel_raise','calf_stretch'],
  footRehabTailMeta: ['foot_intrinsic','calf_stretch'],
  lowImpactSub:      ['walk'],
};
function exercisesForBlock(key) { return (BLOCK_EX[key] || []).map(k => EXERCISES.find(e => e.key === k)).filter(Boolean); }

// ============================================================
// RIR 2-3 DOUBLE-PROGRESSION (EVIDENCE-REVIEW §6)
// Each loaded lift carries a live prescription and advances on the existing Progress
// signal — no extra daily friction (check-in stays goal+feel+hurt). Two rules climb:
//   1. reps climb inside the working range per Progress (loaded/bodyweight +1 rep; the plank
//      climbs +step seconds, clamped to the top of its range);
//   2. at the top of the range for 2 consecutive sessions, ONE variable bumps (load for loaded
//      lifts, a harder variation for bodyweight, a harder anti-extension variation for the plank)
//      and reps reset to the bottom — never both reps and load in the same session (anti-failure
//      on-ramp). A loaded lift with no weight set yet has nothing to bump, so it pins reps at the
//      top until the user sets a weight via the ± control (no black box — never a silent reset).
// state.lifts is per-persona and persisted via saveLocal (whole-state serialization).
// ============================================================
// Seed templates (conservative on-ramp): load:null = "Set your weight" until the user sets it
// (no black box — never invent a starting weight). split_sq starts bodyweight (load 0) and only
// steps once a load is set (per the library cue: add DBs after 8 clean per leg).
const LIFT_SEEDS = {
  goblet_sq: { kind:'loaded',     load:null, unit:'lb', step:2.5, reps:8,  range:[8,12],  goodStreak:0, variation:null },
  rdl:       { kind:'loaded',     load:null, unit:'lb', step:5,   reps:8,  range:[8,12],  goodStreak:0, variation:null },
  oh_press:  { kind:'loaded',     load:null, unit:'lb', step:2.5, reps:8,  range:[8,10],  goodStreak:0, variation:null },
  db_row:    { kind:'loaded',     load:null, unit:'lb', step:2.5, reps:10, range:[8,12],  goodStreak:0, variation:null },
  split_sq:  { kind:'loaded',     load:0,    unit:'lb', step:2.5, reps:8,  range:[8,12],  goodStreak:0, variation:null },
  kb_swing:  { kind:'loaded',     load:null, unit:'lb', step:5,   reps:12, range:[12,15], goodStreak:0, variation:null },
  pushup:    { kind:'bodyweight', load:null, unit:'lb', step:0,   reps:6,  range:[6,12],  goodStreak:0, variation:null },
  plank:     { kind:'time',       load:null, unit:'s',  step:5,   reps:30, range:[30,60], goodStreak:0, variation:null },
};
// Harder-bodyweight progression hints (set as `variation` when the rep range is topped twice).
const BW_VARIATIONS = { pushup: ['Full pushups', 'Feet-elevated pushups', 'Decline / weighted pushups'] };
// A plank that has topped its range twice gets a harder anti-extension variation rather than ever-longer holds.
const PLANK_VARIATION = 'RKC plank / long-lever (harder, not longer)';
// Lazily seed a lift the first time it is needed; returns the live entry (defaults included).
function getLift(key) {
  if (!state.lifts) state.lifts = {};
  if (!state.lifts[key] && LIFT_SEEDS[key]) state.lifts[key] = { ...LIFT_SEEDS[key], range: LIFT_SEEDS[key].range.slice() };
  return state.lifts[key] || null;
}
function hasLift(key) { return !!LIFT_SEEDS[key]; }
// User-set load (the ± control). Clamped to >= 0; unit follows current settings (lb/kg display).
function setLiftLoad(key, load) {
  const lift = getLift(key); if (!lift || lift.kind !== 'loaded') return;
  lift.load = (load == null) ? null : Math.max(0, Math.round(load * 10) / 10);
  saveLocal();
}
// The lift keys trained on a day plan = exercisesForBlock over the day's kind==='strength' blocks,
// de-duped, keeping only those we actually progress (LIFT_SEEDS).
function dayLiftKeys(dayPlan) {
  const ks = [];
  (dayPlan && dayPlan.blocks ? dayPlan.blocks : []).filter(b => b.kind === 'strength')
    .forEach(b => exercisesForBlock(b.key).forEach(ex => { if (hasLift(ex.key) && !ks.includes(ex.key)) ks.push(ex.key); }));
  return ks;
}
// One double-progression step for a single lift entry (mutates in place).
function _stepLift(lift, key) {
  const [lo, hi] = lift.range;
  if (lift.reps < hi) {                                     // reps climb first (time climbs by step, others by 1)
    lift.reps = (lift.kind === 'time') ? Math.min(lift.reps + lift.step, hi) : lift.reps + 1;
    return;
  }
  // At the top of the range. A loaded lift with no weight set yet has nothing to bump — pin reps at hi
  // (no black box: don't silently reset reps or burn the streak before the user sets a weight via ±).
  if (lift.kind === 'loaded' && lift.load == null) return;
  lift.goodStreak = (lift.goodStreak || 0) + 1;             // at the top — bank a session
  if (lift.goodStreak >= 2) {                               // 2 consecutive at-top → bump ONE variable, reset reps
    if (lift.kind === 'loaded') { lift.load = Math.round((lift.load + lift.step) * 10) / 10; }
    else if (lift.kind === 'time') { lift.variation = PLANK_VARIATION; }
    else { const opts = BW_VARIATIONS[key] || []; const cur = opts.indexOf(lift.variation); lift.variation = opts[Math.min(cur + 1, opts.length - 1)] || lift.variation; }
    lift.reps = lo; lift.goodStreak = 0;
  }
}
// Advance every lift trained today; returns a snapshot of the PRE-advance entries for rollback.
// Mirrors the pointer's _pre snapshot: capture exactly the lifts we touched, so a same-day
// downgrade can restore them and a re-check can't double-advance or strand a lift.
function advanceDayLifts(dayPlan) {
  const snap = {};
  dayLiftKeys(dayPlan).forEach(key => {
    const lift = getLift(key); if (!lift) return;
    snap[key] = { ...lift, range: lift.range.slice() };   // deep-enough copy (range is the only nested field)
    _stepLift(lift, key);
  });
  return snap;
}
// Restore a snapshot taken by advanceDayLifts (same-day downgrade away from Progress).
function rollbackDayLifts(snap) {
  if (!snap) return;
  if (!state.lifts) state.lifts = {};
  Object.keys(snap).forEach(key => { state.lifts[key] = { ...snap[key], range: snap[key].range.slice() }; });
}
// Compact prescription string for a lift (UI helper). unitLabel respects settings (lb default, kg if metric).
function liftUnitLabel() { return (state.settings && state.settings.units === 'metric') ? 'kg' : 'lb'; }
function liftPrescription(key) {
  const lift = getLift(key); if (!lift) return null;
  if (lift.kind === 'time') return `${lift.reps}s plank · RIR 2-3: stop with form intact${lift.variation ? ` · ${lift.variation}` : ''}`;
  if (lift.kind === 'bodyweight') return `3×${lift.reps}${lift.variation ? ` · ${lift.variation}` : ' · add reps before making it harder'}`;
  if (lift.load == null) return 'Set your weight';
  return `3×${lift.reps} @ ${_fmtLoad(lift.load)} ${liftUnitLabel()} · RIR 2-3: stop ~2-3 reps short`;
}
// Round a load for display (drop a trailing .0; keep one decimal otherwise).
// Named _fmtLoad (not _n) to avoid colliding with figure.js's _n numeric rounder, which loads
// after program.js in index.html and would otherwise shadow this formatter globally.
function _fmtLoad(v) { return (Math.round(v * 10) % 10 === 0) ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1); }

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
// Local-midnight day diff between two epoch-ms instants: how many clean local-calendar mornings separate them.
// Anchors each instant to its own LOCAL midnight (not UTC), so injury/ramp windows expire on morning boundaries
// and don't shift on DST or evening logging — the same calendar-day model the day-gate uses.
function localMidnight(ms) { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function localDayDiff(fromMs, toMs) { return Math.round((localMidnight(toMs) - localMidnight(fromMs)) / 86400000); }
// The most-recent stored check's real-time ts — a tamper anchor for clock checks. excludeToday mirrors
// lastCheckDate: skip rows stamped today, so a same-day re-edit compares the SAME two events as the calendar
// gap. (Without this, a re-edit of the return-day check saw calGap=20 vs tsGap=0, the clamp "distrusted the
// calendar", collapsed the gap to 0, and un-held the layoff gate — daysim "return-day edit keeps hold".)
function lastCheckTs(excludeToday) { const t = excludeToday ? isoToday() : null; for (let i = state.checks.length - 1; i >= 0; i--) { const c = state.checks[i]; if (c && typeof c.ts === 'number' && (!t || c.date !== t)) return c.ts; } return null; }
// Whole-calendar-day math (midnight-to-midnight) so the 15/29/57-day tier boundaries don't jitter with time-of-day or DST.
// Sanity-clamp against the stored ts of the last check: if the calendar gap and the real-time ts gap disagree by more
// than ~1.5 days, the device clock was moved — DISTRUST the calendar and fall back to the smaller (ts-based) value, so
// a clock glitch can't manufacture a multi-week layoff. Normal real gaps (calendar ≈ ts) pass through untouched.
function daysSinceLastCheck(excludeToday) {
  const d = lastCheckDate(excludeToday); if (!d) return 0;
  const a = new Date(d + 'T00:00:00').getTime(), b = new Date(isoToday() + 'T00:00:00').getTime();
  const calGap = Math.max(0, Math.round((b - a) / 86400000));
  const ts = lastCheckTs(excludeToday);
  if (ts != null) {
    const tsGap = Math.max(0, localDayDiff(ts, Date.now()));   // real-time gap in local days
    if (Math.abs(calGap - tsGap) > 1.5) return Math.min(calGap, tsGap);   // clock disagreement → trust the smaller gap
  }
  return calGap;
}
// Effective days-off for ALL layoff logic (tier, ramp, stage regression, banner): the raw gap,
// capped by "I didn't take time off". state.layoffDismissedOn records the local date the user
// asserted they were active, so no gap can ever be measured ACROSS that day — while absence
// AFTER it still counts in full (a real 30-day break after a bogus dismissed 60-day gap must
// still ease them back). The anchor ages out naturally; nothing ever needs clearing.
function effectiveLayoffGap(excludeToday) {
  const g = daysSinceLastCheck(excludeToday);
  const d = state.layoffDismissedOn;
  if (!d) return g;
  const since = Math.max(0, Math.round((new Date(isoToday() + 'T00:00:00') - new Date(d + 'T00:00:00')) / 86400000));
  return Math.min(g, since);
}
function layoffTier(gap) {
  const g = (gap == null) ? daysSinceLastCheck() : gap;
  if (g < 15) return null;
  if (g < 29) return { gap: g, level: 1, pct: 85, title: 'Welcome back', msg: `${g} days off. Ease in: ~15% lighter today, rebuild over a week. Hold running at your last tolerated run-walk, not your best.` };
  if (g < 57) return { gap: g, level: 2, pct: 70, title: 'Easing back in', msg: `${g} days off (~1-2 months). Start ~30% lighter, higher reps, +10%/week. Running throttles back to early run-walk intervals — tendons de-adapt faster than your heart and muscle.` };
  return { gap: g, level: 3, pct: 60, title: 'Restart, smartly', msg: `${g}+ days off. Start ~40% lighter and rebuild running from the run-walk start, regardless of your old level. Muscle memory means it comes back much faster the second time.` };
}
// Graded STAGE regression on return from a layoff — sets the program pointer to an EARLIER phase by how long
// you were away, then you re-progress (fast, per muscle memory). Returns the floor phase index, or null for none.
// Evidence (docs/EVIDENCE-REVIEW.md): muscle/neural strength returns fast and 1–8wk costs little real strength
// (Stronger By Science 2023), so SHORT breaks (<2mo) only ease LOAD (layoffTier), no stage reset. Tendon stiffness
// de-adapts by ~2 months (Kubo 2010) → 2–6mo restarts RUNNING from the Run-Introduction stage. 6–12mo rebuilds the
// strength/tendon base from Foundation. 1yr+ does the full graded restart from Infrastructure (bone BMD lags most),
// but myonuclear/epigenetic "muscle memory" (Cumming 2024; Seaborne) means reclaim ≈ half the layoff — so the
// re-progression is quick. Never advances an unearned day: only Progress check-ins move the pointer back up.
function layoffRegressPhase(gap) {
  const g = (gap == null) ? daysSinceLastCheck() : gap;
  if (g < 57) return null;    // < ~2 months: ease load only (strength largely retained) — no stage reset
  if (g < 180) return 2;      // ~2–6 months: restart running from Run Introduction (P2)
  if (g < 365) return 1;      // ~6–12 months: rebuild from Foundation (P1)
  return 0;                   // 1 year+: full graded restart from Infrastructure (P0)
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
function injuryEnd(inj) { return (inj && inj.easeUntil) || (inj ? inj.since + 10 * 86400000 : 0); }   // overall recovery-window end (ts)
// User-facing window length in clean local days (length is preserved: ~10d ease, ~3d protect), aligned to morning
// boundaries via the same local-midnight diff as daysSinceLastCheck — so windows don't expire mid-afternoon or shift on DST.
function injuryEaseDays(inj) { return inj ? Math.max(1, localDayDiff(inj.since || 0, injuryEnd(inj))) : 0; }
function injuryRiceDays(inj) { return inj ? Math.max(1, localDayDiff(inj.since || 0, (inj.riceUntil || (inj.since + 3 * 86400000)))) : 0; }
// Elapsed clean local days since the injury was logged (0 on the logging day, +1 each new local morning).
function injuryElapsedDays(inj) { return inj ? Math.max(0, localDayDiff(inj.since || Date.now(), Date.now())) : 0; }
function injuryActive() { return !!(state.injury && !state.injury.clearedAt && injuryElapsedDays(state.injury) < injuryEaseDays(state.injury)); }   // expires on a clean morning boundary
function injuryInRice() { return injuryActive() && injuryElapsedDays(state.injury) < injuryRiceDays(state.injury); }
function clearInjury() { if (state.injury) { state.injury.clearedAt = Date.now(); } state.injury = null; saveLocal(); }
// Relapse-prevention tail after a gated foot-rehab clear (spec §5.4) — active until `until` (a localMidnight-
// aligned boundary set at clear time, see engine.js applyCheck) has passed.
function rehabTailActive() { return !!(state.rehabTail && Date.now() < state.rehabTail.until); }
// Auto-expire a stale injury whose recovery window has fully elapsed (out of range → exclude it).
function pruneInjury() {
  // Use the same local-day window as injuryActive() so prune and active-state agree on the morning boundary.
  if (state.injury && !state.injury.clearedAt && injuryElapsedDays(state.injury) >= injuryEaseDays(state.injury)) {
    logEvent('injury', `Recovery window ended (${fmtDate(state.injury.since)}–${fmtDate(injuryEnd(state.injury))}) — back to normal training`);
    clearInjury();
  }
  // Foot relapse-prevention tail: expiry is silent (no log line, unlike an injury window ending) — pruned
  // wherever pruneInjury() is called (screens.js, init.js) so it never needs its own call site (spec §5.4).
  if (state.rehabTail && !rehabTailActive()) { state.rehabTail = null; saveLocal(); }
}
// A call that persists across the days it covers, bounded by explicit start/end dates.
function standingCall() {
  if (!injuryActive()) return null;
  const inj = state.injury;
  // "day N of M" counts clean local-calendar mornings (aligned with the day-gate), not raw 24h ticks, so it
  // advances on each morning and the protect length stays ~3 days regardless of time-of-day or DST.
  const days = injuryRiceDays(inj);
  const dayNum = Math.min(days, injuryElapsedDays(inj) + 1);
  // Plain-language condition name for foot kinds (spec §3.4); every other kind falls back to the body-part
  // join, byte-identical to today's copy (FOOT_CONDITION_NAMES/foot.js may not be loaded yet, hence the guard).
  const parts = (typeof FOOT_CONDITION_NAMES !== 'undefined' && inj.kind && FOOT_CONDITION_NAMES[inj.kind])
    || (inj.parts || []).join(', ') || 'injury';
  const ext = inj.extended ? ' · extended' : '';
  // Keep it tight — the "day N of M" label already conveys the protect window, so don't repeat the end date.
  if (injuryInRice()) return { cls: 'strength', label: `Recovering · ${parts} · day ${dayNum} of ${days}${ext}`, title: 'Rest and protect', action: `Keep moving everything that doesn't hurt — gentle, pain-free motion heals faster than total rest.` };
  return { cls: 'milestone', label: `Recovering · ${parts} · easing back${ext}`, title: 'Ease back in', action: `Ease back in by feel — keep any pain at or under ~3–5/10 and gone by next morning. Re-check by ${fmtDate(injuryEnd(inj))}.` };
}

// ---- Graded return ramp (after a layoff) + unified load reduction ----
// A layoff arms a ramp (set in applyCheck); while it is active the prescription is shown lighter and rebuilds
// to baseline over the tier's window — a graded return, not a single eased day, then auto-expires.
// Expire on a clean local-morning boundary (same day model as the day-gate): the ramp clears once its full-day
// length has elapsed in local calendar days from startedAt, rather than at a raw UTC-ms instant mid-day.
function returnRampDays(r) { return r ? Math.max(1, localDayDiff(r.startedAt != null ? r.startedAt : r.until - 0, r.until)) : 0; }
function returnRampActive() {
  const r = state.returnRamp;
  if (r) { const start = (r.startedAt != null) ? r.startedAt : r.until; if (localDayDiff(start, Date.now()) >= returnRampDays(r)) state.returnRamp = null; }
  return !!state.returnRamp;
}
// The single source of truth for "should today's prescription be lighter, and why" — injury > layoff-ramp > deload.
function loadReduction() {
  if (injuryActive()) {
    if (injuryInRice()) return { reason: 'injury', pct: 0, note: 'Protect — offload the painful movement; keep pain-free movement going (PEACE & LOVE)' };
    // Foot-pf/foot-meta rehab carries its own ease-back copy (spec §5.5 pain rule); every other kind (incl.
    // every non-foot injury) keeps today's exact note (footRehabKind/foot.js may not be loaded yet — guarded).
    const isFootRehab = state.injury && typeof footRehabKind === 'function' && footRehabKind(state.injury.kind);
    return { reason: 'injury', pct: 50, note: isFootRehab
      ? 'Pain-monitored ease-back — up to ~3/10 that settles by morning is OK; climbing pain means back off.'
      : 'Pain-monitored ease-back — keep pain ≤ ~3–5/10 and gone by next morning' };
  }
  if (returnRampActive()) { const r = state.returnRamp, start = (r.startedAt != null) ? r.startedAt : r.until, left = Math.max(1, returnRampDays(r) - localDayDiff(start, Date.now())); return { reason: 'layoff', pct: r.pct, note: `Easing back from time off — about ${r.pct}% of normal load, rebuild over ~${left} more day${left > 1 ? 's' : ''}` }; }
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
// Every exercise renders through the parametric figure engine (gait for walk/run/carry, a FIG_POSES
// skeleton for everything else — see util.js animatedFigure). The old two-frame flip-book sprite
// system it replaced has been fully removed.

