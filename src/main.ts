import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/index.css';
import App from './App.vue';
import router from './router/router';

// import the fontawesome core
import { library } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// import fontawesome icon component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// import specific icons
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Add icon packs to the library
const solidIcons = Object.values(fas) as IconDefinition[];
const regularIcons = Object.values(far) as IconDefinition[];
const brandIcons = Object.values(fab) as IconDefinition[];

library.add(...solidIcons, ...regularIcons, ...brandIcons);

const pinia = createPinia();

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .use(pinia)
  .use(router)
  .mount('#app');
