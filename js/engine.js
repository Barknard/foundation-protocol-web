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
  if (!lr) return base;
  return { day: base.day, blocks: base.blocks.map(b => lightenBlock(b, lr)) };
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
      if (lastPhase) { week = pd.totalWeeks; dayInWeek = pd.week.length; state.capstoneReached = true; }   // TERMINAL: clamp, never wrap Target back to week 1
      else { week = 1; phase = phase + 1; }
    }
  }
  state.phase = { phase, week, dayInWeek, sessionsCleared: (cur.sessionsCleared ?? 0) + 1, lastDecision: new Date().toISOString() };
}
const INJURY_REST = { key: 'rest', title: 'Rest & protect', cls: 'strength',
  action: 'Offload the painful movement today. Keep moving everything that does not hurt.',
  why: 'For a fresh tweak, current guidance is PEACE & LOVE, not RICE: Protect (briefly offload), Elevate, Avoid anti-inflammatories/ice as a "healing" step, Compress, Educate — then over the next days gently Load, stay Optimistic, do easy pain-free cardio (Vascularization) and graded Exercise. Gentle early loading beats prolonged rest (BJSM 2019/2020). Prefer paracetamol over NSAIDs for pain; re-check tomorrow. Warning signs — can\'t bear weight, numbness, a visible deformity, joint locking/giving way, a "pop", or rapid swelling — mean see a clinician (GP, physio, urgent care) before training it, more so at 40+.' };
const INJURY_FLAG = { key: 'rest', title: 'See a clinician first', cls: 'strength',
  action: 'Hold off and get this looked at before training it.',
  why: 'You flagged a warning sign — cannot bear weight, bone-point tenderness, numbness, deformity, joint locking/giving way, a "pop", or rapid swelling. Any of these warrants a professional check (GP, physio, urgent care), and it matters more at 40+ where fracture and medication-interaction risk are higher. Resume the plan once cleared.' };

function applyCheck(goalMet, feel, hurt, parts, redFlag) {
  // Single source of truth: hurt → the dedicated injury outcome (clinician on a red flag, else PEACE & LOVE); else decide().
  let outcome = hurt ? (redFlag ? INJURY_FLAG : INJURY_REST) : decide(goalMet, feel, hurt);
  const cur = state.phase || {};
  const today = isoToday();
  // --- Injury handling (PEACE & LOVE / red-flag screen) ---
  const wasInjury = injuryActive();   // ease-back spans the WHOLE injury window (~10d), not just the 3-day protect
  if (hurt) {
    const prev = (state.injury && !state.injury.clearedAt) ? state.injury : null;   // re-flagging extends the window
    const now = Date.now();
    state.injury = { parts: parts || [], since: now, riceUntil: now + 3 * 86400000, easeUntil: now + 10 * 86400000, kind: 'acute', redFlag: !!redFlag, extended: prev ? (prev.extended || 0) + 1 : 0, firstSince: prev ? (prev.firstSince || prev.since) : now };
  } else if (injuryActive()) {
    // re-checked with no pain: the injury is settling — clear it (with an audit timestamp + log) and resume
    clearInjury();
    logEvent('injury', 'Re-checked pain-free — injury cleared, resuming normal training');
  }
  // --- Ease back: no load jump on the first day back from a layoff (gap measured to the last DIFFERENT day, so a
  //     same-day edit can't collapse it to 0), anywhere inside the injury window, or while under-recovered. ---
  const priorGap = daysSinceLastCheck(true);
  const lay = layoffTier(priorGap);
  if (lay) {   // arm a graded return ramp once, on the real return day — it lightens the prescription over the tier's window
    const rampDays = lay.level === 1 ? 7 : lay.level === 2 ? 21 : 42;
    state.returnRamp = { until: Date.now() + rampDays * 86400000, level: lay.level, pct: lay.pct, startedAt: Date.now() };
  }
  if (!hurt && outcome.key === 'progress' && (lay || wasInjury || underRecoveryTrend())) outcome = OUTCOMES.repeat;
  const existingIdx = state.checks.findIndex(c => c.date === today);
  const alreadyCheckedToday = existingIdx >= 0;
  const prevEntry = alreadyCheckedToday ? state.checks[existingIdx] : null;
  const prevWasProgress = !!(prevEntry && prevEntry.decision === 'progress');
  const prevPre = (prevEntry && prevEntry._pre) ? prevEntry._pre : null;   // pre-advance pointer snapshot
  const nowIsProgress = outcome.key === 'progress';
  const entry = {
    ts: Date.now(), date: today, goalMet, feel, hurt: !!hurt, parts: parts || [],
    decision: outcome.key, phase: cur.phase ?? 0, week: cur.week ?? 1, dayInWeek: cur.dayInWeek ?? 1,
  };
  // Keep the pointer consistent with TODAY's current decision: advance at most once per local day,
  // and roll back a same-day advance if a re-check downgrades away from Progress (fixes pointer/decision drift).
  let willAdvance = false;
  if (nowIsProgress && !prevWasProgress) {
    entry._pre = { phase: cur.phase ?? 0, week: cur.week ?? 1, dayInWeek: cur.dayInWeek ?? 1, sessionsCleared: cur.sessionsCleared ?? 0, lastDecision: cur.lastDecision ?? null };
  } else if (nowIsProgress && prevWasProgress) {
    entry._pre = prevPre;   // already advanced earlier today; keep the original snapshot, don't advance twice
    // stored row records the session that was checked (pre-advance), so it matches the actual pointer
    if (prevPre) { entry.phase = prevPre.phase; entry.week = prevPre.week; entry.dayInWeek = prevPre.dayInWeek; }
  }
  if (alreadyCheckedToday) state.checks[existingIdx] = entry; else state.checks.push(entry);
  if (nowIsProgress && !prevWasProgress) {
    advancePointer();
    willAdvance = true;
  } else if (!nowIsProgress && prevWasProgress && prevPre) {
    state.phase = { phase: prevPre.phase, week: prevPre.week, dayInWeek: prevPre.dayInWeek, sessionsCleared: prevPre.sessionsCleared, lastDecision: new Date().toISOString() };
    // keep the stored row consistent with the rolled-back pointer (it was stamped from the post-advance pointer)
    entry.phase = prevPre.phase; entry.week = prevPre.week; entry.dayInWeek = prevPre.dayInWeek;
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
  markDirty('checks', 'phase');
  return outcome;
}

