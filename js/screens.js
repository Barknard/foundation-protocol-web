'use strict';
// ============================================================
// SCREENS
// ============================================================
function renderLoading() {
  return `<div class="screen"><div class="sp-48"></div><div class="sp-48"></div>
    <div style="text-align:center;"><img class="brand-logo" src="logo.png" alt="The Hard Part" style="max-width:220px;"></div></div>`;
}

// ---------- ONBOARDING (stepped wizard; research: docs/EVIDENCE-REVIEW.md + onboarding research) ----------
const ONB_LABELS = ['Welcome', 'Numbers', 'Plan'];
const ONB_REAL = 3;
function planPreviewHtml(phase) {
  if (phase == null) return '';
  return `<div class="plan-preview"><span class="label" style="color:var(--mobility);">Your plan</span><div class="sp-4"></div><div class="body">Got it — here's <strong>your</strong> plan: <strong>${escHtml(PHASES[phase].name)}</strong>. We'll move you up the moment you're ready — never before.</div></div>`;
}
function renderOnboarding() {
  const p = state._onb = state._onb || { step:1, username: (state.profile && state.profile.username) || state.activeUser || '', weight:'', pushup:'', walk:'', age:'', phase:0, unit: state.settings.units || 'imperial' };
  if (!p.step) p.step = 1;
  setTimeout(bindOnboarding, 0);
  const imp = p.unit === 'imperial';
  const r = Math.min(p.step, ONB_REAL);   // r is 1..3
  let body = '';
  if (r === 1) body = `
    <div class="brand"><img class="brand-full" src="logo.png" alt="The Hard Part"></div>
    <p class="hp-quote">“It gets easier. Every day it gets a little easier. But you have to do it every day; that’s the hard part. But it does get easier.”</p>
    <div class="sp-16"></div>
    ${(() => { const others = savedPersonas(); if (!others.length) return ''; return `<div class="card" style="margin-bottom:14px;"><span class="label" style="color:var(--milestone);">Welcome back</span><div class="sp-8"></div><div class="row gap-8"><select id="onb-resume-sel" style="flex:1;min-width:0;padding:11px 12px;background:var(--surface-1);color:var(--paper);border:1px solid var(--rule);border-radius:12px;font-size:16px;">${others.map(s => `<option value="${escHtml(s)}">${escHtml(s)}</option>`).join('')}</select><button class="secondary" id="onb-resume-go" style="width:auto;flex:0 0 auto;">Continue</button></div><div class="help">Or set up a new profile below.</div></div>`; })()}
    <div class="field"><label for="onb-username">Username</label><input type="text" id="onb-username" value="${escHtml(p.username)}" placeholder="e.g. Sisyphus" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="username"><div class="help">Pick any name — it's just the label on your private profile. Change it anytime.</div></div>
    <div class="field"><label for="onb-age">Age</label><input type="number" inputmode="numeric" id="onb-age" value="${p.age}" placeholder="e.g. 42"><div class="help">Keeps your plan age-appropriate — recovery, deloads, and pacing scale with age.</div></div>`;
  else if (r === 2) body = `
    <h1 class="display-s serif">Your numbers</h1><div class="sp-4"></div>
    <p class="body-dim">Two quick self-tests + your weight. Best guess is fine — leave any blank.</p>
    <div class="sp-16"></div>
    <div class="field"><div class="unit-row"><label for="onb-weight">Body weight</label>
      <div class="seg" id="onb-unit"><button type="button" data-u="imperial" class="${imp?'on':''}">lb</button><button type="button" data-u="metric" class="${imp?'':'on'}">kg</button></div></div>
      <div class="conv-wrap"><input type="number" inputmode="decimal" id="onb-weight" step="0.1" value="${p.weight}" placeholder="${imp?'e.g. 173':'e.g. 78.4'}"><span class="conv" id="onb-weight-conv"></span></div>
      <div class="help">Sets your starting strength loads.</div></div>
    <div class="field"><label for="onb-pushup">Pushup test <span class="body-dim" style="font-size:12px;">· optional</span></label><input type="number" inputmode="numeric" id="onb-pushup" value="${p.pushup}" placeholder="e.g. 20"><div class="help">Good-form reps only — stop when form slips, never to failure or pain.</div></div>
    <div class="field"><label for="onb-walk">Walk test <span class="body-dim" style="font-size:12px;">· optional</span></label><input type="number" inputmode="numeric" id="onb-walk" value="${p.walk}" placeholder="e.g. 20 min"><div class="help">Longest you can walk nonstop at an easy, can-still-talk pace.</div></div>`;
  else body = `
    <h1 class="display-s serif">Where are you starting from?</h1><div class="sp-4"></div>
    <p class="body-dim" style="font-size:14px;">Not sure? Pick the first — the safe default. The app moves you up as fast as you are ready.</p><div class="sp-12"></div>
    ${[
      {i:0,t:'New — or back after a break',s:'Walking + mobility, then strength. Recommended.'},
      {i:1,t:'I exercise sometimes',s:'Strength 2× a week with easy cardio.'},
      {i:2,t:'I train regularly',s:'Run-walk, strength continuing underneath.'}
     ].map(o=>`<div class="radio-card ${p.phase===o.i?'selected':''}" data-phase="${o.i}" role="radio" tabindex="0" aria-checked="${p.phase===o.i?'true':'false'}"><div class="dot"></div><div><div class="title">${o.t}</div><div class="body-dim" style="margin-top:2px;">${o.s}</div></div></div>`).join('')}
    <div id="plan-preview">${planPreviewHtml(p.phase)}</div>`;
  // Returning users (saved personas → the "Welcome back · Continue" card) get a compacted
  // step 1 so the extra card never pushes the age field behind the fixed footer.
  const hasResume = (r === 1) && savedPersonas().length > 0;
  return `<div class="screen onb${hasResume ? ' onb-resume' : ''}">${body}</div>`;
}
// Onboarding's frozen header (progress crumb) + frozen footer (Back/Next) — placed by the app shell.
function onbCrumb() {
  const p = state._onb || { step: 1 };
  const r = Math.min(p.step || 1, ONB_REAL), total = ONB_LABELS.length;
  return `<div class="wiz-head"><div class="wiz-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${r}">${ONB_LABELS.map((_,i)=>`<span class="wiz-seg${i<r?' on':''}"></span>`).join('')}</div><div class="wiz-step">Step ${r} of ${total} · ${ONB_LABELS[r-1]}</div></div>`;
}
function onbFooter() {
  const p = state._onb || { step: 1 };
  const r = Math.min(p.step || 1, ONB_REAL), isLast = r === ONB_REAL;
  return `<div class="wiz-nav">${r>1?`<button class="secondary onb-back" id="onb-back">Back</button>`:''}<button class="onb-next" id="onb-next">${isLast?'Start my first session':'Next'}</button></div>`;
}
function bindOnboarding() {
  const get = id => document.getElementById(id);
  const next = get('onb-next'); if (!next) return;   // DOM moved on before this deferred bind ran
  const o = state._onb;
  // "Welcome back" — resume a saved persona via the dropdown (step 1)
  const resumeGo = get('onb-resume-go'), resumeSel = get('onb-resume-sel');
  if (resumeGo && resumeSel) resumeGo.addEventListener('click', () => {
    const slug = resumeSel.value;
    state.activeUser = slug; try { localStorage.setItem(ACTIVE_KEY, slug); } catch (_) {}
    loadUserState(slug); delete state._onb;
    navigate(state.profile ? 'today' : 'onboarding');
    if (state.profile) toast('Welcome back, ' + (state.profile.username || slug), 'success');
  });
  const FIELDS = ['username','weight','pushup','walk','age'];
  const upd = () => FIELDS.forEach(k => { const e = get('onb-'+k); if (e) o[k] = e.value; });
  const updConv = () => { const conv = get('onb-weight-conv'); if (!conv) return; const v = parseFloat(get('onb-weight').value); conv.textContent = (v>0) ? (o.unit==='imperial' ? `≈ ${fmt1(lbToKg(v))} kg` : `≈ ${fmt1(kgToLb(v))} lb`) : ''; };
  FIELDS.forEach(k => { const e = get('onb-'+k); if (e) e.addEventListener('input', upd); });
  // Enter in any field submits the step (like clicking Next); Enter on the resume dropdown resumes.
  const enterAdvance = (e) => { if (e.key === 'Enter') { e.preventDefault(); upd(); next.click(); } };
  FIELDS.forEach(k => { const e = get('onb-'+k); if (e) e.addEventListener('keydown', enterAdvance); });
  if (resumeSel) resumeSel.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (resumeGo) resumeGo.click(); } });
  const wEl = get('onb-weight'); if (wEl) wEl.addEventListener('input', updConv);
  document.querySelectorAll('#onb-unit button').forEach(b => b.addEventListener('click', () => {
    const u = b.getAttribute('data-u'); if (u === o.unit) return;
    const cur = parseFloat(wEl.value);
    if (cur > 0) wEl.value = u === 'metric' ? fmt1(lbToKg(cur)) : fmt1(kgToLb(cur));
    o.unit = u;
    document.querySelectorAll('#onb-unit button').forEach(x => x.classList.toggle('on', x.getAttribute('data-u') === u));
    wEl.placeholder = u === 'imperial' ? 'e.g. 173' : 'e.g. 78.4';
    upd(); updConv();
  }));
  const selectPhase = (el) => {
    o.phase = Number(el.getAttribute('data-phase'));
    document.querySelectorAll('[data-phase]').forEach(x => { const on = x === el; x.classList.toggle('selected', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); });
    const pv = get('plan-preview'); if (pv) pv.innerHTML = planPreviewHtml(o.phase);
  };
  document.querySelectorAll('[data-phase]').forEach(el => {
    el.addEventListener('click', () => selectPhase(el));
    // keyboard: Space selects; Enter selects and advances (so the whole flow is keyboard-only)
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPhase(el); if (e.key === 'Enter') next.click(); } });
  });
  updConv();
  const back = get('onb-back'); if (back) back.addEventListener('click', () => { o.step = Math.max(1, (o.step||1) - 1); render(); });
  next.addEventListener('click', () => {
    upd();
    const r = o.step || 1;
    if (r === 1) {
      if (!slugify(o.username)) { toast('Pick a username to continue','error'); return; }
      const slug = slugify(o.username);
      // Block a name that collides with an existing persona on this device (distinct names can slugify the same),
      // so onboarding never silently overwrites someone else's saved data.
      if (slug !== state.activeUser && localStorage.getItem(userStateKey(slug))) { toast('That name is already used on this device — pick another, or load it from Settings.','error'); return; }
      const ag = parseInt(o.age,10); if (!(ag>=13 && ag<=100)) { toast('Enter a valid age (13–100)','error'); return; }
    }
    if (r === 2) {
      const w = o.unit==='imperial' ? lbToKg(parseFloat(o.weight)) : parseFloat(o.weight);
      if (!(w>=20 && w<=400)) { toast('Enter a valid body weight','error'); return; }
      const pu = o.pushup==='' ? 0 : parseInt(o.pushup,10), wk = o.walk==='' ? 0 : parseInt(o.walk,10);   // optional → 0
      if (!(pu>=0 && pu<=300)) { toast('Pushups should be a number (or leave blank)','error'); return; }
      if (!(wk>=0 && wk<=600)) { toast('Walk minutes should be a number (or leave blank)','error'); return; }
    }
    if (r < ONB_REAL) { o.step = r + 1; render(); return; }
    // finish
    const w = o.unit==='imperial' ? lbToKg(parseFloat(o.weight)) : parseFloat(o.weight);
    const pu = o.pushup==='' ? 0 : parseInt(o.pushup,10), wk = o.walk==='' ? 0 : parseInt(o.walk,10), ag = parseInt(o.age,10), slug = slugify(o.username);
    state.settings.units = o.unit; state.activeUser = slug;
    // A brand-new persona must not inherit the previous one's RIR loads / rep targets / ramp.
    state.lifts = {}; state.returnRamp = null;
    state.profile = { username: o.username.trim().slice(0,40), usernameSlug: slug, weightKg: Math.round(w*10)/10, maxPushup:pu, longestWalkMin:wk, age:ag, startingPhase:o.phase, createdAt:Date.now() };
    state.phase = { phase:o.phase, week:1, dayInWeek:1, sessionsCleared:0, lastDecision:null };
    saveLocal();
    logEvent('profile', `Created persona "${state.profile.username}" · starting ${PHASES[o.phase].name}`);
    // A real user gesture maximizes the chance the browser grants persistent storage.
    if (typeof ensurePersistentStorage === 'function' && !state.settings.storagePersisted) { try { ensurePersistentStorage(); } catch (_) {} }
    delete state._onb;
    celebrate("You're set up. Let's do today's session.", () => navigate('today'));
  });
}

