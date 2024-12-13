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
      // Apply dark mode class to html element
      this._applyDarkMode();
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      Cookies.set('darkMode', this.darkMode ? 'true' : 'false', {
        expires: 365,
      });
      // Apply dark mode class to html element
      this._applyDarkMode();
    },
    // Using underscore prefix as a convention for "internal" method
    _applyDarkMode() {
      // Toggle the 'dark' class on the html element
      document.documentElement.classList.toggle('dark', this.darkMode);
    },
  },
});
