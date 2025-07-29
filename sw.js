const CACHE_NAME = 'namaz-v2';
const ASSETS = [
  '/',
  '/index.html',
  'https://img.icons8.com/ios/512/islamic/prayer.png',
  'https://www.islamcan.com/audio/adhan/fajr.mp3',
  'https://www.islamcan.com/audio/adhan/standard.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
