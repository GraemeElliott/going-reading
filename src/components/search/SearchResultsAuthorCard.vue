<script setup lang="ts">
import type { Author } from '@/types/author';

defineProps<{
  author: Author;
}>();
</script>

<template>
  <router-link
    :to="`/author/${encodeURIComponent(author.name)}`"
    class="gr-card flex items-center justify-between gap-4 px-5 py-4 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
  >
    <div class="flex min-w-0 items-center gap-4">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gr-surface-2 text-gr-muted"
        aria-hidden="true"
      >
        <font-awesome-icon icon="fa-solid fa-user" />
      </span>
      <div class="min-w-0">
        <p class="truncate text-lg font-[650]">{{ author.name }}</p>
        <p class="text-sm text-gr-muted">Author</p>
      </div>
    </div>
    <font-awesome-icon icon="fa-solid fa-angle-right" class="shrink-0 text-gr-muted" aria-hidden="true" />
  </router-link>
</template>
