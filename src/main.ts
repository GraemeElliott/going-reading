import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/index.css';
import App from './App.vue';
import router from '@/router/router';

// import the fontawesome core
import { library } from '@fortawesome/fontawesome-svg-core';

// import fontawesome icon component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// import config so we can set a default style
import { config } from '@fortawesome/fontawesome-svg-core';

import { fas } from '@fortawesome/free-solid-svg-icons';

import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fas, fab);

// set the default style
config.familyDefault = 'classic';

const pinia = createPinia();

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .use(pinia)
  .use(router)
  .mount('#app');
