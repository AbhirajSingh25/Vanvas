// VANVAS Production Service Worker
// Version: vanvas-pwa-v6.0.0

const CACHE_VERSION = 'vanvas-v6';
const SCRIPT_VERSION = 'vanvas-pwa-v6.0.0';
const CACHE_STATIC = `vanvas-static-${CACHE_VERSION}`;
const CACHE_SHELL = `vanvas-shell-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/apple-touch-icon-v2.png',
  '/favicon.ico',
];

const PRIVATE_ROUTE_PREFIXES = [
  '/trips',
  '/circles',
  '/friends',
  '/profile',
  '/settings',
  '/bookings',
  '/admin',
  '/login',
  '/register',
  '/join',
  '/api',
];

function isPrivatePathname(pathname) {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// 1. Install Event: Precache core offline fallback and icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            fetch(new Request(asset, { cache: 'reload' }))
              .then((res) => {
                if (res && res.ok && res.status === 200) {
                  return cache.put(asset, res);
                }
              })
              .catch(() => {})
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated cache versions & claim clients immediately
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_STATIC, CACHE_SHELL];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('vanvas-') && !allowedCaches.includes(cacheName)) {
              console.log('[VANVAS SW] Deleting obsolete cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Safe routing with strict private-route and RSC protection
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never intercept cross-origin APIs (e.g. Render backend, CDNs, analytics)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache API endpoints or Next.js RSC flight / router prefetch requests
  if (
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-State-Tree') ||
    request.headers.has('Next-Router-Prefetch')
  ) {
    return;
  }

  // A. Hashed Next.js Static Chunks: Cache-First on exact immutable hash URL
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse && cachedResponse.status === 200) {
          return cachedResponse;
        }
        const networkResponse = await fetch(request);
        if (
          networkResponse &&
          networkResponse.ok &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      })
    );
    return;
  }

  // A2. Editorial Imagery & Brand Media: Network-First with cache fallback
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/artworks/') ||
    url.pathname.startsWith('/avatars/') ||
    /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (
            networkResponse &&
            networkResponse.ok &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            cache.put(request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
        } catch {
          // Network failed or offline - fall back to cache below
        }

        const cachedResponse = await cache.match(request);
        if (cachedResponse && cachedResponse.status === 200) {
          return cachedResponse;
        }

        // Final safety attempt via direct fetch
        return fetch(request).catch(() => cachedResponse);
      })
    );
    return;
  }

  // B. HTML Document Navigation Requests: Network-First, never serving stale HTML to private routes
  const acceptHeader = request.headers.get('accept') || '';
  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const cacheControl = (networkResponse.headers.get('cache-control') || '').toLowerCase();
          const shouldCachePublicShell =
            networkResponse &&
            networkResponse.ok &&
            networkResponse.status === 200 &&
            !isPrivatePathname(url.pathname) &&
            !cacheControl.includes('no-store') &&
            !cacheControl.includes('private');

          if (shouldCachePublicShell) {
            const clone = networkResponse.clone();
            caches.open(CACHE_SHELL).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Only look up cached HTML for public pages
          if (!isPrivatePathname(url.pathname)) {
            const shellCache = await caches.open(CACHE_SHELL);
            const cachedPage = await shellCache.match(request);
            if (cachedPage && cachedPage.status === 200) {
              return cachedPage;
            }
          }
          const offlineFallback = await caches.match('/offline');
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response(
            '<!doctype html><html><body style="font-family:serif;padding:2rem;background:#FAF4E8;color:#173B32"><h1>Offline</h1><p>Reconnect to continue exploring VANVAS.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }
});

// 4. Message Event: Controlled skipWaiting and safe version diagnostics
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'GET_DIAGNOSTICS' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      cacheVersion: CACHE_VERSION,
      scriptVersion: SCRIPT_VERSION,
      cacheStatic: CACHE_STATIC,
      cacheShell: CACHE_SHELL,
    });
  }
});
