'use strict';
// ============================================================
// ROUTER + RENDER
// ============================================================
const backStack = [];
function navigate(screen, params) {
  const prev = state.ui.screen;
  if (TAB_SCREENS.includes(screen)) {
    backStack.length = 0;   // tabs are top-level — Back shouldn't cycle through them
  } else if (prev && prev !== screen && prev !== 'loading') {
    backStack.push({ screen: prev, params: state.ui.params });
    if (backStack.length > 20) backStack.shift();
  }
  state.ui.screen = screen; state.ui.params = params || {};
  render(); window.scrollTo(0,0);
}
function goBack(fallback) {
  if (backStack.length > 0) { const prev = backStack.pop(); state.ui.screen = prev.screen; state.ui.params = prev.params; render(); window.scrollTo(0,0); }
  else navigate(fallback || 'today');
}
const TAB_SCREENS = ['today','library','progress','phase'];
// Frozen header content = "where you are". Tab screens show the journey; sub-screens show back + title.
function journeyHeader() {
  const phaseIdx = state.phase?.phase ?? state.profile?.startingPhase ?? 0;
  const pd = PHASES[phaseIdx] || PHASES[0];
  const wk = state.phase?.week ?? 1;
  const dayInWeek = state.phase?.dayInWeek ?? 1;
  return `<button class="hd-journey" data-go="progress" aria-label="Your progress — phase ${phaseIdx + 1} of ${PHASES.length}, ${escHtml(pd.name)}, week ${wk}, session ${dayInWeek} of ${pd.week.length}">
      <span class="hd-phase">Phase ${phaseIdx + 1}/${PHASES.length} · ${escHtml(pd.name)} · Wk ${wk} · Day ${dayInWeek}/${pd.week.length}</span>
    </button>`;
}
const SCREEN_TITLES = { settings: 'Settings', log: 'Activity log' };
function appHeader(screen) {
  if (screen === 'loading') return '';
  if (screen === 'onboarding') return `<header class="app-header"><div class="hd-inner" style="display:block;padding-top:12px;padding-bottom:12px;">${onbCrumb()}</div></header>`;
  let inner;
  if (screen === 'today') {
    inner = `${journeyHeader()}<button class="hd-gear icon" data-go="settings" aria-label="Settings">${svgUse('ic-settings', 22)}</button>`;
  } else if (TAB_SCREENS.includes(screen)) {
    const t = { library: 'Library', progress: 'Progress', phase: 'Phases' }[screen] || '';
    inner = `<button class="hd-back" data-go="today" aria-label="Back to Today">${svgUse('ic-back', 22)}</button><span class="hd-title">${t}</span><button class="hd-gear icon" data-go="settings" aria-label="Settings">${svgUse('ic-settings', 22)}</button>`;
  } else {
    let title = SCREEN_TITLES[screen] || '';
    if (screen === 'check') title = injuryActive() ? 'Pain re-check' : 'Daily check-in';
    if (screen === 'exerciseDetail') { const ex = EXERCISES.find(e => e.key === state.ui.params?.key); title = ex ? ex.name : 'Exercise'; }
    if (screen === 'phaseDetail') { const p = PHASES[state.ui.params?.index]; title = p ? p.name : 'Phase'; }
    inner = `<button class="hd-back" data-back aria-label="Back">${svgUse('ic-back', 22)}</button><span class="hd-title">${escHtml(title)}</span>`;
  }
  return `<header class="app-header"><div class="hd-inner">${inner}</div></header>`;
}
// Frozen footer = the bottom bar. Tab + sub-screens get the nav; action screens get their action bar.
function appFooter(screen) {
  if (screen === 'loading') return '';
  if (screen === 'onboarding') return onbFooter();
  if (screen === 'check') return checkFooter();
  return renderNav(screen);
}
function render() {
  const root = document.getElementById('app');
  const screen = state.ui.screen;
  let body = '';
  switch (screen) {
    case 'onboarding':     body = renderOnboarding(); break;
    case 'today':          body = renderToday(); break;
    case 'check':          body = renderCheck(); break;
    case 'result':         body = renderResult(state.ui.params.outcome); break;
    case 'library':        body = renderLibrary(); break;
    case 'progress':       body = renderProgress(); break;
    case 'phase':          body = renderPhaseList(); break;
    case 'phaseDetail':    body = renderPhaseDetail(state.ui.params.index); break;
    case 'exerciseDetail': body = renderExerciseDetail(state.ui.params.key); break;
    case 'settings':       body = renderSettings(); break;
    case 'log':            body = renderLog(); break;
    default:               body = renderLoading();
  }
  const header = appHeader(screen), footer = appFooter(screen);
  const cls = ['app-main'];
  if (!header) cls.push('no-header');
  if (footer) cls.push('has-footer');
  if (screen === 'onboarding') cls.push('onb-main');
  root.innerHTML = header + `<main class="${cls.join(' ')}">${body}</main>` + footer;
  bindEvents();
  setSync(state.ui.syncStatus, state.ui.syncMessage);
}
function renderNav(active) {
  return `<nav class="nav">
    <button class="tab ${active==='today'?'active':''}" data-go="today">${svgUse('ic-today',22)}<span>Today</span></button>
    <button class="tab ${active==='library'?'active':''}" data-go="library">${svgUse('ic-library',22)}<span>Library</span></button>
    <button class="tab ${active==='progress'?'active':''}" data-go="progress">${svgUse('ic-progress',22)}<span>Progress</span></button>
    <button class="tab ${active==='phase'?'active':''}" data-go="phase">${svgUse('ic-phase',22)}<span>Phase</span></button>
  </nav>`;
}
function bindEvents() {
  document.querySelectorAll('[data-go]').forEach(el => {
    const goNav = () => {
      const target = el.getAttribute('data-go');
      const params = {};
      for (const a of el.attributes) if (a.name.startsWith('data-p-')) params[a.name.slice(7)] = a.value;
      navigate(target, params);
    };
    el.addEventListener('click', goNav);
    // Keyboard activation for non-button elements that act as buttons (e.g. the whole exercise card).
    if (el.getAttribute('tabindex') === '0') el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goNav(); } });
  });
  document.querySelectorAll('[data-back]').forEach(el => el.addEventListener('click', () => goBack('today')));
  document.querySelectorAll('[data-exp]').forEach(el => el.addEventListener('click', () => {
    const i = el.getAttribute('data-exp');
    const panel = document.getElementById('ex-panel-' + i);
    if (!panel) return;
    const open = panel.classList.toggle('open');
    el.setAttribute('aria-expanded', open ? 'true' : 'false');
    state.ui.openBlocks[i] = open;   // persist so it survives re-renders
  }));
  document.querySelectorAll('[data-exp-why]').forEach(el => el.addEventListener('click', () => {
    const panel = document.getElementById('why-panel');
    if (!panel) return;
    const open = panel.classList.toggle('open');
    el.setAttribute('aria-expanded', open ? 'true' : 'false');
    state.ui.whyOpen = open;
  }));
  document.querySelectorAll('[data-toggle-ex]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); toggleEx(el.getAttribute('data-toggle-ex')); render(); }));
  document.querySelectorAll('[data-markall]').forEach(el => el.addEventListener('click', () => { markBlockDone(el.getAttribute('data-markall')); render(); }));
}

