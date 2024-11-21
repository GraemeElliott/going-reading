<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import type { BookStatus } from '@/types/book';

const props = defineProps<{
  status: BookStatus;
}>();

const userBooksStore = useUserBooksStore();

const booksToShow = computed(() => {
  const books = userBooksStore.groupedBooks[props.status];
  return books.slice(0, 3); // Get up to 3 books
});
</script>

<template>
  <div class="relative h-28 w-24">
    <template v-if="booksToShow.length > 0">
      <div
        v-for="(book, index) in booksToShow"
        :key="book.isbn"
        :class="[
          'absolute rounded shadow transition-transform duration-300 bottom-0',
          {
            'w-[72px] h-28 z-30 hover:-translate-y-2': index === 0,
            'w-16 h-24 -right-0.5 z-20 opacity-90 hover:-translate-y-2':
              index === 1,
            'w-14 h-20 -right-4 z-10 opacity-80 hover:-translate-y-2':
              index === 2,
          },
        ]"
      >
        <img
          :src="book.image"
          :alt="book.title"
          class="w-full h-full object-fit"
          loading="lazy"
        />
      </div>
    </template>
    <template v-else>
      <div class="w-16 h-28 bg-gray-100 rounded shadow absolute bottom-0"></div>
    </template>
  </div>
</template>

<style scoped></style>
