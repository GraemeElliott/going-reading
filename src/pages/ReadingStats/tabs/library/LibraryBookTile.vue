<script setup lang="ts">
import { computed, ref } from 'vue';
import { Book as BookOutlineIcon } from 'lucide-vue-next';
import { DEFAULT_COVER } from '@/services/bookApiService';
import { formatAuthors } from '@/utils/book-display';

// A book row in the Library tab's lists, laid out like Overview's Currently
// reading: cover on the left, then title, author, pages and a pill (#pill
// slot). The whole row links to the book page.
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
    class="group flex items-start gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gr-accent"
  >
    <span class="block h-16 w-11 shrink-0 overflow-hidden rounded bg-gr-surface-2">
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
        <BookOutlineIcon :size="20" :stroke-width="1.5" aria-hidden="true" />
      </span>
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate font-medium transition-colors group-hover:text-gr-accent" :title="title">
        {{ title }}
      </span>
      <span v-if="authors?.length" class="block truncate text-sm text-gr-muted">
        {{ formatAuthors(authors) }}
      </span>
      <span v-if="pages" class="block text-sm text-gr-muted">{{ pages.toLocaleString() }} pages</span>
      <span class="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gr-surface-2 px-2.5 py-1 text-xs font-semibold text-gr-muted">
        <slot name="pill" />
      </span>
    </span>
  </router-link>
</template>
