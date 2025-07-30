const CACHE_NAME = 'namaz-v3';
const ASSETS = [
  '/',
  '/index.html',
  'https://img.icons8.com/ios/512/islamic/prayer.png',
  'https://www.islamcan.com/audio/adhan/fajr.mp3',
  'https://www.islamcan.com/audio/adhan/standard.mp3'
];

let prayerTimes = {};
let currentCity = '';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});

self.addEventListener('message', event => {
  if (event.data.type === 'SET_PRAYER_TIMES') {
    prayerTimes = event.data.times;
    currentCity = event.data.city;
    scheduleBackgroundNotifications();
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'prayer-times') {
    event.waitUntil(scheduleBackgroundNotifications());
  }
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

function scheduleBackgroundNotifications() {
  if (!prayerTimes || Object.keys(prayerTimes).length === 0) return;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  Object.entries(prayerTimes).forEach(([prayer, time]) => {
    if (prayer === 'sunrise') return;

    const [hours, minutes] = time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    let diff = prayerTime - currentTime;

    if (diff < 0) diff += 1440;
    
    const notificationTime = diff - 5; // За 5 минут до намаза
    if (notificationTime > 0 && notificationTime < 1440) {
      setTimeout(() => {
        self.registration.showNotification('Время намаза', {
          body: `Скоро время намаза ${getPrayerName(prayer)}`,
          icon: 'https://img.icons8.com/ios/512/islamic/prayer.png',
          vibrate: [200, 100, 200, 100, 200],
          tag: `prayer-${prayer}`,
          data: { prayer: prayer }
        });
      }, notificationTime * 60000);
    }
  });
}

function getPrayerName(prayer) {
  const names = {
    'fajr': 'Фаджр',
    'dhuhr': 'Зухр',
    'asr': 'Аср',
    'maghrib': 'Магриб',
    'isha': 'Иша'
  };
  return names[prayer] || prayer;
}

self.addEventListener('notificationclick', event => {
  const prayer = event.notification.data.prayer;
  event.notification.close();
  
  // Воспроизводим азан
  const audioUrl = prayer === 'fajr' ? 
    'https://www.islamcan.com/audio/adhan/fajr.mp3' :
    'https://www.islamcan.com/audio/adhan/standard.mp3';
  
  event.waitUntil(
    clients.openWindow('/')
      .then(() => {
        return fetch(audioUrl)
          .then(response => response.blob())
          .then(blob => {
            const audio = new Audio(URL.createObjectURL(blob));
            return audio.play();
          });
      })
  );
});
