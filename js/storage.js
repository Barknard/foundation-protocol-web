'use strict';
// ============================================================
// STORAGE
// ============================================================
// Soft sign-out: persist the current persona, then clear the in-memory session + the
// active-user pointer WITHOUT deleting any persona's saved data (so you can log back in).
function logout() {
  try { saveLocal(); } catch (_) {}
  state.profile = null; state.phase = null; state.checks = []; state.pending = [];
  state.session = null; state.injury = null; state.log = []; state.lifts = {}; state._preDay = null; delete state._chk; delete state._onb;
  state.returnRamp = null; state.targetReachedAt = null; state.celebrationSeen = false; state.capstoneReached = false;
  state.activeUser = null;
  try { localStorage.removeItem(ACTIVE_KEY); } catch (_) {}
}
function loadUserState(slug) {
  state.profile = null; state.phase = null; state.checks = []; state.pending = []; state.session = null; state.injury = null; state.log = []; state.lifts = {};
  state.returnRamp = null; state.targetReachedAt = null; state.celebrationSeen = false; state.capstoneReached = false;
  if (!slug) return;
  try {
    const raw = localStorage.getItem(userStateKey(slug));
    if (raw) { const d = JSON.parse(raw); state.profile = d.profile || null; state.phase = d.phase || null; state.checks = d.checks || []; state.pending = d.pending || []; state.session = d.session || null; state.injury = d.injury || null; state.log = d.log || []; state.lifts = d.lifts || {}; state.returnRamp = d.returnRamp || null; state.targetReachedAt = d.targetReachedAt || null; state.celebrationSeen = !!d.celebrationSeen; state.capstoneReached = !!d.capstoneReached; }
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
      localStorage.setItem(userStateKey(slug), JSON.stringify({ profile: state.profile, phase: state.phase, checks: state.checks, pending: state.pending, session: state.session, injury: state.injury, log: state.log, lifts: state.lifts, returnRamp: state.returnRamp, targetReachedAt: state.targetReachedAt, celebrationSeen: state.celebrationSeen, capstoneReached: state.capstoneReached }));
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
function markDirty(...keys) {
  // Local-first: a device that has never been configured for sync carries NO pending queue,
  // so it never shows a false "unsynced changes" state. Just persist and return.
  if (!isConfigured()) { saveLocal(); return; }
  keys.forEach(k => { if (!state.pending.includes(k)) state.pending.push(k); });
  saveLocal();
  if (state.settings.autoSync) syncToRemote();
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
  state.pending = [];
  saveLocal();
  logEvent('persona', `Imported backup for "${slug}" (${state.checks.length} check-ins)`);
  return true;
}

// ---------- GitHub API ----------
function ghUrl(path) { return `https://api.github.com/repos/${state.settings.repo}/contents/${path}`; }
function ghHeaders() { return { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${state.settings.pat}` }; }
function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
function b64decode(s) { return decodeURIComponent(escape(atob(s.replace(/\s/g, '')))); }
const fileShaCache = {};
async function ghGetRaw(path) {
  // no-store: GitHub sends Cache-Control max-age on authed GETs; the browser would
  // otherwise serve a stale sha/content and defeat conflict-retry and fresh pulls.
  const resp = await fetch(ghUrl(path), { headers: ghHeaders(), cache: 'no-store' });
  if (resp.status === 404) return null;
  if (resp.status === 401 || resp.status === 403) throw new Error('GitHub auth failed — check the token (needs Contents: Read & Write).');
  if (!resp.ok) throw new Error(`GitHub GET ${path} → ${resp.status}`);
  const json = await resp.json();
  fileShaCache[path] = json.sha;
  return { content: JSON.parse(b64decode(json.content)), sha: json.sha };
}
async function ghGet(path) { const r = await ghGetRaw(path); return r ? r.content : null; }
async function ghPut(path, data) {
  let sha = fileShaCache[path];
  if (!sha) { try { const r = await ghGetRaw(path); if (r) sha = r.sha; } catch (_) {} }
  const send = (useSha) => {
    const body = { message: `Update ${path}`, content: b64encode(JSON.stringify(data, null, 2)) };
    if (useSha) body.sha = useSha;
    return fetch(ghUrl(path), { method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  };
  let resp = await send(sha);
  if (resp.status === 409 || resp.status === 422) {
    // stale sha (file changed on another device / the web UI) — refresh and retry once
    delete fileShaCache[path];
    let fresh = null;
    try { const r = await ghGetRaw(path); if (r) fresh = r.sha; } catch (_) {}
    resp = await send(fresh);
  }
  if (!resp.ok) { const t = await resp.text(); throw new Error(`GitHub PUT ${path} → ${resp.status}: ${t.slice(0,200)}`); }
  const json = await resp.json();
  fileShaCache[path] = json.content.sha;
}
function isConfigured() { return Boolean(state.settings.repo && state.settings.pat); }

function celebrate(line, then) {
  const ov = document.createElement('div'); ov.className = 'crown';
  ov.innerHTML = `<div style="max-width:340px;"><div class="display-l serif" style="color:var(--milestone);">✦</div><div class="sp-12"></div><p class="headline serif">${escHtml(line)}</p></div>`;
  document.body.appendChild(ov);
  setTimeout(() => { ov.remove(); if (then) then(); }, 1500);
}
function mergeChecks(remote, local) {
  // Dedupe by calendar DATE, not raw ts: a same-day re-check gets a new ts, so keying by ts would
  // keep BOTH the old and new entry for one day and double-count it. Newest ts wins per date.
  const byDate = new Map();
  const take = c => {
    if (!c || c.ts == null || !c.date) return;
    const prev = byDate.get(c.date);
    if (!prev || c.ts >= prev.ts) byDate.set(c.date, c);
  };
  (Array.isArray(remote) ? remote : []).forEach(take);
  (Array.isArray(local)  ? local  : []).forEach(take);   // local applied last → wins exact ts ties
  return [...byDate.values()].sort((a, b) => a.ts - b.ts);
}
async function syncFromRemote() {
  if (!isConfigured() || !activeSlug()) return;
  setSync('syncing', 'Loading from GitHub');
  try {
    const [profile, phase, checks] = await Promise.allSettled([ ghGet(dataPath('profile')), ghGet(dataPath('phase')), ghGet(dataPath('checks')) ]);
    if (profile.status === 'fulfilled' && profile.value) state.profile = profile.value;
    if (phase.status   === 'fulfilled' && phase.value)   state.phase   = phase.value;
    if (checks.status  === 'fulfilled' && Array.isArray(checks.value)) state.checks = checks.value;
    const failed = [profile, phase, checks].find(r => r.status === 'rejected');
    saveLocal();
    if (failed) setSync('error', (failed.reason && failed.reason.message) ? failed.reason.message : 'Sync issue');
    else setSync('online', 'Synced');
  } catch (e) { console.error(e); setSync('error', e.message); }
}
let _syncing = false, _syncQueued = false;
async function syncToRemote() {
  if (!isConfigured() || !activeSlug() || state.pending.length === 0) return;
  if (_syncing) { _syncQueued = true; return; }      // serialize: avoid overlapping push loops
  _syncing = true;
  setSync('syncing', `Pushing ${state.pending.length} change${state.pending.length===1?'':'s'}`);
  try {
    for (const key of [...state.pending]) {
      if (key === 'checks') {
        // union with any checks pushed from another device so cross-device entries are never clobbered
        try { const remote = await ghGet(dataPath('checks')); if (Array.isArray(remote)) state.checks = mergeChecks(remote, state.checks); } catch (_) {}
      }
      await ghPut(dataPath(key), state[key]);
      state.pending = state.pending.filter(k => k !== key);
      saveLocal();
    }
    setSync('online', 'Synced');
  } catch (e) { console.error(e); setSync('error', e.message); }
  finally {
    _syncing = false;
    if (_syncQueued) { _syncQueued = false; if (state.pending.length) syncToRemote(); }
  }
}
function setSync(status, message) {
  state.ui.syncStatus = status; state.ui.syncMessage = message;
  document.querySelectorAll('.sync').forEach(el => {
    el.className = 'sync ' + status;
    el.textContent = status === 'error' ? 'Sync issue' : status === 'syncing' ? 'Syncing…' : status === 'online' ? 'Synced' : (isConfigured() ? 'Idle' : 'Local only');
  });
}

