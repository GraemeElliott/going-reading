<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import PageSection from '@/components/layout/PageSection.vue';
import StatCard from './StatCard.vue';
import { STATUS_DISPLAY_NAMES, BookStatus } from '@/types/book';
import { bookCount, percentLabel } from '@/utils/book-display';

const userBooksStore = useUserBooksStore();

const statuses: BookStatus[] = ['want-to-read', 'read', 'did-not-finish'];

const bookCounts = computed(() => {
  const books = userBooksStore.groupedBooks;
  return Object.fromEntries(
    Object.entries(books).map(([status, bookList]) => [status, bookList.length])
  );
});

const totalBooks = computed(() =>
  statuses.reduce((sum, status) => sum + (bookCounts.value[status] || 0), 0)
);

const shelves = computed(() =>
  statuses.map((status) => {
    const count = bookCounts.value[status] || 0;
    return {
      status,
      name: STATUS_DISPLAY_NAMES[status],
      count,
      percentLabel: percentLabel(count, totalBooks.value, 'of your library'),
    };
  })
);
</script>

<template>
  <PageSection
    title="Bookshelves"
    :count="bookCount(totalBooks)"
  >
    <div
      class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]"
    >
      <StatCard
        v-for="shelf in shelves"
        :key="shelf.status"
        :to="{ name: 'bookshelves', query: { shelf: shelf.status } }"
        :label="shelf.name"
        :count="shelf.count"
        :caption="shelf.percentLabel"
      />
    </div>
  </PageSection>
</template>
