import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io } from 'socket.io-client';
import { useAppStore } from './appStore';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null);
  const isConnected = ref(false);
  const socketId = ref(null);
  

  // Инициализация соединения
  const initSocket = (serverUrl) => {
    socket.value = io(serverUrl);

    socket.value = io(serverUrl, {
      transports: ['polling'],  // Принудительное использование long polling
      upgrade: false,           // Отключить автоматическое повышение до WebSocket
      reconnection: true,       // Включить автоматическое переподключение
      reconnectionAttempts: 5,  // Количество попыток
      reconnectionDelay: 5000   // Задержка между попытками (мс)
    });
    
    socket.value.on('connect', () => {
      console.log('Connected to socket server');
      isConnected.value = true;
      socketId.value = socket.value.id;
      
      const appStore = useAppStore();
      // Присоединяемся к комнате
      if (appStore.userRole) {
        joinRoom(appStore.userRole);
      }
    });
    
    socket.value.on('disconnect', () => {
      console.log('Disconnected from socket server');
      isConnected.value = false;
      socketId.value = null;
    });
    
    // Обработка подключения партнера
    socket.value.on('user-connected', (data) => {
      console.log('Partner connected:', data);
    });
    
    // Обработка отключения партнера
    socket.value.on('user-disconnected', (data) => {
      console.log('Partner disconnected:', data);
      const appStore = useAppStore();
      appStore.setPartnerOffline();
    });
    
    // Обработка обновления геолокации партнера
    socket.value.on('partner-location', (data) => {
      console.log('Partner location update:', data);
      const appStore = useAppStore();
      appStore.setPartnerLocation(data.location);
    });
  };
  
  // Присоединение к комнате
  const joinRoom = (role) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('join-room', { role });
    }
  };
  
  // Отправка обновленных координат
  const sendLocationUpdate = (locationData) => {
    if (socket.value && isConnected.value) {
      socket.value.emit('location-update', locationData);
    }
  };
  
  // Отключение от сервера
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
    }
  };

  const startTracking = () => {
    if (socket.value && isConnected.value) {
      socket.value.emit('tracking-started', { 
        role: useAppStore().userRole,
        status: true 
      });
    }
  };



  
  return {
    socket,
    isConnected,
    socketId,
    initSocket,
    joinRoom,
    sendLocationUpdate,
    disconnect,
    startTracking
  };
});