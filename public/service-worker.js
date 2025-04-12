// Версия кеша
const CACHE_NAME = 'family-app-v1';

// Файлы для кеширования
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon-256.png',
  '/notification.mp3',
  '/bell.mp3',
  '/chime.mp3',
  '/manifest.json'
];

// Установка Service Worker и кеширование ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Удаление старых кешей
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов и использование кеша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем данные из кеша, если они найдены
        if (response) {
          return response;
        }
        
        // Клонируем запрос, так как он может быть использован только один раз
        const fetchRequest = event.request.clone();
        
        // Если данных в кеше нет, делаем запрос к сети
        return fetch(fetchRequest).then(response => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ, так как он может быть использован только один раз
          const responseToCache = response.clone();
          
          // Добавляем ответ в кеш для будущих запросов
          caches.open(CACHE_NAME)
            .then(cache => {
              // Кешируем только статические ресурсы и данные API с GET-запросами
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });
            
          return response;
        });
      })
  );
});

// Обработка уведомлений push
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Действие при клике на уведомление
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Обработка действий уведомления
  if (event.action === 'open') {
    // Действие "Открыть приложение"
    console.log('User clicked on "Open App" action');
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(clientList => {
      // Если уже есть открытое окно, переключаемся на него
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});