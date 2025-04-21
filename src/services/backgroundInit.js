// Модуль для инициализации всех фоновых сервисов в приложении
import { useAppStore } from '../stores/appStore';
import locationService from './locationService';

// Функция для создания тихого аудио для поддержания активности
function createSilentAudio() {
  // Создаем аудио контекст
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Устанавливаем минимальную громкость
    gainNode.gain.value = 0.001;
    
    // Подключаем и запускаем осциллятор
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    // Возвращаем функции для управления
    return {
      audioContext,
      resume() {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      },
      stop() {
        oscillator.stop();
        audioContext.close();
      }
    };
  } catch (error) {
    console.error('Error creating silent audio:', error);
    return null;
  }
}

// Функция для получения и поддержания блокировки пробуждения (WakeLock)
async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported');
    return null;
  }
  
  try {
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock acquired');
    
    // Обновление блокировки при возвращении на страницу
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        // Повторно запрашиваем блокировку
        await navigator.wakeLock.request('screen')
          .then(lock => console.log('Wake Lock reacquired'))
          .catch(err => console.error('Failed to reacquire Wake Lock:', err));
      }
    });
    
    return wakeLock;
  } catch (error) {
    console.error('Error acquiring Wake Lock:', error);
    return null;
  }
}

// Функция для регистрации дополнительного service worker для уведомлений
async function registerNotificationWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/notification-worker.js', {
      scope: '/'
    });
    
    console.log('Notification worker registered:', registration.scope);
    
    // Отправляем данные пользователя
    const appStore = useAppStore();
    if (appStore.userRole) {
      registration.active.postMessage({
        type: 'STORE_USER_DATA',
        payload: {
          userRole: appStore.userRole,
          partnerRole: appStore.partnerRole,
          lastCheckTimestamp: Date.now()
        }
      });
      
      // Запускаем фоновые сервисы
      registration.active.postMessage({
        type: 'START_BACKGROUND_SERVICES'
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Error registering notification worker:', error);
    return null;
  }
}

// Функция для запроса всех необходимых разрешений
async function requestPermissions() {
  const permissions = [];
  
  // Разрешение на уведомления
  if ('Notification' in window) {
    permissions.push(
      Notification.requestPermission()
        .then(result => ({ permission: 'notifications', result }))
        .catch(error => ({ permission: 'notifications', error }))
    );
  }
  
  // Разрешение на геолокацию
  if ('geolocation' in navigator) {
    permissions.push(
      new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          () => resolve({ permission: 'geolocation', result: 'granted' }),
          error => resolve({ permission: 'geolocation', error })
        );
      })
    );
  }
  
  // Разрешение на постоянное хранилище
  if ('storage' in navigator && 'persist' in navigator.storage) {
    permissions.push(
      navigator.storage.persist()
        .then(isPersisted => ({ permission: 'persistent-storage', result: isPersisted }))
        .catch(error => ({ permission: 'persistent-storage', error }))
    );
  }
  
  // Разрешение на фоновую синхронизацию
  if ('permissions' in navigator && 'query' in navigator.permissions) {
    try {
      permissions.push(
        navigator.permissions.query({ name: 'periodic-background-sync' })
          .then(status => ({ permission: 'background-sync', result: status.state }))
          .catch(error => ({ permission: 'background-sync', error }))
      );
    } catch (error) {
      // Игнорируем ошибку, если API не поддерживается
    }
  }
  
  // Ждем все запросы разрешений
  return Promise.all(permissions);
}

