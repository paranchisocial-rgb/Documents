/* ═══════════════════════════════════════════════════
   Paranchi's Documents — Service Worker
   Makes the app fully usable offline after the first
   successful load (which needs internet once, to fetch
   the app + fonts + PDF/ZIP libraries from their CDNs).
═══════════════════════════════════════════════════ */

const CACHE_VERSION = 'paranchi-docs-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-192x192.png',
  './icon-maskable-512x512.png',
  './apple-touch-icon.png'
];

// Hosts the app pulls fonts / libraries from at runtime.
// Anything fetched from these gets cached the first time
// it succeeds, then served from cache from then on.
const RUNTIME_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {}) // never block install on a slow/missing asset
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => n !== CACHE_VERSION)
          .map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

function isRuntimeHost(url) {
  try {
    const u = new URL(url);
    return RUNTIME_HOSTS.some(h => u.hostname === h);
  } catch (e) {
    return false;
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate';
  const sameOrigin = new URL(req.url).origin === self.location.origin;

  // App shell (this origin): cache-first, so the app opens instantly
  // and works with zero connectivity once cached.
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req)
          .then(res => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => {
            // Offline and not cached — fall back to the app shell
            // for navigations so the app still opens.
            if (isNavigation) return caches.match('./index.html');
          });
      })
    );
    return;
  }

  // Fonts / CDN libraries (JSZip, pdf.js, Google Fonts): cache-first
  // runtime caching. First load needs internet; every load after
  // that is served from cache, offline-safe.
  //
  // IMPORTANT: cross-origin requests like these come back as
  // "opaque" responses (status 0, res.ok is always false even on
  // success) because the browser fetches them in no-cors mode. A
  // check like `if (res.ok)` silently never caches them — that was
  // the actual reason offline mode wasn't working before. We cache
  // any response the fetch resolves with instead.
  if (isRuntimeHost(req.url)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
