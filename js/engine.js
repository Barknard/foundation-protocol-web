'use strict';
// ============================================================
// DECISION ENGINE
// ============================================================
const OUTCOMES = {
  progress: {
    key: 'progress', title: 'Progress', cls: 'mobility',
    action: 'Move to the next session.',
    why: 'You completed the work and you are recovered. That is the only condition under which load should go up. The next session is a small step, not a leap. This is autoregulation: progression follows readiness, not the calendar.'
  },
  repeat: {
    key: 'repeat', title: 'Repeat this session', cls: 'cardio',
    action: 'Run the same session again next time.',
    why: 'Either the session was not fully completed, or you are recovered but not fresh enough to add load. Repeating consolidates the adaptation already in motion. Most plateaus clear in 7 to 14 days of holding steady.'
  },
  modify: {
    key: 'modify', title: 'Easier version next', cls: 'milestone',
    action: 'Same session, easiest variation, no added load.',
    why: 'You are a bit run down but not wrecked. Keep the movement pattern, drop the intensity: incline pushups, bodyweight squats, shorter holds, run-walk instead of running. Training through mild fatigue at reduced load preserves the habit without digging a deeper hole.'
  },
  rest: {
    key: 'rest', title: 'Rest today', cls: 'strength',
    action: 'Full rest, or an easy 15 to 20 min walk only.',
    why: 'Recovery outranks everything else. Sleep, hydrate, get protein in. Re-check tomorrow and resume where you left off. Nothing is lost by resting one day; a lot can be lost by training on top of a body that is signalling stop.'
  },
};

function decide(goalMet, feel, hurt) {
  const g = String(goalMet).toLowerCase();   // tolerate casing/type so progression can't silently stall
  if (hurt) {
    return { ...OUTCOMES.rest,
      title: 'Stop. Rest and check the pain.',
      why: 'Sharp pain is not training stress. Take today off entirely. If the same sharp pain is still there after a few days, or it is point-tender on the bone, see a physio before resuming. ' + OUTCOMES.rest.why };
  }
  if (feel <= 1) return OUTCOMES.rest;
  if (feel === 2) return OUTCOMES.modify;
  if (g === 'done') return feel >= 4 ? OUTCOMES.progress : OUTCOMES.repeat;
  return OUTCOMES.repeat;
}

function modifyBlock(block) {
  switch (block.kind) {
    case 'strength': return { title: block.title, detail: 'Easiest variation, no added load. Incline pushups, bodyweight squats, shorter holds.' };
    case 'cardio':
      if (/run/i.test(block.title) || /run/i.test(block.label))
        return { title: 'Run-walk or walk', detail: 'Drop the running. Walk, or gentle run-walk intervals for the same time.' };
      return { title: 'Short easy walk', detail: '15 to 20 minutes, conversational. Nothing more.' };
    case 'mobility': return { title: block.title, detail: 'Painless items only. Skip anything that aggravates.' };
    case 'milestone': return { title: block.title, detail: block.detail };
    default: return { title: 'Rest', detail: 'Sleep, hydrate, protein.' };
  }
}

