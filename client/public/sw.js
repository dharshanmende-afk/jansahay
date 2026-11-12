/**
 * sw.js — JanSahay AI Progressive Web App Service Worker
 *
 * Implements offline availability for rural & low-connectivity areas:
 * 1. App Shell + static assets cached dynamically on fetch
 * 2. Stale-While-Revalidate for scheme catalog, document guides, updates, and preparation checklist API
 */

const CACHE_NAME = 'jansahay-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Stale-While-Revalidate for scheme catalog, document guides, updates, and saved preparation checklist
  if (
    url.pathname.includes('/api/schemes') ||
    url.pathname.includes('/api/documents/guides') ||
    url.pathname.includes('/api/updates') ||
    url.pathname.includes('/api/documents/preparation-dashboard') ||
    url.pathname.includes('/api/documents')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation requests fall back to cached app shell cleanly when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static JS/CSS/font/image assets: Cache with network fallback + background update
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((netRes) => {
            if (netRes && netRes.status === 200) {
              cache.put(request, netRes.clone());
            }
            return netRes;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    )
  );
});
