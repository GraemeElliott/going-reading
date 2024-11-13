import { defineStore } from 'pinia';
import Cookies from 'js-cookie';

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isLoading: false,
  }),
  actions: {
    setLoading(value: boolean) {
      this.isLoading = value;
    },
  },
});

// Dark mode store
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
