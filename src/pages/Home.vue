<script setup lang="ts">
import HomeHero from '@/components/home/HomeHero.vue';
import HomeFeatures from '@/components/home/HomeFeatures.vue';
</script>

<template>
  <div
    class="bg-[#0F3538] min-h-screen w-[100vw] -ml-[50vw] left-[50%] relative -mt-[72px]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36">
      <HomeHero />
      <HomeFeatures />
    </div>
  </div>
</template>

<style scoped>
/* Prevent horizontal scrollbar */
:deep(body) {
  overflow-x: hidden;
}
</style>