// ---------- TODAY ----------
// Why-this-session rationale (grounded in docs/EVIDENCE-REVIEW.md)
function dayWhy() {
  const ph = state.phase?.phase ?? state.profile?.startingPhase ?? 0;
  const wk = state.phase?.week ?? 1;
  const pd = PHASES[ph] || PHASES[0];
  const age = state.profile?.age;
  const blocks = currentDayPlan().blocks;
  const hasStr = blocks.some(b => b.kind === 'strength');
  const hasRun = blocks.some(b => /run/i.test(b.title) || /run/i.test(b.label));
  const hasWalk = blocks.some(b => b.kind === 'cardio') && !hasRun;
  const recent = state.checks.slice(-14);
  const avg = recent.length ? (recent.reduce((s,c)=>s+(c.feel||0),0)/recent.length) : null;
  const cleared = state.phase?.sessionsCleared ?? 0;

  // THE FORMULA — the exact rule that turns your two taps into today's call (shown so you trust it).
  const formula = `Your call = f(goal met?, how you feel 1–5). Done + feel 4–5 → Progress (load steps up a notch). Done + feel 3 → Repeat (consolidate). Feel 2 → easier version, no added load. Feel 1, or any pain → Rest. Load only ever rises when you did the work AND feel recovered — never by the calendar. Coming back from a layoff or an injury window forces a Repeat first (no jump).`;

  // WHERE THIS LEADS — personalised to phase/week/progress.
  const lead = `You're in ${pd.name} — phase ${ph+1} of ${PHASES.length}, week ${wk}${cleared?`, ${cleared} progression${cleared===1?'':'s'} banked`:''}. Each phase earns the next, building toward the capstone: a 10K run plus 100 pushups, a 2-minute plank, and 100 squats in one session.`;

  // Personalised trend / age pacing.
  const trend = avg
    ? `Your readiness has averaged ~${avg.toFixed(1)}/5 over your last ${recent.length} check-in${recent.length===1?'':'s'}${age?`, paced for age ${age}`:''} — that average is what tunes how fast you move.`
    : (age ? `Paced for age ${age}: more recovery and a gentler ramp than a 25-year-old's program.` : '');

  let line, points;
  if (ph === 0) { line = "Build the slowest tissue first — tendons and bone lag your heart and muscles."; points = [
    "Phase 0 is deliberately low-impact: daily walking, 10-min PT (balance, hips, calves), and protein — no loaded lifting or running yet.",
    "Connective tissue and bone adapt over months while muscle and cardio adapt in weeks, so we prep the structure before the stress (Bohm & Arampatzis, Sports Med 2015).",
    "Single-leg balance and hip work is the base that keeps knees and shins healthy once running starts." ]; }
  else if (ph >= 4) { line = "Get faster and more durable with quality sets and quick movements — not 100 grinding reps."; points = [
    "Strength 2–3×/week at RIR 2–3 plus a little power (fast sit-to-stands, step-ups) and brief impact 'bone-snacks' beats high-volume daily work for 40+ (ACSM 2024; Pelland 2025).",
    "Near-daily training to failure raises injury risk without extra benefit at this age — quality and recovery win.",
    "Keep building toward the 10K with the +10% session cap and a lighter week every ~5 weeks." ]; }
  else if (hasRun) { line = "Each run grows at most ~10% over your longest recent run — no hero sessions."; points = [
    "A single run that spikes far past what you've recently done is the strongest injury trigger, so we cap the jump, not the week (Johansen & Nielsen, BJSM 2025).",
    "Run-walk on non-consecutive days keeps impact tolerable while tendons and bone catch up.",
    "Novice and 40+ runners are the highest-risk group — easing in is the whole point." ]; }
  else if (hasStr) { line = "Strength is your #1 injury insurance — and we stop 2–3 reps short of failure."; points = [
    "Resistance training cuts overuse injuries roughly in half (Lauersen, BJSM 2018) — the most evidence-backed thing in this program.",
    "Leave ~2–3 good reps in the tank (RIR 2–3); add load only after you hit your reps cleanly.",
    "The heavy, slow calf and leg work is tendon-prep — it stiffens the tendons running will pound (Bohm & Arampatzis, 2015)." ]; }
  else if (hasWalk) { line = "Easy, conversational cardio builds the aerobic base you can sustain without breaking down."; points = [
    "Easy, conversational pace (you can talk in full sentences) grows the engine with minimal injury risk.",
    "Aerobic fitness (VO₂max) is among the strongest predictors of long-term health (Kokkinos, JACC 2022).",
    "This volume is the foundation your runs are built on." ]; }
  else { line = "Recovery outranks everything — today's job is to let adaptation happen."; points = [
    "Rest and easy movement are when the work you did turns into fitness.",
    "Sleep, hydration, and protein (~1.6 g/kg/day spread across meals) drive recovery, especially at 40+." ]; }

  return { line, points, formula, lead, trend };
}

// A quiet engraved-stone / Sisyphus-spirit line for the post-check "done" card — keeps the brand's
// voice alive on a screen people see daily. Deterministic: advances one line per completed check-in.
const STONE_LINES = [
  'You showed up. That is the whole job today.',
  'Slow, repeated, unglamorous — that is how it holds.',
  'You did the part most people skip.',
  'One more stone up the hill. It counts.',
  'Nothing dramatic happened. That is the win.',
  'The work is showing up again tomorrow. You will.',
  'Quietly stronger than yesterday. That is enough.',
  'It gets easier — because of days exactly like this one.',
];
function stoneLine() { return STONE_LINES[(state.checks ? state.checks.length : 0) % STONE_LINES.length]; }

