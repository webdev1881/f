<template>
  <div class="balance-container">
    <h2>Сімейний баланс</h2>
    
    <div class="balance-cards">
      <div class="balance-card personal" :class="'userRole' === 'Вова' ? 'vova' : 'tanya' " >
        <h3>баланс ({{ userRole }})</h3>
        <div class="balance-display">
          <span class="balance-amount">{{ formatCurrency(myBalance) }}</span>
        </div>
        
        <div class="balance-form">
          <input 
            type="number" 
            v-model="newBalanceAmount" 
            placeholder="Нова сума" 
            class="balance-input"
          />
          
          <button 
            @click="updateBalanceValue" 
            class="update-button"
            :disabled="!isValidAmount"
          >
            Оновити
          </button>
        </div>
      </div>
      
      <div class="balance-card partner"  :class="'userRole' === 'Вова' ? 'tanya' : 'vova' ">
        <h3>баланс {{ partnerRole }}</h3>
        <div class="balance-display">
          <span class="balance-amount">{{ formatCurrency(partnerBalance) }}</span>
        </div>
      </div>
      
      <div class="balance-card total">
        <h3>Загальний баланс</h3>
        <div class="balance-display">
          <span class="balance-amount total">{{ formatCurrency(totalBalance) }}</span>
        </div>
      </div>
    </div>
    
    <div class="balance-history">
      <h3>Історія оновлень</h3>
      <p>Буде відображатися істория оновлень балансу</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAppStore } from '../stores/appStore';

const appStore = useAppStore();
const userRole = computed(() => appStore.userRole);
const partnerRole = computed(() => appStore.partnerRole);
const myBalance = computed(() => appStore.myBalance);
const partnerBalance = computed(() => appStore.partnerBalance);
const totalBalance = computed(() => appStore.totalBalance);
const newBalanceAmount = ref('');

// Валидация ввода
const isValidAmount = computed(() => {
  const amount = parseFloat(newBalanceAmount.value);
  return !isNaN(amount) && amount >= 0;
});

// Форматирование суммы
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ua', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(amount);
};

// Обновление баланса
const updateBalanceValue = async () => {
  if (isValidAmount.value) {
    const amount = parseFloat(newBalanceAmount.value);
    await appStore.updateMyBalance(amount);
    newBalanceAmount.value = '';
  }
};

// Подписка на изменения баланса
onMounted(() => {
  const unsubscribe = appStore.subscribeToBalance();
  
  // Отписка при уничтожении компонента
  return () => {
    unsubscribe();
  };
});
</script>

<style scoped>
.balance-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

h2, h3 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.balance-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  margin-bottom: 30px;
}

.balance-card {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.balance-card.vova {
  grid-column: 1 / 2;
  border-left: 4px solid #007bff;
}

.balance-card.tanya {
  grid-column: 2 / 3;
  border-left: 4px solid pink;
}

.balance-card.total {
  grid-column: 1 / 3;
  background-color: #e9ecef;
  border-left: 4px solid #28a745;
}

.balance-display {
  text-align: center;
  margin: 15px 0;
}

.balance-amount {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.balance-amount.total {
  color: #28a745;
  font-size: 28px;
}

.balance-form {
  /* display: flex; */
  margin: 15px 0;
  gap: 10px;
}

.balance-input {
  width: 100%;
  margin-bottom: 15px;
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.update-button {
  width: 100%;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.update-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.update-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.balance-history {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.balance-history h3 {
  margin-top: 0;
  color: #555;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 600px) {
  .balance-cards {
    grid-template-columns: 1fr;
  }
  
  .balance-card.personal,
  .balance-card.partner,
  .balance-card.total {
    grid-column: auto;
  }
}
</style>