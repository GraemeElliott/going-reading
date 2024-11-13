import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/index.css';
import App from './App.vue';
import router from '@/router/router';

const pinia = createPinia();

createApp(App).use(pinia).use(router).mount('#app');
