'use strict';
// ============================================================
// SCREENS
// ============================================================
function renderLoading() {
  return `<div class="screen no-nav"><div class="sp-48"></div><div class="sp-48"></div>
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
    <div class="brand"><img class="brand-logo" src="logo.png" alt="The Hard Part"></div>
    <div class="sp-16"></div>
    ${(() => { const others = savedPersonas(); if (!others.length) return ''; return `<div class="card" style="margin-bottom:14px;"><span class="label" style="color:var(--milestone);">Welcome back</span><div class="sp-8"></div>${others.map(s => `<button class="secondary" data-resume="${escHtml(s)}" style="width:100%;margin-bottom:6px;">Continue as ${escHtml(s)}</button>`).join('')}<div class="help">Or set up a new profile below.</div></div>`; })()}
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
     ].map(o=>`<div class="radio-card ${p.phase===o.i?'selected':''}" data-phase="${o.i}"><div class="dot"></div><div><div class="title">${o.t}</div><div class="body-dim" style="margin-top:2px;">${o.s}</div></div></div>`).join('')}
    <div id="plan-preview">${planPreviewHtml(p.phase)}</div>`;
  return `<div class="screen no-nav onb">${body}</div>`;
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
  // "Welcome back — continue as <persona>" resume buttons (step 1)
  document.querySelectorAll('[data-resume]').forEach(el => el.addEventListener('click', () => {
    const slug = el.getAttribute('data-resume');
    state.activeUser = slug; try { localStorage.setItem(ACTIVE_KEY, slug); } catch (_) {}
    loadUserState(slug); delete state._onb;
    navigate(state.profile ? 'today' : 'onboarding');
    if (state.profile) toast('Welcome back, ' + (state.profile.username || slug), 'success');
  }));
  const FIELDS = ['username','weight','pushup','walk','age'];
  const upd = () => FIELDS.forEach(k => { const e = get('onb-'+k); if (e) o[k] = e.value; });
  const updConv = () => { const conv = get('onb-weight-conv'); if (!conv) return; const v = parseFloat(get('onb-weight').value); conv.textContent = (v>0) ? (o.unit==='imperial' ? `≈ ${fmt1(lbToKg(v))} kg` : `≈ ${fmt1(kgToLb(v))} lb`) : ''; };
  FIELDS.forEach(k => { const e = get('onb-'+k); if (e) e.addEventListener('input', upd); });
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
  document.querySelectorAll('[data-phase]').forEach(el => el.addEventListener('click', () => {
    o.phase = Number(el.getAttribute('data-phase'));
    document.querySelectorAll('[data-phase]').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    const pv = get('plan-preview'); if (pv) pv.innerHTML = planPreviewHtml(o.phase);
  }));
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
    state.profile = { username: o.username.trim().slice(0,40), usernameSlug: slug, weightKg: Math.round(w*10)/10, maxPushup:pu, longestWalkMin:wk, age:ag, startingPhase:o.phase, createdAt:Date.now() };
    state.phase = { phase:o.phase, week:1, dayInWeek:1, sessionsCleared:0, lastDecision:null };
    state.pending = [];
    markDirty('profile','phase');
    logEvent('profile', `Created persona "${state.profile.username}" · starting ${PHASES[o.phase].name}`);
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
  const lead = `You're in ${pd.name} — phase ${ph+1} of ${PHASES.length}, week ${wk}${cleared?`, ${cleared} progression${cleared===1?'':'s'} banked`:''}. Each phase earns the next, building toward the capstone: a 10K run plus 100 pushups, situps and squats in one session.`;

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

function renderToday() {
  ensureSession();
  pruneInjury();
  const phaseIdx = state.phase?.phase ?? 0;
  const pd = PHASES[phaseIdx];
  const dayInWeek = state.phase?.dayInWeek ?? 1;
  const dayPlan = currentDayPlan();
  const who = state.profile?.username ? `${state.profile.username} · ` : '';
  const crumb = `${who}Phase ${phaseIdx} · Wk ${state.phase?.week ?? 1} · Session ${dayInWeek}/${pd.week.length}`;
  const todayChecks = state.checks.filter(c => c.date === isoToday());
  const lastToday = todayChecks[todayChecks.length - 1];
  const why = dayWhy();
  const whyOpen = !!state.ui.whyOpen;
  const layoff = layoffTier();
  const counts = sessionCounts();
  const recent = state.checks.slice(-14);
  let trend = '';
  if (recent.length >= 2) {
    const avg = recent.reduce((s,c)=>s+(c.feel||0),0)/recent.length;
    const adh = Math.round(recent.filter(c=>c.goalMet==='done').length/recent.length*100);
    trend = `Readiness ~${avg.toFixed(1)}/5 over your last ${recent.length} check-ins · ${adh}% sessions completed · ${state.phase?.sessionsCleared ?? 0} progressions so far.`;
  }
  const focus = dayPlan.blocks.map(b=>escHtml(b.title.split(' —')[0])).join(' + ') || 'Recovery';
  const PENCIL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  // "Why" card lives at the BOTTOM (action-first layout): the call/session leads, rationale is opt-in below.
  // The dynamic "why" panel (opened by the brain-? icon): today's reasoning, THE formula, where it leads, your trend.
  const whyPanel = `<div class="ex-panel${whyOpen?' open':''}" id="why-panel"><div class="card" style="padding:14px 16px;border:1px solid var(--rule);margin-top:10px;">
      <div class="body" style="margin-bottom:8px;">${escHtml(why.line)}</div>
      ${why.points.map(p=>`<p class="body-dim" style="margin:6px 0;">•  ${escHtml(p)}</p>`).join('')}
      ${why.trend?`<div class="divider"></div><p class="label">Your trend</p><div class="sp-4"></div><p class="body-dim">${escHtml(why.trend)}</p>`:''}
    </div></div>`;
  // One banner max (research: a banner is a thin frame, not a hero) — priority injury > layoff > deload.
  const banners = (() => {
    const sc = standingCall();
    if (sc) return `<div class="card-block ${sc.cls}" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label" style="color:var(--${sc.cls});">${escHtml(sc.label)}</span><div class="sp-4"></div><div class="headline serif">${escHtml(sc.title)}</div><div class="sp-4"></div><div class="body-dim">${sc.action} <button class="more" data-go="check">Re-check pain &rarr;</button></div></div></div>`;
    if (layoff) return `<div class="card-block milestone" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label" style="color:var(--milestone);">${escHtml(layoff.title)} · ${layoff.gap} days off</span><div class="sp-4"></div><div class="body-dim">${escHtml(layoff.msg)}</div></div></div>`;
    if (deloadActive()) return `<div class="card-block cardio" style="margin-bottom:12px;"><div class="stripe"></div><div class="card" style="padding:14px 16px;"><span class="label" style="color:var(--cardio);">Lighter week</span><div class="sp-4"></div><div class="body-dim">Back off ~40% today — fewer sets, one notch easier. We cut the load, not stop, to let hidden fitness surface.</div></div></div>`;
    return '';
  })();
  return `<div class="screen">
    ${banners}
    ${lastToday ? (() => {
      // DAY-GATE: already checked in today → call up top + done/countdown. Next session locks until the
      // next local calendar day (msUntilTomorrow), so you can't run ahead. One session a day.
      const o = OUTCOMES[lastToday.decision] || OUTCOMES.repeat;
      return `<div class="card-block ${o.cls}"><div class="stripe"></div><div class="card" style="padding:16px;"><div class="rx-head"><span class="label">${svgUse('ic-check',13)} Today's call</span><button class="icon" data-go="check" data-p-edit="1" aria-label="Edit today's answer" style="width:auto;padding:4px;background:none;border:none;color:var(--paper-dim);">${PENCIL}</button></div><div class="sp-4"></div><div class="headline serif">${escHtml(o.title)}</div><div class="sp-4"></div><div class="body-dim">${escHtml(o.action)}</div></div></div>
      <div class="sp-12"></div>
      <div class="card-block mobility"><div class="stripe"></div><div class="card" style="padding:16px;"><span class="label" style="color:var(--mobility);">You're done for today</span><div class="sp-4"></div><div class="body">Nice work showing up. Rest up — hydrate and get some protein in. Your next session opens in <span id="next-unlock" class="metric" style="color:var(--milestone);">${fmtCountdown(msUntilTomorrow())}</span> (tomorrow).</div></div></div>
      <div class="sp-12"></div>
      <button class="why-btn-row" data-exp-why aria-expanded="${whyOpen?'true':'false'}">${svgUse('ic-why',20)}<span>Why this call?</span></button>
      ${whyPanel}`;
    })() : `
    <div class="today-head"><div class="today-focus serif">${focus}</div><button class="why-btn" data-exp-why aria-expanded="${whyOpen?'true':'false'}" aria-label="Why this plan — the reasoning behind today's routine">${svgUse('ic-why',24)}<span class="why-lbl">Why this plan?</span></button></div>
    ${whyPanel}
    <div class="sp-8"></div>
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
      const card = (ex)=>{ const dn=exDone(ex.key); return `<div class="ex-card${dn?' done':''}" data-go="exerciseDetail" data-p-key="${escHtml(ex.key)}" role="button" tabindex="0" aria-label="${escHtml(ex.name)} — full steps"><div class="fig">${animatedFigure(ex,44)}</div><div class="meta"><div class="name">${escHtml(ex.name)}</div><div class="rx">${escHtml(ex.rx)}</div><div class="cue">${escHtml(ex.cue)}</div><span class="more">Full steps &rarr;</span></div><button class="ex-check" data-toggle-ex="${escHtml(ex.key)}" aria-pressed="${dn?'true':'false'}" aria-label="Mark ${escHtml(ex.name)} ${dn?'not done':'done'}" title="Mark done">${svgUse('ic-check',16)}</button></div>`; };
      const todo = exs.filter(e=>!exDone(e.key));
      const done = exs.filter(e=>exDone(e.key));
      const panel = `<div class="ex-panel${open?' open':''}" id="ex-panel-${i}">
        ${todo.length?`<div class="ex-grid">${todo.map(card).join('')}</div>`:''}
        ${todo.length?`<button class="markall" data-markall="${escHtml(b.key)}">${svgUse('ic-check',14)} Mark all ${exs.length} complete</button>`:''}
        ${done.length?`<div class="ex-done-label">${svgUse('ic-check',14)} Completed (${done.length})</div><div class="ex-grid">${done.map(card).join('')}</div>`:''}
      </div>`;
      return `<div style="margin-bottom:12px;"><button class="today-block" data-exp="${i}" aria-expanded="${open?'true':'false'}">${head}</button>${panel}</div>`;
    }).join('')}</div></div>
    <div class="sp-12"></div>
    <button data-go="check">Daily check-in</button>`}
    <div class="sp-16"></div>
  </div>`;
}

