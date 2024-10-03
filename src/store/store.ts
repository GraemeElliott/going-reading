import { defineStore } from 'pinia';
import Cookies from 'js-cookie';

export const useDarkModeStore = defineStore('darkMode', {
  state: () => ({
    darkMode: Cookies.get('darkMode') === 'true',
    initialized: false,
  }),
  actions: {
    initializeDarkMode() {
      this.darkMode = Cookies.get('darkMode') === 'true';
      this.initialized = true;
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      Cookies.set('darkMode', this.darkMode ? 'true' : 'false', {
        expires: 365,
      });
    },
  },
});
