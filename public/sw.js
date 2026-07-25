/// <reference lib="webworker" />

/**
 * Service Worker for බිත්තර කඩේ
 * - Pre-caches app shell on install
 * - Network-first for HTML/JS/CSS (so updates are picked up)
 * - Cache-first for static assets (icons, fonts, images)
 */

const VERSION = 'v1.1.0';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-1024.png',
  '/icons/icon-512.png',
  '/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin: try network first, fall back to cache (offline support)
  if (url.origin === self.location.origin) {
    // Static assets — cache first
    if (req.destination === 'image' || req.destination === 'font' || url.pathname.startsWith('/icons/')) {
      event.respondWith(
        caches.open(ASSET_CACHE).then(async (cache) => {
          const cached = await cache.match(req);
          if (cached) return cached;
          try {
            const res = await fetch(req);
            cache.put(req, res.clone());
            return res;
          } catch {
            return cached || new Response('', { status: 504 });
          }
        })
      );
      return;
    }
    // HTML / JS / CSS — network first
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          // For navigation requests, fall back to root
          if (req.mode === 'navigate') {
            const root = await caches.match('/');
            if (root) return root;
          }
          return new Response('අන්තර්ජාලය නොමැති විට මෙම පිටුව ලබා ගත නොහැක.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // Cross-origin (e.g. Google Fonts) — stale-while-revalidate
  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Optional: daily reminder via push (no-op self-notification, scheduled client-side)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
