<script setup lang="ts">
import type { Author } from '@/types/author';

const props = defineProps<{
  author: Author;
}>();
</script>

<template>
  <div class="flex items-start py-4">
    <router-link :to="`/author/${encodeURIComponent(author.name)}`">
      <div class="flex items-center w-full">
        <div>
          <h2 class="text-xl font-semibold">{{ author.name }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Author</p>
        </div>
      </div>
    </router-link>
  </div>
</template>
