'use strict';
// ============================================================
// STORAGE
// ============================================================
// Soft sign-out: persist the current persona, then clear the in-memory session + the
// active-user pointer WITHOUT deleting any persona's saved data (so you can log back in).
function logout() {
  try { saveLocal(); } catch (_) {}
  state.profile = null; state.phase = null; state.checks = [];
  state.session = null; state.injury = null; state.log = []; state.lifts = {}; state._preDay = null; delete state._chk; delete state._onb;
  state.returnRamp = null; state.targetReachedAt = null; state.celebrationSeen = false; state.capstoneReached = false;
  state.activeUser = null;
  try { localStorage.removeItem(ACTIVE_KEY); } catch (_) {}
}
function loadUserState(slug) {
  state.profile = null; state.phase = null; state.checks = []; state.session = null; state.injury = null; state.log = []; state.lifts = {};
  state.returnRamp = null; state.targetReachedAt = null; state.celebrationSeen = false; state.capstoneReached = false;
  if (!slug) return;
  try {
    const raw = localStorage.getItem(userStateKey(slug));
    if (raw) { const d = JSON.parse(raw); state.profile = d.profile || null; state.phase = d.phase || null; state.checks = d.checks || []; state.session = d.session || null; state.injury = d.injury || null; state.log = d.log || []; state.lifts = d.lifts || {}; state.returnRamp = d.returnRamp || null; state.targetReachedAt = d.targetReachedAt || null; state.celebrationSeen = !!d.celebrationSeen; state.capstoneReached = !!d.capstoneReached; }
  } catch (e) { console.error('loadUserState failed', e); }
}
function loadLocal() {
  try {
    try { const sraw = localStorage.getItem(SETTINGS_KEY); if (sraw) state.settings = { ...state.settings, ...JSON.parse(sraw) }; }
    catch (_) { /* a corrupt settings blob must not abort persona loading below */ }
    // Migrate a pre-persona single-user blob into a named persona once.
    const legacy = localStorage.getItem(STORAGE_KEY);
    if (legacy && !localStorage.getItem(ACTIVE_KEY)) {
      try {
        const d = JSON.parse(legacy);
        if (d && d.profile) {
          const slug = d.profile.usernameSlug || slugify(d.profile.username || 'me') || 'me';
          d.profile.username = d.profile.username || slug;
          d.profile.usernameSlug = slug;
          localStorage.setItem(userStateKey(slug), JSON.stringify(d));
          localStorage.setItem(ACTIVE_KEY, slug);
        }
      } catch (_) {}
      localStorage.removeItem(STORAGE_KEY);
    }
    const slug = localStorage.getItem(ACTIVE_KEY) || '';
    state.activeUser = slug || null;
    loadUserState(slug);
  } catch (e) { console.error('loadLocal failed', e); }
}
function saveLocal() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    const slug = activeSlug();
    if (slug) {
      state.activeUser = slug;
      localStorage.setItem(ACTIVE_KEY, slug);
      localStorage.setItem(userStateKey(slug), JSON.stringify({ profile: state.profile, phase: state.phase, checks: state.checks, session: state.session, injury: state.injury, log: state.log, lifts: state.lifts, returnRamp: state.returnRamp, targetReachedAt: state.targetReachedAt, celebrationSeen: state.celebrationSeen, capstoneReached: state.capstoneReached }));
    }
    state._saveError = false;
    return true;
  } catch (e) {
    // Quota exhaustion is the one error a check-in must surface to the user (data at risk of loss).
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
      state._saveError = true; return false;
    }
    console.error('saveLocal failed', e); return false;
  }
}
function markDirty(..._keys) {
  // Local-first, on-device only: persist to localStorage. (The former GitHub-API sync was
  // removed — using a repo as an app datastore tripped GitHub's automated abuse detection.)
  saveLocal();
}

// ---- Persistent storage + storage pressure (local-first durability) ----
// Ask the browser to mark our origin's storage as persistent so it is not evicted under pressure.
// Idempotent: skips the persist() call when already granted. Records the outcome in settings.
async function ensurePersistentStorage() {
  try {
    if (!(navigator.storage && navigator.storage.persist)) return false;
    let granted = false;
    if (navigator.storage.persisted && await navigator.storage.persisted()) granted = true;
    else granted = await navigator.storage.persist();
    state.settings.storagePersisted = !!granted;
    saveLocal();
    return !!granted;
  } catch (_) { return false; }
}
// Returns { usage, quota, pct } from the Storage Manager estimate, or null when unsupported.
async function storagePressure() {
  try {
    if (!(navigator.storage && navigator.storage.estimate)) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const pct = quota > 0 ? usage / quota : 0;
    return { usage, quota, pct };
  } catch (_) { return null; }
}

