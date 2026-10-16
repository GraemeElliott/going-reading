<script setup lang="ts">
import { computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';
import PageSection from '@/components/layout/PageSection.vue';
import { STATUS_DISPLAY_NAMES, BookStatus } from '@/types/book';

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

const percentLabel = (count: number): string => {
  const percent = totalBooks.value
    ? Math.round((count / totalBooks.value) * 100)
    : 0;
  if (count > 0 && percent < 1) return 'Under 1% of your library';
  return `${percent}% of your library`;
};

const shelves = computed(() =>
  statuses.map((status) => {
    const count = bookCounts.value[status] || 0;
    return {
      status,
      name: STATUS_DISPLAY_NAMES[status],
      count,
      percentLabel: percentLabel(count),
    };
  })
);
</script>

<template>
  <PageSection
    title="Bookshelves"
    :count="`${totalBooks} ${totalBooks === 1 ? 'book' : 'books'}`"
  >
    <div
      class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]"
    >
      <router-link
        v-for="shelf in shelves"
        :key="shelf.status"
        :to="{ name: 'bookshelves', query: { shelf: shelf.status } }"
        class="gr-card group flex items-center justify-between gap-4 p-6 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
      >
        <div class="min-w-0">
          <p class="font-semibold">{{ shelf.name }}</p>
          <p
            class="mt-1 text-4xl font-bold leading-tight transition-colors duration-200 group-hover:text-gr-accent"
          >
            {{ shelf.count }}
          </p>
          <p class="mt-1 text-sm text-gr-muted">{{ shelf.percentLabel }}</p>
        </div>
        <font-awesome-icon
          icon="fa-solid fa-angle-right"
          class="shrink-0 text-gr-muted transition duration-200 group-hover:translate-x-1 group-hover:text-gr-text"
          aria-hidden="true"
        />
      </router-link>
    </div>
  </PageSection>
</template>