// ---------- CHECK ----------
function bodyMap(sel) {
  // Keyboard/screen-reader accessible: each region is a focusable toggle (role=button, aria-pressed).
  const a = (part) => `data-part="${escHtml(part)}" role="button" tabindex="0" aria-label="${escHtml(part)}" aria-pressed="${sel.includes(part)?'true':'false'}"`;
  const seg = (part,x,y,w,h)=>`<rect class="bm-seg${sel.includes(part)?' sel':''}" ${a(part)} x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
  return `<svg viewBox="0 0 100 188" class="bodymap" role="group" aria-label="Body map — choose where it hurts">
    <circle class="bm-seg${sel.includes('head/neck')?' sel':''}" ${a('head/neck')} cx="50" cy="13" r="10"/>
    ${seg('left shoulder',26,26,16,9)}${seg('right shoulder',58,26,16,9)}
    ${seg('chest',38,30,24,15)}${seg('core',39,47,22,15)}
    ${seg('left arm',21,30,11,44)}${seg('right arm',68,30,11,44)}
    ${seg('hip / groin',37,64,26,12)}
    ${seg('left thigh',38,78,11,33)}${seg('right thigh',51,78,11,33)}
    ${seg('left knee',38,112,11,9)}${seg('right knee',51,112,11,9)}
    ${seg('left lower leg',39,122,10,36)}${seg('right lower leg',51,122,10,36)}
    ${seg('left foot',35,159,13,9)}${seg('right foot',52,159,13,9)}
  </svg>`;
}
function renderCheck() {
  ensureSession();
  const { done, total } = sessionCounts();
  const allEx = total > 0 && done === total;
  // Editing today's answer: pre-fill from the existing record (research: lock-with-edit, not re-check).
  const todayCheck = state.checks.find(c => c.date === isoToday());
  if (state.ui.params && state.ui.params.edit && todayCheck && !state._chk) {
    state._chk = { goalMet: todayCheck.goalMet, feel: todayCheck.feel, hurt: !!todayCheck.hurt, parts: (todayCheck.parts || []).slice(), redFlag: false, painChecked: true };
  }
  state._chk = state._chk || { goalMet: allEx ? 'done' : null, feel: null, hurt: false, parts: [], redFlag: false };
  if (!state._chk.parts) state._chk.parts = [];
  setTimeout(bindCheck, 0);
  const t = state._chk;
  const ready = t.goalMet && t.feel;
  const faces = { 5:'😀', 4:'🙂', 3:'😐', 2:'😕', 1:'😵' };
  const reChk = injuryActive();
  const gl = { done:'Goal met', partial:'Partial goal', missed:'Goal missed' }[t.goalMet] || 'Goal not set';
  return `<div class="screen no-nav">
    ${reChk ? `<p class="body-dim">Still sore, or good to ease back in?</p><div class="sp-20"></div>` : `<div class="sp-8"></div>`}
    ${t.hurt ? `
    <button class="chk-min" data-clearhurt aria-label="Change your goal or feeling answer">${gl} · Feel ${t.feel?`${t.feel}/5`:'—'} <span class="more">change</span></button>
    <div class="sp-12"></div>
    <p class="label">Where does it hurt? Tap all that apply.</p><div class="sp-8"></div>
    ${bodyMap(t.parts)}
    <div class="sp-12"></div>
    <button class="ghost" data-clearhurt>Nothing hurts — clear</button>
    ` : `
    <p class="label">Did you meet today's goal?</p>${allEx ? `<div class="sp-4"></div><p class="body-dim" style="color:var(--mobility);font-size:14px;">${svgUse('ic-check',13)} All ${total} exercises checked off — marked Done automatically.</p>` : ''}<div class="sp-8"></div>
    <div class="chip-row" data-q="goal">
      <button class="chip yes ${t.goalMet==='done'?'active':''}" data-val="done">Done</button>
      <button class="chip ${t.goalMet==='partial'?'active':''}" data-val="partial">Partial</button>
      <button class="chip no ${t.goalMet==='missed'?'active':''}" data-val="missed">Missed</button>
    </div>
    <div class="sp-24"></div>
    <p class="label">How do you feel?</p><div class="sp-8"></div>
    <div class="feel-grid" data-q="feel">
      ${[5,4,3,2,1].map(v=>`<button class="feel ${t.feel===v?'active':''} feel-${v}" data-val="${v}"><span class="feel-face">${faces[v]}</span><span class="feel-label">${FEEL_LABELS[v]}</span></button>`).join('')}
    </div>
    <div class="sp-20"></div>
    ${(t.feel && t.feel <= 2 && !t.painChecked) ? `
      <div class="card-block strength pain-nudge"><div class="stripe"></div><div class="card" style="padding:14px 16px;">
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
    <p class="body-dim" style="font-size: 14px;">Readiness drives the call (Saw, Main &amp; Gastin, BJSM 2016) — feel rough or flag pain and it eases you back with pain-monitored loading.</p>
    `}
  </div>`;
}
// Check-in's frozen footer action (placed by the app shell).
function checkFooter() {
  const t = state._chk || {};
  const ready = t.goalMet && t.feel;
  return `<div class="wiz-nav"><button class="onb-next" id="chk-go" ${ready?'':'disabled'}>See the call</button></div>`;
}
function bindCheck() {
  if (state.ui.screen !== 'check' || !state._chk) return;   // deferred bind fired after navigating away
  const goal = document.querySelector('[data-q="goal"]');   // absent in hurt mode (goal/feel minimized)
  if (goal) goal.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    state._chk.goalMet = btn.getAttribute('data-val');
    goal.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); refreshGo();
  }));
  const feel = document.querySelector('[data-q="feel"]');
  if (feel) feel.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    state._chk.feel = Number(btn.getAttribute('data-val'));
    render();   // re-render so the low-feel pain nudge appears/updates for feel 1–2
  }));
  const hurt = document.getElementById('chk-hurt');
  if (hurt) hurt.addEventListener('click', () => {
    state._chk.hurt = !state._chk.hurt;
    if (!state._chk.hurt) { state._chk.parts = []; state._chk.redFlag = false; }
    render();
  });
  // Low-feel pain discriminator (feel 1–2): 3-way, default fatigue — keeps soreness ≠ injury (DOMS isn't in a joint).
  const pno = document.getElementById('chk-pain-no');
  if (pno) pno.addEventListener('click', () => { state._chk.painChecked = true; state._chk.hurt = false; render(); });
  const pspot = document.getElementById('chk-pain-spot');
  if (pspot) pspot.addEventListener('click', () => { state._chk.hurt = true; state._chk.painChecked = true; render(); });
  const psharp = document.getElementById('chk-pain-sharp');
  if (psharp) psharp.addEventListener('click', () => { state._chk.hurt = true; state._chk.painChecked = true; state._chk.painSharp = true; render(); });
  // Clear / "nothing hurts" / "change" → back to the goal+feel questions.
  document.querySelectorAll('[data-clearhurt]').forEach(el => el.addEventListener('click', () => { state._chk.hurt = false; state._chk.parts = []; state._chk.redFlag = false; state._chk.painChecked = false; render(); }));
  const flag = document.getElementById('chk-flag');
  if (flag) flag.addEventListener('click', () => { state._chk.redFlag = !state._chk.redFlag; render(); });
  document.querySelectorAll('[data-part]').forEach(el => {
    const toggle = () => {
      const p = el.getAttribute('data-part'); const i = state._chk.parts.indexOf(p);
      if (i >= 0) state._chk.parts.splice(i,1); else state._chk.parts.push(p);
      const on = el.classList.toggle('sel');
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  function refreshGo() { const g = document.getElementById('chk-go'); if (g) g.disabled = !(state._chk.goalMet && state._chk.feel); }
  const go = document.getElementById('chk-go');
  if (go) go.addEventListener('click', () => {
    const t = state._chk;
    if (!(t.goalMet && t.feel)) return;
    const outcome = applyCheck(t.goalMet, t.feel, t.hurt, t.parts, t.redFlag);
    state.ui.resultOutcome = outcome;
    delete state._chk;
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
  return `<div class="screen no-nav">
    <div class="sp-24"></div>
    <p class="label">The call</p><div class="sp-8"></div>
    <h1 class="display-l serif" style="color:var(--${o.cls});">${escHtml(o.title)}</h1>
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
          <div class="fig">${animatedFigure(ex,44)}</div>
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
  });
}
function renderExerciseDetail(key) {
  const ex = EXERCISES.find(e => e.key === key);
  if (!ex) return `<div class="screen no-nav"><p>Not found.</p></div>`;
  return `<div class="screen no-nav">
    <p class="mono" style="color:var(--milestone); font-size: 15px; letter-spacing:0.05em;">${escHtml(ex.cat)} · ${escHtml(ex.rx)}</p>
    <div class="fig-hero">${animatedFigure(ex,140)}</div>
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
    <div class="chart" data-chart="chart-readiness" data-color="cardio">
      <div class="top"><div class="title">Readiness</div><div class="label-sm">feel 1–5</div></div>
      <canvas id="chart-readiness" height="96"></canvas>
      <div class="bottom" id="chart-readiness-bottom"></div>
    </div>
    <div class="card"><div class="stat-cols">
      <div><span class="label">Last 14</span><div class="sp-8"></div>
        <div class="row between"><span class="body-dim">Done</span><span class="metric" style="color:var(--mobility);">${done}</span></div>
        <div class="row between"><span class="body-dim">Partial</span><span class="metric" style="color:var(--milestone);">${partial}</span></div>
        <div class="row between"><span class="body-dim">Missed</span><span class="metric" style="color:var(--strength);">${missed}</span></div>
      </div>
      <div><span class="label">All-time calls</span><div class="sp-8"></div>
        <div class="row between"><span class="body-dim">Progress</span><span class="metric" style="color:var(--mobility);">${mix.progress}</span></div>
        <div class="row between"><span class="body-dim">Repeat</span><span class="metric" style="color:var(--cardio);">${mix.repeat}</span></div>
        <div class="row between"><span class="body-dim">Modify</span><span class="metric" style="color:var(--milestone);">${mix.modify}</span></div>
        <div class="row between"><span class="body-dim">Rest</span><span class="metric" style="color:var(--strength);">${mix.rest}</span></div>
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
  4: { formula: "The capstone: sharpen everything toward one session — a 10K plus 100 pushups, situps and squats — by peaking aerobic fitness and strength endurance. You attempt it only when your check-ins confirm you're recovered and ready, never forcing it on a tired body, because readiness is the gate that keeps a hard effort from becoming an injury.",
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
  return `<div class="screen no-nav">
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
  return `<div class="screen no-nav">
        <div class="sp-4"></div>
    <p class="body-dim">A timestamped record of every check-in, call, progression, injury, layoff, and sync for ${escHtml(state.profile?.username || 'this persona')}.</p>
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
    a.href = url; a.download = `foundation-log-${activeSlug()||'me'}-${isoToday()}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Log downloaded', 'success');
  });
}

// ---------- SETTINGS ----------
function renderSettings() {
  const s = state.settings;
  setTimeout(bindSettings, 0);
  return `<div class="screen no-nav">
        <div class="sp-8"></div>
    <p class="label">Persona</p><div class="sp-8"></div>
    <p class="body-dim" style="font-size: 16px;">Active profile: <strong style="color:var(--paper);">${escHtml(state.profile?.username || activeSlug() || '—')}</strong>. Each persona keeps its own files in the repo: <span class="mono" style="font-size:13px;">data/users/${escHtml(activeSlug()||'…')}/</span></p>
    <div class="sp-12"></div>
    <div class="field"><label for="s-user">Switch / load a persona</label><input type="text" id="s-user" value="${escHtml(activeSlug())}" placeholder="username" autocapitalize="none" autocorrect="off" spellcheck="false"><div class="help">Type a username, then load it from GitHub to use this device as that persona.</div></div>
    <button class="secondary" id="s-loaduser">Load persona from GitHub</button>
    <div class="sp-8"></div>
    <button class="ghost" id="s-logout">Log out${state.profile ? ` — ${escHtml(state.profile.username || activeSlug())}` : ''}</button>
    <p class="help" style="margin-top:6px;">Log out keeps your data saved on this device — pick your profile again from the welcome screen anytime.</p>
    <div class="divider"></div>
    <p class="label">GitHub Sync</p><div class="sp-8"></div>
    <p class="body-dim" style="font-size: 16px;">Save your training data to your own GitHub so it follows you to any device. Without this, data stays in this browser only.</p>
    <div class="sp-12"></div>
    ${isConfigured() ? `<p class="body-dim" style="font-size:14px;">Connected · syncing to <span class="mono" style="font-size:13px;">${escHtml(s.repo)}</span></p><div class="sp-8"></div>` : ''}
    <div class="field"><label for="s-repo">Repository (username/repo)</label><input type="text" id="s-repo" value="${escHtml(s.repo)}" placeholder="eddie/foundation-protocol-data" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
    <div class="field"><label for="s-pat">Personal Access Token</label><input type="password" id="s-pat" value="${escHtml(s.pat)}" placeholder="github_pat_…" autocapitalize="none" autocorrect="off" spellcheck="false"><div class="help">Fine-grained PAT with Contents: Read &amp; Write. Stored only in this browser.</div></div>
    <div class="sp-8"></div>
    <button class="secondary" id="s-test">Test &amp; sync now</button><div class="sp-8"></div>
    <button class="ghost" id="s-pull">Pull from GitHub (overwrite local)</button>
    <div class="sp-24"></div>
    <div class="row between"><div><div class="title">Auto-sync</div><div class="body-dim" style="font-size: 16px;">Push every change automatically.</div></div>
      <label class="switch"><input type="checkbox" id="s-autosync" ${s.autoSync?'checked':''}><span class="slider"></span></label></div>
    <div class="divider"></div>
    <p class="label">Data</p><div class="sp-12"></div>
    <button class="secondary" data-go="log">Activity log</button><div class="sp-8"></div>
    <button class="secondary" id="s-export">Export backup (JSON)</button><div class="sp-8"></div>
    <button class="secondary" id="s-import">Import backup (JSON)</button>
    <input type="file" id="s-import-file" accept="application/json" style="display:none">
    ${hasBackup() ? `<div class="sp-8"></div><button class="ghost" id="s-restore">Restore last auto-backup</button>` : ''}
    <div class="sp-8"></div>
    <button class="danger" id="s-reset">Reset all local data…</button>
    <p class="help" style="margin-top:6px;">Export saves your whole history (incl. injuries &amp; log). Import restores it on any device — no GitHub needed. Reset auto-saves a backup first.</p>
    <div class="divider"></div>
    <p class="label">How the call is made</p><div class="sp-8"></div>
    <p class="body-dim" style="font-size: 16px;">Each day you answer two things: did you meet the goal, and how do you feel. The app maps that to one of four calls. Progress only when you did the work and feel good or great. Feel rough, it gives an easier version. Feel wrecked or flag pain, it rests you. Anything in between repeats the session so you consolidate before adding load.</p>
    <div class="divider"></div>
    <p class="label">About</p><div class="sp-8"></div>
    <p class="body">The Hard Part v${APP_VERSION}.</p>
    <p class="body-dim" style="font-size: 16px; margin-top:4px;">Evidence-based 40-week framework. Local-first, no telemetry. Sync optional via GitHub Contents API.</p>
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
  const repo=document.getElementById('s-repo'), pat=document.getElementById('s-pat'), autosync=document.getElementById('s-autosync');
  if (!repo || !pat) return;   // DOM moved on before this deferred bind ran
  repo.addEventListener('input', () => { state.settings.repo=repo.value.trim(); saveLocal(); });
  pat.addEventListener('input',  () => { state.settings.pat=pat.value.trim(); saveLocal(); });
  autosync.addEventListener('change', () => { state.settings.autoSync=autosync.checked; saveLocal(); });
  const logoutBtn = document.getElementById('s-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (!confirm('Log out? Your data stays saved on this device — pick your profile again from the welcome screen anytime.')) return;
    logout();
    navigate('onboarding');
    toast('Logged out — your data is saved', 'success');
  });
  const loaduser = document.getElementById('s-loaduser');
  if (loaduser) loaduser.addEventListener('click', async () => {
    const slug = slugify(document.getElementById('s-user').value);
    if (!slug) { toast('Enter a username','error'); return; }
    if (!isConfigured()) { toast('Enter repo + token first','error'); return; }
    if (!confirm(`Switch this device to persona "${slug}" and load its data from GitHub?`)) return;
    state.activeUser = slug;
    localStorage.setItem(ACTIVE_KEY, slug);
    loadUserState(slug);            // use any local copy first
    await syncFromRemote();         // then pull the latest for this persona
    saveLocal();
    if (state.profile) logEvent('persona', `Loaded persona "${slug}" from GitHub`);
    navigate(state.profile ? 'today' : 'onboarding');
    toast(state.profile ? `Loaded persona ${slug}` : `No data yet for ${slug} — set it up`, state.profile ? 'success' : 'error');
  });
  document.getElementById('s-test').addEventListener('click', async () => {
    if (!isConfigured()) { toast('Enter repo + token first','error'); return; }
    if (!activeSlug()) { toast('Set a username first (finish onboarding)','error'); return; }
    state.pending = [...DATA_KEYS]; await syncToRemote();
    if (state.ui.syncStatus==='online') logEvent('sync', 'Pushed all data to GitHub');
    toast(state.ui.syncStatus==='online'?'Pushed to GitHub':'Sync failed — check repo and token', state.ui.syncStatus==='online'?'success':'error');
  });
  document.getElementById('s-pull').addEventListener('click', async () => {
    if (!isConfigured()) { toast('Enter repo + token first','error'); return; }
    if (state.pending.length && !confirm(`You have ${state.pending.length} unsynced change${state.pending.length===1?'':'s'} that will be overwritten. Continue?`)) return;
    if (!confirm('Replace local data with what is in GitHub?')) return;
    snapshotBeforeDestroy();   // keep a local restore point before overwriting
    await syncFromRemote(); logEvent('sync', 'Pulled all data from GitHub'); render(); toast('Pulled from GitHub','success');
  });
  document.getElementById('s-export').addEventListener('click', () => { downloadBackup(); toast('Backup downloaded','success'); });
  const importBtn = document.getElementById('s-import'), importFile = document.getElementById('s-import-file');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const file = importFile.files && importFile.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          if (state.profile && !confirm('Replace this device\'s data with the imported backup?')) return;
          applyBackup(obj);
          navigate(state.profile ? 'today' : 'onboarding');
          toast('Backup imported','success');
        } catch (e) { toast('Could not import: ' + e.message, 'error'); }
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
  document.getElementById('s-reset').addEventListener('click', () => {
    if (!confirm('Delete this persona\'s data on this device? We\'ll save a backup to your device first. GitHub data is untouched.')) return;
    snapshotBeforeDestroy();          // keep a local restore point
    try { downloadBackup(); } catch (_) {}   // and drop a file in Downloads
    const slug = activeSlug();
    if (slug) localStorage.removeItem(userStateKey(slug));
    // Fully zero the in-memory persona (mirrors loadUserState('')) so nothing — log, injury, session,
    // or the active-user pointer — bleeds into the next persona created from onboarding.
    state.profile=null; state.phase=null; state.checks=[]; state.pending=[];
    state.session=null; state.injury=null; state.log=[]; state._preDay=null;
    state.activeUser=null; try { localStorage.removeItem(ACTIVE_KEY); } catch(_){}
    navigate('onboarding'); toast('Backup saved · local data cleared','success');
  });
}

// ============================================================
