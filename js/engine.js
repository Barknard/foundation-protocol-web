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
  if (hurt) {
    return { ...OUTCOMES.rest,
      title: 'Stop. Rest and check the pain.',
      why: 'Sharp pain is not training stress. Take today off entirely. If the same sharp pain is still there after a few days, or it is point-tender on the bone, see a physio before resuming. ' + OUTCOMES.rest.why };
  }
  if (feel <= 1) return OUTCOMES.rest;
  if (feel === 2) return OUTCOMES.modify;
  if (goalMet === 'done') return feel >= 4 ? OUTCOMES.progress : OUTCOMES.repeat;
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
  return pd.week[Math.max(0, Math.min(idx, pd.week.length - 1))];
}
function advancePointer() {
  const cur = state.phase || { phase: 0, week: 1, dayInWeek: 1, sessionsCleared: 0, lastDecision: null };
  const pd = PHASES[cur.phase];
  let { phase, week, dayInWeek } = cur;
  dayInWeek += 1;
  if (dayInWeek > pd.week.length) {
    dayInWeek = 1; week += 1;
    if (week > pd.totalWeeks) { week = 1; phase = Math.min(phase + 1, PHASES.length - 1); }
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
  let outcome = decide(goalMet, feel, hurt);
  // When something hurts, route to the dedicated injury outcome: clinician escalation on a red flag,
  // otherwise the PEACE & LOVE rest/protect card (previously these were defined but never shown).
  if (hurt) outcome = redFlag ? INJURY_FLAG : INJURY_REST;
  const cur = state.phase || {};
  const today = isoToday();
  // --- Injury handling (PEACE & LOVE / red-flag screen) ---
  const wasInRice = injuryInRice();
  if (hurt) {
    const prev = (state.injury && !state.injury.clearedAt) ? state.injury : null;   // re-flagging extends the window
    const now = Date.now();
    state.injury = { parts: parts || [], since: now, riceUntil: now + 3 * 86400000, easeUntil: now + 10 * 86400000, kind: 'acute', redFlag: !!redFlag, extended: prev ? (prev.extended || 0) + 1 : 0, firstSince: prev ? (prev.firstSince || prev.since) : now };
  } else if (injuryActive()) {
    // re-checked with no pain: the injury is settling — clear it and resume
    state.injury = null;
  }
  // --- Ease back: no load jump on the first session back after a layoff or within the injury-protect window ---
  const lay = layoffTier();
  if (!hurt && outcome.key === 'progress' && (lay || wasInRice)) outcome = OUTCOMES.repeat;
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
  }
  if (alreadyCheckedToday) state.checks[existingIdx] = entry; else state.checks.push(entry);
  if (nowIsProgress && !prevWasProgress) {
    advancePointer();
    willAdvance = true;
  } else if (!nowIsProgress && prevWasProgress && prevPre) {
    state.phase = { phase: prevPre.phase, week: prevPre.week, dayInWeek: prevPre.dayInWeek, sessionsCleared: prevPre.sessionsCleared, lastDecision: new Date().toISOString() };
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