function renderToday() {
  ensureSession();
  pruneInjury();
  setTimeout(bindToday, 0);
  const dayPlan = currentDayPlan();
  const todayChecks = state.checks.filter(c => c.date === isoToday());
  const lastToday = todayChecks[todayChecks.length - 1];
  const why = dayWhy();
  const whyOpen = !!state.ui.whyOpen;
  // Banner and engine share the SAME dismissal-aware gap (a dismissed bogus gap shows no banner;
  // real absence after the dismissal still does).
  const layoff = layoffTier((typeof effectiveLayoffGap === 'function') ? effectiveLayoffGap() : undefined);
  const counts = sessionCounts();
  const focus = dayPlan.blocks.map(b=>escHtml(b.title.split(' —')[0])).join(' + ') || 'Recovery';
  const PENCIL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  // "Why" card lives at the BOTTOM (action-first layout): the call/session leads, rationale is opt-in below.
  // The dynamic "why" panel (opened by the brain-? icon): today's reasoning, THE formula, where it leads, your trend.
  const whyPanel = `<div class="ex-panel${whyOpen?' open':''}" id="why-panel"><div class="card" style="padding:14px 16px;border:1px solid var(--rule);margin-top:10px;">
      <div class="body" style="margin-bottom:8px;">${escHtml(why.line)}</div>
      ${why.points.map(p=>`<p class="body-dim" style="margin:6px 0;">•  ${escHtml(p)}</p>`).join('')}
      <div class="divider"></div><p class="label">The formula</p><div class="sp-4"></div><p class="body-dim">${escHtml(why.formula)}</p>
      <div class="divider"></div><p class="label">Where this leads</p><div class="sp-4"></div><p class="body-dim">${escHtml(why.lead)}</p>
      ${why.trend?`<div class="divider"></div><p class="label">Your trend</p><div class="sp-4"></div><p class="body-dim">${escHtml(why.trend)}</p>`:''}
    </div></div>`;
  // BACKUP NUDGE: the only off-device copy is a manual export. If it's been >7 days (or never),
  // prompt a one-tap backup. Dismissible for the session (state._backupNudgeDismissed).
  const backupNudge = (() => {
    if (state._backupNudgeDismissed) return '';
    if (typeof backupAgeDays !== 'function') return '';
    // Housekeeping never competes with the day's real content: hide it during an active injury
    // (the recovery card owns the screen) and before there's any history worth protecting (day 1).
    if (typeof standingCall === 'function' && standingCall()) return '';
    if ((state.checks ? state.checks.length : 0) < 2) return '';
    const age = backupAgeDays();
    if (age != null && age <= 7) return '';
    const msg = (age == null) ? 'Your log lives only on this phone — keep a copy somewhere safe.' : `It's been ${age} day${age === 1 ? '' : 's'} since your last backup.`;
    // Neutral strip (no gold stripe / no gold button) — solid gold is reserved for the day's primary action.
    return `<div class="card-block" style="margin-bottom:12px;"><div class="stripe"></div><div class="card bordered" style="padding:14px 16px;"><div class="rx-head"><span class="label">Back up your data</span><button class="icon" id="backup-dismiss" aria-label="Dismiss backup reminder" style="background:none;border:none;color:var(--paper-dim);font-size:18px;line-height:1;">×</button></div><div class="sp-4"></div><div class="body-dim">${escHtml(msg)} <button class="more" id="backup-now">Export now &rarr;</button></div></div></div>`;
  })();
  // One coaching banner max (research: a banner is a thin frame, not a hero) — priority injury > layoff > deload.
  const banners = (() => {
    const sc = standingCall();
    if (sc) return `<div class="card-block ${sc.cls}" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label">${escHtml(sc.label)}</span><div class="sp-4"></div><div class="headline serif">${escHtml(sc.title)}</div><div class="sp-4"></div><div class="body-dim">${sc.action} <button class="more" data-go="check">Re-check pain &rarr;</button></div></div></div>`;
    // DISMISSIBLE LAYOFF BANNER: a forward clock jump (or a clock fix) can manufacture a bogus "time off".
    // "I didn't take time off" records today as an active day (layoffDismissedOn), which zeroes the
    // effective gap above — so the banner disappears without a separate suppression check here.
    if (layoff) return `<div class="card-block milestone" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><div class="rx-head"><span class="label" style="color:var(--milestone);">${escHtml(layoff.title)} · ${layoff.gap} days off</span><button class="icon" id="layoff-dismiss" aria-label="Dismiss — I didn't take time off" style="background:none;border:none;color:var(--paper-dim);font-size:18px;line-height:1;">×</button></div><div class="sp-4"></div><div class="body-dim">${escHtml(layoff.msg)} <button class="more" id="layoff-not-off">I didn't take time off</button></div></div></div>`;
    if (deloadActive()) return `<div class="card-block cardio" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label" style="color:var(--cardio);">Lighter week</span><div class="sp-4"></div><div class="body-dim">Back off ~40% today — fewer sets, one notch easier. We cut the load, not stop, to let hidden fitness surface.</div></div></div>`;
    return '';
  })();
  // PERSISTENT header: the "Why this plan?" brain icon lives in the upper-right of Today
  // in EVERY state (pre-check, checked-in/locked, every phase/week/day). Constant icon,
  // dynamic text (dayWhy()). Hoisted above the banners so it never moves or disappears.
  const whyHead = `<div class="today-head"><div class="today-focus serif">${focus}</div><button class="why-btn" data-exp-why aria-expanded="${whyOpen?'true':'false'}" aria-label="Why this plan — the reasoning behind today's routine">${svgUse('ic-why',24)}<span class="why-lbl">Why this plan?</span></button></div>`;
  return `<div class="screen">
    ${whyHead}
    ${whyPanel}
    <div class="sp-8"></div>
    ${banners}
    ${lastToday ? (() => {
      // DAY-GATE: already checked in today → call up top + done/countdown. Next session locks until the
      // next local calendar day (msUntilTomorrow), so you can't run ahead. One session a day.
      const o = OUTCOMES[lastToday.decision] || OUTCOMES.repeat;
      // When an injury is active the recovery banner above already states the call (e.g. "Rest & protect")
      // and carries the "Re-check pain" action — repeating it as a separate "Today's call: Rest today" card
      // is pure redundancy, so skip it. The countdown card still shows when the next session opens.
      const callCard = standingCall() ? '' : `<div class="card-block ${o.cls}"><div class="stripe"></div><div class="card" style="padding:16px;"><div class="rx-head"><span class="label">${svgUse('ic-check',13)} Today's call</span><button class="icon" data-go="check" data-p-edit="1" aria-label="Edit today's answer" style="background:none;border:none;color:var(--paper-dim);">${PENCIL}</button></div><div class="sp-4"></div><div class="headline serif">${escHtml(o.title)}</div><div class="sp-4"></div><div class="body-dim">${escHtml(o.action)}</div></div></div>
      <div class="sp-12"></div>`;
      const doneMsg = standingCall()
        ? `Logged — your next check-in opens in`
        : `Nice work showing up. Rest up — hydrate and get some protein in. Your next session opens in`;
      return `${callCard}<div class="card-block mobility"><div class="stripe"></div><div class="card" style="padding:16px;"><span class="label" style="color:var(--mobility);">You're done for today</span><div class="sp-4"></div><div class="body">${doneMsg} <span id="next-unlock" class="metric" style="color:var(--milestone);">${fmtCountdown(msUntilTomorrow())}</span> (tomorrow).</div>${standingCall() ? '' : `<div class="sp-12"></div><p class="label" style="text-transform:none;letter-spacing:.02em;font-style:italic;color:var(--paper-dim);margin:0;">${escHtml(stoneLine())}</p>`}</div></div>
      `;
    })() : `
    ${(() => {
      if (standingCall()) return '';   // the recovering card above is the active call
      const lastAny = state.checks[state.checks.length - 1];
      const carried = (!layoff && lastAny && lastAny.date !== isoToday() && daysSinceLastCheck() <= 2 && ['rest','modify','repeat'].includes(lastAny.decision)) ? lastAny : null;
      if (!carried) return '';
      const o = OUTCOMES[carried.decision] || OUTCOMES.repeat;
      return `<div class="card-block ${o.cls}" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label">Still standing · your last call</span><div class="sp-4"></div><div class="headline serif">${escHtml(o.title)}</div><div class="sp-4"></div><div class="body-dim">${escHtml(o.action)}</div></div></div>`;
    })()}
    <div class="goal-row"><div class="goal-vert">Today's goal${counts.total?` · ${counts.done}/${counts.total}`:''}</div><div class="goal-blocks">${dayPlan.blocks.map((b,i)=>{
      const exs = exercisesForBlock(b.key);
      const bdone = exs.filter(e=>exDone(e.key)).length;
      const head = `<div class="card-block ${b.kind}"><div class="stripe"></div>
        <div class="card" style="padding:14px 16px;"><div class="rx-head"><div class="col">
          <span class="label">${escHtml(b.label)}</span><div class="sp-4"></div>
          <div class="title">${escHtml(b.title)}</div>${b.detail?`<div class="body-dim" style="margin-top:4px;">${escHtml(b.detail)}</div>`:''}
        </div><div class="col" style="align-items:flex-end;gap:6px;">${exs.length?`<span class="rx-count">${bdone}/${exs.length}</span><div class="rx-chev">${svgUse('ic-chev-right',20)}</div>`:'<span></span>'}</div></div></div></div>`;
      if (!exs.length) return `<div style="margin-bottom:12px;">${head}</div>`;
      const open = !!state.ui.openBlocks[i];
      const card = (ex)=>{ const dn=exDone(ex.key); return `<div class="ex-card${dn?' done':''}" data-go="exerciseDetail" data-p-key="${escHtml(ex.key)}" role="button" tabindex="0" aria-label="${escHtml(ex.name)} — full steps"><div class="fig">${animatedFigure(ex,72)}</div><div class="meta"><div class="name">${escHtml(ex.name)}</div><div class="rx">${escHtml(ex.rx)}</div><div class="cue">${escHtml(ex.cue)}</div><span class="more">Full steps &rarr;</span></div><button class="ex-check" data-toggle-ex="${escHtml(ex.key)}" aria-pressed="${dn?'true':'false'}" aria-label="Mark ${escHtml(ex.name)} ${dn?'not done':'done'}" title="Mark done">${svgUse('ic-check',16)}</button></div>`; };
      const todo = exs.filter(e=>!exDone(e.key));
      const done = exs.filter(e=>exDone(e.key));
      // RIR: on a strength block, a compact one-line prescription per progressed lift (load/reps live).
      const rxStrip = (b.kind === 'strength' && typeof hasLift === 'function')
        ? exs.filter(e => hasLift(e.key)).map(e => `<div class="lift-line"><span class="lift-name">${escHtml(e.name)}</span><span class="lift-rx">${escHtml(liftPrescription(e.key))}</span></div>`).join('')
        : '';
      const panel = `<div class="ex-panel${open?' open':''}" id="ex-panel-${i}">
        ${rxStrip?`<div class="lift-strip">${rxStrip}</div>`:''}
        ${todo.length?`<div class="ex-grid">${todo.map(card).join('')}</div>`:''}
        ${todo.length?`<button class="markall" data-markall="${escHtml(b.key)}">${svgUse('ic-check',14)} Mark all ${exs.length} complete</button>`:''}
        ${done.length?`<div class="ex-done-label">${svgUse('ic-check',14)} Completed (${done.length})</div><div class="ex-grid">${done.map(card).join('')}</div>`:''}
      </div>`;
      return `<div style="margin-bottom:12px;"><button class="today-block" data-exp="${i}" aria-expanded="${open?'true':'false'}">${head}</button>${panel}</div>`;
    }).join('')}</div></div>
    <div class="sp-12"></div>
    <button data-go="check">Daily check-in</button>`}
    ${backupNudge ? `<div class="sp-24"></div>${backupNudge}` : ''}
    <div class="sp-16"></div>
  </div>`;
}

