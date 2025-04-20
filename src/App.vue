<template>
  <div id="app">
    <template v-if="isLoading">
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Завантаження...</p>
      </div>
    </template>
    
    <template v-else-if="!hasRole">
      <RoleSelector />
    </template>
    
    <template v-else>
      <header :class=" userRole === 'Вова' ? 'vova-header' : 'tanya-header' " >
        <!-- <h2>Баланс</h2> -->
        <div class="user-role">{{ userRole }}</div>
      </header>
      
      <nav class="app-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="currentTab = tab.id"
          :class="{ active: currentTab === tab.id }"
          class="nav-button"
        >
          {{ tab.name }}
        </button>
      </nav>
      
      <main class="app-content">
        <component :is="currentTabComponent" />
      </main>
      
      <footer class="app-footer">
        <p>Сімейний додаток Литвиновських &copy; 2025</p>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, markRaw } from 'vue';
import { useAppStore } from './stores/appStore';
import { useSocketStore } from './stores/socketStore';
import { register } from 'register-service-worker';

// Компоненты
import RoleSelector from './components/RoleSelector.vue';
import BalanceManager from './components/BalanceManager.vue';
import LocationManager from './components/LocationManager.vue';
import SettingsManager from './components/SettingsManager.vue';

// Хранилища
const appStore = useAppStore();
const socketStore = useSocketStore();

// Состояние
const isLoading = ref(true);
const hasRole = ref(false);
const currentTab = ref('balance');

// Вычисляемые свойства
const userRole = computed(() => appStore.userRole);

// Доступные вкладки
const tabs = [
  { id: 'balance', name: 'Баланс', component: markRaw(BalanceManager) },
  { id: 'location', name: 'Геолокація', component: markRaw(LocationManager) },
  { id: 'settings', name: 'Налаштування', component: markRaw(SettingsManager) }
];

// Текущий компонент вкладки
const currentTabComponent = computed(() => {
  const tab = tabs.find(t => t.id === currentTab.value);
  return tab ? tab.component : null;
});

// Проверка ежедневных повідомлень
const setupDailyNotification = () => {
  // Проверка текущего времени каждую минуту
  setInterval(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    if (currentTime === appStore.notificationTime) {
      // Время для ежедневного уведомления о балансе
      if ("Notification" in window && Notification.permission === 'granted') {
        new Notification('Сімейний додаток', {
          body: `Час оновити баланс! Поточний баланс: ${appStore.balance}UAH`,
          icon: '/icon-256.png'
        });
      }
      
      // Также можно воспроизвести звук
      const audio = new Audio('/notification.mp3');
      audio.play();
    }
  }, 60000); // Проверка каждую минуту
};

// Инициализация приложения
const initializeApp = async () => {
  // Проверка сохраненной роли
  const hasExistingRole = await appStore.checkSavedRole();
  hasRole.value = hasExistingRole;
  
  // Инициализация соединения с сокетами
  socketStore.initSocket('https://ffff-c3e3c.web.app/');
  
  // Регистрация Service Worker для PWA
  register('/service-worker.js', {
    ready() {
      console.log('App is being served from cache by a service worker.');
    },
    registered() {
      console.log('Service worker has been registered.');
    },
    cached() {
      console.log('Content has been cached for offline use.');
    },
    updatefound() {
      console.log('New content is downloading.');
    },
    updated() {
      console.log('New content is available; please refresh.');
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.');
    },
    error(error) {
      console.error('Error during service worker registration:', error);
    }
  });
  
  // Настройка ежедневных повідомлень
  setupDailyNotification();
  
  // Завершение загрузки
  isLoading.value = false;
};

// Отслеживание изменений роли
watch(() => appStore.userRole, (newRole) => {
  if (newRole) {
    hasRole.value = true;
  }
});

// Инициализация при монтировании
onMounted(() => {
  initializeApp();
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f4f6f9;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.vova-header {
  font-family: 'Verdana', sans-serif;
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tanya-header {
  font-family: 'Verdana', sans-serif;
  background-color: pink;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-role {
  /* width: 50%; */
  background-color: rgba(255, 255, 255, 0.2);
  padding: 5px 30px;
  border-radius: 20px;
  font-size: 14px;
}

.app-nav {
  background-color: #f8f9fa;
  display: flex;
  border-bottom: 1px solid #dee2e6;
}

.nav-button {
  flex: 1;
  padding: 15px;
  text-align: center;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;
}

.nav-button:hover {
  background-color: #e9ecef;
}

.nav-button.active {
  background-color: white;
  border-bottom: 3px solid black;
}

.app-content {
  flex: 1;
  padding: 20px;
  background-color: white;
}

.app-footer {
  position: fixed;
  z-index: 2;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 10px;
  font-size: 14px;
}
</style>