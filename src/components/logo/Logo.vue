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
      <p :class="['kanit-thin text-4xl', textColor]">Going</p>
      <font-awesome-icon icon="fa-solid fa-bookmark" class="fa-2xl mx-2"/>
      <p :class="['kanit-regular text-4xl', textColor]">Reading</p>
    </div>
  </div>
</template>

<style scoped>
p {
  transition: color 0.3s ease;
}
</style>
