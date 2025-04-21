import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import realtimeService from '../services/realtimeService';
import { useAppStore } from './appStore';

export const useNotificationStore = defineStore('notification', () => {
  // Состояния
  const notifications = ref([]);
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  );
  const appStore = useAppStore();
  
  // Подписка на уведомления
  const subscribeToNotifications = () => {
    if (!appStore.userRole) return () => {};
    
    return realtimeService.subscribeToNotifications(
      appStore.userRole,
      (notificationsList) => {
        notifications.value = notificationsList;
        
        // Показываем уведомление в браузере, если получено новое
        const newNotifications = notificationsList.filter(n => !n.read);
        if (newNotifications.length > 0) {
          showBrowserNotification(newNotifications[0]);
        }
      }
    );
  };
  
  // Отправка уведомления партнеру
  const sendNotificationToPartner = async (message) => {
    if (!appStore.userRole || !appStore.partnerRole) return false;
    
    return await realtimeService.sendNotification(
      appStore.userRole,
      appStore.partnerRole,
      message
    );
  };
  
  // Пометить уведомление как прочитанное
  const markAsRead = async (notificationId) => {
    if (!appStore.userRole) return false;
    
    await realtimeService.markNotificationAsRead(
      appStore.userRole,
      notificationId
    );
    
    // Обновляем локальное состояние
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications.value[index].read = true;
    }
    
    return true;
  };
  
  // Показать браузерное уведомление
  const showBrowserNotification = (notification) => {
    if (!notification) return;
    
    try {
      // Воспроизводим звук
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.warn('Sound autoplay prevented:', e));
      
      // Показываем уведомление в браузере
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Семейное приложение', {
              body: `${notification.from}: ${notification.message}`,
              icon: '/icon-192.png',
              vibrate: [200, 100, 200],
              tag: 'notification-' + notification.id,
              requireInteraction: true
            });
          }).catch(err => {
            // Запасной вариант
            new Notification('Семейное приложение', {
              body: `${notification.from}: ${notification.message}`,
              icon: '/icon-192.png'
            });
          });
        } else {
          new Notification('Семейное приложение', {
            body: `${notification.from}: ${notification.message}`,
            icon: '/icon-192.png'
          });
        }
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };
  
  // Очистка всех уведомлений
  const clearAllNotifications = () => {
    notifications.value = [];
  };
  
  return {
    notifications,
    unreadCount,
    subscribeToNotifications,
    sendNotificationToPartner,
    markAsRead,
    showBrowserNotification,
    clearAllNotifications
  };
});