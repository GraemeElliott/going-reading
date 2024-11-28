<script setup lang="ts">
import AuthenticationTab from '@/components/authentication/AuthenticationTab.vue';
</script>
<template>
  <div class="container mx-auto">
    <div
      class="flex flex-col md:flex-row items-center justify-between gap-8 pt-24 md:pt-32 pb-8 md:pb-20"
    >
      <!-- Left side - CTA -->
      <div
        class="w-full md:w-1/2 space-y-4 md:space-y-6 text-center md:text-left"
      >
        <h1
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white kanit-bold leading-tight"
        >
          Your reading<br class="hidden sm:block" />
          journey<br class="sm:hidden" />
          starts here
        </h1>
        <p class="text-gray-300 text-lg md:text-xl">
          Track your books, discover new stories, and connect with fellow
          readers in one place.
        </p>
      </div>
      <!-- Right side - Authentication -->
      <div class="w-full md:w-1/2">
        <div
          class="max-w-[400px] mx-auto bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg"
        >
          <AuthenticationTab class="h-[700px]" />
        </div>
      </div>
    </div>
  </div>
</template>