// ============================================================
// PROGRESSION
// ============================================================
function currentPhaseDef() { return PHASES[(state.phase?.phase ?? state.profile?.startingPhase ?? 0)]; }
function currentDayPlan() {
  const pd = currentPhaseDef();
  const idx = ((state.phase?.dayInWeek ?? 1) - 1);
  const base = pd.week[Math.max(0, Math.min(idx, pd.week.length - 1))];
  // On a deload / return-ramp / injury-ease day, show the prescription LIGHTER (the reduction has teeth, not just a banner).
  const lr = (typeof loadReduction === 'function') ? loadReduction() : null;
  let blocks = lr ? base.blocks.map(b => lightenBlock(b, lr)) : base.blocks;
  // --- Foot rehab swap-in (additive; foot-pf/foot-meta only — spec §5.3, plan Task B 2026-08-17). Every other
  //     kind, including every non-foot injury, never satisfies footRehabKind() so this is a no-op for them —
  //     the regression pin (scenarioNonFootRegressionPin) depends on that. footRehabKind() lives in foot.js,
  //     which may not be loaded during Lane A/B parallel development, hence the typeof guard. ---
  const inj = state.injury;
  if (injuryActive() && inj && typeof footRehabKind === 'function' && footRehabKind(inj.kind)) {
    const rehabKey = inj.kind === 'foot-pf' ? 'footRehabPF' : 'footRehabMeta';
    const rehabBlock = BLOCKS[rehabKey] ? { ...BLOCKS[rehabKey], key: rehabKey } : null;
    const cardioSubKey = injuryInRice() ? 'rest' : 'lowImpactSub';
    const cardioSub = BLOCKS[cardioSubKey] ? { ...BLOCKS[cardioSubKey], key: cardioSubKey } : null;
    blocks = blocks.map(b => {
      if (b.kind === 'mobility' && rehabBlock) return rehabBlock;                        // PT slot -> rehab block
      if (RUN_BLOCK_KEYS.includes(b.key) && cardioSub) return cardioSub;                 // impact cardio -> low-impact sub, or rest during protect
      return b;   // strength keeps its already-lightened pain-rule note (existing loadReduction mechanism, no fork); rest/milestone/walk-only cardio unchanged
    });
  }
  // --- Relapse-prevention tail (spec §5.4): appended (never swapped) on Mon/Thu only (idx is the 0-based
  //     weekday index into pd.week, which is always Mon..Sun — idx 0 = Mon, idx 3 = Thu, for every phase),
  //     only while no injury is currently active, and only within its window. Expiry is silent — pruneInjury()
  //     (program.js) drops it, so no explicit expiry handling is needed here. ---
  if (!injuryActive() && rehabTailActive() && (idx === 0 || idx === 3)) {
    // A foot-meta tail substitutes foot_intrinsic for pf_heel_raise as the key exercise (spec §6.2). The visible
    // block is always the single BLOCKS.footRehabTail entry (the plan names exactly one footRehabTail block) —
    // only the exercisesForBlock() lookup key differs: footRehabTailMeta is a BLOCK_EX-only alias for the
    // substituted list, not a second named block (plan Task B: "substitute ... in currentDayPlan, document inline").
    const tailKind = state.rehabTail && state.rehabTail.kind;
    const tailLookupKey = tailKind === 'foot-meta' ? 'footRehabTailMeta' : 'footRehabTail';
    blocks = blocks.concat([{ ...BLOCKS.footRehabTail, key: tailLookupKey }]);
  }
  return { day: base.day, blocks };
}
function advancePointer() {
  const cur = state.phase || { phase: state.profile?.startingPhase ?? 0, week: 1, dayInWeek: 1, sessionsCleared: 0, lastDecision: null };
  const pd = PHASES[cur.phase];
  let { phase, week, dayInWeek } = cur;
  const lastPhase = phase >= PHASES.length - 1;
  dayInWeek += 1;
  if (dayInWeek > pd.week.length) {
    dayInWeek = 1; week += 1;
    if (week > pd.totalWeeks) {
      if (lastPhase) { week = pd.totalWeeks; dayInWeek = pd.week.length; }   // TERMINAL: clamp, never wrap Target back to week 1
      else { week = 1; phase = phase + 1; if (phase === PHASES.length - 1 && !state.targetReachedAt) state.targetReachedAt = Date.now(); }   // first arrival at the Target phase → celebrate
    }
  }
  state.phase = { phase, week, dayInWeek, sessionsCleared: (cur.sessionsCleared ?? 0) + 1, lastDecision: new Date().toISOString() };
}
const INJURY_REST = { key: 'rest', title: 'Rest and protect', cls: 'strength',
  action: 'Offload the painful movement today. Keep moving everything that does not hurt.',
  why: 'For a fresh tweak, current guidance is PEACE & LOVE, not RICE: Protect (briefly offload), Elevate, Avoid anti-inflammatories/ice as a "healing" step, Compress, Educate — then over the next days gently Load, stay Optimistic, do easy pain-free cardio (Vascularization) and graded Exercise. Gentle early loading beats prolonged rest (BJSM 2019/2020). Prefer paracetamol over NSAIDs for pain; re-check tomorrow. Warning signs — can\'t bear weight, numbness, a visible deformity, joint locking/giving way, a "pop", or rapid swelling — mean see a clinician (GP, physio, urgent care) before training it, more so at 40+.' };
const INJURY_FLAG = { key: 'rest', title: 'See a clinician first', cls: 'strength',
  action: 'Hold off and get this looked at before training it.',
  why: 'You flagged a warning sign — cannot bear weight, bone-point tenderness, numbness, deformity, joint locking/giving way, a "pop", or rapid swelling. Any of these warrants a professional check (GP, physio, urgent care), and it matters more at 40+ where fracture and medication-interaction risk are higher. Resume the plan once cleared.' };

