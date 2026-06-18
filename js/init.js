'use strict';
// INIT
// ============================================================
async function init() {
  loadLocal();
  pruneInjury();
  navigate(state.profile ? 'today' : 'onboarding');
  if (isConfigured()) {
    if (state.profile == null && state.activeUser) { await syncFromRemote(); if (state.profile) navigate('today'); else if (state.ui.syncStatus !== 'error') setSync('offline', 'Local only'); }
    else if (state.profile == null) { setSync('offline', 'Local only'); }
    else if (state.pending.length) await syncToRemote();
    else setSync('online', 'Synced');
  } else setSync('offline', 'Local only');
}
window.addEventListener('online',  () => { setSync('syncing','Reconnecting'); syncToRemote(); });
window.addEventListener('offline', () => { setSync('offline','Offline'); });
// Offline support: cache the app shell so it opens without a network connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
// Keep the day-gate countdown ("next session opens in …") fresh without a full re-render.
setInterval(() => { const el = document.getElementById('next-unlock'); if (el) el.textContent = fmtCountdown(msUntilTomorrow()); }, 30000);
init();

