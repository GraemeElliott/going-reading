<script setup lang="ts">
import { useDarkModeStore } from '@/store/store.ts';
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
  <button @click="toggleDarkMode" class="toggle-theme-btn">
    <template v-if="darkMode">
      <font-awesome-icon icon="fa-solid fa-moon" class="fa-lg" />
    </template>
    <template v-else>
      <font-awesome-icon icon="fa-solid fa-sun" class="fa-lg" />
    </template>
  </button>
</template>

<style scoped></style>
