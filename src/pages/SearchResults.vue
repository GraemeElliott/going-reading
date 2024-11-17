<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import isbndbService from '@/services/isbndbService';
import type { Book, BookStatus } from '@/types/book';
import type { Author } from '@/types/author';
import SearchResultsBookCard from '@/components/search/SearchResultsBookCard.vue';
import SearchResultsAuthorCard from '@/components/search/SearchResultsAuthorCard.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBooksStore } from '@/store/user-books-store';
import { useAuthStore } from '@/store/auth-store';

type SearchType = 'title' | 'author' | 'isbn';

const ITEMS_PER_PAGE = 10;

const route = useRoute();
const query = ref((route.query.q as string) || '');
const searchType = ref<SearchType>((route.query.type as SearchType) || 'title');
const results = ref<(Book | Author)[]>([]);
const loading = ref(true); // Start with loading true
const error = ref<string | null>(null);
const hasMoreResults = ref(true);
const currentPage = ref(1);
const hasSearched = ref(false);
const userBooksStore = useUserBooksStore();
const authStore = useAuthStore();

// Compute visible results based on current page
const visibleResults = computed(() => {
  return results.value.slice(0, currentPage.value * ITEMS_PER_PAGE);
});

const isAuthor = (result: Book | Author): result is Author => {
  return 'type' in result && result.type === 'author';
};

const updateBookStatus = async (book: Book, newStatus: BookStatus) => {
  const bookIndex = results.value.findIndex(
    (result) => !isAuthor(result) && result.isbn === book.isbn
  );
  if (bookIndex !== -1) {
    // Create a new array with the updated book to maintain reactivity
    results.value = results.value.map((result, index) => {
      if (index === bookIndex && !isAuthor(result)) {
        return { ...result, status: newStatus };
      }
      return result;
    });
  }
};

const fetchResults = async (searchQuery: string, page: number = 1) => {
  if (!searchQuery) return;

  if (page === 1) {
    results.value = [];
    loading.value = true; // Set loading true immediately for first page
    hasSearched.value = false;
  }

  error.value = null;
  try {
    const newResults = await isbndbService.searchQuery(
      searchQuery,
      searchType.value,
      page
    );

    if (newResults.length === 0) {
      hasMoreResults.value = false;
    } else {
      // Process results in chunks to avoid blocking the UI
      const processResults = async () => {
        const processedResults = await Promise.all(
          newResults.map(async (result) => {
            if (!isAuthor(result)) {
              const status = userBooksStore.getUserBookStatus(result.isbn);
              return {
                ...result,
                status: status as BookStatus,
              };
            }
            return result;
          })
        );

        // Append new results to existing ones
        results.value = [...results.value, ...processedResults];
      };

      await processResults();
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
let debounceTimeout: NodeJS.Timeout;
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
  }
);

// Initialize store and fetch results
onMounted(async () => {
  loading.value = true; // Ensure loading is true on mount
  if (authStore.user) {
    await userBooksStore.initialize();
  }
  if (query.value) {
    await fetchResults(query.value);
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">
      Search results for "{{ query }}"
      <span class="text-gray-500 text-lg capitalize">({{ searchType }})</span>
    </h1>

    <div v-if="error" class="text-red-500 mb-4">
      {{ error }}
    </div>

    <!-- Loading Skeletons - Show immediately when loading is true -->
    <div v-if="loading && !results.length" class="space-y-4">
      <div v-for="n in 5" :key="n" class="w-full">
        <div
          class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full border-b"
        >
          <div class="flex items-start w-full gap-4">
            <Skeleton class="w-24 h-36 rounded" />
            <div class="flex-grow space-y-2">
              <Skeleton class="h-6 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
              <div class="space-y-1 mt-2">
                <Skeleton class="h-4 w-1/4" />
                <Skeleton class="h-4 w-1/3" />
              </div>
            </div>
          </div>
          <div class="flex space-x-3 mt-5 md:mt-0 self-center">
            <Skeleton class="w-[180px] h-10 rounded" />
            <Skeleton class="w-10 h-10 rounded" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched && !results.length" class="text-center py-8">
      <p class="text-gray-600">No results found for "{{ query }}"</p>
    </div>

    <div v-else class="space-y-4">
      <template
        v-for="result in visibleResults"
        :key="isAuthor(result) ? result.name : result.isbn"
      >
        <!-- Author Card -->
        <Suspense v-if="isAuthor(result)">
          <SearchResultsAuthorCard :author="result" />
          <template #fallback>
            <div class="py-4">
              <Skeleton class="h-12 w-full" />
            </div>
          </template>
        </Suspense>

        <!-- Book Card -->
        <Suspense v-else>
          <SearchResultsBookCard
            :book="result"
            @update:status="(newStatus) => updateBookStatus(result, newStatus)"
          />
          <template #fallback>
            <div class="py-4">
              <Skeleton class="h-36 w-full" />
            </div>
          </template>
        </Suspense>
      </template>
    </div>

    <div
      v-if="hasMoreResults && !loading && results.length > 0"
      class="text-center mt-8"
    >
      <Button @click="loadMore" class="px-6 py-2 rounded transition-colors">
        Load More Results
      </Button>
    </div>

    <!-- Loading state for "Load More" -->
    <div v-if="loading && results.length > 0" class="space-y-4 mt-8">
      <div v-for="n in 2" :key="n" class="w-full">
        <div
          class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full border-b"
        >
          <div class="flex items-start w-full gap-4">
            <Skeleton class="w-24 h-36 rounded" />
            <div class="flex-grow space-y-2">
              <Skeleton class="h-6 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
              <div class="space-y-1 mt-2">
                <Skeleton class="h-4 w-1/4" />
                <Skeleton class="h-4 w-1/3" />
              </div>
            </div>
          </div>
          <div class="flex space-x-3 mt-5 md:mt-0 self-center">
            <Skeleton class="w-[180px] h-10 rounded" />
            <Skeleton class="w-10 h-10 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
