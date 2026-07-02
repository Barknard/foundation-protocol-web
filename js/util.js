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
  // Procedural gait for walk/run; farmer carry reuses the walk gait with a kettlebell in each
  // hand; parametric skeleton pose for everything else. Every EXERCISES key resolves to one of
  // these (asserted by tools/_daysim-fixes.js "figure coverage") — the empty box is a safety net.
  if (ex && (ex.key === 'walk' || ex.key === 'run') && typeof gaitFigure === 'function') return gaitFigure(ex.key, s);
  if (ex && ex.key === 'kb_carry' && typeof gaitFigure === 'function') return gaitFigure('walk', s, true);
  if (ex && ex.key && typeof hasFigurePose === 'function' && hasFigurePose(ex.key)) return skeletonFigure(ex.key, s);
  return `<span class="afig" style="width:${s}px;height:${s}px;"></span>`;
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

