<script setup lang="ts">
import { ref } from 'vue';
import type { Author } from '@/types/author';
import { Skeleton } from '@/components/ui/skeleton';

const props = defineProps<{
  author: Author;
}>();

const isLoading = ref(true);
const hasError = ref(false);

const handleIconLoad = () => {
  isLoading.value = false;
};

const handleIconError = () => {
  hasError.value = true;
  isLoading.value = false;
};
</script>

<template>
  <div class="overflow-hidden">
    <router-link
      :to="`/author/${encodeURIComponent(author.name)}`"
      class="block w-full"
    >
      <div
        class="flex items-center py-4 w-full transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="relative w-12 h-12 mr-4">
          <!-- Skeleton loader while loading -->
          <Skeleton v-if="isLoading" class="absolute inset-0 rounded-full" />

          <!-- Icon with error handling -->
          <div
            class="absolute inset-0 flex items-center justify-center"
            :class="{
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            }"
          >
            <font-awesome-icon
              icon="fa-solid fa-user"
              class="w-full h-full text-goingTeal"
              @load="handleIconLoad"
              @error="handleIconError"
            />
          </div>
        </div>

        <div class="flex-grow min-w-0">
          <h2 class="text-xl font-semibold truncate">
            {{ author.name }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Author</p>
        </div>
      </div>
    </router-link>
  </div>
</template>

<style scoped>
.overflow-hidden {
  contain: content;
}

/* Optimize transitions */
.transition-colors {
  will-change: background-color;
}
</style>