// Основная функция инициализации всех фоновых сервисов
export async function initBackgroundServices() {
  console.log('Initializing background services...');
  
  // Данные для отладки
  const debug = {
    startTime: Date.now(),
    browser: navigator.userAgent,
    services: {}
  };
  
  // Запрашиваем разрешения
  const permissions = await requestPermissions();
  debug.permissions = permissions;
  
  // Инициализируем тихий звук для поддержания активности
  const silentAudio = createSilentAudio();
  debug.services.silentAudio = !!silentAudio;
  
  // Периодически возобновляем аудио контекст
  if (silentAudio) {
    setInterval(() => silentAudio.resume(), 30000);
  }
  
  // Получаем блокировку пробуждения
  const wakeLock = await acquireWakeLock();
  debug.services.wakeLock = !!wakeLock;
  
  // Регистрируем notification worker
  const notificationWorker = await registerNotificationWorker();
  debug.services.notificationWorker = !!notificationWorker;
  
  // Запускаем отслеживание локации (только для Вовы)
  const appStore = useAppStore();
  if (appStore.userRole === 'Вова') {
    const trackingId = locationService.startTracking(appStore.userRole);
    const locationUpdater = locationService.initBackgroundLocationUpdates(appStore.userRole);
    
    debug.services.locationTracking = !!trackingId;
    debug.services.backgroundLocationUpdates = !!locationUpdater;
  }
  
  // Регистрируем обработчик для предотвращения выгрузки страницы
  if (appStore.userRole === 'Вова') {
    window.addEventListener('beforeunload', event => {
      event.preventDefault();
      event.returnValue = 'Приложение должно оставаться активным для отслеживания местоположения.';
      return event.returnValue;
    });
    
    debug.services.unloadPrevention = true;
  }
  
  // Настраиваем периодическое выполнение задач для поддержания активности
  const keepAliveInterval = setInterval(() => {
    // Проверяем и возобновляем все сервисы
    if (silentAudio) silentAudio.resume();
    
    // Запрашиваем блокировку пробуждения, если она была потеряна
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
    
    // Обновляем геолокацию (только для Вовы)
    if (appStore.userRole === 'Вова') {
      locationService.getCurrentPosition()
        .then(position => {
          // Сохраняем в базу данных
          const locationRef = ref(rtdb, `locations/${appStore.userRole}`);
          set(locationRef, {
            ...position,
            keepAliveUpdate: true
          });
        })
        .catch(() => {});
    }
  }, 60000); // Каждую минуту
  
  debug.services.keepAliveInterval = !!keepAliveInterval;
  
  // Создаем невидимый аудио элемент
  const audioElement = document.createElement('audio');
  audioElement.loop = true;
  audioElement.autoplay = true;
  audioElement.muted = true;
  audioElement.volume = 0.01;
  audioElement.src = '/keepalive-silent.mp3';
  document.body.appendChild(audioElement);
  
  // Пытаемся воспроизвести звук
  audioElement.play().catch(() => {});
  
  // Периодически пытаемся воспроизвести звук
  setInterval(() => {
    audioElement.play().catch(() => {});
  }, 5 * 60 * 1000); // Каждые 5 минут
  
  debug.services.audioElement = true;
  
  // Сохраняем отладочную информацию
  console.log('Background services initialized:', debug);
  
  // Возвращаем набор функций для управления фоновыми сервисами
  return {
    debug,
    
    // Остановка всех фоновых сервисов
    stopAll() {
      if (silentAudio) silentAudio.stop();
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (audioElement) {
        audioElement.pause();
        audioElement.remove();
      }
      if (wakeLock) wakeLock.release();
      if (appStore.userRole === 'Вова') {
        locationService.stopTracking();
      }
      
      console.log('All background services stopped');
    },
    
    // Обновление данных пользователя в service worker
    updateUserData() {
      if (notificationWorker && notificationWorker.active) {
        notificationWorker.active.postMessage({
          type: 'STORE_USER_DATA',
          payload: {
            userRole: appStore.userRole,
            partnerRole: appStore.partnerRole,
            lastCheckTimestamp: Date.now()
          }
        });
      }
    }
  };
}

// Экспортируем singleton для управления фоновыми сервисами
let backgroundServices = null;

export default {
  async init() {
    if (!backgroundServices) {
      backgroundServices = await initBackgroundServices();
    }
    return backgroundServices;
  },
  
  getServices() {
    return backgroundServices;
  }
};