// Today's dynamic buttons: backup nudge (export/dismiss) + dismissible layoff banner.
function bindToday() {
  if (state.ui.screen !== 'today') return;   // deferred bind fired after navigating away
  const dismiss = document.getElementById('backup-dismiss');
  if (dismiss) dismiss.addEventListener('click', () => { state._backupNudgeDismissed = true; render(); });
  const backupNow = document.getElementById('backup-now');
  if (backupNow) backupNow.addEventListener('click', async () => {
    let ok = false;
    try { ok = await downloadBackup(); } catch (_) { ok = false; }
    if (ok) { state._backupNudgeDismissed = true; toast('Backup saved', 'success'); render(); }
    else toast('Backup not saved — try again from Settings.', 'error');
  });
  const layoffOff = document.getElementById('layoff-not-off');
  const clearLayoff = () => {
    state.layoffDismissedOn = isoToday();   // persisted assertion "I was active today" — caps all gap math across this date
    state.returnRamp = null;                // drop the bogus return-ramp load reduction
    if (typeof logEvent === 'function') logEvent('layoff', 'Dismissed layoff banner — "I didn\'t take time off"');
    if (typeof saveLocal === 'function') saveLocal();
    render();
  };
  if (layoffOff) layoffOff.addEventListener('click', clearLayoff);
  const layoffX = document.getElementById('layoff-dismiss');
  if (layoffX) layoffX.addEventListener('click', clearLayoff);
}

