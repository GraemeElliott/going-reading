<script setup lang="ts">
import HomeHero from '@/components/home/HomeHero.vue';
import HomeFeatures from '@/components/home/HomeFeatures.vue';
import HomeCoreFeatures from '@/components/home/HomeCoreFeatures.vue';
</script>

<template>
  <div>
    <!-- Hero and initial features section with dark background -->
    <div
      class="bg-[#0F3538] min-h-screen w-[100vw] -ml-[50vw] left-[50%] relative -mt-[72px] pb-48"
    >
      <div class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36">
        <HomeHero />
        <div class="mt-24 mb-20">
          <HomeFeatures />
        </div>
      </div>
      <!-- Curved transition to white section -->
      <div class="absolute -bottom-1 left-0 right-0">
        <svg
          class="fill-white w-full h-32"
          viewBox="0 0 1440 128"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C240,60 480,100 720,80 C960,60 1200,20 1440,40 L1440,128 L0,128 Z"
          />
        </svg>
      </div>
    </div>

    <!-- Core features section with white background -->
    <div class="w-[100vw] -ml-[50vw] left-[50%] relative -mt-1">
      <HomeCoreFeatures />
    </div>
  </div>
</template>

<style scoped>
/* Prevent horizontal scrollbar */
:deep(body) {
  overflow-x: hidden;
}
</style>
