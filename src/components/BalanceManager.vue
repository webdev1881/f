<template>
  <div class="balance-container">
    <!-- <h2>Сімейний баланс</h2> -->

    <div class="balance-cards">
      <div class="balance-card personal" :style="`border-left: 4px solid ${myColor}`">
        <h3>Ваш баланс ({{ userRole }})</h3>
        <div class="balance-display">
          <span class="balance-amount">{{ formatCurrency(myBalance) }}</span>
        </div>

        <!-- {{ balanceHistory }} -->

        <div class="balance-form">
          <input type="number" v-model="newBalanceAmount" placeholder="Нова сумма" class="balance-input" />

          <button @click="updateBalanceValue" class="update-button" :disabled="!isValidAmount">
            Оновити баланс
          </button>
        </div>
      </div>

      <div class="balance-card partner">
        <h3>Баланс {{ partnerRole }}</h3>
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

    <!-- <div class="wrap">
      <div class="mai" id="main"></div>
    </div> -->

    <div class="balance-history">
      <h3>Історія оновлень</h3>

      <div v-if="balanceHistory.length > 0" class="history-list">
        <table class="history-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Вова</th>
              <th>Таня</th>
              <th>Всього</th>
              <!-- <th>Хто змінив</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in balanceHistory"  :key="entry.id" class="history-row">
              <td>{{ formatDate(entry.timestamp) }}</td>
              <td class="td_balance">
                <div class="bln">{{ formatCurrency(entry.vovaBalance) }}</div>
                <div :class="(entry.previousAmount - entry.vovaBalance) < 0 ? 'bln_pos' : 'bln_pre' ">{{entry.updatedBy === 'Вова' ?  formatCurrency(entry.vovaBalance -entry.previousAmount) : '-' }}</div>
              </td>
              <td>
                <div class="bln">{{ formatCurrency(entry.tanyaBalance) }}</div>
                <div :class="(entry.previousAmount - entry.tanyaBalance) < 0 ? 'bln_pos' : 'bln_pre' ">{{entry.updatedBy === 'Таня' ? formatCurrency(entry.tanyaBalance - entry.previousAmount ) : '-' }}</div>
                <!-- {{ formatCurrency(entry.tanyaBalance) }} -->
              </td>
              <td class="totale">{{ formatCurrency(entry.vovaBalance + entry.tanyaBalance) }}</td>
              <!-- <td>
                <span class="updater-badge" :class="{'vova': entry.updatedBy === 'Вова', 'tanya': entry.updatedBy === 'Таня'}">
                  {{ entry.updatedBy }}
                </span>
              </td> -->
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-history">
        <p>Історія оновлень порожня</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAppStore } from '../stores/appStore';
import * as echarts from 'echarts';

const appStore = useAppStore();
const userRole = computed(() => appStore.userRole);
const partnerRole = computed(() => appStore.partnerRole);
const myBalance = computed(() => appStore.myBalance);
const partnerBalance = computed(() => appStore.partnerBalance);
const totalBalance = computed(() => appStore.totalBalance);
const balanceHistory = computed(() => appStore.balanceHistory);
const newBalanceAmount = ref('');
const myColor = computed(() => appStore.myColor);

// Валидация ввода
const isValidAmount = computed(() => {
  const amount = parseFloat(newBalanceAmount.value);
  return !isNaN(amount) && amount >= 0;
});

// Форматирование суммы
const formatCurrency = (amount) => {
  return amount.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 '); // разделитель символ пробел порядок 

  return amount.toFixed(2);
  return new Intl.NumberFormat('UAH', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 2
  }).format(amount) ;
};

// Форматирование даты и времени
const formatDate = (date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    // year: 'numeric',
    // hour: '2-digit',
    // minute: '2-digit'
  }).format(date);
};

// Обновление баланса
const updateBalanceValue = async () => {
  if (isValidAmount.value) {
    const amount = parseFloat(newBalanceAmount.value);
    await appStore.updateMyBalance(amount);
    newBalanceAmount.value = '';
  }
};

// Подписка на изменения баланса и истории
onMounted(() => {
  const unsubscribeBalance = appStore.subscribeToBalance();
  const unsubscribeHistory = appStore.subscribeToBalanceHistory();

  initModulesChart();
  // Отписка при уничтожении компонента
  return () => {
    unsubscribeBalance();
    unsubscribeHistory();
    // initModulesChart();
  };
});