// ---------- CHECK ----------
function bodyMap(sel) {
  // A tappable front-facing body silhouette (the visual "where does it hurt?" figure). Every region is
  // an enlarged hit zone that renders >=48px in BOTH axes at phone width, with a real gutter between the
  // left/right pairs — so it's a clear image AND clears the WCAG 2.5.5/2.5.8 tap-target minimum (the
  // previous figure packed ~27x22px regions edge-to-edge). data-part strings are unchanged → engine/injury
  // logic is identical. role=button + aria-pressed + Enter/Space keyboard (wired in bindCheck).
  const a = (part) => `data-part="${escHtml(part)}" role="button" tabindex="0" aria-label="${escHtml(part)}" aria-pressed="${sel.includes(part) ? 'true' : 'false'}"`;
  const on = (part) => sel.includes(part) ? ' sel' : '';
  const seg = (part, x, y, w, h, rx) => `<rect class="bm-seg${on(part)}" ${a(part)} x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx == null ? 4 : rx}"/>`;
  const segC = (part, cx, cy, r) => `<circle class="bm-seg${on(part)}" ${a(part)} cx="${cx}" cy="${cy}" r="${r}"/>`;
  // Stocky proportions (viewBox 100x152) so the WHOLE figure fits one phone screen with no scroll, while
  // every region still renders ~44-48px at phone width (the figure is height-fitted by fitBodyMap()).
  // Distinct shapes per leg segment so they don't all read as identical squares: thigh = wide tall block,
  // knee = CIRCLE (a joint), shin = narrower tall block, foot = wide landscape block. Centre gutter (x48|x52).
  return `<svg viewBox="0 0 100 152" class="bodymap" role="group" aria-label="Body map — tap where it hurts. Select all that apply.">
    ${segC('head/neck',50,12,11)}
    ${seg('left shoulder',22,24,16,15,5)}${seg('right shoulder',62,24,16,15,5)}
    ${seg('chest',38,25,24,15,5)}${seg('core',39,42,22,15,5)}
    ${seg('left arm',13,26,15,42,7)}${seg('right arm',72,26,15,42,7)}
    ${seg('hip / groin',34,59,32,16,6)}
    ${seg('left thigh',31,77,17,20,7)}${seg('right thigh',52,77,17,20,7)}
    ${segC('left knee',39.5,105,8.5)}${segC('right knee',60.5,105,8.5)}
    ${seg('left lower leg',32,115,15,18,5)}${seg('right lower leg',53,115,15,18,5)}
    ${seg('left foot',29,135,19,15,7)}${seg('right foot',52,135,19,15,7)}
  </svg>`;
}
// Live breadcrumb text for the body-map selection.
function bmPickText(parts) {
  if (!parts || !parts.length) return 'Tap the figure to mark where it hurts.';
  return 'Hurting: ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ');
}
// Size the body figure to fill exactly the space left between the prompt above and the "Nothing hurts"
// button + fixed footer below, so the whole hurt screen fits one phone viewport with NO scroll on any
// device. Regions then render as large as that space allows (~48px on a 390x844 phone).
function fitBodyMap() {
  const svg = document.querySelector('svg.bodymap');
  if (!svg) return;
  // top is fixed by the prompt/breadcrumb above (independent of the figure's own height), so no reset needed.
  const top = svg.getBoundingClientRect().top;
  const main = document.querySelector('.app-main');
  const padB = (main ? parseFloat(getComputedStyle(main).paddingBottom) : 0) || 96;   // reserves the fixed footer
  const avail = (window.innerHeight || 800) - top - padB - 14;   // +14 = figure bottom margin + safety
  // Floor kept low (180) so short/landscape viewports stay within `avail` (no scroll under the fixed footer);
  // `avail` already subtracts the footer reservation, so we never force the figure taller than fits.
  svg.style.height = Math.max(180, Math.min(avail, 540)) + 'px';
}
function renderCheck() {
  ensureSession();
  const { done, total } = sessionCounts();
  const allEx = total > 0 && done === total;
  // Editing today's answer: pre-fill from the SAVED record unconditionally so the pencil always shows
  // the logged answer, not a stale half-edited draft left over from an abandoned check-in.
  const todayCheck = state.checks.find(c => c.date === isoToday());
  if (state.ui.params && state.ui.params.edit && todayCheck) {
    state._chk = { goalMet: todayCheck.goalMet, feel: todayCheck.feel, hurt: !!todayCheck.hurt, parts: (todayCheck.parts || []).slice(), redFlag: false, painChecked: !!todayCheck.hurt || (todayCheck.feel != null && todayCheck.feel <= 2) };
    state.ui.params.edit = false;   // consume ONCE — otherwise every re-render (e.g. changing feel calls render()) re-prefills from the saved check and clobbers the in-progress edit
  }
  // On a pain re-check, pre-seed the prior injury location so the body-map shows what was already flagged
  // (and a "still hurts" submit keeps it) instead of starting blank and erasing the location.
  const reChkSeed = (injuryActive() && state.injury && state.injury.parts) ? state.injury.parts.slice() : [];
  state._chk = state._chk || { goalMet: allEx ? 'done' : null, feel: null, hurt: false, parts: reChkSeed, redFlag: false };
  if (!state._chk.parts) state._chk.parts = [];
  setTimeout(bindCheck, 0);
  const t = state._chk;
  const ready = t.goalMet && t.feel;
  const faces = { 5:'😀', 4:'🙂', 3:'😐', 2:'😕', 1:'😵' };
  const reChk = injuryActive();
  const gl = { done:'Goal met', partial:'Partial goal', missed:'Goal missed' }[t.goalMet] || 'Goal not set';
  return `<div class="screen">
    ${reChk ? `<p class="body-dim">Still sore, or good to ease back in?</p><div class="sp-20"></div>` : `<div class="sp-8"></div>`}
    ${t.hurt ? `
    <button class="chk-min" data-clearhurt aria-label="Change your goal or feeling answer">${gl} · Feel ${t.feel?`${t.feel}/5`:'—'} <span class="more">change</span></button>
    <div class="sp-8"></div>
    <p class="label bm-prompt">Where does it hurt? Tap all that apply.</p>
    <p class="bm-pick" id="bm-pick" aria-live="polite">${escHtml(bmPickText(t.parts))}</p>
    ${bodyMap(t.parts)}
    ` : `
    <p class="label">Did you meet today's goal?</p>${allEx ? `<div class="sp-4"></div><p class="body-dim" style="color:var(--mobility);font-size:14px;">${svgUse('ic-check',13)} All ${total} exercises checked off — marked Done automatically.</p>` : ''}<div class="sp-8"></div>
    ${(() => {
      const opts = [['done','yes',`${svgUse('ic-check',13)} Done`],['partial','',`${svgUse('ic-goal-partial',13)} Partial`],['missed','no',`${svgUse('ic-goal-missed',13)} Missed`]];
      const selIdx = opts.findIndex(o => o[0] === t.goalMet);
      const tab = selIdx >= 0 ? selIdx : 0;   // roving tabindex: one stop into the group
      return `<div class="chip-row" data-q="goal" role="radiogroup" aria-label="Did you meet today's goal?">${opts.map((o,i) => { const on = o[0] === t.goalMet; return `<button class="chip ${o[1]} ${on?'active':''}" data-val="${o[0]}" role="radio" aria-checked="${on?'true':'false'}" tabindex="${i===tab?'0':'-1'}">${o[2]}</button>`; }).join('')}</div>`;
    })()}
    <div class="sp-24"></div>
    <p class="label">How do you feel?</p><div class="sp-8"></div>
    ${(() => {
      const order = [5,4,3,2,1];
      const selIdx = order.indexOf(t.feel);
      const tab = selIdx >= 0 ? selIdx : 0;
      return `<div class="feel-grid" data-q="feel" role="radiogroup" aria-label="How do you feel?">${order.map((v,i) => { const on = t.feel===v; return `<button class="feel ${on?'active':''} feel-${v}" data-val="${v}" role="radio" aria-checked="${on?'true':'false'}" aria-label="${escHtml(FEEL_LABELS[v])}" tabindex="${i===tab?'0':'-1'}"><span class="feel-face" aria-hidden="true">${faces[v]}</span><span class="feel-label">${FEEL_LABELS[v]}</span></button>`; }).join('')}</div>`;
    })()}
    <div class="sp-20"></div>
    ${(t.feel && t.feel <= 2 && !t.painChecked) ? `
      <div class="card-block strength"><div class="stripe"></div><div class="card" style="padding:14px 16px;">
        <div class="title">Low days are normal — is something actually hurting?</div>
        <div class="body-dim" style="font-size:14px;margin-top:2px;">Tired or sore all over is fatigue, not injury. A joint, one spot, or sharp/new pain is different — soreness never lives inside a joint.</div>
        <div class="sp-12"></div>
        <div class="col" style="gap:8px;">
          <button class="secondary" id="chk-pain-no">Just tired / sore all over</button>
          <button class="secondary" id="chk-pain-spot">One spot hurts</button>
          <button id="chk-pain-sharp">Sharp / new / worse pain</button>
        </div>
      </div></div>`
    : `<button class="hurt-toggle" id="chk-hurt">Something hurts?</button>`}
    <div class="sp-16"></div>
    <p class="body-dim" style="font-size: 14px;">How you feel drives the call — flag pain or feel rough and it eases you back, keeping pain low and gone by morning.</p>
    ${(!state.checks || state.checks.length === 0) ? `<div class="sp-8"></div><p class="body-dim" style="font-size:14px;">Your two answers become your call for today — the app's read on whether to push, hold, ease off, or rest.</p>` : ''}
    <p class="gate-hint" id="chk-gate" aria-live="polite">${ready ? '' : 'Pick a goal and how you feel to see your call.'}</p>
    `}
  </div>`;
}
// Can the check-in be submitted? Normally needs goal + feel. But in HURT mode, marking where it hurts IS
// the answer (the hurt path drives a Rest/injury call regardless of goal/feel), so >=1 selected part enables it.
function chkReady(t) {
  if (!t) return false;
  if (t.hurt) return !!(t.parts && t.parts.length);   // hurt mode: must mark WHERE it hurts (re-check pre-seeds the prior spot)
  return !!(t.goalMet && t.feel);
}
// Check-in's frozen footer action (placed by the app shell).
function checkFooter() {
  const t = state._chk || {};
  const ready = chkReady(t);
  // In hurt mode the "Nothing hurts — clear" escape lives here (not in the scroll area) so the body figure
  // can fill the screen with no scroll. Single primary CTA otherwise.
  const clear = t.hurt ? `<button class="onb-back ghost" data-clearhurt>Nothing hurts</button>` : '';
  // aria-describedby only when the #chk-gate hint actually exists (it's rendered in the non-hurt branch only).
  return `<div class="wiz-nav">${clear}<button class="onb-next" id="chk-go" ${ready?'':'disabled'}${t.hurt ? '' : ' aria-describedby="chk-gate"'}>See the call</button></div>`;
}
function bindCheck() {
  if (state.ui.screen !== 'check' || !state._chk) return;   // deferred bind fired after navigating away
  // Restore keyboard focus to the chosen feel after a feel change re-renders the screen (radiogroup continuity).
  if (state._focusFeel != null) {
    const f = document.querySelector(`[data-q="feel"] [data-val="${state._focusFeel}"]`);
    if (f) f.focus();
    state._focusFeel = null;
  }
  // Restore focus after a hurt-toggle / pain-discriminator / clear re-render (else focus drops to <body>).
  if (state._focusAfter) { const fa = document.querySelector(state._focusAfter); if (fa) fa.focus(); state._focusAfter = null; }
  // Arrow-key roving-tabindex helper shared by both radiogroups.
  const wireArrows = (radios, idx, select) => radios[idx].addEventListener('keydown', e => {
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (idx + 1) % radios.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (idx - 1 + radios.length) % radios.length;
    if (n >= 0) { e.preventDefault(); select(radios[n]); }
  });
  // GOAL radiogroup — selection updates in place (no re-render) + announces via aria-checked + roving tabindex.
  const goal = document.querySelector('[data-q="goal"]');   // absent in hurt mode (goal/feel minimized)
  if (goal) {
    const radios = [...goal.querySelectorAll('[role=radio]')];
    const selectGoal = (btn) => {
      state._chk.goalMet = btn.getAttribute('data-val');
      radios.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      btn.focus(); refreshGo(); updateGate();
    };
    radios.forEach((btn, idx) => { btn.addEventListener('click', () => selectGoal(btn)); wireArrows(radios, idx, selectGoal); });
  }
  // FEEL radiogroup — selection re-renders (the low-feel pain nudge appears for feel 1–2); _focusFeel restores focus.
  const feel = document.querySelector('[data-q="feel"]');
  if (feel) {
    const radios = [...feel.querySelectorAll('[role=radio]')];
    const selectFeel = (btn) => { state._chk.feel = Number(btn.getAttribute('data-val')); state._focusFeel = state._chk.feel; render(); };
    radios.forEach((btn, idx) => { btn.addEventListener('click', () => selectFeel(btn)); wireArrows(radios, idx, selectFeel); });
  }
  // These handlers re-render the whole screen; set _focusAfter so keyboard focus lands somewhere sensible
  // afterward (render() replaces #app wholesale, otherwise focus drops to <body>). Restored in bindCheck's top block.
  const hurt = document.getElementById('chk-hurt');
  if (hurt) hurt.addEventListener('click', () => {
    state._chk.hurt = !state._chk.hurt;
    if (!state._chk.hurt) { state._chk.parts = []; state._chk.redFlag = false; }
    state._focusAfter = state._chk.hurt ? '.bm-seg[data-part]' : '#chk-hurt';
    render();
  });
  // Low-feel pain discriminator (feel 1–2): 3-way, default fatigue — keeps soreness ≠ injury (DOMS isn't in a joint).
  const pno = document.getElementById('chk-pain-no');
  if (pno) pno.addEventListener('click', () => { state._chk.painChecked = true; state._chk.hurt = false; state._focusAfter = '#chk-hurt'; render(); });
  const pspot = document.getElementById('chk-pain-spot');
  if (pspot) pspot.addEventListener('click', () => { state._chk.hurt = true; state._chk.painChecked = true; state._focusAfter = '.bm-seg[data-part]'; render(); });
  const psharp = document.getElementById('chk-pain-sharp');
  if (psharp) psharp.addEventListener('click', () => { state._chk.hurt = true; state._chk.painChecked = true; state._focusAfter = '.bm-seg[data-part]'; render(); });
  // Clear / "nothing hurts" / "change" → back to the goal+feel questions.
  document.querySelectorAll('[data-clearhurt]').forEach(el => el.addEventListener('click', () => { state._chk.hurt = false; state._chk.parts = []; state._chk.redFlag = false; state._chk.painChecked = false; state._focusAfter = '#chk-hurt'; render(); }));
  // Body-map regions are SVG shapes with role=button (multi-select, aria-pressed). Toggle in place
  // (no re-render → keeps scroll position and focus). SVG isn't a native button, so wire Enter/Space.
  document.querySelectorAll('[data-part]').forEach(el => {
    const toggle = () => {
      const p = el.getAttribute('data-part'); const i = state._chk.parts.indexOf(p);
      const on = i < 0;
      if (on) state._chk.parts.push(p); else state._chk.parts.splice(i, 1);
      el.classList.toggle('sel', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      const pick = document.getElementById('bm-pick');   // live "Hurting: …" breadcrumb
      if (pick) pick.textContent = bmPickText(state._chk.parts);
      refreshGo();   // marking where it hurts enables "See the call"
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  // Fit the body figure to fill the viewport (no scroll); keep it fitted on rotate/resize.
  if (state._chk.hurt) {
    requestAnimationFrame(() => { try { fitBodyMap(); } catch (_) {} });
    if (!window._bmFitBound) { window._bmFitBound = true; window.addEventListener('resize', () => { try { fitBodyMap(); } catch (_) {} }); }
  }
  function refreshGo() { const g = document.getElementById('chk-go'); if (g) g.disabled = !chkReady(state._chk); }
  function updateGate() { const el = document.getElementById('chk-gate'); if (el) el.textContent = (state._chk.goalMet && state._chk.feel) ? '' : 'Pick a goal and how you feel to see your call.'; }
  const go = document.getElementById('chk-go');
  if (go) go.addEventListener('click', () => {
    const t = state._chk;
    if (!chkReady(t)) return;
    // Hurt path: marking where it hurts is the answer; backfill neutral goal/feel so the stored record and
    // readiness trend stay valid (the call is Rest/injury regardless of these values).
    if (t.hurt) { if (!t.goalMet) t.goalMet = 'partial'; if (!t.feel) t.feel = 2; }
    const outcome = applyCheck(t.goalMet, t.feel, t.hurt, t.parts, t.redFlag);
    // A check-in is a user gesture — a good moment to lock in persistent storage.
    if (typeof ensurePersistentStorage === 'function' && !state.settings.storagePersisted) { try { ensurePersistentStorage(); } catch (_) {} }
    // QUOTA FAILURE VISIBLE: applyCheck's save can silently fail when the phone is full. The storage
    // lane sets state._saveError on a failed write; surface it loudly with a one-tap export to recover.
    if (state._saveError) {
      toast('Could not save — phone storage is full. Export a backup now.', 'error');
      // Emergency export: don't block the result screen, but be honest if it didn't land.
      try { downloadBackup().then(ok => { if (!ok) toast('Backup did not leave the device — export from Settings as soon as you can.', 'error'); }); } catch (_) {}
    } else if (typeof storagePressure === 'function') {
      // Pressure warning after a successful save, so the user backs up before the next one fails.
      Promise.resolve().then(async () => { try { const est = await storagePressure(); if (est && est.pct > 0.8) toast('Phone storage is almost full — export a backup soon.', 'error'); } catch (_) {} });
    }
    state.ui.resultOutcome = outcome;
    delete state._chk;
    // First time the program advances into the Target phase → the capstone celebration, once.
    if (state.targetReachedAt && !state.celebrationSeen) { navigate('capstone'); return; }
    navigate('result', { outcome: outcome.key });
  });
}

// ---------- RESULT ----------
function renderResult(outcomeKey) {
  const o = (state.ui.resultOutcome && state.ui.resultOutcome.key === outcomeKey) ? state.ui.resultOutcome : (OUTCOMES[outcomeKey] || OUTCOMES.repeat);
  let modifyHtml = '';
  if (o.key === 'modify') {
    const blocks = currentDayPlan().blocks.map(modifyBlock);
    modifyHtml = `<div class="sp-20"></div><p class="label">Today, easier</p><div class="sp-8"></div>
      ${blocks.map(b=>`<div class="card-block milestone" style="margin-bottom:10px;"><div class="stripe"></div>
        <div class="card" style="padding:12px 14px;"><div class="title">${escHtml(b.title)}</div>
        <div class="body-dim" style="margin-top:4px;">${escHtml(b.detail)}</div></div></div>`).join('')}`;
  }
  const advanced = o.key === 'progress';
  return `<div class="screen result-screen">
    <div class="sp-24"></div>
    <p class="label">The call</p><div class="sp-8"></div>
    <div style="color:var(--${o.cls});display:flex;align-items:center;gap:10px;">${svgUse('ic-call-'+o.key,30)}<h1 class="display-l serif" style="color:var(--${o.cls});margin:0;">${escHtml(o.title)}</h1></div>
    <div class="sp-24"></div>
    <p class="label">What to do</p><div class="sp-8"></div>
    <p class="headline serif">${escHtml(o.action)}</p>
    ${modifyHtml}
    <div class="sp-24"></div>
    <p class="label">Why</p><div class="sp-8"></div>
    <p class="body">${escHtml(o.why)}</p>
    <div class="sp-48"></div>
    <button data-go="today">${advanced ? 'Start next session' : 'Got it'}</button>
    <div class="sp-12"></div>
    <p class="body-dim" style="font-size: 14px;">Source: Saw, Main &amp; Gastin BJSM 2016. Hooper &amp; Mackinnon MSSE 1995. Lally et al. 2010 (a single miss does not erase progress).</p>
  </div>`;
}

// ---------- CAPSTONE CELEBRATION (reaching the Target phase) ----------
function renderCapstone() {
  const sc = state.phase?.sessionsCleared ?? 0;
  return `<div class="screen cap-screen">
    <div class="cap-confetti" aria-hidden="true"><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span><span>•</span></div>
    <div class="brand"><img class="brand-emblem" src="logo.png" alt=""></div>
    <p class="label" style="text-align:center;color:var(--milestone);">Phase 5 of 5 · The Target</p>
    <div class="sp-8"></div>
    <h1 class="display-l serif cap-title">You reached the Target phase.</h1>
    <div class="sp-12"></div>
    <p class="body" style="text-align:center;">${sc} sessions of showing up — the slow, unglamorous, do-it-every-day <em>hard part</em>. You built the engine. Now there's one test left:</p>
    <div class="sp-20"></div>
    <div class="card-block milestone"><div class="stripe"></div><div class="card" style="padding:16px;">
      <span class="label" style="color:var(--milestone);">THE CAPSTONE</span><div class="sp-8"></div>
      <div class="headline serif">10K run + 100 pushups + a 2-minute plank + 100 squats — in one session.</div>
      <div class="sp-8"></div>
      <div class="body-dim">You'll get there with quality strength sets, a little power, and the 10K build — plus a lighter week every ~5 weeks. Not by grinding hundreds of reps a day, which only buys injury at 40+.</div>
    </div></div>
    <div class="sp-32"></div>
    <button data-celebrate-done>Keep going — train for the capstone</button>
    <div class="sp-16"></div>
  </div>`;
}

// ---------- LIBRARY ----------
function renderLibrary() {
  setTimeout(bindLibrary, 0);
  const cats = ['Neuromuscular','Hip','Shin','Day A','Day B','Kettlebell','Mobility','Cardio'];
  return `<div class="screen">
    <div class="field" style="margin-bottom:14px;"><input type="search" id="lib-search" placeholder="Search exercises…" autocapitalize="none" autocorrect="off" aria-label="Search exercises"></div>
    <div id="lib-list">
    ${cats.map(cat=>{ const list=EXERCISES.filter(e=>e.cat===cat); if(!list.length) return '';
      return `<div class="cat-group"><div class="cat-header">${escHtml(cat)}</div>
        ${list.map(ex=>`<button class="lib-row" data-go="exerciseDetail" data-p-key="${escHtml(ex.key)}" data-search="${escHtml((ex.name+' '+(ex.cue||'')+' '+ex.cat).toLowerCase())}">
          <div class="fig">${animatedFigure(ex,84)}</div>
          <div class="text"><div class="name">${escHtml(ex.name)}</div><div class="rx">${escHtml(ex.rx)}</div></div>
          <div class="chev">${svgUse('ic-chev-right',16)}</div></button>`).join('')}</div>`; }).join('')}
    </div>
    <p class="body-dim" id="lib-empty" style="display:none;">No exercises match that search.</p>
    <div class="sp-32"></div>
  </div>`;
}
function bindLibrary() {
  const s = document.getElementById('lib-search'); if (!s) return;
  s.addEventListener('input', () => {
    const q = s.value.trim().toLowerCase();
    document.querySelectorAll('#lib-list .lib-row').forEach(r => { r.style.display = (!q || (r.getAttribute('data-search')||'').includes(q)) ? '' : 'none'; });
    let anyVisible = false;
    document.querySelectorAll('#lib-list .cat-group').forEach(g => { const vis = [...g.querySelectorAll('.lib-row')].some(r => r.style.display !== 'none'); g.style.display = vis ? '' : 'none'; if (vis) anyVisible = true; });
    const empty = document.getElementById('lib-empty'); if (empty) empty.style.display = anyVisible ? 'none' : '';
    if (typeof updateScrollCue === 'function') updateScrollCue();   // filtering changes page height in place
  });
}
// RIR prescription block for a strength lift (loaded/bodyweight/time). Loaded lifts get a ± load
// control that writes state.lifts[key].load and saves; bodyweight/plank show the live target + hint.
function liftRxBlock(key) {
  if (typeof hasLift !== 'function' || !hasLift(key)) return '';
  const lift = getLift(key); if (!lift) return '';
  const rx = liftPrescription(key);
  if (lift.kind === 'loaded') {
    const unit = liftUnitLabel();
    const set = lift.load == null;
    const ctrl = `<div class="lift-set" data-lift="${escHtml(key)}">
      <button class="lift-step" data-lift-d="-1" aria-label="Decrease load">−</button>
      <span class="lift-val">${set ? `Set ${unit}` : `${_fmtLoad(lift.load)} ${unit}`}</span>
      <button class="lift-step" data-lift-d="1" aria-label="Increase load">+</button></div>`;
    return `<div class="divider"></div>
      <p class="label" style="color:var(--milestone);">Today's prescription</p><div class="sp-4"></div>
      <p class="body">${escHtml(rx)}</p><div class="sp-8"></div>${ctrl}`;
  }
  return `<div class="divider"></div>
    <p class="label" style="color:var(--milestone);">Today's prescription</p><div class="sp-4"></div>
    <p class="body">${escHtml(rx)}</p>`;
}
function bindExerciseDetail() {
  if (state.ui.screen !== 'exerciseDetail') return;   // deferred bind fired after navigating away
  document.querySelectorAll('.lift-set').forEach(box => {
    const key = box.getAttribute('data-lift');
    box.querySelectorAll('[data-lift-d]').forEach(btn => btn.addEventListener('click', () => {
      const lift = getLift(key); if (!lift) return;
      const d = Number(btn.getAttribute('data-lift-d'));
      const base = (lift.load == null) ? 0 : lift.load;   // first + from null seeds at one step
      setLiftLoad(key, Math.max(0, base + d * lift.step));
      render();
    }));
  });
}
function renderExerciseDetail(key) {
  const ex = EXERCISES.find(e => e.key === key);
  if (!ex) return `<div class="screen"><p>Not found.</p></div>`;
  setTimeout(bindExerciseDetail, 0);
  return `<div class="screen ex-detail">
    <p class="mono" style="color:var(--milestone); font-size: 15px; letter-spacing:0.05em;">${escHtml(ex.cat)} · ${escHtml(ex.rx)}</p>
    <div class="fig-hero">${animatedFigure(ex,260)}</div>
    ${liftRxBlock(ex.key)}
    <p class="label">Steps</p><div class="sp-8"></div>
    <div class="step-list">${ex.steps.map((s,i)=>`<div class="n">${String(i+1).padStart(2,'0')}</div><div class="t">${escHtml(s)}</div>`).join('')}</div>
    <div class="divider"></div>
    <p class="label" style="color:var(--milestone);">Cue</p><div class="sp-4"></div>
    <p class="body">${escHtml(ex.cue)}</p>
    <div class="sp-16"></div>
  </div>`;
}

// ---------- PROGRESS ----------
function renderProgress() {
  setTimeout(drawReadiness, 0);
  const cleared = state.phase?.sessionsCleared ?? 0;
  const pd = PHASES[state.phase?.phase ?? 0];
  const recent = state.checks.slice(-14);
  const done = recent.filter(c=>c.goalMet==='done').length;
  const partial = recent.filter(c=>c.goalMet==='partial').length;
  const missed = recent.filter(c=>c.goalMet==='missed').length;
  const mix = {
    progress: state.checks.filter(c=>c.decision==='progress').length,
    repeat:   state.checks.filter(c=>c.decision==='repeat').length,
    modify:   state.checks.filter(c=>c.decision==='modify').length,
    rest:     state.checks.filter(c=>c.decision==='rest').length,
  };
  return `<div class="screen">
    <div class="sp-4"></div>
    <div class="card" style="margin-bottom:10px;">
      <span class="label">Program position</span><div class="sp-8"></div>
      <div class="headline serif">${escHtml(pd.name)} · Week ${state.phase?.week ?? 1}</div>
      <div class="body-dim" style="margin-top:4px;">Session ${state.phase?.dayInWeek ?? 1} of ${pd.week.length} · ${cleared} session${cleared===1?'':'s'} cleared total</div>
    </div>
    ${state.checks.length === 0 ? `<div class="card"><span class="label" style="color:var(--mobility);">Your picture starts with day one</span><div class="sp-4"></div><div class="body-dim">Check in each day — your readiness trend and the mix of calls will build here.</div></div>` : `
    <div class="chart">
      <div class="top"><div class="title">Readiness</div><div class="label-sm">feel 1–5</div></div>
      <canvas id="chart-readiness" height="96"></canvas>
      <div class="bottom" id="chart-readiness-bottom"></div>
    </div>
    <div class="card"><div class="stat-cols">
      <div><span class="label">Last 14</span><div class="sp-8"></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-check',12)} Done</span><span class="metric" style="color:var(--mobility);">${done}</span></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-goal-partial',12)} Partial</span><span class="metric" style="color:var(--milestone);">${partial}</span></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-goal-missed',12)} Missed</span><span class="metric" style="color:var(--red-text);">${missed}</span></div>
      </div>
      <div><span class="label">All-time calls</span><div class="sp-8"></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-call-progress',12)} Progress</span><span class="metric" style="color:var(--mobility);">${mix.progress}</span></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-call-repeat',12)} Repeat</span><span class="metric" style="color:var(--cardio);">${mix.repeat}</span></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-call-modify',12)} Modify</span><span class="metric" style="color:var(--milestone);">${mix.modify}</span></div>
        <div class="row between"><span class="body-dim">${svgUse('ic-call-rest',12)} Rest</span><span class="metric" style="color:var(--red-text);">${mix.rest}</span></div>
      </div>
    </div></div>`}
    <div class="sp-8"></div>
  </div>`;
}
function drawReadiness() {
  const canvas = document.getElementById('chart-readiness');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssColor = n => getComputedStyle(document.documentElement).getPropertyValue('--'+n).trim();
  const values = state.checks.slice(-20).map(c => c.feel);
  const w = canvas.clientWidth, h = 96;
  canvas.width = w*dpr; canvas.height = h*dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
  const bottom = document.getElementById('chart-readiness-bottom');
  if (values.length < 2) {
    ctx.fillStyle = cssColor('paper-low'); ctx.font = "13px 'IBM Plex Sans', sans-serif"; ctx.textAlign='center';
    ctx.fillText(values.length===0 ? 'Check in to see readiness' : 'Need two check-ins', w/2, h/2);
    if (bottom) bottom.innerHTML = ''; return;
  }
  const pad = 8, mn = 1, mx = 5, span = mx - mn;
  ctx.strokeStyle = cssColor('rule'); ctx.lineWidth = 1; ctx.setLineDash([4,4]);
  [2].forEach(y => { const ny = pad + (h-pad*2) - ((y-mn)/span)*(h-pad*2); ctx.beginPath(); ctx.moveTo(pad,ny); ctx.lineTo(w-pad,ny); ctx.stroke(); });
  ctx.setLineDash([]);
  ctx.strokeStyle = cssColor('cardio'); ctx.lineWidth = 2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath();
  values.forEach((v,i)=>{ const x=pad+(i/(values.length-1))*(w-pad*2); const y=pad+(h-pad*2)-((v-mn)/span)*(h-pad*2); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.stroke();
  ctx.fillStyle = cssColor('cardio');
  values.forEach((v,i)=>{ const x=pad+(i/(values.length-1))*(w-pad*2); const y=pad+(h-pad*2)-((v-mn)/span)*(h-pad*2); ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); });
  if (bottom) { const last = values[values.length-1]; bottom.innerHTML = `<span>Latest ${FEEL_LABELS[last]}</span><span>${values.length} check-ins</span>`; }
}
window.addEventListener('resize', () => { if (state.ui.screen === 'progress') drawReadiness(); });

// ---------- PHASE LIST / DETAIL ----------
// Plain-language formula + the research each phase is based on (shown on the Phase tab).
const PHASE_WHY = {
  0: { formula: "For 4 weeks you do gentle, repeatable movement (walking, light bodyweight prep, mobility) plus a daily 2-tap check-in. You advance only when you can repeatedly hit easy goals AND feel good doing them — because tendons and bone strengthen far more slowly than muscle and heart, so this phase lets the slow tissue catch up before any load goes on. Cap: never raise a session more than ~10% over the prior week.",
       refs: ["Bohm, Mersmann & Arampatzis — Sports Medicine, 2015 (tendon & bone adapt slower than muscle/cardio).","Johansen & Nielsen et al. — BJSM, 2025 (avoid >10% single-session spikes).","Saw, Main & Gastin — BJSM, 2016 (subjective wellbeing tracks readiness)."] },
  1: { formula: "For 8 weeks the main job is strength, taken close to but never to failure (~2–3 reps in reserve). You advance by meeting strength goals while still feeling recovered — strength roughly halves injury risk and builds the capacity for running, and for the 40+ body stopping shy of failure gives nearly all the benefit with far less strain.",
       refs: ["Lauersen, Andersen & Andersen — BJSM, 2018 (strength training cuts injuries ~50%).","ACSM guidelines / Pelland et al., 2025 (2–3 reps in reserve; anti-failure for older adults).","Bohm, Mersmann & Arampatzis — Sports Medicine, 2015 (strength builds tendon/bone capacity)."] },
  2: { formula: "Over 12 weeks you add running in tiny, controlled doses (run-walk intervals) on top of maintained strength. You advance only when you complete the run goal and feel recovered the next day — and never grow a run more than ~10% week to week, because a new runner's tendons, bone and joints are the limiter, not the lungs.",
       refs: ["Johansen & Nielsen et al. — BJSM, 2025 (+10% session-spike cap limits running injury).","Bohm, Mersmann & Arampatzis — Sports Medicine, 2015 (slow tissue adaptation governs safe running).","Lauersen, Andersen & Andersen — BJSM, 2018 (maintained strength halves running injury)."] },
  3: { formula: "For 16 weeks you steadily grow running distance and strength volume to raise aerobic fitness (VO₂max) — one of the strongest predictors of health and longevity. You advance by hitting progressively bigger goals while still feeling good, always under the +10% weekly cap and with strength still shy of failure.",
       refs: ["Kokkinos et al. — JACC, 2022 (higher VO₂max strongly lowers mortality).","Johansen & Nielsen et al. — BJSM, 2025 (+10% load-spike cap during the build).","ACSM guidelines / Pelland et al., 2025 (progressive overload with 2–3 RIR)."] },
  4: { formula: "The capstone: sharpen everything toward one session — a 10K plus 100 pushups, a 2-minute plank, and 100 squats — by peaking aerobic fitness and strength endurance. You attempt it only when your check-ins confirm you're recovered and ready, never forcing it on a tired body, because readiness is the gate that keeps a hard effort from becoming an injury.",
       refs: ["Kokkinos et al. — JACC, 2022 (peak VO₂max underpins the 10K demand).","Saw, Main & Gastin — BJSM, 2016 (subjective readiness gates peak/test efforts).","Lauersen, Andersen & Andersen — BJSM, 2018 (accumulated strength protects the capstone effort)."] },
};
function renderPhaseList() {
  const curIdx = state.phase?.phase ?? 0;
  const cw = PHASE_WHY[curIdx];
  return `<div class="screen">
    <h1 class="display-s serif">Five phases.<br>Each earns the next.</h1><div class="sp-16"></div>
    ${cw ? `<div class="card" style="margin-bottom:18px;border:1px solid var(--milestone);">
      <span class="label" style="color:var(--milestone);">Your phase now · the formula</span><div class="sp-8"></div>
      <div class="body">${escHtml(cw.formula)}</div>
      <div class="sp-12"></div><p class="label">Based on</p><div class="sp-4"></div>
      ${cw.refs.map(r=>`<p class="body-dim" style="font-size:14px;margin:3px 0;">${escHtml(r)}</p>`).join('')}
    </div>` : ''}
    ${PHASES.map(p=>`<button class="lib-row" data-go="phaseDetail" data-p-index="${p.index}" style="grid-template-columns:1fr 16px; height:auto; padding:14px 16px; ${p.index===curIdx?'background:var(--surface-1);border:1px solid var(--milestone);':''}">
      <div class="text"><div class="row between"><span class="label">PHASE 0${p.index}</span>${p.index===curIdx?'<span class="label" style="color:var(--milestone);">CURRENT</span>':''}</div>
      <div class="headline serif" style="margin-top:4px;">${escHtml(p.name)}</div>
      <div class="body-dim" style="margin-top:2px;">${escHtml(p.weeks)}</div>
      <div class="body-dim" style="margin-top:8px;">${escHtml(p.summary)}</div></div>
      <div class="chev">${svgUse('ic-chev-right',16)}</div></button>`).join('')}
    <div class="sp-32"></div>
  </div>`;
}
function renderPhaseDetail(index) {
  const p = PHASES[Number(index)||0];
  return `<div class="screen">
        <p class="label">Phase 0${p.index}</p><div class="sp-8"></div>
    <div class="sp-4"></div>
    <p class="label-sm" style="color:var(--milestone);">${escHtml(p.weeks)}</p><div class="sp-16"></div>
    <p class="body">${escHtml(p.summary)}</p>
    <div class="sp-24"></div><p class="label">Focus this phase</p><div class="sp-8"></div>
    ${p.focus.map(f=>`<p class="body" style="margin:4px 0;">•  ${escHtml(f)}</p>`).join('')}
    <div class="sp-20"></div><p class="label">Exit criteria</p><div class="sp-8"></div>
    ${p.exit.map(f=>`<p class="body" style="margin:4px 0;">•  ${escHtml(f)}</p>`).join('')}
    ${PHASE_WHY[p.index]?`<div class="divider"></div><p class="label" style="color:var(--milestone);">The formula</p><div class="sp-8"></div><p class="body">${escHtml(PHASE_WHY[p.index].formula)}</p><div class="sp-12"></div><p class="label">References</p><div class="sp-8"></div>${PHASE_WHY[p.index].refs.map(r=>`<p class="body-dim" style="font-size:14px;margin:3px 0;">${escHtml(r)}</p>`).join('')}`:''}
    <div class="divider"></div><p class="label">Sample week</p><div class="sp-12"></div>
    ${p.week.map(d=>`<div style="margin-bottom:12px;"><div class="title-sm" style="color:var(--paper-dim); margin-bottom:6px;">${escHtml(d.day)}</div>
      ${d.blocks.map(b=>`<div class="card-block ${b.kind}" style="margin-bottom:6px;"><div class="stripe"></div>
        <div class="card" style="padding:10px 12px;"><span class="label">${escHtml(b.label)}</span><div style="margin-top:2px;font-size: 17px;">${escHtml(b.title)}</div></div></div>`).join('')}
      </div>`).join('')}
    <div class="sp-32"></div>
  </div>`;
}

// ---------- ACTIVITY LOG ----------
function renderLog() {
  setTimeout(bindLog, 0);
  const log = (state.log || []).slice().reverse();
  return `<div class="screen">
        <div class="sp-4"></div>
    <p class="body-dim">A timestamped record of every check-in, call, progression, injury, and layoff for ${escHtml(state.profile?.username || 'this persona')}.</p>
    <div class="sp-16"></div>
    ${log.length ? log.map(e => `<div class="logrow"><div class="logtime">${escHtml(fmtLogTime(e.ts))}</div><div class="logbody"><span class="logtype ${escHtml(e.type)}">${escHtml(e.type)}</span>${escHtml(e.text)}</div></div>`).join('') : '<p class="body-dim">No activity yet — your first check-in will show up here.</p>'}
    <div class="sp-20"></div>
    <button class="secondary" id="log-export">Export log (JSON)</button>
    <div class="sp-32"></div>
  </div>`;
}
function bindLog() {
  const ex = document.getElementById('log-export');
  if (ex) ex.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user: state.profile?.username, log: state.log || [] }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `the-hard-part-log-${activeSlug()||'me'}-${isoToday()}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Log downloaded', 'success');
  });
}

// ---------- SETTINGS ----------
function renderSettings() {
  const s = state.settings;
  setTimeout(bindSettings, 0);
  return `<div class="screen">
        <div class="sp-8"></div>
    <p class="label">Persona</p><div class="sp-8"></div>
    <p class="body-dim" style="font-size: 16px;">Active profile: <strong style="color:var(--paper);">${escHtml(state.profile?.username || activeSlug() || '—')}</strong>. Each persona's data lives on this device.</p>
    <div class="sp-12"></div>
    ${(() => {
      // LOCAL persona switcher. savedPersonas() itself excludes backup/aux keys (':' slugs).
      const others = (typeof savedPersonas === 'function') ? savedPersonas() : [];
      if (others.length <= 1 && others.includes(activeSlug())) return '';
      if (!others.length) return '';
      return `<div class="field"><label for="s-persona-sel">Switch persona</label>
        <select id="s-persona-sel" style="width:100%;padding:11px 12px;background:var(--surface-1);color:var(--paper);border:1px solid var(--rule);border-radius:12px;font-size:16px;">${others.map(sl => `<option value="${escHtml(sl)}"${sl===activeSlug()?' selected':''}>${escHtml(sl)}</option>`).join('')}</select>
        <div class="help">Switch between profiles saved on this phone — no account needed.</div></div>
        <button class="secondary" id="s-persona-go">Switch to this persona</button><div class="sp-8"></div>`;
    })()}
    <button class="ghost" id="s-logout">Log out${state.profile ? ` — ${escHtml(state.profile.username || activeSlug())}` : ''}</button>
    <p class="help" style="margin-top:6px;">Log out keeps your data saved on this device — pick your profile again from the welcome screen anytime.</p>
    <div class="divider"></div>
    <p class="label">On-device storage</p><div class="sp-8"></div>
    ${state.settings.storagePersisted
      ? `<p class="body-dim" style="font-size:16px;">${svgUse('ic-check',13)} On-device storage: <strong style="color:var(--mobility);">protected</strong> — the system won't evict your data.</p>`
      : `<button class="secondary" id="s-persist">On-device storage: best-effort (tap to protect)</button><p class="help" style="margin-top:6px;">Ask the system to protect your data from automatic cleanup.</p>`}
    <div class="divider"></div>
    <p class="label">Data</p><div class="sp-12"></div>
    <button class="secondary" data-go="log">Activity log</button><div class="sp-8"></div>
    <button class="secondary" id="s-export">Export backup (JSON)</button><div class="sp-8"></div>
    <button class="secondary" id="s-import">Import backup (JSON)</button>
    <input type="file" id="s-import-file" accept="application/json" style="display:none">
    ${hasBackup() ? `<div class="sp-8"></div><button class="ghost" id="s-restore">Restore last auto-backup</button>` : ''}
    <div class="sp-8"></div>
    <button class="danger" id="s-reset">Reset all local data…</button>
    <p class="help" style="margin-top:6px;">Export saves your whole history (incl. injuries &amp; log). Import restores it on any device. Reset auto-saves a backup first.</p>
    <div class="divider"></div>
    <p class="label">How the call is made</p><div class="sp-8"></div>
    <p class="body-dim" style="font-size: 16px;">Each day you answer two things: did you meet the goal, and how do you feel. The app maps that to one of four calls. Progress only when you did the work and feel good or great. Feel rough, it gives an easier version. Feel wrecked or flag pain, it rests you. Anything in between repeats the session so you consolidate before adding load.</p>
    <div class="divider"></div>
    <p class="label">About</p><div class="sp-8"></div>
    <p class="body">The Hard Part v${APP_VERSION}.</p>
    <p class="body-dim" style="font-size: 16px; margin-top:4px;">Evidence-based 40-week framework. Local-first, no telemetry. Your data stays on this device.</p>
    <div class="sp-16"></div>
    <p class="label">Evidence base</p><div class="sp-8"></div>
    ${['Hooper SL et al. Markers for monitoring overtraining and recovery. Med Sci Sports Exerc 1995;27(1):106–112.',
       'Saw AE, Main LC, Gastin PB. Subjective self-reported measures trump objective measures: a systematic review. Br J Sports Med 2016;50(5):281–291.',
       'Lally P et al. How are habits formed: modelling habit formation in the real world. Eur J Soc Psychol 2010;40(6):998–1009.',
       'Kokkinos P et al. J Am Coll Cardiol 2022;80(6):598–609.',
       'Kokura Y et al. Clin Nutr ESPEN 2024;63:417–426.',
       'Nielsen Norman Group. Dark Mode: How Users Think About It. 2023.'
      ].map(c=>`<p class="body-dim" style="font-size: 14px; margin:4px 0;">${escHtml(c)}</p>`).join('')}
    <div class="sp-32"></div>
  </div>`;
}
function bindSettings() {
  if (state.ui.screen !== 'settings') return;   // deferred bind fired after navigating away
  // LOCAL persona switcher (no GitHub): load the chosen persona and navigate into it.
  const personaSel = document.getElementById('s-persona-sel'), personaGo = document.getElementById('s-persona-go');
  if (personaSel && personaGo) personaGo.addEventListener('click', () => {
    const slug = personaSel.value;
    if (!slug || slug === activeSlug()) return;
    state.activeUser = slug; try { localStorage.setItem(ACTIVE_KEY, slug); } catch (_) {}
    loadUserState(slug);
    if (typeof logEvent === 'function' && state.profile) logEvent('persona', `Switched to persona "${slug}"`);
    navigate(state.profile ? 'today' : 'onboarding');
    toast(state.profile ? `Switched to ${state.profile.username || slug}` : `No data for ${slug}`, state.profile ? 'success' : 'error');
  });
  // Persistent-storage opt-in (user gesture → best chance of a grant).
  const persistBtn = document.getElementById('s-persist');
  if (persistBtn) persistBtn.addEventListener('click', async () => {
    if (typeof ensurePersistentStorage !== 'function') return;
    try { await ensurePersistentStorage(); } catch (_) {}
    render();
    toast(state.settings.storagePersisted ? 'On-device storage protected' : 'Could not enable protection — your data is still saved locally', state.settings.storagePersisted ? 'success' : 'error');
  });
  const logoutBtn = document.getElementById('s-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (!confirm('Log out? Your data stays saved on this device — pick your profile again from the welcome screen anytime.')) return;
    logout();
    navigate('onboarding');
    toast('Logged out — your data is saved', 'success');
  });
  document.getElementById('s-export').addEventListener('click', async () => {
    let ok = false; try { ok = await downloadBackup(); } catch (_) { ok = false; }
    toast(ok ? 'Backup saved' : 'Backup not saved — nothing left this device', ok ? 'success' : 'error');
  });
  const importBtn = document.getElementById('s-import'), importFile = document.getElementById('s-import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const file = importFile.files && importFile.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let obj;
        try { obj = JSON.parse(reader.result); }
        catch (e) { toast('Not a valid Hard Part backup', 'error'); return; }
        // Shape-check BEFORE confirm/snapshot so a rejected file can't overwrite the existing
        // restore point (applyBackup revalidates authoritatively below).
        if (!obj || typeof obj !== 'object' || !obj.profile || (obj.app && obj.app !== 'the-hard-part')) { toast('Not a valid Hard Part backup', 'error'); return; }
        // SAFETY: snapshot + confirm against the persona the FILE targets (not whoever is active).
        // Importing B's stale backup while A is active must snapshot B (the data about to be replaced)
        // and must always ask when B already has saved data — even when nobody is logged in.
        const targetSlug = (obj.profile.usernameSlug || slugify(obj.profile.username || '')) || obj.slug || '';
        const targetHasData = targetSlug && !!localStorage.getItem(userStateKey(targetSlug));
        if (targetHasData && !confirm(`Replace the data saved on this device for "${targetSlug}" with the imported backup?`)) return;
        try { snapshotBeforeDestroy(targetSlug || undefined); } catch (_) {}
        // applyBackup signals invalid by returning false (storage-lane contract) or by throwing
        // (current behavior); anything else (true / undefined) is a success.
        let ok = true;
        try { const r = applyBackup(obj); if (r === false) ok = false; } catch (e) { ok = false; }
        if (!ok) { toast('Not a valid Hard Part backup', 'error'); return; }
        navigate(state.profile ? 'today' : 'onboarding');
        toast('Backup imported','success');
      };
      reader.onerror = () => toast('Could not read that file', 'error');
      reader.readAsText(file);
    });
  }
  const restoreBtn = document.getElementById('s-restore');
  if (restoreBtn) restoreBtn.addEventListener('click', () => {
    if (!confirm('Restore the last auto-backup? This replaces current data on this device.')) return;
    try { restoreBackup(); navigate(state.profile ? 'today' : 'onboarding'); toast('Restored from backup', 'success'); }
    catch (e) { toast(e.message, 'error'); }
  });
  document.getElementById('s-reset').addEventListener('click', async () => {
    // HONEST RESET: snapshot first, attempt an export, then make the confirm reflect whether the
    // backup actually landed — never claim "Backup saved" when the file may not have left the device.
    snapshotBeforeDestroy();          // keep a local restore point
    let ok = false; try { ok = await downloadBackup(); } catch (_) { ok = false; }
    const msg = ok
      ? 'Backup saved to your device — delete local data? (A restore point is also kept on this device.)'
      : 'No backup left this device — delete anyway? (A restore point is kept on this device.)';
    if (!confirm(msg)) return;
    const slug = activeSlug();
    if (slug) localStorage.removeItem(userStateKey(slug));
    // Fully zero the in-memory persona (mirrors loadUserState('')) so nothing — log, injury, session,
    // lifts, ramps, celebration/target markers, or the active-user pointer — bleeds into the next persona.
    state.profile=null; state.phase=null; state.checks=[];
    state.session=null; state.injury=null; state.log=[];
    state.lifts={}; state.returnRamp=null; state.layoffDismissedOn=null;
    state.targetReachedAt=null; state.celebrationSeen=false;
    state.activeUser=null; try { localStorage.removeItem(ACTIVE_KEY); } catch(_){}
    navigate('onboarding'); toast(ok ? 'Backup saved · local data cleared' : 'Local data cleared (verify your backup)', ok ? 'success' : 'error');
  });
}

// ============================================================
