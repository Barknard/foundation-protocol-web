'use strict';
// ============================================================
// UTIL
// ============================================================
function isoToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
// Day-gate: the next session unlocks at local midnight. Time math, not a 24h timer (travel/DST-safe).
function msUntilTomorrow() { const n = new Date(); const t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0, 0); return Math.max(0, t.getTime() - n.getTime()); }
function fmtCountdown(ms) { ms = Math.max(0, ms); const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function escHtml(s) { if (s == null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function svgUse(id, size) { const s = size||24; return `<svg width="${s}" height="${s}" aria-hidden="true"><use href="#${escHtml(id)}"/></svg>`; }
function animatedFigure(ex, size) {
  const s = size || 44;
  // Procedural gait for walk/run; parametric skeleton pose for everything else with a pose.
  if (ex && (ex.key === 'walk' || ex.key === 'run') && typeof gaitFigure === 'function') return gaitFigure(ex.key, s);
  if (ex && ex.key && typeof hasFigurePose === 'function' && hasFigurePose(ex.key)) return skeletonFigure(ex.key, s);
  const frames = (ex && ex.frames && ex.frames.length) ? ex.frames : [ex.icon];
  const svg = (cls, id) => `<svg class="${cls}" width="${s}" height="${s}" aria-hidden="true"><use href="#${escHtml(id)}"/></svg>`;
  const box = (cls, inner) => `<span class="${cls}" style="width:${s}px;height:${s}px;">${inner}</span>`;
  if (frames.length >= 4) return box('afig anim4', svg('a',frames[0]) + svg('b',frames[1]) + svg('c',frames[2]) + svg('d',frames[3]));
  if (frames.length === 3) return box('afig anim3', svg('a',frames[0]) + svg('b',frames[1]) + svg('c',frames[2]));
  if (frames.length === 2) return box('afig anim', svg('a',frames[0]) + svg('b',frames[1]));
  return box('afig', svg('a', frames[0]));
}
function toast(message, kind) {
  const el = document.getElementById('toast');
  el.className = 'toast ' + (kind||'');
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2400);
}
const FEEL_LABELS = { 5:'Great', 4:'Good', 3:'OK', 2:'Rough', 1:'Wrecked' };

