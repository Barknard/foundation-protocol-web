/* The Hard Part service worker — offline app shell.
   The app is a slim index.html spine + css/*.css + js/*.js modules, fully local-first
   (no accounts, no cloud, no telemetry): cache the whole shell — icons and self-hosted
   fonts included — so it opens with no network on a first-ever offline launch.

   NO-SERVER UPDATE RITUAL (installed local-first copy):
   The fetch handler is network-first, so an installed copy only picks up new code when
   it can briefly reach the origin. To update an installed copy:
     1. Re-run a local server for this folder (the same origin the app was installed from).
     2. Relaunch the app ONCE while online — the network-first SW pulls the new shell and,
        because CACHE was bumped below, the new service worker installs and activates
        (old caches are deleted in 'activate').
     3. Go back offline — the freshly-cached new shell now serves.
   If you change ANY shell asset, bump CACHE — keep the version in sync with APP_VERSION
   in js/config.js (one app, one version). */
const CACHE = 'thp-shell-v2.3.0';
const SHELL = [
  './', './index.html', './manifest.json',
  './icon.png', './logo.png',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './fonts/fraunces-latin-var.woff2', './fonts/ibm-plex-sans-latin-var.woff2',
  './fonts/ibm-plex-mono-latin-400.woff2', './fonts/ibm-plex-mono-latin-500.woff2',
  './css/base.css', './css/components.css', './css/figures.css', './css/screens.css',
  './js/sprite.js', './js/config.js', './js/state.js', './js/program.js',
  './js/figure-poses.js', './js/figure.js', './js/foot.js',
  './js/engine.js', './js/storage.js', './js/util.js', './js/ui.js', './js/screens.js', './js/init.js',
];

self.addEventListener('install', (e) => {
  // Fetch each shell file with cache:'no-store' so a reinstall never re-caches a
  // stale copy from the browser's HTTP cache (the cause of mixed old/new files).
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(
      SHELL.map((u) => fetch(u, { cache: 'no-store' }).then((r) => (r && r.ok) ? c.put(u, r.clone()) : null).catch(() => {}))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // the app makes no cross-origin requests — let the browser handle strays

  // Same-origin app shell: network-first with cache bypass so a freshly-deployed version always
  // wins online; fall back to the cached shell when offline. Only cache GOOD responses — a 404/500
  // served mid-deploy must never overwrite a working cached file (it would poison the offline shell).
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req).then((r) => {
        if (r) return r;
        // Only a NAVIGATION falls back to the app spine; a missing js/css/font must fail
        // honestly rather than execute an HTML page as a subresource.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
