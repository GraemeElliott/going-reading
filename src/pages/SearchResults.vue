<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import isbndbService from '@/services/isbndbService';
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import PageLayout from '@/components/layout/PageLayout.vue';
import SearchResultsBookCard from '@/components/search/SearchResultsBookCard.vue';
import SearchResultsAuthorCard from '@/components/search/SearchResultsAuthorCard.vue';
import AddToLibraryDialog from '@/components/library/AddToLibraryDialog.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBooksStore } from '@/store/user-books-store';
import { useLibraryStore } from '@/store/library-store';
import { useAuthStore } from '@/store/auth-store';

type SearchType = 'title' | 'author' | 'isbn';

const ITEMS_PER_PAGE = 10;
const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  title: 'title',
  author: 'author',
  isbn: 'ISBN',
};

const route = useRoute();
const query = ref((route.query.q as string) || '');
const searchType = ref<SearchType>((route.query.type as SearchType) || 'title');
const results = ref<(Book | Author)[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const hasMoreResults = ref(true);
const currentPage = ref(1);
const hasSearched = ref(false);
const userBooksStore = useUserBooksStore();
const libraryStore = useLibraryStore();
const authStore = useAuthStore();

const libraryDialogOpen = ref(false);
const libraryBook = ref<Book | null>(null);

// Compute visible results based on current page
const visibleResults = computed(() => {
  return results.value.slice(0, currentPage.value * ITEMS_PER_PAGE);
});

const isAuthor = (result: Book | Author): result is Author => {
  return 'type' in result && result.type === 'author';
};

// A book is "yours" if it's on any shelf or in the library. Computed from the
// stores, so a book moves group as soon as it's shelved or added.
const isYours = (book: Book) =>
  !!userBooksStore.getUserBookStatus(book.isbn) || libraryStore.ownedIsbns.has(book.isbn);

const visibleBooks = computed(() => visibleResults.value.filter((r): r is Book => !isAuthor(r)));
const visibleAuthors = computed(() => visibleResults.value.filter(isAuthor));
const yourBooks = computed(() => visibleBooks.value.filter(isYours));
const moreBooks = computed(() => visibleBooks.value.filter((b) => !isYours(b)));

const countLabel = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

const summary = computed(() => {
  const n = results.value.filter((r) => !isAuthor(r)).length;
  const found = searchType.value === 'author' && !n
    ? countLabel(results.value.length, 'author')
    : countLabel(n, 'book');
  return `${found} found · searching by ${SEARCH_TYPE_LABELS[searchType.value]}`;
});

const openAddToLibrary = (book: Book) => {
  libraryBook.value = book;
  libraryDialogOpen.value = true;
};

const fetchResults = async (searchQuery: string, page: number = 1) => {
  if (!searchQuery) return;

  if (page === 1) {
    results.value = [];
    loading.value = true;
    hasSearched.value = false;
  }

  error.value = null;
  try {
    const newResults = await isbndbService.searchQuery(
      searchQuery,
      searchType.value,
      page,
    );

    if (newResults.length === 0) {
      hasMoreResults.value = false;
    } else {
      // Append new results to existing ones
      results.value = [...results.value, ...newResults];
      hasMoreResults.value = true;
    }
  } catch (e) {
    error.value = 'Error loading search results';
    console.error(e);
  } finally {
    loading.value = false;
    hasSearched.value = true;
  }
};

const loadMore = () => {
  if (!loading.value && hasMoreResults.value) {
    currentPage.value++;
    fetchResults(query.value, currentPage.value);
  }
};

// Watch for query changes in URL with debounce
let debounceTimeout: ReturnType<typeof setTimeout>;
watch(
  () => route.query,
  (newQuery) => {
    const newQueryText = newQuery.q as string;
    const newSearchType = newQuery.type as SearchType;

    if (newQueryText !== query.value || newSearchType !== searchType.value) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        query.value = newQueryText || '';
        searchType.value = newSearchType || 'title';
        currentPage.value = 1;
        hasSearched.value = false;
        if (query.value) {
          fetchResults(query.value);
        }
      }, 300);
    }
  },
);

