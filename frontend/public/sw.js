// VANVAS Production Service Worker
// Version: vanvas-pwa-v1.0.0

const CACHE_VERSION = 'vanvas-v1';
const CACHE_STATIC = `vanvas-static-${CACHE_VERSION}`;
const CACHE_SHELL = `vanvas-shell-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// 1. Install Event: Precache core static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[VANVAS SW] Precache warning:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_STATIC, CACHE_SHELL];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('vanvas-') && !allowedCaches.includes(cacheName)) {
            console.log('[VANVAS SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Clean strategy routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // A. Next.js Static Assets & Images/Icons/Fonts: Cache-First with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/artworks/') ||
    url.pathname.startsWith('/avatars/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_STATIC).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // B. Navigation Requests (HTML Pages): Network-First with Cache/Offline Fallback
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_SHELL).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, check if page is in cache
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // If not cached, fall back to offline page
          const offlinePage = await caches.match('/offline');
          if (offlinePage) {
            return offlinePage;
          }
          // Ultimate fallback to root if available
          return caches.match('/');
        })
    );
    return;
  }

  // C. API Requests & External APIs: Network-Only (Honest offline, no false synth data)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) {
    // Network-only. Offline handling is performed faithfully by the frontend client
    return;
  }
});
