<script setup lang="ts">
const features = [
  {
    icon: 'fa-solid fa-book-open-reader',
    title: 'Track Your Progress',
    description:
      'Keep track of your reading journey with easy-to-use tools for managing your library and reading progress.',
  },

  {
    icon: 'fa-solid fa-list-check',
    title: 'Create Reading Lists',
    description:
      'Organise your reading with custom lists - from your current reads to your future favorites.',
  },
  {
    icon: 'fa-solid fa-chart-line',
    title: 'Analyse Your Reading Activity',
    description:
      'Use your own personal dashboard to analyse your reading activity to create future goals.',
  },
];
</script>
<template>
  <div class="mx-auto">
    <div class="">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto"
      >
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-colors duration-200"
        >
          <div class="mb-3 sm:mb-4">
            <font-awesome-icon
              :icon="feature.icon"
              class="text-3xl sm:text-4xl text-white"
            />
          </div>
          <h3 class="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
            {{ feature.title }}
          </h3>
          <p class="text-sm sm:text-base text-gray-300">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