function applyCheck(goalMet, feel, hurt, parts, redFlag, foot) {
  // Single source of truth: hurt → the dedicated injury outcome (clinician on a red flag, else PEACE & LOVE); else decide().
  let outcome = hurt ? (redFlag ? INJURY_FLAG : INJURY_REST) : decide(goalMet, feel, hurt);
  let cur = state.phase || {};
  const today = isoToday();
  // --- Injury handling (PEACE & LOVE / red-flag screen) ---
  const wasInjury = injuryActive();   // ease-back spans the WHOLE injury window (~10d), not just the 3-day protect
  if (hurt) {
    const prev = (state.injury && !state.injury.clearedAt) ? state.injury : null;   // re-flagging extends the window
    const now = Date.now();
    // Foot drill-down (additive; foot = null | {zone, neural, gate} — pinned contract, foot-pain-rehab plan
    // 2026-08-17). A foot zone routes to a specific kind via foot.js's footKind(); every other case (no zone,
    // or foot.js not yet loaded) keeps kind:'acute' and footWindow()'s documented default {rice:3, ease:10} —
    // identical to today's hardcoded 3d/10d, so non-foot injuries are byte-identical (regression pin).
    let kind = 'acute';
    let footInfo = null;
    if (foot && foot.zone) {
      kind = (typeof footKind === 'function') ? footKind(foot.zone, foot.neural, redFlag) : 'acute';
      footInfo = { zone: foot.zone, neural: (foot.neural === true || foot.neural === false) ? foot.neural : null };
    }
    const win = (typeof footWindow === 'function') ? footWindow(kind) : { rice: 3, ease: 10 };
    // Preserve the prior location when a re-check flags "still hurts" with no region re-selected,
    // so the recovery banner never degrades to a generic "injury" with the original spot lost.
    state.injury = { parts: (parts && parts.length) ? parts : (prev ? (prev.parts || []) : []), since: now, riceUntil: now + win.rice * 86400000, easeUntil: now + win.ease * 86400000, kind, foot: footInfo, redFlag: !!redFlag, extended: prev ? (prev.extended || 0) + 1 : 0, firstSince: prev ? (prev.firstSince || prev.since) : now };
    state.rehabTail = null;   // a fresh flag supersedes any relapse-prevention tail — starts clean (spec §5.4 "re-flag during tail")
  } else if (injuryActive()) {
    const inj = state.injury;
    const gated = (typeof footRehabKind === 'function') && footRehabKind(inj.kind);
    if (gated && foot && foot.gate) {
      // Criteria-gated clear for foot-pf/foot-meta (spec §3.5 / §5.2) — a bare pain-free submit does NOT clear these.
      const passed = (typeof footGatePassed === 'function') ? footGatePassed(inj.kind, foot.gate) : true;
      if (passed) {
        const clearedKind = inj.kind;
        clearInjury();
        const tailDays = (typeof REHAB_TAIL_DAYS === 'number') ? REHAB_TAIL_DAYS : 35;   // foot.js contract default
        state.rehabTail = { kind: clearedKind, until: localMidnight(Date.now()) + tailDays * 86400000 };
        const condName = (typeof FOOT_CONDITION_NAMES !== 'undefined' && FOOT_CONDITION_NAMES[clearedKind]) || 'condition';
        logEvent('injury', `Recovery gate passed — ${condName} cleared; 5 weeks of light upkeep begins`);
      } else {
        const gateDef = (typeof FOOT_GATES !== 'undefined') ? FOOT_GATES[inj.kind] : null;
        const failedKeys = gateDef ? gateDef.filter(g => !(foot.gate[g.key] === true)).map(g => g.key) : [];
        logEvent('injury', `Gate not yet met — ${failedKeys.length ? failedKeys.join(', ') : 'criteria'} not yet cleared`);
        // Stay in the injury; the outcome reads as "keep going", not a fresh injury flag.
        outcome = { ...INJURY_REST, why: 'Keep going — the recovery gate is not fully clear yet. ' + INJURY_REST.why };
      }
    } else {
      // Non-foot injuries, non-gated foot kinds (foot-refer/foot-toes/foot-top), and a gated kind submitted
      // without gate answers (shouldn't happen via the UI) all keep today's exact behavior: clear immediately.
      clearInjury();
      logEvent('injury', 'Re-checked pain-free — injury cleared, resuming normal training');
    }
  }
  // --- Ease back: no load jump on the first day back from a layoff (gap measured to the last DIFFERENT day, so a
  //     same-day edit can't collapse it to 0), anywhere inside the injury window, or while under-recovered. ---
  // "I didn't take time off" is honored via effectiveLayoffGap: the dismissal date caps every gap
  // measurement across it (no ramp / forced Repeat / stage regression for the dismissed absence),
  // while absence AFTER the dismissal counts in full — daysim-fixes "dismissal" scenarios.
  const priorGap = (typeof effectiveLayoffGap === 'function') ? effectiveLayoffGap(true) : daysSinceLastCheck(true);
  const lay = layoffTier(priorGap);
  if (lay) {   // arm a graded return ramp once, on the real return day — it lightens the prescription over the tier's window
    const rampDays = lay.level === 1 ? 7 : lay.level === 2 ? 21 : 42;
    state.returnRamp = { until: Date.now() + rampDays * 86400000, level: lay.level, pct: lay.pct, startedAt: Date.now() };
  }
  // STAGE regression on the genuine return day from a LONG layoff (research-backed — see layoffRegressPhase +
  // docs/EVIDENCE-REVIEW.md "Detraining model"). Fires once (skipped on a same-day re-edit, which already has
  // today's row) and only ever moves the pointer to an EARLIER phase. The return day is still held to Repeat
  // below (the `lay` deload-gate), so this SETS the stage without advancing — and re-progression from here is
  // fast (muscle memory). It never counts forward a day you didn't complete.
  const regressTo = (lay && typeof layoffRegressPhase === 'function') ? layoffRegressPhase(priorGap) : null;   // gated on `lay` so a dismissed gap can't regress
  const isReturnDay = !state.checks.some(c => c && c.date === today);
  if (regressTo != null && isReturnDay && (cur.phase ?? 0) > regressTo) {
    state.phase = { phase: regressTo, week: 1, dayInWeek: 1, sessionsCleared: cur.sessionsCleared ?? 0, lastDecision: cur.lastDecision ?? null };
    cur = state.phase;
    logEvent('layoff', `${priorGap} days off — detraining reset to ${(typeof PHASES !== 'undefined' && PHASES[regressTo]) ? PHASES[regressTo].name : 'an earlier phase'}; re-progression is faster the second time.`);
  }
  // Hold the pointer on a genuine return day (lay), inside an injury window, or on an under-recovery trend —
  // all of these self-expire (the gap collapses tomorrow, the injury window ends, the trend clears as feels
  // improve). A SCHEDULED deload week deliberately does NOT hold the pointer: isDeloadWeek() is derived from
  // the pointer itself and only a Progress can move the pointer, so "hold during deload" could never end —
  // it froze every user at loaded week 5 forever (daysim "deload deadlock", 33 frozen days). The deload week
  // still has teeth: loadReduction() lightens every session in it, and it exits after its own 7 sessions.
  if (!hurt && outcome.key === 'progress' && (lay || wasInjury || underRecoveryTrend())) outcome = OUTCOMES.repeat;
  // --- Day-gate (monotonic, clock-tamper hardened) ---
  // Normal path: a row already stamped with today's date is a same-day re-edit (replace, never a second advance).
  // Backward clock (NTP fix, manual change, eastward travel): isoToday() returns an EARLIER date than an
  // existing row — that future-dated row proves we already logged "ahead" of now, so this is the same real
  // day → point existingIdx at the newest row so it is REPLACED (no row growth, no double advance).
  let existingIdx = state.checks.findIndex(c => c.date === today);
  if (existingIdx < 0 && state.checks.length) {
    const hasFutureDated = state.checks.some(c => c && c.date && c.date >= today);   // a row at/after today's date
    if (hasFutureDated) existingIdx = state.checks.length - 1;   // backward clock / date-line hop → re-edit newest
  }
  // "One full night of recovery" gate: <12h of real time since the newest check from a DIFFERENT day
  // (skipping the row being re-edited) holds a Progress to Repeat. Today still gets its OWN history row —
  // erasing yesterday's record would break the data covenant (daysim-fixes "evening→morning keeps history")
  // — and the gate covers same-day RE-EDITS of that morning check too, so a pencil edit can't unlock what
  // the original check correctly held (daysim-fixes "tooSoon re-edit"). It expires naturally: by the
  // evening, >12h have passed and a re-edit may Progress.
  let tooSoon = false;
  for (let i = state.checks.length - 1; i >= 0; i--) {
    if (i === existingIdx) continue;
    const c = state.checks[i];
    if (c && typeof c.ts === 'number' && c.date !== today) { tooSoon = Math.abs(Date.now() - c.ts) <= 12 * 3600000; break; }
  }
  if (tooSoon && !hurt && outcome.key === 'progress') {
    outcome = { ...OUTCOMES.repeat, why: 'Your last check-in was under 12 hours ago — one full night of recovery has not happened yet, so today holds instead of stepping up. ' + OUTCOMES.repeat.why };
  }
  const alreadyCheckedToday = existingIdx >= 0;
  const prevEntry = alreadyCheckedToday ? state.checks[existingIdx] : null;
  const prevWasProgress = !!(prevEntry && prevEntry.decision === 'progress');
  const prevPre = (prevEntry && prevEntry._pre) ? prevEntry._pre : null;   // pre-advance pointer snapshot
  const prevLiftPre = (prevEntry && prevEntry._liftPre) ? prevEntry._liftPre : null;   // pre-advance lift snapshot
  const nowIsProgress = outcome.key === 'progress';
  // RIR double-progression operates on the session just completed (the CURRENT, pre-advance day plan).
  const dayPlanNow = (typeof currentDayPlan === 'function') ? currentDayPlan() : null;
  const entry = {
    ts: Date.now(), date: today, goalMet, feel, hurt: !!hurt, parts: parts || [], footZone: (foot && foot.zone) || null,
    decision: outcome.key, phase: cur.phase ?? 0, week: cur.week ?? 1, dayInWeek: cur.dayInWeek ?? 1,
  };
  // Keep the pointer consistent with TODAY's current decision: advance at most once per local day,
  // and roll back a same-day advance if a re-check downgrades away from Progress (fixes pointer/decision drift).
  let willAdvance = false;
  if (nowIsProgress && !prevWasProgress) {
    entry._pre = { phase: cur.phase ?? 0, week: cur.week ?? 1, dayInWeek: cur.dayInWeek ?? 1, sessionsCleared: cur.sessionsCleared ?? 0, lastDecision: cur.lastDecision ?? null };
  } else if (nowIsProgress && prevWasProgress) {
    entry._pre = prevPre;   // already advanced earlier today; keep the original snapshot, don't advance twice
    entry._liftPre = prevLiftPre;   // ditto for lifts: keep the first-Progress snapshot, don't re-advance
    // stored row records the session that was checked (pre-advance), so it matches the actual pointer
    if (prevPre) { entry.phase = prevPre.phase; entry.week = prevPre.week; entry.dayInWeek = prevPre.dayInWeek; }
  }
  if (alreadyCheckedToday) state.checks[existingIdx] = entry; else state.checks.push(entry);
  if (nowIsProgress && !prevWasProgress) {
    advancePointer();
    willAdvance = true;
    // RIR: advance the day's strength lifts ONLY on the first Progress of the day, mirroring the
    // pointer snapshot — capture the touched lifts into _liftPre so a same-day downgrade can roll back.
    if (typeof advanceDayLifts === 'function') { entry._liftPre = advanceDayLifts(dayPlanNow); }
  } else if (!nowIsProgress && prevWasProgress && prevPre) {
    state.phase = { phase: prevPre.phase, week: prevPre.week, dayInWeek: prevPre.dayInWeek, sessionsCleared: prevPre.sessionsCleared, lastDecision: new Date().toISOString() };
    // keep the stored row consistent with the rolled-back pointer (it was stamped from the post-advance pointer)
    entry.phase = prevPre.phase; entry.week = prevPre.week; entry.dayInWeek = prevPre.dayInWeek;
    // RIR: undo today's lift advance too, so a re-check can't strand a lift one step ahead
    if (typeof rollbackDayLifts === 'function') { rollbackDayLifts(prevLiftPre); }
    logEvent('progress', `Rolled back today's advance — re-checked as ${outcome.title}`);
  } else {
    if (!state.phase) state.phase = { phase: 0, week: 1, dayInWeek: 1, sessionsCleared: 0, lastDecision: null };
    state.phase.lastDecision = new Date().toISOString();
  }
  // --- audit log ---
  const pl = (parts && parts.length) ? ` [${parts.join(', ')}${redFlag ? '; red flag' : ''}]` : '';
  logEvent('check', `Goal ${goalMet}, feel ${feel}/5${hurt ? ' · hurt' + pl : ''} → ${outcome.title}`);
  if (willAdvance) logEvent('progress', `Advanced → Phase ${state.phase.phase} · Wk ${state.phase.week} · Session ${state.phase.dayInWeek}`);
  if (hurt) logEvent('injury', `Injury logged${pl}${redFlag ? ' — routed to clinician' : ''} · protect through ${fmtDate(state.injury.riceUntil)}, re-check by ${fmtDate(state.injury.easeUntil)}${state.injury.extended ? ` (extended ×${state.injury.extended})` : ''}`);
  else if (lay) logEvent('layoff', `${lay.gap} days off — eased back in (no load jump)`);
  saveLocal();
  return outcome;
}

