<template>
    <div class="role-selector">
      <h1>Сімейний додаток</h1>
      <p>Оберіть вашу роль:</p>
      
      <div class="role-buttons">
        <button 
          @click="selectRole('Вова')" 
          class="role-button"
          :class="{ 'selected': selectedRole === 'Вова' }"
        >
          Вова
        </button>
        
        <button 
          @click="selectRole('Таня')" 
          class="role-button"
          :class="{ 'selected': selectedRole === 'Таня' }"
        >
          Таня
        </button>
      </div>
      
      <button 
        @click="confirmRole" 
        class="confirm-button"
        :disabled="!selectedRole"
      >
        Продовжити
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useAppStore } from '../stores/appStore';
  import { useSocketStore } from '../stores/socketStore';
  
  const selectedRole = ref(null);
  const appStore = useAppStore();
  const socketStore = useSocketStore();
  
  const selectRole = (role) => {
    selectedRole.value = role;
  };
  
  const confirmRole = async () => {
    if (selectedRole.value) {
      await appStore.setRole(selectedRole.value);
      socketStore.joinRoom(selectedRole.value);
      
      // Запрашиваем разрешение на уведомления
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    }
  };
  </script>
  
  <style scoped>
  .role-selector {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
  }
  
  h1 {
    margin-bottom: 20px;
    color: #333;
  }
  
  .role-buttons {
    display: flex;
    justify-content: space-around;
    margin: 40px 0;
  }
  
  .role-button {
    padding: 15px 30px;
    font-size: 18px;
    border: 2px solid #ccc;
    border-radius: 8px;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .role-button:hover {
    border-color: #007bff;
  }
  
  .role-button.selected {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
  }
  
  .confirm-button {
    padding: 12px 24px;
    font-size: 16px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .confirm-button:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
  
  .confirm-button:hover:not(:disabled) {
    background-color: #218838;
  }
  </style>