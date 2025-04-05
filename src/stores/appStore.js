import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';

export const useAppStore = defineStore('app', () => {
  // Состояния
  const userRole = ref(null);
  const partnerRole = computed(() => userRole.value === 'Вова' ? 'Таня' : 'Вова');
  const myBalance = ref(0);
  const partnerBalance = ref(0);
  const totalBalance = computed(() => myBalance.value + partnerBalance.value);
  const notificationTime = ref('19:00');
  const homeRadius = ref(500); // метров
  const partnerLocation = ref(null);
  const myLocation = ref(null);
  const isPartnerOnline = ref(false);
  
  // Загрузка и сохранение роли пользователя
  const setRole = async (role) => {
    userRole.value = role;
    localStorage.setItem('userRole', role);
    
    // Проверяем существование документа пользователя
    const configRef = doc(db, 'config', role);
    const configSnap = await getDoc(configRef);
    
    // Проверяем существование документа баланса
    const balanceRef = doc(db, 'balance', role);
    const balanceSnap = await getDoc(balanceRef);
    
    // Налаштування пользователя
    if (!configSnap.exists()) {
      // Создаем начальные Налаштування пользователя
      await setDoc(configRef, {
        notificationTime: notificationTime.value,
        homeRadius: homeRadius.value,
        createdAt: Timestamp.now()
      });
    } else {
      // Загружаем Налаштування
      const data = configSnap.data();
      notificationTime.value = data.notificationTime;
      homeRadius.value = data.homeRadius;
    }
    
    // Баланс пользователя
    if (!balanceSnap.exists()) {
      // Создаем начальный баланс
      await setDoc(balanceRef, {
        amount: 0,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      });
    } else {
      // Загружаем баланс
      myBalance.value = balanceSnap.data().amount;
    }
  };
  
  // Проверка сохраненной роли
  const checkSavedRole = async () => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      await setRole(savedRole);
      return true;
    }
    return false;
  };
  
  // Обновление баланса пользователя
  const updateMyBalance = async (newBalance) => {
    myBalance.value = newBalance;
    await setDoc(doc(db, 'balance', userRole.value), {
      amount: newBalance,
      updatedAt: Timestamp.now(),
      updatedBy: userRole.value
    });
  };
  
  // Обновление настроек
  const updateSettings = async (settings) => {
    if (settings.notificationTime) {
      notificationTime.value = settings.notificationTime;
    }
    
    if (settings.homeRadius) {
      homeRadius.value = settings.homeRadius;
    }
    
    await updateDoc(doc(db, 'config', userRole.value), {
      notificationTime: notificationTime.value,
      homeRadius: homeRadius.value,
      updatedAt: Timestamp.now()
    });
  };
  
  // Обновление координат
  const updateLocation = (coords) => {
    myLocation.value = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: new Date().toISOString()
    };
  };
  
  // Слушатель изменений баланса
  const subscribeToBalance = () => {
    // Слушатель собственного баланса
    const unsubscribeMyBalance = onSnapshot(doc(db, 'balance', userRole.value), (doc) => {
      if (doc.exists()) {
        myBalance.value = doc.data().amount;
      }
    });
    
    // Слушатель баланса партнера
    const unsubscribePartnerBalance = onSnapshot(doc(db, 'balance', partnerRole.value), (doc) => {
      if (doc.exists()) {
        partnerBalance.value = doc.data().amount;
      }
    });
    
    // Возвращаем функцию для отписки от обоих слушателей
    return () => {
      unsubscribeMyBalance();
      unsubscribePartnerBalance();
    };
  };
  
  // Установка локации партнера
  const setPartnerLocation = (location) => {
    partnerLocation.value = location;
    isPartnerOnline.value = true;
  };
  
  // Установка статуса офлайн для партнера
  const setPartnerOffline = () => {
    isPartnerOnline.value = false;
  };
  
  return {
    userRole,
    partnerRole,
    myBalance,
    partnerBalance,
    totalBalance,
    notificationTime,
    homeRadius,
    myLocation,
    partnerLocation,
    isPartnerOnline,
    setRole,
    checkSavedRole,
    updateMyBalance,
    updateSettings,
    updateLocation,
    subscribeToBalance,
    setPartnerLocation,
    setPartnerOffline
  };
});