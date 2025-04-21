<template>
    <div class="notification-panel" v-if="isOpen">
      <div class="panel-header">
        <h3>Уведомления</h3>
        <button @click="closePanel" class="close-button">&times;</button>
      </div>
      
      <div class="panel-content">
        <div v-if="notifications.length === 0" class="empty-notifications">
          <p>У вас нет новых уведомлений</p>
        </div>
        
        <div v-else class="notification-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id" 
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <div class="notification-icon">
              <i class="notification-dot" v-if="!notification.read"></i>
              <span class="sender-avatar">{{ notification.from.charAt(0) }}</span>
            </div>
            
            <div class="notification-content">
              <div class="notification-sender">{{ notification.from }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="panel-footer">
        <button @click="clearAll" class="clear-button">Очистить все</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, defineProps, defineEmits } from 'vue';
  import { useNotificationStore } from '../stores/notificationStore';
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['close']);
  
  const notificationStore = useNotificationStore();
  const notifications = computed(() => notificationStore.notifications);
  
  // Форматирование времени
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Если меньше суток
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Если меньше недели
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      return days[date.getDay()] + ', ' + 
        date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Полная дата
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Отметить уведомление как прочитанное
  const markAsRead = async (id) => {
    await notificationStore.markAsRead(id);
  };
  
  // Закрыть панель
  const closePanel = () => {
    emit('close');
  };
  
  // Очистить все уведомления
  const clearAll = () => {
    notificationStore.clearAllNotifications();
    emit('close');
  };
  </script>
  
  <style scoped>
  .notification-panel {
    position: fixed;
    top: 60px;
    right: 10px;
    width: 320px;
    max-width: calc(100vw - 20px);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    overflow: hidden;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #eee;
  }
  
  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    max-height: 400px;
  }
  
  .empty-notifications {
    padding: 30px 15px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  
  .notification-list {
    display: flex;
    flex-direction: column;
  }
  
  .notification-item {
    display: flex;
    padding: 12px 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .notification-item:hover {
    background-color: #f9f9f9;
  }
  
  .notification-item.unread {
    background-color: #f0f7ff;
  }
  
  .notification-icon {
    position: relative;
    margin-right: 12px;
  }
  
  .sender-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: #007bff;
    color: white;
    border-radius: 50%;
    font-weight: bold;
  }
  
  .notification-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background-color: #ff4757;
    border-radius: 50%;
    border: 2px solid white;
  }
  
  .notification-content {
    flex: 1;
  }
  
  .notification-sender {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 3px;
  }
  
  .notification-message {
    font-size: 14px;
    color: #333;
    margin-bottom: 5px;
  }
  
  .notification-time {
    font-size: 12px;
    color: #888;
  }
  
  .panel-footer {
    padding: 10px 15px;
    border-top: 1px solid #eee;
    text-align: center;
  }
  
  .clear-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 5px 10px;
    font-size: 13px;
  }
  
  .clear-button:hover {
    text-decoration: underline;
  }
  </style>