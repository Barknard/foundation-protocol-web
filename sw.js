/* Foundation Protocol service worker — offline app shell.
   The app is a slim index.html spine + css/*.css + js/*.js modules; cache them
   all (plus icons + self-hosted fonts) so it opens with no network on a first-ever
   offline launch.
   GitHub API (data sync) is NEVER cached — it always goes to the network.

   NO-SERVER UPDATE RITUAL (installed local-first copy):
   The fetch handler is network-first, so an installed copy only picks up new code when
   it can briefly reach the origin. To update an installed copy:
     1. Re-run a local server for this folder (the same origin the app was installed from).
     2. Relaunch the app ONCE while online — the network-first SW pulls the new shell and,
        because CACHE was bumped below, the new service worker installs and activates
        (old caches are deleted in 'activate').
     3. Go back offline — the freshly-cached new shell now serves.
   If you change ANY shell asset, bump CACHE (vX.Y.Z) so the activate step purges the old cache. */
const CACHE = 'fp-shell-v3.16.8';
const SHELL = [
  './', './index.html', './manifest.json',
  './icon.png', './logo.png',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './fonts/fraunces-latin-var.woff2', './fonts/ibm-plex-sans-latin-var.woff2',
  './fonts/ibm-plex-mono-latin-400.woff2', './fonts/ibm-plex-mono-latin-500.woff2',
  './css/base.css', './css/components.css', './css/figures.css', './css/screens.css',
  './js/sprite.js', './js/config.js', './js/state.js', './js/program.js',
  './js/figure-poses.js', './js/figure.js',
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

  // Never intercept the data-sync API — must always hit the live network.
  if (url.hostname === 'api.github.com') return;

  // Same-origin app shell: network-first with cache bypass so a freshly-deployed
  // version always wins online (GitHub Pages sets a 10-min Cache-Control we must skip);
  // fall back to the cached shell only when offline.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Cross-origin: cache-first, fall back to network. Fonts are now self-hosted (same-origin),
  // so this path is only a safety net for any incidental cross-origin GET.
  e.respondWith(
    caches.match(req).then((r) =>
      r || fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => r)
    )
  );
});
