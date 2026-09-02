// AquaShield PWA Service Worker
const CACHE_NAME = 'aquashield-cache-v1';
const urlsToCache = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Network first with fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});