// ---- Backup / restore (local-first data safety — works with no GitHub) ----
// LOSSLESS: includes profile, phase, checks, session, injury, log, and units.
function fullBackup() {
  return {
    app: 'the-hard-part', appVersion: APP_VERSION, exportedAt: new Date().toISOString(),
    slug: activeSlug(), units: state.settings.units,
    profile: state.profile, phase: state.phase, checks: state.checks,
    session: state.session, injury: state.injury, log: state.log, lifts: state.lifts,
    returnRamp: state.returnRamp, targetReachedAt: state.targetReachedAt,
    celebrationSeen: state.celebrationSeen, capstoneReached: state.capstoneReached,
  };
}
// Returns true only when an export action was actually invoked without throwing.
// Prefers the Web Share sheet on mobile (verifiable destination) and falls back to a download anchor.
function downloadBackup() {
  const json = JSON.stringify(fullBackup(), null, 2);
  const name = `the-hard-part-${activeSlug() || 'backup'}-${isoToday()}.json`;
  const mark = () => { state.settings.lastBackupAt = Date.now(); saveLocal(); };
  try {
    if (typeof File !== 'undefined' && navigator.canShare) {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] }) && navigator.share) {
        // resolve = the user committed the share; reject (cancel) leaves lastBackupAt untouched.
        navigator.share({ files: [file], title: name }).then(mark).catch(() => {});
        return true;
      }
    }
  } catch (_) { /* fall through to the download-anchor path */ }
  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    mark();
    return true;
  } catch (e) { console.error('downloadBackup failed', e); return false; }
}
// Whole days since the last successful backup, or null if never backed up.
function backupAgeDays() {
  const t = state.settings.lastBackupAt;
  if (!t) return null;
  return Math.floor((Date.now() - t) / 86400000);
}
function backupKey(slug) { return slug ? `${userStateKey(slug)}:backup` : null; }
function snapshotBeforeDestroy() {
  const slug = activeSlug(); const k = backupKey(slug); if (!k) return;
  try {
    const cur = localStorage.getItem(userStateKey(slug)) || JSON.stringify(fullBackup());
    localStorage.setItem(k, cur);
  } catch (_) {}
}
function hasBackup() { const k = backupKey(activeSlug()); return !!(k && localStorage.getItem(k)); }
function restoreBackup() {
  const k = backupKey(activeSlug()); if (!k) throw new Error('No backup found');
  const raw = localStorage.getItem(k); if (!raw) throw new Error('No backup found');
  const slug = activeSlug();
  localStorage.setItem(userStateKey(slug), raw);
  loadUserState(slug);
  logEvent('persona', 'Restored last auto-backup');
}
// Accepts either a full backup object or a legacy { profile, phase, checks } export.
// VALIDATES before mutating any state (caller should snapshotBeforeDestroy() first). Returns boolean.
function applyBackup(obj) {
  if (!obj || typeof obj !== 'object' || !obj.profile) return false;
  if (obj.app && obj.app !== 'the-hard-part') return false;        // foreign file — refuse
  if (obj.appVersion && obj.appVersion !== APP_VERSION) console.warn(`applyBackup: backup appVersion ${obj.appVersion} != ${APP_VERSION}`);
  const slug = obj.profile.usernameSlug || slugify(obj.profile.username || '') || obj.slug || '';
  if (!slug) return false;
  state.activeUser = slug; try { localStorage.setItem(ACTIVE_KEY, slug); } catch (_) {}
  state.profile = obj.profile;
  state.phase = obj.phase || null;
  state.checks = Array.isArray(obj.checks) ? obj.checks : [];
  state.session = obj.session || null;
  state.injury = obj.injury || null;
  state.log = Array.isArray(obj.log) ? obj.log : [];
  state.lifts = (obj.lifts && typeof obj.lifts === 'object') ? obj.lifts : {};
  state.returnRamp = obj.returnRamp || null;
  state.targetReachedAt = obj.targetReachedAt || null;
  state.celebrationSeen = !!obj.celebrationSeen;
  state.capstoneReached = !!obj.capstoneReached;
  if (obj.units) state.settings.units = obj.units;
  saveLocal();
  logEvent('persona', `Imported backup for "${slug}" (${state.checks.length} check-ins)`);
  return true;
}

function celebrate(line, then) {
  const ov = document.createElement('div'); ov.className = 'crown';
  ov.innerHTML = `<div style="max-width:340px;"><div class="display-l serif" style="color:var(--milestone);">✦</div><div class="sp-12"></div><p class="headline serif">${escHtml(line)}</p></div>`;
  document.body.appendChild(ov);
  setTimeout(() => { ov.remove(); if (then) then(); }, 1500);
}

