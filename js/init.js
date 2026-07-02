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
    try { const est = await storagePressure(); if (est && est.pct > 0.8) toast('Phone storage is almost full — export a backup soon to avoid losing data.', 'error'); } catch (_) {}
  }
  navigate(state.profile ? 'today' : 'onboarding');
}
// Offline support: cache the app shell so it opens without a network connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
// ANDROID BACK (APK): without this listener Capacitor's default finishes the Activity — the standard
// back-swipe closed the whole app from every screen. Mirror the in-app back arrow instead: sub-screens
// go back, non-Today tabs go to Today, and only the roots (Today / welcome / loading) exit the app.
(() => {
  try {
    const Cap = window.Capacitor;
    if (!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.Plugins && Cap.Plugins.App)) return;
    Cap.Plugins.App.addListener('backButton', () => {
      const s = state.ui.screen;
      if (s === 'onboarding' && state._onb && (state._onb.step || 1) > 1) { state._onb.step -= 1; render(); return; }
      if (s === 'today' || s === 'onboarding' || s === 'loading') { Cap.Plugins.App.exitApp(); return; }
      if (TAB_SCREENS.includes(s) || s === 'capstone') { navigate('today'); return; }   // capstone: never back onto the spent check-in form
      goBack('today');
    });
  } catch (_) { /* browser PWA / plugin missing — the in-app back arrow still covers navigation */ }
})();
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

