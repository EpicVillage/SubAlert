const CACHE_NAME = 'subalert-v4';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Skip caching for POST requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) URLs
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Network first for HTML to avoid stale content
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Cache first for other resources
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Only cache http(s) URLs
          if (!event.request.url.startsWith('http')) {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.warn('Cache put failed:', err);
            });
          
          return response;
        });
      })
  );
});

self.addEventListener('activate', event => {
  // Take control of all pages immediately
  event.waitUntil(
    clients.claim().then(() => {
      // Clean up old caches
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});