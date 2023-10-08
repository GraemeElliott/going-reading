import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/router';
import naive from 'naive-ui';

const pinia = createPinia();

createApp(App).use(router).use(pinia).use(naive).mount('#app');
