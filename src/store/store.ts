import { defineStore } from 'pinia';
import Cookies from 'js-cookie';
import { ref } from 'vue';

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false);

  function startLoading() {
    isLoading.value = true;
  }

  function stopLoading() {
    isLoading.value = false;
  }

  return { isLoading, startLoading, stopLoading };
});

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
