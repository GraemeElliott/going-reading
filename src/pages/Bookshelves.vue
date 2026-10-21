<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { STATUS_DISPLAY_NAMES, type BookStatus, type UserBook } from '@/types/book';
import { extractYear } from '@/utils/book-utils';
import { authorMatches, compareByAuthor } from '@/utils/book-display';
import PageLayout from '@/components/layout/PageLayout.vue';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import ListPagination from '@/components/layout/ListPagination.vue';
import ShelfBookCard from '@/components/user-books/ShelfBookCard.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryPagination } from '@/composables/useQueryPagination';

type SortKey = 'added' | 'title' | 'author' | 'year';

const SHELVES: BookStatus[] = [
  'want-to-read',
  'currently-reading',
  'read',
  'did-not-finish',
];
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'added', label: 'Recently added' },
  { value: 'title', label: 'Title A to Z' },
  { value: 'author', label: 'Author A to Z' },
  { value: 'year', label: 'Year published' },
];
const BOOKS_PER_PAGE = 20;

const route = useRoute();
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const isInitializing = ref(true);
const error = computed(() => userBooksStore.error);

// The selected shelf lives in ?shelf=; anything else falls back to the first
const shelf = computed<BookStatus>(() => {
  const value = route.query.shelf as BookStatus;
  return SHELVES.includes(value) ? value : 'want-to-read';
});

const counts = computed(() =>
  Object.fromEntries(
    SHELVES.map((s) => [s, userBooksStore.groupedBooks[s]?.length || 0])
  )
);

const countLabel = computed(() => {
  const count = counts.value[shelf.value];
  return `${count} ${count === 1 ? 'book' : 'books'}`;
});

const search = ref('');
const sort = ref<SortKey>('added');

const SORTERS: Record<SortKey, (a: UserBook, b: UserBook) => number> = {
  added: (a, b) =>
    new Date(b.date_added).getTime() - new Date(a.date_added).getTime(),
  title: (a, b) => a.title.localeCompare(b.title),
  author: compareByAuthor,
  // Newest first; books without a year go last
  year: (a, b) =>
    (extractYear(b.date_published) ?? -Infinity) -
    (extractYear(a.date_published) ?? -Infinity),
};

const filteredBooks = computed(() => {
  const term = search.value.trim().toLowerCase();
  const books = userBooksStore.groupedBooks[shelf.value] || [];
  const matches = term
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(term) ||
          authorMatches(book.authors, term)
      )
    : books;
  return [...matches].sort(SORTERS[sort.value]);
});

// Switching shelf drops ?page= with the tab link, so only search and sort reset here
const {
  currentPage,
  pageCount,
  pagedItems: displayedBooks,
} = useQueryPagination(filteredBooks, {
  pageSize: BOOKS_PER_PAGE,
  resetOn: [search, sort],
  ready: () => !isInitializing.value,
});

watch(shelf, () => {
  search.value = '';
  sort.value = 'added';
});

// Keep the selected tab in view when the tab row scrolls on narrow screens
const tabs = ref<HTMLElement | null>(null);
watch(
  shelf,
  async () => {
    await nextTick();
    tabs.value
      ?.querySelector('[aria-current]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  },
  { flush: 'post' }
);

const handleBookDelete = async (isbn: string) => {
  try {
    await userBooksStore.deleteBook(isbn);
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
};

onMounted(async () => {
  try {
    // If we have a user and no books loaded (even from persistence), fetch them
    if (authStore.user?.id && !userBooksStore.userBooks.length) {
      await userBooksStore.fetchUserBooks();
    }
  } catch (error) {
    console.error('Failed to initialize books:', error);
  } finally {
    isInitializing.value = false;
  }
  tabs.value
    ?.querySelector('[aria-current]')
    ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
</script>

<template>
  <PageLayout
    :title="STATUS_DISPLAY_NAMES[shelf]"
    :count="isInitializing ? undefined : countLabel"
    back-to="/my-books"
    back-label="My Books"
  >
    <div>
      <!-- Shelf tabs -->
      <nav
        ref="tabs"
        aria-label="Shelves"
        class="-mt-4 flex gap-2 overflow-x-auto"
      >
        <router-link
          v-for="s in SHELVES"
          :key="s"
          :to="{ query: { shelf: s } }"
          :aria-current="s === shelf ? 'true' : undefined"
          class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold transition-colors"
          :class="
            s === shelf
              ? 'bg-gr-accent-soft text-gr-accent'
              : 'text-gr-muted hover:bg-gr-surface-2 hover:text-gr-text'
          "
        >
          {{ STATUS_DISPLAY_NAMES[s] }}
          <span class="font-normal">{{ counts[s] }}</span>
        </router-link>
      </nav>

      <!-- Toolbar -->
      <div class="mt-6 flex flex-col gap-3 md:flex-row">
        <div class="relative flex-1">
          <font-awesome-icon
            icon="fa-solid fa-magnifying-glass"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
          />
          <input
            v-model="search"
            type="search"
            class="gr-input bg-gr-surface pl-10"
            placeholder="Search this shelf"
            aria-label="Search this shelf"
          />
        </div>
        <div class="md:w-[220px]">
          <ThemedSelect v-model="sort" :options="SORT_OPTIONS" label="Sort by" />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isInitializing" class="mt-6 space-y-3" aria-busy="true">
        <Skeleton
          v-for="n in 3"
          :key="n"
          class="h-[160px] rounded-2xl bg-gr-surface-2"
        />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        role="alert"
        class="gr-card mt-6 p-4 text-center text-gr-danger-text"
      >
        {{ error }}
      </div>

      <p v-else-if="!filteredBooks.length" class="gr-empty mt-6">
        {{
          search.trim()
            ? `No books on this shelf match "${search.trim()}".`
            : 'No books on this shelf yet.'
        }}
      </p>

      <!-- Books -->
      <template v-else>
        <ul class="mt-6 space-y-3">
          <li v-for="book in displayedBooks" :key="book.isbn">
            <ShelfBookCard :book="book" @delete="handleBookDelete" />
          </li>
        </ul>
        <ListPagination v-model:page="currentPage" :page-count="pageCount" />
      </template>
    </div>
  </PageLayout>
</template>
