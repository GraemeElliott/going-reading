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
import PageSection from '@/components/layout/PageSection.vue';
import type { BookStatus, BookBasicInfo } from '@/types/book';

const userBooksStore = useUserBooksStore();

const currentlyReadingBooks = computed(() => {
  const books = userBooksStore.groupedBooks['currently-reading'] || [];
  return [...books].sort(
    (a, b) => new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
  );
});

// Sits in the grid beside the slides instead of floating over them
const ARROW_CLASS =
  'static translate-y-0 h-11 w-11 rounded-full border border-gr-line bg-transparent text-gr-text shadow-none hover:bg-gr-surface-2 hover:text-gr-text';

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
  <PageSection
    v-if="currentlyReadingBooks.length > 0"
    title="Currently Reading"
    :count="`${currentlyReadingBooks.length} ${
      currentlyReadingBooks.length === 1 ? 'book' : 'books'
    }`"
  >
    <Carousel
      :opts="{ align: 'start' }"
      class="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3"
    >
      <CarouselPrevious :class="ARROW_CLASS" aria-label="Previous book" />
      <CarouselContent
        class="items-start"
        :class="{ 'md:justify-center': currentlyReadingBooks.length < 3 }"
      >
        <CarouselItem
          v-for="book in currentlyReadingBooks"
          :key="book.isbn"
          class="basis-full md:basis-1/3"
        >
          <CurrentlyReadingBookItem :book="book" @update="handleBookUpdate" />
        </CarouselItem>
      </CarouselContent>
      <CarouselNext :class="ARROW_CLASS" aria-label="Next book" />
    </Carousel>
  </PageSection>
</template>