const initModulesChart = () => {
//   var chartDom = document.getElementById('main');
// var myChart = echarts.init(chartDom);
// var option;
// let data = [
  
// ]

// option = {
//   tooltip: {
//     trigger: 'axis',
//     axisPointer: {
//       type: 'shadow'
//     }
//   },
//   legend: {
//     data: ['Profit2', 'Expenses', 'Income']
//   },
//   grid: {
//     left: '3%',
//     right: '1%',
//     bottom: '3%',
//     containLabel: true
//   },
//   xAxis: [
//     {
//       type: 'value'
//     }
//   ],
//   yAxis: [
//     {
//       type: 'category',
//       axisTick: {
//         show: false
//       },
//       // data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
//       data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
//     }
//   ],
//   series: [
//     {
//       name: 'Profit',
//       type: 'bar',
//       stack: 'Profit2',
//       barWidth: '15%',
//       barCategoryGap: '40%',
//       itemStyle:{
//         color: 'orange'
//       },
//       label: {
//         show: true,
//         position: 'inside',
//         fontSize: 10,
//         position: 'right',
//       },
//       emphasis: {
//         focus: 'series'
//       },
//       data: [200, 170, 240, 244, 200, 220, 210]
//     },
//     {
//       name: 'Profit2',
//       type: 'bar',
//       stack: 'Profit2',
//       itemStyle:{
//         color: 'orange'
//       },
//       label: {
//         show: true,
//         position: 'inside',
//         fontSize: 10,
//         position: 'left',
//       },
//       emphasis: {
//         focus: 'series'
//       },
//       data: [-200, -170, -240, -244, -200, -220, -210]
//     },


//     {
//       name: 'Income',
//       type: 'bar',
//       stack: 'Total',
//       itemStyle:{
//         color: 'pink'
//       },
//       label: {
//         show: true,
//         fontSize: 10,
//         position: 'right',
//       },
//       emphasis: {
//         focus: 'series'
//       },
//       data: [320, 302, 341, 374, 390, 450, 420]
//     },
//     {
//       name: 'Expenses',
//       type: 'bar',
//       stack: 'Total',
//       label: {
//         show: true,
//         fontSize: 10,
//         position: 'left',
//       },
//       emphasis: {
//         focus: 'series'
//       },
//       data: [-120, -132, -101, -234, -190, -230, -210]
//     }
//   ]
// };

// option && myChart.setOption(option);
}





</script>

<style scoped>
.bln {
  font-weight: bold;
}
.bln_pos {
  font-size: 12px;
  color: green;
}
.bln_pre {
  font-size: 12px;
  color: red;
}
.td_balance {
  display: flex;
  flex-direction: column;
}

.balance-container {
  max-width: 800px;
  margin: 0 auto;
  /* padding: 20px; */
}

h2,
h3 {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.balance-card.personal {
  grid-column: 1 / 2;
  /* border-left: 4px solid #007bff; */
}

.balance-card.partner {
  grid-column: 2 / 3;
  border-left: 6px solid #6c757d;
}

.balance-card.total {
  grid-column: 1 / 3;
  background-color: #e9ecef;
  border-left: 6px solid #28a745;
}
.totale {
  font-size: 16px;

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
  display: flex;
  flex-direction: column;
  margin: 15px 0;
  gap: 10px;
}

.balance-input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.update-button {
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
  margin-top: 30px;
  margin-bottom: 50px;
}

.balance-history h3 {
  margin-top: 0;
  color: #555;
  margin-bottom: 15px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.history-table th {
  background-color: #e9ecef;
  padding: 10px;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 2px solid #dee2e6;
}

.history-row {
  background-color: white;
}

.history-row:nth-child(even) {
  background-color: #f8f9fa;
}

.history-row td {
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
}

.updater-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.updater-badge.vova {
  background-color: #007bff;
}

.updater-badge.tanya {
  background-color: #e83e8c;
}

.empty-history {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 600px) {
  .history-table {
    font-size: 12px;
  }

  .history-table th,
  .history-row td {
    padding: 8px 5px;
  }
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