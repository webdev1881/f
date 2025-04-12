import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, onSnapshot, updateDoc, addDoc, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const useAppStore = defineStore('app', () => {
  // Состояния - объявляем все переменные в начале
  const userRole = ref(null);
  const partnerRole = computed(() => userRole.value === 'Вова' ? 'Таня' : 'Вова');
  const myBalance = ref(0);
  const partnerBalance = ref(0);
  const totalBalance = computed(() => myBalance.value + partnerBalance.value);
  const balanceHistory = ref([]); // Объявляем здесь, перед использованием
  const notificationTime = ref('19:00');
  const homeRadius = ref(500); // метров
  const partnerLocation = ref(null);
  const myLocation = ref(null);
  const isPartnerOnline = ref(false);
  const myColor = ref(null);
  
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
    
    // Настройки пользователя
    if (!configSnap.exists()) {
      // Создаем начальные настройки пользователя
      await setDoc(configRef, {
        notificationTime: notificationTime.value,
        homeRadius: homeRadius.value,
        createdAt: Timestamp.now()
      });
    } else {
      // Загружаем настройки
      const data = configSnap.data();
      notificationTime.value = data.notificationTime;
      homeRadius.value = data.homeRadius;
      myColor.value = data.color;
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
    try {
      // Сохраняем предыдущее значение для истории
      const previousBalance = myBalance.value;
      
      // Обновляем текущий баланс
      myBalance.value = newBalance;
      
      // Сохраняем новое значение в Firestore
      await setDoc(doc(db, 'balance', userRole.value), {
        amount: newBalance,
        updatedAt: Timestamp.now(),
        updatedBy: userRole.value
      });
      
      // Добавляем запись в историю
      const historyEntry = {
        timestamp: Timestamp.now(),
        vovaBalance: userRole.value === 'Вова' ? newBalance : partnerBalance.value,
        tanyaBalance: userRole.value === 'Таня' ? newBalance : partnerBalance.value,
        updatedBy: userRole.value,
        previousAmount: previousBalance,
        newAmount: newBalance
      };
      
      await addDoc(collection(db, 'balanceHistory'), historyEntry);
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      throw error;
    }
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
  
  // Получение истории обновлений баланса
  const fetchBalanceHistory = async (limitCount = 20) => {
    try {
      const q = query(
        collection(db, 'balanceHistory'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          timestamp: data.timestamp.toDate(),
          vovaBalance: data.vovaBalance,
          tanyaBalance: data.tanyaBalance,
          updatedBy: data.updatedBy,
          previousAmount: data.previousAmount,
          newAmount: data.newAmount
        });
      });
      
      balanceHistory.value = history;
    } catch (error) {
      console.error('Ошибка при загрузке истории баланса:', error);
    }
  };
  
  // Слушатель изменений истории баланса
  const subscribeToBalanceHistory = () => {
    const q = query(
      collection(db, 'balanceHistory'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const history = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          timestamp: data.timestamp.toDate(),
          vovaBalance: data.vovaBalance,
          tanyaBalance: data.tanyaBalance,
          updatedBy: data.updatedBy,
          previousAmount: data.previousAmount,
          newAmount: data.newAmount
        });
      });
      
      balanceHistory.value = history;
    });
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

  const setPartnerOnline = () => {
    isPartnerOnline.value = true;
  };
  
  return {
    userRole,
    partnerRole,
    myBalance,
    partnerBalance,
    totalBalance,
    balanceHistory,
    notificationTime,
    homeRadius,
    myColor,
    myLocation,
    partnerLocation,
    isPartnerOnline,
    setRole,
    checkSavedRole,
    updateMyBalance,
    updateSettings,
    updateLocation,
    subscribeToBalance,
    fetchBalanceHistory,
    subscribeToBalanceHistory,
    setPartnerLocation,
    setPartnerOffline,
    setPartnerOnline,
  };
});