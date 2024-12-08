<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const userBooksStore = useUserBooksStore();

// Get recently read books (top 5)
const recentlyReadBooks = computed(() => {
  const readBooks = userBooksStore.groupedBooks.read || [];
  return readBooks.slice(0, 5);
});
</script>

<template>
  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Recently Read Books</h2>
    <div v-if="recentlyReadBooks.length > 0">
      <Carousel class="w-full">
        <CarouselContent class="-ml-1">
          <CarouselItem
            v-for="book in recentlyReadBooks"
            :key="book.isbn"
            class="pl-1 basis-full md:basis-1/2 lg:basis-1/5"
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
                  {{ book.title }}
                </h3>
              </router-link>
              <router-link
                :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
              >
                <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {{ book.authors.join(', ') }}
                </p>
              </router-link>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious class="lg:hidden" />
        <CarouselNext class="lg:hidden" />
      </Carousel>
    </div>
    <p v-else class="text-gray-600 dark:text-gray-400">No books read yet.</p>
  </div>
</template>
