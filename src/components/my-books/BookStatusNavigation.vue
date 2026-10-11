<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserBooksStore } from '@/store/user-books-store';
import { useDarkModeStore } from '@/store/store';
import BookCovers from '@/components/my-books/BookCovers.vue';
import { STATUS_DISPLAY_NAMES, BookStatus } from '@/types/book';
import { Separator } from '@/components/ui/separator';

const route = useRoute();
const router = useRouter();
const userBooksStore = useUserBooksStore();
const darkModeStore = useDarkModeStore();
const username = route.params.username;

const statuses: BookStatus[] = ['want-to-read', 'read', 'did-not-finish'];

const STATUS_BAR_COLOURS: Partial<Record<BookStatus, string>> = {
  'want-to-read': 'bg-goingTeal',
  read: 'bg-goingGreen',
  'did-not-finish': 'bg-gray-500',
};

const bookCounts = computed(() => {
  const books = userBooksStore.groupedBooks;
  return Object.fromEntries(
    Object.entries(books).map(([status, bookList]) => [status, bookList.length])
  );
});

const totalBooks = computed(() =>
  statuses.reduce((sum, status) => sum + (bookCounts.value[status] || 0), 0)
);

const percentOfTotal = (status: BookStatus): number => {
  if (!totalBooks.value) return 0;
  return ((bookCounts.value[status] || 0) / totalBooks.value) * 100;
};

const percentLabel = (status: BookStatus): string => {
  const percent = percentOfTotal(status);
  if (percent > 0 && percent < 1) return '<1%';
  return `${Math.round(percent)}%`;
};

const navigateToStatus = (status: BookStatus) => {
  router.push(`/user/${username}/my-books/${status}`);
};
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-4">
      <h3 class="text-xl font-medium">Bookshelves</h3>
      <span class="text-sm text-muted-foreground">
        {{ totalBooks }} {{ totalBooks === 1 ? 'book' : 'books' }}
      </span>
    </div>
    <Separator class="my-6" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <button
        v-for="status in statuses"
        :key="status"
        type="button"
        class="group w-full rounded-xl border p-6 text-left transition-all duration-200 hover:cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
        :class="{
          'bg-transparent text-black hover:border-black focus-visible:ring-black':
          !darkModeStore.darkMode,
          'bg-transparent text-white border-gray-700 hover:border-white focus-visible:ring-white':
          darkModeStore.darkMode,
        }"
        @click="navigateToStatus(status)"
      >
        <BookCovers :status="status" />

        <p class="mt-5 text-lg font-semibold">
          {{ STATUS_DISPLAY_NAMES[status] }}
        </p>
        <div class="flex items-end justify-between">
          <div>
            <p class="text-3xl font-semibold leading-tight">
              {{ bookCounts[status] || 0 }}
            </p>
            <span class="text-sm text-gray-500">
              {{ bookCounts[status] === 1 ? 'book' : 'books' }}
            </span>
          </div>
          <font-awesome-icon
            icon="fa-solid fa-angle-right"
            class="mb-1 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-goingTeal"
          />
        </div>

        <div
          class="mt-6 h-1 w-full overflow-hidden rounded-full"
          :class="darkModeStore.darkMode ? 'bg-gray-700' : 'bg-gray-200'"
        >
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="STATUS_BAR_COLOURS[status]"
            :style="{
              width: `${Math.max(percentOfTotal(status), bookCounts[status] ? 1 : 0)}%`,
            }"
          ></div>
        </div>
        <p class="mt-2 text-sm text-gray-500">
          {{ percentLabel(status) }} of total
        </p>
      </button>
    </div>
  </div>
</template>
