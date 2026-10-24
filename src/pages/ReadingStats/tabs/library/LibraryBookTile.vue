<script setup lang="ts">
import { computed, ref } from 'vue';
import { Book as BookOutlineIcon } from 'lucide-vue-next';
import { DEFAULT_COVER } from '@/services/bookApiService';
import { formatAuthors } from '@/utils/book-display';

// A book in the Library tab's grids: cover, title, author, pages and a pill
// (#pill slot). The whole tile links to the book page.
const props = defineProps<{
  isbn: string;
  title: string;
  authors?: string[] | null;
  image?: string | null;
  pages?: number | null;
}>();

const coverFailed = ref(false);
const hasCover = computed(
  () => !!props.image && props.image !== DEFAULT_COVER && !coverFailed.value
);
</script>

<template>
  <router-link
    :to="`/book/${isbn}`"
    class="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gr-accent"
  >
    <span class="block aspect-[2/3] overflow-hidden rounded-lg bg-gr-surface-2 shadow-gr-card">
      <img
        v-if="hasCover"
        :src="image!"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover"
        @error="coverFailed = true"
      />
      <span
        v-else
        role="img"
        :aria-label="title"
        class="flex h-full w-full items-center justify-center text-gr-muted"
      >
        <BookOutlineIcon :size="32" :stroke-width="1.5" aria-hidden="true" />
      </span>
    </span>
    <!-- Always two lines tall (clamped), so the details below line up across tiles -->
    <span
      class="mt-3 line-clamp-2 min-h-[2.75em] font-[650] leading-snug transition-colors group-hover:text-gr-accent"
      :title="title"
    >
      {{ title }}
    </span>
    <span v-if="authors?.length" class="mt-0.5 block truncate text-sm text-gr-muted">
      {{ formatAuthors(authors) }}
    </span>
    <span v-if="pages" class="block text-sm text-gr-muted">{{ pages.toLocaleString() }} pages</span>
    <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gr-surface-2 px-2.5 py-1 text-xs font-semibold text-gr-muted">
      <slot name="pill" />
    </span>
  </router-link>
</template>
