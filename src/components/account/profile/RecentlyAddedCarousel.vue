<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import { truncateText } from '@/utils/book-utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const userBooksStore = useUserBooksStore();

// Get the 5 most recently added books across all statuses
// Sort all books by date_added to get the most recent ones first
const recentlyAddedBooks = computed(() => {
  return [...userBooksStore.userBooks]
    .sort(
      (a, b) =>
        new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
    )
    .slice(0, 4)
    .map((book) => ({
      ...book,
      truncatedTitle: truncateText(book.title, 50), // Truncate the title
    }));
});
</script>

<template>
  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Recently Added Books</h2>
    <div v-if="recentlyAddedBooks.length > 0">
      <Carousel class="w-full">
        <CarouselContent class="-ml-1">
          <CarouselItem
            v-for="book in recentlyAddedBooks"
            :key="book.isbn"
            class="pl-1 basis-full md:basis-1/2 lg:basis-1/4"
          >
            <div class="flex flex-col items-center p-1">
              <router-link :to="`/book/${book.isbn}`">
                <img
                  :src="book.image"
                  :alt="book.title"
                  class="w-32 h-48 object-cover rounded shadow-md hover:shadow-lg transition-shadow"
                />
              </router-link>
              <router-link :to="`/book/${book.isbn}`">
                <h3 class="text-sm font-medium text-center mt-2">
                  {{ truncateText(book.title, 40) }}
                </h3>
              </router-link>
              <router-link
                :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
              >
                <p
                  class="text-xs text-gray-600 dark:text-gray-400 text-center mt-2"
                >
                  {{ book.authors.join(', ') }}
                </p>
              </router-link>
              <span class="text-xs text-gray-500 mt-1">{{ book.status }}</span>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="lg:hidden" />
        <CarouselNext class="lg:hidden" />
      </Carousel>
    </div>
    <p v-else class="text-gray-600 dark:text-gray-400">No books added yet.</p>
  </div>
</template>
