// Сервис для работы с уведомлениями
import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';

// Проверка поддержки уведомлений на текущем устройстве
export const checkNotificationSupport = () => {
  // Проверяем поддержку сервис-воркеров
  const isServiceWorkerSupported = 'serviceWorker' in navigator;
  
  // Проверяем поддержку уведомлений
  const isNotificationSupported = 'Notification' in window;
  
  // Проверяем, является ли устройство мобильным Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  return {
    isServiceWorkerSupported,
    isNotificationSupported,
    isAndroid,
    isPushSupported: isServiceWorkerSupported && isNotificationSupported
  };
};

// Запрос разрешения на показ уведомлений
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { status: 'unsupported', permission: null };
  }
  
  try {
    const permission = await Notification.requestPermission();
    return { status: 'supported', permission };
  } catch (error) {
    console.error('Ошибка при запросе разрешения на уведомления:', error);
    return { status: 'error', permission: null, error };
  }
};

// Получение токена для Firebase Cloud Messaging (для Android)
export const getMessagingToken = async (vapidKey) => {
  try {
    if (!messaging) return null;
    
    const currentToken = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    });
    
    if (currentToken) {
      console.log('FCM токен получен:', currentToken);
      return currentToken;
    } else {
      console.log('Не удалось получить токен. Требуется запросить разрешение.');
      return null;
    }
  } catch (error) {
    console.error('Ошибка при получении FCM токена:', error);
    return null;
  }
};

// Показ локального уведомления
export const showLocalNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('Уведомления не поддерживаются в этом браузере');
    return false;
  }
  
  const defaultOptions = {
    body: '',
    icon: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'family-app-notification'
  };
  
  if (Notification.permission === 'granted') {
    try {
      // Воспроизведение звука
      if (options.sound) {
        const audio = new Audio(options.sound);
        audio.play().catch(error => console.warn('Ошибка воспроизведения звука:', error));
      }
      
      // Создание уведомления
      const notification = new Notification(title, { ...defaultOptions, ...options });
      
      // Обработчик клика по уведомлению
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return true;
    } catch (error) {
      console.error('Ошибка при показе уведомления:', error);
      return false;
    }
  }
  
  return false;
};

// Настройка обработчика входящих FCM сообщений
export const setupFCMListener = () => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Получено сообщение FCM:', payload);
    
    const { notification } = payload;
    if (notification) {
      showLocalNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192.png',
        sound: '/notification.mp3'
      });
    }
  });
};