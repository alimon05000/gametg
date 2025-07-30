// sw.js
const CACHE_NAME = 'prayer-times-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  'https://img.icons8.com/ios/512/islamic/prayer.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

let prayerTimes = {};

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_PRAYER_TIMES') {
    prayerTimes = {
      times: event.data.times,
      city: event.data.city
    };
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prayer-times') {
    event.waitUntil(checkPrayerTimes());
  }
});

function checkPrayerTimes() {
  if (!prayerTimes.times) return;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  for (const [prayer, time] of Object.entries(prayerTimes.times)) {
    if (prayer === 'sunrise') continue;
    
    const [hours, minutes] = time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    let diff = prayerTime - currentTime;
    
    if (diff < 0) diff += 1440;
    
    if (diff <= 5) {
      showNotification(prayer);
    }
  }
}

function showNotification(prayer) {
  const prayerNames = {
    'fajr': 'Фаджр',
    'dhuhr': 'Зухр',
    'asr': 'Аср',
    'maghrib': 'Магриб',
    'isha': 'Иша'
  };
  
  self.registration.showNotification('Время намаза', {
    body: `Наступило время намаза ${prayerNames[prayer]}`,
    icon: 'https://img.icons8.com/ios/512/islamic/prayer.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: `prayer-${prayer}-${Date.now()}`,
    data: { prayer: prayer }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