// Initialize stores and fetch results
onMounted(async () => {
  loading.value = true;

  // Shelf and library state decide the "In your books" group
  if (authStore.user?.id) {
    await Promise.all([
      userBooksStore.initialize().catch((e) => console.error('Failed to initialize user books:', e)),
      libraryStore.initialize().catch((e) => console.error('Failed to load library:', e)),
    ]);
  }

  if (query.value) {
    await fetchResults(query.value);
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <PageLayout
    :title="`Results for “${query}”`"
    :subtitle="hasSearched ? summary : undefined"
    compact-title
  >
    <div class="space-y-8">
      <p v-if="error" role="alert" class="gr-card p-4 text-center text-gr-danger-text">
        {{ error }}
      </p>

      <!-- Loading -->
      <div v-if="loading && !results.length" class="space-y-3" aria-busy="true">
        <Skeleton v-for="n in 4" :key="n" class="h-[148px] rounded-2xl bg-gr-surface-2" />
      </div>

      <!-- Nothing found -->
      <div v-else-if="hasSearched && !results.length" class="gr-empty">
        <p class="font-semibold text-gr-text">No books found for &ldquo;{{ query }}&rdquo;</p>
        <p class="mt-1 text-sm">
          Check the spelling, or try searching by
          {{ searchType === 'author' ? 'title or ISBN' : searchType === 'isbn' ? 'title or author' : 'author or ISBN' }}
          using the menu next to the search box.
        </p>
      </div>

      <template v-else>
        <section v-if="yourBooks.length">
          <div class="mb-3.5 flex items-baseline justify-between gap-4">
            <h2 class="font-heading text-2xl font-medium leading-tight">In your books</h2>
            <span class="shrink-0 text-sm text-gr-muted">{{ countLabel(yourBooks.length, 'book') }}</span>
          </div>
          <ul class="space-y-3">
            <li v-for="book in yourBooks" :key="book.isbn">
              <SearchResultsBookCard :book="book" @add-to-library="openAddToLibrary" />
            </li>
          </ul>
        </section>

        <section v-if="moreBooks.length">
          <div class="mb-3.5 flex items-baseline justify-between gap-4">
            <h2 class="font-heading text-2xl font-medium leading-tight">More results</h2>
            <span class="shrink-0 text-sm text-gr-muted">{{ countLabel(moreBooks.length, 'book') }}</span>
          </div>
          <ul class="space-y-3">
            <li v-for="book in moreBooks" :key="book.isbn">
              <SearchResultsBookCard :book="book" @add-to-library="openAddToLibrary" />
            </li>
          </ul>
        </section>

        <!-- Author searches return author names -->
        <section v-if="visibleAuthors.length">
          <div class="mb-3.5 flex items-baseline justify-between gap-4">
            <h2 class="font-heading text-2xl font-medium leading-tight">Authors</h2>
            <span class="shrink-0 text-sm text-gr-muted">{{ countLabel(visibleAuthors.length, 'author') }}</span>
          </div>
          <ul class="space-y-3">
            <li v-for="author in visibleAuthors" :key="author.name">
              <SearchResultsAuthorCard :author="author" />
            </li>
          </ul>
        </section>

        <!-- Loading state for "Load More" -->
        <div v-if="loading && results.length" class="space-y-3" aria-busy="true">
          <Skeleton v-for="n in 2" :key="n" class="h-[148px] rounded-2xl bg-gr-surface-2" />
        </div>

        <div v-if="hasMoreResults && !loading && results.length" class="text-center">
          <button type="button" class="gr-btn gr-btn-outline" @click="loadMore">
            Load more results
          </button>
        </div>
      </template>
    </div>

    <AddToLibraryDialog v-model:open="libraryDialogOpen" :preset-book="libraryBook" />
  </PageLayout>
</template>
