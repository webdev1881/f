// Сервис для управления фоновой работой приложения
import { useAppStore } from '../stores/appStore';

const backgroundService = {
  // Инициализация фонового режима
  init() {
    this.keepAlive();
    this.setupBackgroundSync();
    this.setupWakeLock();
    this.storeUserDataForBackground();
  },
  
  // Отправка данных в Service Worker для фоновой работы
  storeUserDataForBackground() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const appStore = useAppStore();
      
      // Отправляем данные пользователя в Service Worker
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_USER_DATA',
        payload: {
          userRole: appStore.userRole,
          partnerRole: appStore.partnerRole,
          lastCheckTimestamp: Date.now()
        }
      });
    }
  },
  
  // Настройка периодической синхронизации (для проверки уведомлений)
  async setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Регистрация одноразовой синхронизации
        await registration.sync.register('check-notifications');
        await registration.sync.register('update-location');
        
        // Регистрация периодической синхронизации (если поддерживается)
        if ('periodicSync' in registration) {
          // Проверяем разрешение
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync',
          });
          
          if (status.state === 'granted') {
            // Регистрируем периодическую синхронизацию
            // Проверка уведомлений каждые 15 минут
            await registration.periodicSync.register('check-notifications', {
              minInterval: 15 * 60 * 1000, // 15 минут
            });
            
            // Обновление геолокации каждые 5 минут
            await registration.periodicSync.register('update-location', {
              minInterval: 5 * 60 * 1000, // 5 минут
            });
          }
        }
        console.log('Background sync registered');
      } catch (error) {
        console.error('Error registering background sync:', error);
      }
    }
  },
  
  // Запрашиваем WakeLock для предотвращения засыпания устройства
  async setupWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        
        // Повторно запрашиваем блокировку при возобновлении видимости
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible') {
            await navigator.wakeLock.request('screen');
          }
        });
        
        console.log('Wake Lock active');
      } catch (error) {
        console.error('Error requesting Wake Lock:', error);
      }
    }
  },
  
  // Поддержание активности приложения
  keepAlive() {
    // Создаем невидимый аудио контекст для поддержания активности
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Создаем бесшумный источник звука
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Устанавливаем громкость на минимум (тишина)
      gainNode.gain.value = 0.001;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      
      // Периодически возобновляем контекст
      setInterval(() => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      }, 30000); // 30 секунд
      
      // Возобновляем при взаимодействии пользователя
      document.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      });
    }
    
    // Устанавливаем периодическое обновление через Service Worker
    setInterval(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.active.postMessage({ type: 'KEEP_ALIVE' });
      });
    }, 60000); // 1 минута
  }
};

export default backgroundService;