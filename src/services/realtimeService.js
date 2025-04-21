import { ref, onValue, set, push, update, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
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
        timestamp: Date.now(), // Используем клиентское время для сравнения
        serverTimestamp: serverTimestamp(), // Для сортировки на сервере
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
        timestamp: Date.now(),
        serverTimestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  },
  
  // Подписка на уведомления с ограничением количества
  subscribeToNotifications: (user, callback) => {
    // Получаем только последние 20 уведомлений, отсортированные по времени
    const notificationsQuery = query(
      ref(rtdb, `notifications/${user}`),
      orderByChild('serverTimestamp'),
      limitToLast(20)
    );
    
    const unsubscribe = onValue(notificationsQuery, (snapshot) => {
      const notifications = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          notifications.push({
            id: child.key,
            ...child.val(),
            // Убедимся, что timestamp - число для правильного сравнения
            timestamp: child.val().timestamp || Date.now()
          });
        });
        
        // Сортируем по времени, новые - сверху
        notifications.sort((a, b) => b.timestamp - a.timestamp);
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
      await update(notificationRef, { read: true });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
};

export default realtimeService;