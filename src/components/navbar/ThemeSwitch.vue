<script setup lang="ts">
import { useDarkModeStore } from '@/store/store';
import { ref, watchEffect } from 'vue';

const darkModeStore = useDarkModeStore();
const darkMode = ref(darkModeStore.darkMode);

watchEffect(() => {
  darkMode.value = darkModeStore.darkMode;
});

const toggleDarkMode = () => {
  darkModeStore.toggleDarkMode();
};
</script>

<template>
  <button
    @click="toggleDarkMode"
    type="button"
    class="toggle-theme-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] transition-opacity hover:opacity-80"
    :aria-label="darkMode ? 'Switch to light theme' : 'Switch to dark theme'"
  >
    <template v-if="darkMode">
      <font-awesome-icon icon="fa-solid fa-moon" class="fa-xl" />
    </template>
    <template v-else>
      <font-awesome-icon icon="fa-solid fa-sun" class="fa-xl" />
    </template>
  </button>
</template>

<style scoped></style>
