// Версия кеша
const CACHE_NAME = 'family-app-v1';

// Файлы для кеширования
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
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
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Семейное приложение', options)
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

// ============= ФОНОВАЯ СИНХРОНИЗАЦИЯ =============

// Обработка фоновой синхронизации
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkNotificationsInBackground());
  } else if (event.tag === 'update-location') {
    event.waitUntil(updateLocationInBackground());
  }
});

// Периодический запрос на синхронизацию
self.addEventListener('periodicsync', event => {
  console.log('Periodic sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkNotificationsInBackground());
  } else if (event.tag === 'update-location') {
    event.waitUntil(updateLocationInBackground());
  }
});

// Проверка уведомлений в фоновом режиме
async function checkNotificationsInBackground() {
  try {
    // Получаем данные из IndexedDB
    const db = await openDatabase();
    const userData = await getUserData(db);
    
    if (!userData || !userData.userRole) {
      console.warn('No user data found for background sync');
      return;
    }
    
    // Делаем запрос к Firebase
    const response = await fetch(`https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/notifications/${userData.userRole}.json?orderBy="timestamp"&limitToLast=5`);
    const data = await response.json();
    
    if (!data) return;
    
    // Обрабатываем новые уведомления
    const notifications = Object.entries(data).map(([id, notification]) => ({
      id,
      ...notification
    }));
    
    // Фильтруем только непрочитанные уведомления, пришедшие после последней проверки
    const unreadNotifications = notifications.filter(n => 
      !n.read && n.timestamp > (userData.lastCheckTimestamp || 0)
    );
    
    // Отправляем уведомления
    for (const notification of unreadNotifications) {
      await self.registration.showNotification('Семейное приложение', {
        body: `${notification.from}: ${notification.message}`,
        icon: '/icon-192.png',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: { id: notification.id }
      });
    }
    
    // Обновляем время последней проверки
    if (unreadNotifications.length > 0) {
      userData.lastCheckTimestamp = Date.now();
      await saveUserData(db, userData);
    }
  } catch (error) {
    console.error('Error in background notification check:', error);
  }
}

// Обновление геолокации в фоновом режиме
async function updateLocationInBackground() {
  try {
    // Получаем данные из IndexedDB
    const db = await openDatabase();
    const userData = await getUserData(db);
    
    if (!userData || !userData.userRole) {
      console.warn('No user data found for background location update');
      return;
    }
    
    // Получаем геолокацию (если доступна)
    if ('geolocation' in self) {
      navigator.geolocation.getCurrentPosition(async position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        };
        
        // Отправляем данные в Firebase
        await fetch(`https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/locations/${userData.userRole}.json`, {
          method: 'PUT',
          body: JSON.stringify(location)
        });
        
        console.log('Location updated in background');
      }, error => {
        console.error('Error getting location in background:', error);
      });
    }
  } catch (error) {
    console.error('Error in background location update:', error);
  }
}

// Открытие базы данных IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FamilyAppDB', 1);
    
    request.onerror = event => reject(event.target.error);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => resolve(event.target.result);
  });
}

// Получение данных пользователя из IndexedDB
function getUserData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userData'], 'readonly');
    const store = transaction.objectStore('userData');
    const request = store.get('current');
    
    request.onerror = event => reject(event.target.error);
    request.onsuccess = event => resolve(request.result);
  });
}

// Сохранение данных пользователя в IndexedDB
function saveUserData(db, userData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');
    const request = store.put({ ...userData, id: 'current' });
    
    request.onerror = event => reject(event.target.error);
    request.onsuccess = event => resolve();
  });
}

// ============= ХРАНЕНИЕ СОСТОЯНИЯ ПРИЛОЖЕНИЯ =============

// Обработчик сообщений от клиента (для хранения состояния)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'STORE_USER_DATA') {
    storeUserDataInIndexedDB(event.data.payload);
  }
});

// Сохранение данных пользователя для использования в фоновом режиме
async function storeUserDataInIndexedDB(userData) {
  try {
    const db = await openDatabase();
    await saveUserData(db, userData);
    console.log('User data stored in IndexedDB for background use');
  } catch (error) {
    console.error('Error storing user data in IndexedDB:', error);
  }
}