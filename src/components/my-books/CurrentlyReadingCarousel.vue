<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useUserBooksStore } from '@/store/user-books-store';
import { computed } from 'vue';
import CurrentlyReadingBookItem from './CurrentlyReadingBookItem.vue';
import { Separator } from '@/components/ui/separator';
import type { BookStatus, BookBasicInfo } from '@/types/book';

const userBooksStore = useUserBooksStore();

const currentlyReadingBooks = computed(() => {
  const books = userBooksStore.groupedBooks['currently-reading'] || [];
  return books;
});

async function handleBookUpdate(
  bookId: string,
  updates: { currentPage?: number; status?: BookStatus }
) {
  if (updates.status) {
    const book = currentlyReadingBooks.value.find((b) => b.id === bookId);
    if (book) {
      const bookInfo: BookBasicInfo = {
        isbn: book.isbn,
        title: book.title,
        authors: book.authors,
        image: book.image,
        date_published: book.date_published,
        publisher: book.publisher,
        pages: book.pages,
      };
      await userBooksStore.updateBookStatus(bookInfo, updates.status);
    }
  }
}
</script>

<template>
  <div v-if="currentlyReadingBooks.length > 0" class="w-full py-4">
    <div class="flex flex-col gap-1">
      <h3 class="text-lg font-medium">Currently Reading</h3>
      <span class="text-sm text-muted-foreground"
        >{{ currentlyReadingBooks.length || 0 }}
        {{ currentlyReadingBooks.length === 1 ? 'book' : 'books' }}</span
      >
    </div>
    <Separator class="my-6" />
    <Carousel class="w-full max-w-5xl mx-auto">
      <CarouselContent class="flex flex-row items-center">
        <CarouselItem
          v-for="book in currentlyReadingBooks"
          :key="book.isbn"
          class="basis-1/2 md:basis-1/3 lg:basis-1/3"
        >
          <CurrentlyReadingBookItem :book="book" @update="handleBookUpdate" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious class="hidden md:flex" />
      <CarouselNext class="hidden md:flex" />
    </Carousel>
    <Separator class="my-6" />
  </div>
</template>
