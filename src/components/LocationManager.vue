<template>
    <div class="location-container">
      <h2>Геолокація</h2>
      
      <div v-if="userRole === 'Вова'" class="status-card">
        <h3>Статус відстеження</h3>
        <div class="status-indicator" :class="{ 'active': isTracking }">
          {{ isTracking ? 'Активно' : 'Неактивно' }}
        </div>
        
        <button @click="toggleTracking" class="track-button">
          {{ isTracking ? 'Остановить отслеживание' : 'Начать отслеживание' }}
        </button>
        
        <div class="settings-card">
          <h3>Налаштування повідомлень</h3>
          <label>
            Радіус хати (метрів):
            <input 
              type="number" 
              v-model="localHomeRadius" 
              @change="saveSettings"
              min="50"
              max="5000"
              step="50"
            />
          </label>
        </div>
      </div>
      
      <div v-if="userRole === 'Таня'" class="status-card">
        <h3>Статус Вови</h3>
        <div class="partner-status" :class="{ 'online': isPartnerOnline }">
          {{ isPartnerOnline ? 'В мережі' : 'Не в мережі' }}
        </div>
        
        <div v-if="isPartnerOnline && partnerLocation" class="location-info">
          <p>Последнее обновление: {{ formatTimestamp(partnerLocation.timestamp) }}</p>
          <p v-if="distance !== null">
            Расстояние до дома: <strong>{{ formatDistance(distance) }}</strong>
          </p>
          <p v-if="isComingHome" class="coming-home">
            Вова приближается к дому!
          </p>
        </div>
        
        <div class="settings-card">
          <h3>Налаштування повідомлень</h3>
          <label>
            Радіус хати (метрів):
            <input 
              type="number" 
              v-model="localHomeRadius" 
              @change="saveSettings"
              min="50"
              max="5000"
              step="50"
            />
          </label>
          
          <button @click="testNotification" class="test-button">
            Перевірити повідомлення
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import { useSocketStore } from '../stores/socketStore';
  
  const appStore = useAppStore();
  const socketStore = useSocketStore();
  
  const userRole = computed(() => appStore.userRole);
  const isPartnerOnline = computed(() => appStore.isPartnerOnline);
  const partnerLocation = computed(() => appStore.partnerLocation);
  
  const isTracking = ref(false);
  const watchId = ref(null);
  const localHomeRadius = ref(appStore.homeRadius);
  const distance = ref(null);
  const prevDistance = ref(null);
  const isComingHome = ref(false);
  const audio = ref(null);
  
  // Воспроизведение звукового уведомления
  const playNotificationSound = () => {
    if (!audio.value) {
      audio.value = new Audio('/notification.mp3');
    }
    audio.value.play();
  };
  
  // Следим за изменениями локации партнера
  watch(partnerLocation, (newLocation, oldLocation) => {
    if (userRole.value === 'Таня' && newLocation) {
      // Координаты дома (предполагаем, что это координаты Тани)
      const homeLocation = appStore.myLocation || { latitude: 0, longitude: 0 };
      
      // Расчет расстояния
      distance.value = calculateDistance(
        newLocation.latitude,
        newLocation.longitude,
        homeLocation.latitude,
        homeLocation.longitude
      );
      
      // Определяем, приближается ли Вова к дому
      if (prevDistance.value !== null && distance.value < prevDistance.value) {
        isComingHome.value = true;
        
        // Если Вова подходит к дому ближе, чем указанный радиус
        if (distance.value <= appStore.homeRadius) {
          playNotificationSound();
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Сімейний додаток', {
              body: 'Вова приближается к дому!',
              icon: '/icon-512.png'
            });
          }
        }
      } else {
        isComingHome.value = false;
      }
      
      prevDistance.value = distance.value;
    }
  });
  
  // Инициализация компонента
  onMounted(() => {
    localHomeRadius.value = appStore.homeRadius;
    
    // Если роль Вова - можно автоматически запустить отслеживание
    if (userRole.value === 'Вова') {
      // Автостарт геолокации, если нужно
      // startTracking();
    }
  });
  
  // Очистка при уничтожении компонента
  onUnmounted(() => {
    stopTracking();
  });

  // Форматирование временной метки
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Форматирование расстояния
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    } else {
      return `${(meters / 1000).toFixed(1)} км`;
    }
  };
  
  // Расчет расстояния между двумя точками (формула гаверсинусов)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // радиус Земли в метрах
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // расстояние в метрах
  };
  
  // Обработчик изменения геолокации
  const handlePositionChange = (position) => {
    const { latitude, longitude } = position.coords;
    appStore.updateLocation({ latitude, longitude });
    
    // Отправляем обновление через сокеты
    socketStore.sendLocationUpdate(appStore.myLocation);
  };
  
  // Обработка ошибок геолокации
  const handlePositionError = (error) => {
    console.error('Ошибка геолокации:', error.message);
    stopTracking();
  };
  
  // Запуск отслеживания
  const startTracking = () => {
    if ('geolocation' in navigator) {
      watchId.value = navigator.geolocation.watchPosition(
        handlePositionChange,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      isTracking.value = true;
    } else {
      alert('Геолокація не поддерживается в вашем браузере');
    }
  };
  
  // Остановка отслеживания
  const stopTracking = () => {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value);
      watchId.value = null;
      isTracking.value = false;
    }
  };
  
  // Переключение отслеживания
  const toggleTracking = () => {
    if (isTracking.value) {
      stopTracking();
    } else {
      startTracking();
    }
  };
  
  // Сохранение настроек
  const saveSettings = () => {
    appStore.updateSettings({
      homeRadius: parseInt(localHomeRadius.value, 10)
    });
  };
  
  // Тестирование уведомления
  const testNotification = () => {
    playNotificationSound();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Сімейний додаток', {
        body: 'Вова возвращается домой!',
        icon: '/icon-512.png'
      });
    }
  };
  </script>
  
  <style scoped>
  .location-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h2, h3 {
    color: #333;
  }
  
  .status-card {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .status-indicator {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    background-color: #dc3545;
    color: white;
    margin: 10px 0;
  }
  
  .status-indicator.active {
    background-color: #28a745;
  }
  
  .partner-status {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    background-color: #dc3545;
    color: white;
    margin: 10px 0;
  }
  
  .partner-status.online {
    background-color: #28a745;
  }
  
  .track-button {
    display: block;
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin: 15px 0;
    transition: background-color 0.3s;
  }
  
  .track-button:hover {
    background-color: #0056b3;
  }
  
  .settings-card {
    background-color: white;
    padding: 15px;
    border-radius: 8px;
    margin-top: 20px;
    border: 1px solid #ddd;
  }
  
  .settings-card label {
    display: block;
    margin-bottom: 10px;
  }
  
  .settings-card input {
    display: block;
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    border: 1px solid #ced4da;
    border-radius: 4px;
  }
  
  .test-button {
    display: block;
    width: 100%;
    padding: 10px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
    transition: background-color 0.3s;
  }
  
  .test-button:hover {
    background-color: #5a6268;
  }
  
  .location-info {
    margin: 15px 0;
  }
  
  .coming-home {
    color: #28a745;
    font-weight: bold;
  }
  </style>
