<script setup lang="ts">
import { computed } from 'vue';
import type { UserBook, BookStatus } from '@/types/book';
import UpdateBookProgress from './UpdateBookProgress.vue';
import Progress from '../ui/progress/Progress.vue';

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
  <div class="p-1">
    <div class="flex flex-col items-center h-[320px]">
      <div class="relative group w-32">
        <img
          :src="book.image"
          :alt="book.title"
          class="w-32 h-48 rounded-md shadow-md transition-all duration-200 object-cover"
        />
        <div
          class="absolute inset-0 w-32 h-48 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-200 rounded-md"
        ></div>
        <UpdateBookProgress
          :book="book"
          @update="handleProgressUpdate"
          @statusUpdate="handleStatusUpdate"
        />
      </div>
      <div class="text-center w-full mt-2">
        <div class="flex flex-row items-center justify-center space-x-3 mb-2">
          <Progress :model-value="readingProgress" class="my-2" />
          <span class="text-xs font-semibold"
            >{{ Math.floor(readingProgress) }}%</span
          >
        </div>
        <router-link :to="`/book/${book.isbn}`" class="block mb-1">
          <h3 class="font-medium text-sm line-clamp-2">
            {{ book.title }}
          </h3>
        </router-link>
        <router-link
          :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
        >
          <p class="text-xs text-gray-500 line-clamp-1">
            {{ book.authors.join(', ') }}
          </p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
