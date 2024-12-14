<script setup lang="ts">
const coreFeatures = [
  {
    title: 'Powerful Book Search',
    description:
      'Find any book instantly with our advanced search capabilities powered by the extensive ISBNDB database.',
    details: [
      {
        text: 'Search by title, author, or ISBN',
        icon: 'fa-solid fa-magnifying-glass',
      },
      {
        text: 'Access detailed book information',
        icon: 'fa-solid fa-book-open',
      },
      { text: 'View book covers and summaries', icon: 'fa-solid fa-image' },
    ],
    visual: 'homepage-book-details.png',
    isImage: true,
  },
  {
    title: 'Comprehensive Analytics',
    description:
      'Gain insights into your reading habits with detailed statistics and beautiful visualisations.',
    details: [
      {
        text: 'Track reading progress over time',
        icon: 'fa-solid fa-chart-line',
      },
      { text: 'Analyse reading patterns', icon: 'fa-solid fa-chart-pie' },
      { text: 'Set and monitor reading goals', icon: 'fa-solid fa-bullseye' },
    ],
    visual: 'homepage-stats.png',
    isImage: true,
  },
  {
    title: 'Reading Activity',
    description:
      'Track the books you read and view a detailed history of your journey for each book you interact with.',
    details: [
      {
        text: 'Add a book to bookshelves based on the status or create a custom list',
        icon: 'fa-solid fa-plus',
      },
      {
        text: 'View the full history of a book',
        icon: 'fa-solid fa-bars-staggered',
      },
      {
        text: 'Leave notes to remind you of your thoughts, learnings or leave a review',
        icon: 'fa-solid fa-note-sticky',
      },
    ],
    visual: 'homepage-reading-activity.png',
    isImage: true,
  },
];
</script>

<template>
  <section class="bg-white pt-16 md:pt-20 pb-32 overflow-hidden relative">
    <!-- Decorative background elements with animations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#0F3538]/5 rounded-full blur-3xl animate-pulse"
        style="animation-duration: 4s"
      />
      <div
        class="absolute top-1/4 right-0 w-72 h-72 bg-[#0F3538]/5 rounded-full blur-3xl animate-pulse"
        style="animation-duration: 6s"
      />
      <div
        class="absolute bottom-1/4 left-0 w-72 h-72 bg-[#0F3538]/5 rounded-full blur-3xl animate-pulse"
        style="animation-duration: 5s"
      />
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl lg:max-w-none">
        <div class="text-center mb-24">
          <h2
            class="text-4xl font-bold tracking-tight text-[#0F3538] sm:text-5xl mb-6"
          >
            Everything you need to track your reading journey
          </h2>
          <p class="mt-4 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to enhance your reading experience and
            help you achieve your reading goals.
          </p>
        </div>

        <div class="space-y-32 md:space-y-40">
          <!-- Feature sections with alternating layouts -->
          <div
            v-for="(feature, index) in coreFeatures"
            :key="feature.title"
            class="relative group"
          >
            <div
              :class="[
                'grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 md:gap-6 lg:gap-12 items-center',
                index % 2 === 1 ? 'lg:flex-row-reverse' : '',
              ]"
            >
              <!-- Text content - 5 columns (2/5) -->
              <div class="flex flex-col justify-center md:col-span-5">
                <div>
                  <h3
                    class="text-3xl font-bold tracking-tight text-[#0F3538] sm:text-4xl mb-6"
                  >
                    {{ feature.title }}
                  </h3>
                  <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                    {{ feature.description }}
                  </p>
                  <ul class="space-y-6">
                    <li
                      v-for="detail in feature.details"
                      :key="detail.text"
                      class="flex items-start gap-4 group/item"
                    >
                      <div
                        class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-sm border border-black"
                      >
                        <font-awesome-icon
                          :icon="detail.icon"
                          class="text-[#0F3538] w-5 h-5 sm:w-6 sm:h-6"
                        />
                      </div>
                      <span
                        class="text-base sm:text-lg text-gray-600 pt-3 leading-relaxed"
                        >{{ detail.text }}</span
                      >
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Feature visualization - 7 columns (3/5) -->
              <div
                :class="[
                  'md:col-span-7',
                  index % 2 === 1 ? 'lg:order-first' : '',
                ]"
              >
                <!-- Icon or Image -->
                <template v-if="feature.isImage">
                  <div class="w-full min-h-[400px] md:min-h-[450px] p-2 sm:p-4">
                    <img
                      :src="`/images/${feature.visual}`"
                      :alt="feature.title"
                      class="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
