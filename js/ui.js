'use strict';
// ============================================================
// ROUTER + RENDER
// ============================================================
const backStack = [];
function navigate(screen, params) {
  if (state.ui.screen && state.ui.screen !== screen && state.ui.screen !== 'loading') {
    backStack.push({ screen: state.ui.screen, params: state.ui.params });
    if (backStack.length > 20) backStack.shift();
  }
  state.ui.screen = screen; state.ui.params = params || {};
  render(); window.scrollTo(0,0);
}
function goBack(fallback) {
  if (backStack.length > 0) { const prev = backStack.pop(); state.ui.screen = prev.screen; state.ui.params = prev.params; render(); window.scrollTo(0,0); }
  else navigate(fallback || 'today');
}
function render() {
  const root = document.getElementById('app');
  const screen = state.ui.screen;
  const tabScreens = ['today','library','progress','phase'];
  let html = '';
  switch (screen) {
    case 'onboarding':     html = renderOnboarding(); break;
    case 'today':          html = renderToday(); break;
    case 'check':          html = renderCheck(); break;
    case 'result':         html = renderResult(state.ui.params.outcome); break;
    case 'library':        html = renderLibrary(); break;
    case 'progress':       html = renderProgress(); break;
    case 'phase':          html = renderPhaseList(); break;
    case 'phaseDetail':    html = renderPhaseDetail(state.ui.params.index); break;
    case 'exerciseDetail': html = renderExerciseDetail(state.ui.params.key); break;
    case 'settings':       html = renderSettings(); break;
    case 'log':            html = renderLog(); break;
    default:               html = renderLoading();
  }
  if (tabScreens.includes(screen)) html += renderNav(screen);
  root.innerHTML = html;
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
  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => {
    const target = el.getAttribute('data-go');
    const params = {};
    for (const a of el.attributes) if (a.name.startsWith('data-p-')) params[a.name.slice(7)] = a.value;
    navigate(target, params);
  }));
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
  document.querySelectorAll('[data-toggle-ex]').forEach(el => el.addEventListener('click', () => { toggleEx(el.getAttribute('data-toggle-ex')); render(); }));
  document.querySelectorAll('[data-markall]').forEach(el => el.addEventListener('click', () => { markBlockDone(el.getAttribute('data-markall')); render(); }));
}

