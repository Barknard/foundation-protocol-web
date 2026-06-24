'use strict';
// INIT
// ============================================================
async function init() {
  loadLocal();
  pruneInjury();
  // Persistent storage (best-effort): a non-persistent origin can be silently evicted by the OS,
  // taking the entire offline-only training history with it. Try once at boot; the storage lane's
  // helper no-ops if already granted (guarded by state.settings.storagePersisted).
  if (typeof ensurePersistentStorage === 'function' && !state.settings.storagePersisted) {
    try { await ensurePersistentStorage(); } catch (_) {}
  }
  // Storage-pressure warning: if the device is nearly full, a save can silently fail — warn early.
  if (typeof storagePressure === 'function') {
    try { const pct = await storagePressure(); if (pct != null && pct > 0.8) toast('Phone storage is almost full — export a backup soon to avoid losing data.', 'error'); } catch (_) {}
  }
  navigate(state.profile ? 'today' : 'onboarding');
}
// Offline support: cache the app shell so it opens without a network connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
// Keep the day-gate countdown ("next session opens in …") fresh without a full re-render,
// AND drive the day boundary: when the local day flips (e.g. an installed PWA left open past
// midnight), rerenderIfNewDay() re-renders Today so the check-in button comes back.
setInterval(() => {
  const el = document.getElementById('next-unlock'); if (el) el.textContent = fmtCountdown(msUntilTomorrow());
  rerenderIfNewDay();
}, 30000);
// Resuming a backgrounded standalone PWA does not re-run init(); these hooks catch the day flip
// on foreground (visibility), on bfcache restore (pageshow), and on window focus.
document.addEventListener('visibilitychange', () => { if (!document.hidden) rerenderIfNewDay(); });
window.addEventListener('pageshow', rerenderIfNewDay);
window.addEventListener('focus', rerenderIfNewDay);
init();

