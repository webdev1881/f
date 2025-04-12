// Файл service-worker для Firebase Cloud Messaging (для Android)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Конфигурация Firebase (должна соответствовать конфигурации в firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyCK_9YG5-gjPzJyDG9FhEElRDg-YzHoyYQ",
  authDomain: "ffff-c3e3c.firebaseapp.com",
  projectId: "ffff-c3e3c",
  storageBucket: "ffff-c3e3c.firebasestorage.app",
  messagingSenderId: "481502978134",
  appId: "1:481502978134:web:ae913f9cad7a9a77dd9bf7",
  measurementId: "G-R1YVMQ6LFW"
});

const messaging = firebase.messaging();

// Обработка уведомлений в фоновом режиме
messaging.onBackgroundMessage((payload) => {
  console.log('Получено фоновое сообщение:', payload);
  
  const notificationTitle = payload.notification.title || 'Семейное приложение';
  const notificationOptions = {
    body: payload.notification.body || 'Новое уведомление',
    icon: '/icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    tag: 'family-app-notification',
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});