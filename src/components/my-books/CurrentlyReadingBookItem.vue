<script setup lang="ts">
import { computed } from 'vue';
import type { UserBook, BookStatus } from '@/types/book';
import UpdateBookProgress from './UpdateBookProgress.vue';
import Progress from '../ui/progress/Progress.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import { formatAuthors } from '@/utils/book-display';

const props = defineProps<{
  book: UserBook;
}>();

const emit = defineEmits<{
  (
    e: 'update',
    bookId: string,
    updates: { currentPage?: number; status?: BookStatus }
  ): void;
}>();

function handleProgressUpdate(progress: { currentPage: number }) {
  emit('update', props.book.id, { currentPage: progress.currentPage });
}

function handleStatusUpdate(status: BookStatus) {
  emit('update', props.book.id, { status });
}

const readingProgress = computed(() => {
  if (!props.book.pages || !props.book.current_page) {
    return 0;
  }
  return (props.book.current_page / props.book.pages) * 100;
});
</script>

<template>
  <div class="flex flex-col items-center px-1 text-center">
    <!-- Fixed frame keeps progress rows aligned; the cover scales to fit inside it uncropped -->
    <div class="relative group flex h-[225px] w-[150px] items-end justify-center">
      <img
        :src="book.image"
        :alt="book.title"
        class="max-h-full max-w-full rounded-lg shadow-gr-card transition duration-200 group-hover:brightness-75 group-focus-within:brightness-75"
      />
      <UpdateBookProgress
        :book="book"
        @update="handleProgressUpdate"
        @statusUpdate="handleStatusUpdate"
      />
    </div>
    <div class="mt-4 flex w-full max-w-[290px] items-center justify-center gap-3">
      <Progress
        :model-value="Math.min(readingProgress, 100)"
        :aria-label="`Reading progress for ${book.title}`"
        class="h-2 w-auto max-w-[230px] flex-1 bg-gr-track"
      />
      <span class="text-sm font-semibold tabular-nums"
        >{{ Math.floor(readingProgress) }}%</span
      >
    </div>
    <!-- Links are padded out to a 44px touch target -->
    <router-link
      :to="`/book/${book.isbn}`"
      class="flex min-h-11 min-w-11 items-end justify-center pb-0.5 transition-colors hover:text-gr-accent"
    >
      <h3 class="text-lg font-[650] leading-snug">
        <BookTitle :title="book.title" title-class="line-clamp-2" />
      </h3>
    </router-link>
    <router-link
      :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
      class="flex min-h-11 min-w-11 items-start justify-center pt-0.5"
    >
      <p class="text-[15px] text-gr-muted line-clamp-1">
        {{ formatAuthors(book.authors) }}
      </p>
    </router-link>
  </div>
</template>

<style scoped></style>
