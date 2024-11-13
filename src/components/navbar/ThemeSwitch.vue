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
    class="toggle-theme-btn"
    style="width: 24px; height: 24px"
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
