const CACHE_NAME = 'oke-finance-v1';

// Auto-detect base path
const getBasePath = () => {
    const path = self.location.pathname;
    const match = path.match(/^(\/[^\/]+)\//);
    return match ? match[1] : '';
};

const BASE_PATH = getBasePath();

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/app.js',
  BASE_PATH + '/storage.js',
  BASE_PATH + '/icons.js',
  BASE_PATH + '/styles.css',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icons/icon-192.png',
  BASE_PATH + '/icons/icon-512.png'
];

// Install - skip waiting to activate immediately
self.addEventListener('install', event => {
  console.log('✅ Service Worker installing:', CACHE_NAME);
  self.skipWaiting(); // 👈 Force immediate activation
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Cache failed:', err);
      })
  );
});

// Activate - take control immediately and clean old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating:', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim() // 👈 Control existing pages without reload
    ])
  );
});

// Fetch - Network first, then cache (ensures fresh content)
self.addEventListener('fetch', event => {
  event.respondWith(
    // Try network first
    fetch(event.request)
      .then(response => {
        // Clone response to cache it
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});
