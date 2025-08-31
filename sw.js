const CACHE_NAME = 'prayer-times-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Scheherazade+New&display=swap',
  'https://img.icons8.com/ios/512/islamic/prayer.png',
  'https://www.islamcan.com/audio/adhan/fajr.mp3',
  'https://www.islamcan.com/audio/adhan/standard.mp3'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Для GitHub Pages - особенная обработка
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

let prayerTimes = {};

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_PRAYER_TIMES') {
    prayerTimes = {
      times: event.data.times,
      city: event.data.city,
      timestamp: Date.now()
    };
    console.log('Prayer times updated in Service Worker');
  }
});

function showNotification(prayer) {
  const prayerNames = {
    'fajr': 'Фаджр',
    'dhuhr': 'Зухр',
    'asr': 'Аср',
    'maghrib': 'Магриб',
    'isha': 'Иша'
  };
  
  self.registration.showNotification('Время намаза', {
    body: `Скоро время намаза ${prayerNames[prayer]}`,
    icon: 'https://img.icons8.com/ios/512/islamic/prayer.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: `prayer-${prayer}`,
    data: { prayer: prayer }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('./');
      })
  );
});
