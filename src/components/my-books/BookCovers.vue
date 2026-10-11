<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import { useDarkModeStore } from '@/store/store';
import type { BookStatus } from '@/types/book';

const props = defineProps<{
  status: BookStatus;
}>();

const userBooksStore = useUserBooksStore();
const darkModeStore = useDarkModeStore();

const booksToShow = computed(() =>
  (userBooksStore.groupedBooks[props.status] ?? []).slice(0, 3)
);

// Front cover first; the ones behind step right and fade
const LAYERS = [
  'left-0 z-30',
  'left-8 z-20 opacity-70',
  'left-[3.75rem] z-10 opacity-40',
];
</script>

<template>
  <div class="relative h-[84px] w-[124px]">
    <template v-if="booksToShow.length">
      <img
        v-for="(book, index) in booksToShow"
        :key="book.isbn"
        :src="book.image"
        :alt="book.title"
        class="absolute bottom-0 h-[84px] w-[62px] object-cover rounded shadow-md transition-transform duration-300 group-hover:-translate-y-1"
        :class="LAYERS[index]"
        :style="{ transitionDelay: `${index * 40}ms` }"
        loading="lazy"
        @error="book.image = '/default-book-cover.jpg'"
      />
    </template>
    <template v-else>
      <div
        v-for="(layer, index) in LAYERS.slice(0, 2)"
        :key="index"
        class="absolute bottom-0 h-[84px] w-[62px] rounded border flex items-center justify-center text-gray-500"
        :class="[
          layer,
          darkModeStore.darkMode
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-300',
        ]"
      >
        <font-awesome-icon v-if="index === 0" icon="fa-solid fa-book-open" />
      </div>
    </template>
  </div>
</template>
