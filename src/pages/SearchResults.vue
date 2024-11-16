<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import isbndbService from '@/services/isbndbService';
import type { Book } from '@/types/book';
import type { Author } from '@/types/author';
import SearchResultsBookCard from '@/components/search/SearchResultsBookCard.vue';
import SearchResultsAuthorCard from '@/components/search/SearchResultsAuthorCard.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type SearchType = 'title' | 'author' | 'isbn';

const route = useRoute();
const query = ref((route.query.q as string) || '');
const searchType = ref<SearchType>((route.query.type as SearchType) || 'title');
const results = ref<(Book | Author)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const hasMoreResults = ref(true);
const currentPage = ref(1);
const hasSearched = ref(false);

const isAuthor = (result: Book | Author): result is Author => {
  return 'type' in result && result.type === 'author';
};

const fetchResults = async (searchQuery: string, page: number = 1) => {
  if (page === 1) {
    results.value = [];
  }
  loading.value = true;
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

onMounted(() => {
  if (query.value) {
    fetchResults(query.value);
  }
});

// Watch for query changes in URL
watch(
  () => route.query,
  (newQuery) => {
    const newQueryText = newQuery.q as string;
    const newSearchType = newQuery.type as SearchType;

    if (newQueryText !== query.value || newSearchType !== searchType.value) {
      query.value = newQueryText || '';
      searchType.value = newSearchType || 'title';
      currentPage.value = 1;
      hasSearched.value = false;
      if (query.value) {
        fetchResults(query.value);
      }
    }
  }
);
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

    <!-- Loading Skeletons -->
    <div v-if="loading && !results.length" class="space-y-4">
      <div v-for="n in 5" :key="n" class="w-full">
        <div
          class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full border-b"
        >
          <div class="flex items-start w-full gap-4">
            <!-- Book cover skeleton -->
            <Skeleton class="w-24 h-36 rounded" />

            <div class="flex-grow space-y-2">
              <!-- Title skeleton -->
              <Skeleton class="h-6 w-3/4" />
              <!-- Author skeleton -->
              <Skeleton class="h-4 w-1/2" />
              <!-- Additional info skeletons -->
              <div class="space-y-1 mt-2">
                <Skeleton class="h-4 w-1/4" />
                <Skeleton class="h-4 w-1/3" />
              </div>
            </div>
          </div>

          <!-- Status button skeleton -->
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
      <div
        v-for="result in results"
        :key="isAuthor(result) ? result.name : result.isbn"
        class="w-full"
      >
        <!-- Author Card -->
        <SearchResultsAuthorCard v-if="isAuthor(result)" :author="result" />

        <!-- Book Card -->
        <SearchResultsBookCard v-else :result="result" />
      </div>
    </div>

    <div
      v-if="hasMoreResults && !loading && results.length > 0"
      class="text-center my-8"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
