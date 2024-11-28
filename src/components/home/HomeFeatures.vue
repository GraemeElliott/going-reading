<script setup lang="ts">
const features = [
  {
    icon: 'fa-solid fa-book-open-reader',
    title: 'Track Your Progress',
    description:
      'Keep track of your reading journey with easy-to-use tools for managing your book collection and reading progress.',
  },
  {
    icon: 'fa-solid fa-compass',
    title: 'Discover New Books',
    description:
      'Find your next great read with personalized recommendations and explore books across different genres.',
  },
  {
    icon: 'fa-solid fa-users',
    title: 'Connect with Readers',
    description:
      'Join a community of book lovers, share your thoughts, and discover what others are reading.',
  },
  {
    icon: 'fa-solid fa-list-check',
    title: 'Create Reading Lists',
    description:
      'Organize your reading with custom lists - from your current reads to your future favorites.',
  },
];
</script>
<template>
  <div class="container mx-auto">
    <div class="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto"
      >
        <div
          v-for="feature in features"
          :key="feature.title"
          class="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 bg-white/10 rounded-lg backdrop-blur-sm hover:bg-white/15 transition-colors duration-200"
        >
          <div class="mb-3 sm:mb-4">
            <font-awesome-icon
              :icon="feature.icon"
              class="text-3xl sm:text-4xl text-[#F97316]"
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
