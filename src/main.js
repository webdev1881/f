import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { register } from 'register-service-worker';

// Создание хранилища Pinia
const pinia = createPinia();

// Регистрация PWA Service Worker в продакшн режиме
if (import.meta.env.PROD) {
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
}

// Создание приложения
const app = createApp(App);

// Использование Pinia
app.use(pinia);

// Монтирование приложения
app.mount('#app');