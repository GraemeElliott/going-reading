<script setup lang="ts">
import { useDarkModeStore } from '@/store/store';
import { computed } from 'vue';

const darkModeStore = useDarkModeStore();

const textColor = computed(() =>
  darkModeStore.darkMode ? 'text-white' : 'text-black'
);
</script>

<template>
  <div class="flex flex-row items-center justify-center h-full">
    <div class="flex items-center">
      <p :class="['kanit-thin text-2xl', textColor]">Going</p>
      <font-awesome-icon
        icon="fa-solid fa-bookmark"
        class="fa-1xl mx-1 text-cyan-800"
      />
      <p :class="['kanit-regular text-2xl', textColor]">Reading</p>
    </div>
  </div>
</template>

<style scoped>
p {
  transition: color 0.3s ease;
}
</style>
