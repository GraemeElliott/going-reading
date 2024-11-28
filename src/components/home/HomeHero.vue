<script setup lang="ts">
import AuthenticationTab from '@/components/authentication/AuthenticationTab.vue';
</script>

<template>
  <div
    class="flex flex-col md:flex-row items-center justify-between gap-12 pt-[104px] pb-20 mt-5"
  >
    <!-- Left side - CTA -->
    <div class="w-full md:w-1/2 space-y-6 text-left">
      <h1
        class="text-5xl text-center md:text-6xl lg:text-7xl font-bold text-white kanit-bold leading-tight"
      >
        Your reading journey<br />
        starts here
      </h1>
      <p class="text-gray-300 text-xl text-center">
        Track your reading activity, discover new stories, and see stats on the
        books that you read all in one place.
      </p>
    </div>

    <!-- Right side - Authentication -->
    <div
      class="w-full md:w-[450px] bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg"
    >
      <AuthenticationTab />
    </div>
  </div>
</template>
