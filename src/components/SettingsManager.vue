<template>
  <div class="settings-container">
    <h2>Настройки приложения</h2>
    
    <div class="settings-card">
      <h3>Общие настройки</h3>
      
      <label class="setting-label">
        Время ежедневного уведомления о балансе:
        <input 
          type="time" 
          v-model="localNotificationTime" 
          class="setting-input"
        />
      </label>
      
      <div class="role-info">
        <p>Ваша роль: <strong>{{ userRole }}</strong></p>
        <p>Партнер: <strong>{{ partnerRole }}</strong></p>
      </div>
      
      <button 
        @click="saveSettings" 
        class="save-button"
      >
        Сохранить настройки
      </button>
    </div>
    
    <div class="settings-card">
      <h3>Уведомления</h3>
      
      <div class="notification-setting">
        <p>Статус уведомлений: 
          <span :class="notificationClass">{{ notificationStatus }}</span>
        </p>
        
        <button 
          v-if="notificationStatus !== 'Разрешены'" 
          @click="requestNotificationPermission" 
          class="permission-button"
        >
          Разрешить уведомления
        </button>
      </div>
      
      <div v-if="userRole === 'Таня'" class="notification-sounds">
        <h4>Звуковое уведомление</h4>
        <p>Звук, который воспроизводится при приближении Вовы к дому:</p>
        
        <div class="sound-selector">
          <select v-model="selectedSound" class="sound-select">
            <option value="notification.mp3">Стандартный</option>
            <option value="bell.mp3">Колокольчик</option>
            <option value="chime.mp3">Перезвон</option>
          </select>
          
          <button @click="playSelectedSound" class="play-button">
            Прослушать
          </button>
        </div>
      </div>
    </div>
    
    <div class="settings-card">
      <h3>О приложении</h3>
      <p>Семейное приложение для Вовы и Тани</p>
      <p>Версия: 1.0.0</p>
      
      <div class="settings-debug">
        <h4>Отладка и тестирование</h4>
        <button @click="resetCache" class="reset-button">
          Сбросить кеш приложения
        </button>
        <p class="tip">Используйте эту функцию для тестирования на разных устройствах</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';

const appStore = useAppStore();
const userRole = computed(() => appStore.userRole);
const partnerRole = computed(() => appStore.partnerRole);

const localNotificationTime = ref(appStore.notificationTime);
const notificationStatus = ref('Проверка...');
const selectedSound = ref('notification.mp3');
const audio = ref(null);

// Класс для стилизации статуса уведомлений
const notificationClass = computed(() => {
  if (notificationStatus.value === 'Разрешены') {
    return 'status-allowed';
  } else if (notificationStatus.value === 'Заблокированы') {
    return 'status-blocked';
  } else {
    return 'status-default';
  }
});

// Проверка статуса разрешений на уведомления
const checkNotificationPermission = () => {
  if ("Notification" in window) {
    if (Notification.permission === 'granted') {
      notificationStatus.value = 'Разрешены';
    } else if (Notification.permission === 'denied') {
      notificationStatus.value = 'Заблокированы';
    } else {
      notificationStatus.value = 'Не запрошены';
    }
  } else {
    notificationStatus.value = 'Не поддерживаются';
  }
};

// Запрос разрешения на уведомления
const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    checkNotificationPermission();
    
    if (permission === 'granted') {
      new Notification('Семейное приложение', {
        body: 'Уведомления успешно разрешены!',
        icon: '/icon-192.png'
      });
    }
  }
};

// Воспроизведение выбранного звука
const playSelectedSound = () => {
  if (!audio.value) {
    audio.value = new Audio(`/${selectedSound.value}`);
  } else {
    audio.value.src = `/${selectedSound.value}`;
  }
  audio.value.play();
};

// Сброс кеша приложения
const resetCache = async () => {
  if (confirm('Вы уверены, что хотите сбросить кеш приложения? Это может помочь решить проблемы синхронизации.')) {
    try {
      // Очистка локального хранилища
      localStorage.clear();
      
      // Очистка кешей через API Cache
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(cacheKey => caches.delete(cacheKey))
        );
      }
      
      // Сброс сервис-воркера
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      alert('Кеш успешно очищен. Приложение будет перезагружено.');
      window.location.reload(true);
    } catch (error) {
      console.error('Ошибка при очистке кеша:', error);
      alert('Произошла ошибка при очистке кеша: ' + error.message);
    }
  }
};

// Сохранение настроек
const saveSettings = async () => {
  await appStore.updateSettings({
    notificationTime: localNotificationTime.value
  });
  
  alert('Настройки успешно сохранены!');
};

// Инициализация компонента
onMounted(() => {
  checkNotificationPermission();
  localNotificationTime.value = appStore.notificationTime;
});
</script>

<style scoped>
.settings-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h2, h3, h4 {
  color: #333;
}

.settings-card {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setting-label {
  display: block;
  margin-bottom: 15px;
  font-weight: 500;
}

.setting-input {
  display: block;
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.role-info {
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  margin: 15px 0;
  border: 1px solid #e9ecef;
}

.save-button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  transition: background-color 0.3s;
}

.save-button:hover {
  background-color: #218838;
}

.notification-setting {
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
}

.status-allowed {
  color: #28a745;
  font-weight: bold;
}

.status-blocked {
  color: #dc3545;
  font-weight: bold;
}

.status-default {
  color: #6c757d;
  font-weight: bold;
}

.permission-button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.permission-button:hover {
  background-color: #0056b3;
}

.sound-selector {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.sound-select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.play-button {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.play-button:hover {
  background-color: #5a6268;
}

.settings-debug {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px dashed #ccc;
}

.reset-button {
  width: 100%;
  padding: 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #c82333;
}

.tip {
  font-size: 12px;
  color: #6c757d;
  margin-top: 10px;
  font-style: italic;
}
</style>