import { ref, onValue, set, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase';

// Сервис для работы с Firebase Realtime Database как альтернатива сокетам
const realtimeService = {
  // Отправка уведомления партнеру
  sendNotification: async (fromUser, toUser, message) => {
    try {
      const notificationsRef = ref(rtdb, `notifications/${toUser}`);
      const newNotification = {
        from: fromUser,
        message: message || 'Новое уведомление',
        timestamp: serverTimestamp(),
        read: false
      };
      
      // Добавляем новое уведомление
      await push(notificationsRef, newNotification);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  },
  
  // Обновление геолокации пользователя
  updateLocation: async (user, location) => {
    try {
      const locationRef = ref(rtdb, `locations/${user}`);
      await set(locationRef, {
        ...location,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  },
  
  // Подписка на уведомления
  subscribeToNotifications: (user, callback) => {
    const notificationsRef = ref(rtdb, `notifications/${user}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifications = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          notifications.push({
            id: child.key,
            ...child.val(),
            // Преобразование серверного timestamp в объект Date
            timestamp: child.val().timestamp 
              ? new Date(child.val().timestamp) 
              : new Date()
          });
        });
      }
      callback(notifications);
    });
    
    return unsubscribe;
  },
  
  // Подписка на изменения локации партнера
  subscribeToPartnerLocation: (partnerUser, callback) => {
    const locationRef = ref(rtdb, `locations/${partnerUser}`);
    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        const location = snapshot.val();
        callback(location);
      }
    });
    
    return unsubscribe;
  },
  
  // Пометить уведомление как прочитанное
  markNotificationAsRead: async (user, notificationId) => {
    try {
      const notificationRef = ref(rtdb, `notifications/${user}/${notificationId}`);
      await set(notificationRef, { read: true });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
};

export default realtimeService;