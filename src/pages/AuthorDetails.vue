<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Author } from '@/types/author';
import type { Book } from '@/types/book';
import isbndbService from '@/services/isbndbService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const route = useRoute();
const author = ref<Author | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref('');
const currentPage = ref(1);
const allBooks = ref<Book[]>([]);
const hasMore = ref(false);
const totalBooks = ref<number | undefined>(undefined);
const searchQuery = ref('');

const filteredBooks = computed(() => {
  let books = allBooks.value;

  // Apply search filter if query exists
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    books = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.publisher?.toLowerCase().includes(query) ||
        book.binding?.toLowerCase().includes(query)
    );
  }

  // Sort by date published
  return books.sort((a, b) => {
    // Handle cases where date_published might be undefined
    if (!a.date_published) return 1; // Push items without dates to the end
    if (!b.date_published) return -1;

    // Convert dates to timestamps for comparison
    const dateA = new Date(a.date_published).getTime();
    const dateB = new Date(b.date_published).getTime();

    // Sort in descending order (newest first)
    return dateB - dateA;
  });
});

const fetchAuthorDetails = async (page: number = 1) => {
  try {
    if (page === 1) {
      loading.value = true;
      allBooks.value = [];
    } else {
      loadingMore.value = true;
    }

    const authorName = route.params.name as string;
    if (!authorName) {
      error.value = 'Author name not provided';
      return;
    }

    const authorDetails = await isbndbService.getAuthorDetails(
      authorName,
      page
    );
    if (authorDetails) {
      author.value = authorDetails;

      if (page === 1) {
        allBooks.value = authorDetails.books;
        // Set total from API response
        totalBooks.value = authorDetails.total;
      } else {
        allBooks.value = [...allBooks.value, ...authorDetails.books];
        // Update total if it wasn't set before and we now have it
        if (
          totalBooks.value === undefined &&
          authorDetails.total !== undefined
        ) {
          totalBooks.value = authorDetails.total;
        }
      }

      // If we have a total, check if we've loaded all books
      if (totalBooks.value !== undefined) {
        hasMore.value = allBooks.value.length < totalBooks.value;
      } else {
        // If no total is available, check if we got a full page
        hasMore.value = authorDetails.books.length === 20;
      }
    } else {
      error.value = 'Author not found';
    }
  } catch (e) {
    error.value = 'Error fetching author details';
    console.error(e);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadMore = async () => {
  if (!loadingMore.value && hasMore.value) {
    currentPage.value++;
    await fetchAuthorDetails(currentPage.value);
  }
};

// Watch for changes in route params
watch(
  () => route.params.name,
  (newName) => {
    if (newName) {
      currentPage.value = 1;
      totalBooks.value = undefined;
      hasMore.value = false;
      fetchAuthorDetails(1);
    }
  }
);

onMounted(() => {
  fetchAuthorDetails(1);
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-[50vh]">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"
      ></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500 py-8">
      {{ error }}
    </div>

    <!-- Author Details -->
    <div v-else-if="author" class="space-y-8">
      <!-- Author Header -->
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Author Info -->
        <div class="flex-grow">
          <h1 class="text-3xl font-bold mb-4">{{ author.name }}</h1>
          <p v-if="author.bio" class="text-gray-600 dark:text-gray-300 mb-4">
            {{ author.bio }}
          </p>
        </div>
      </div>

      <!-- Books Grid -->
      <div>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold">Books by {{ author.name }}</h2>
          <div class="w-72">
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search books..."
              class="w-full"
            />
          </div>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <!-- Book Card -->
          <div
            v-for="book in filteredBooks"
            :key="book.isbn"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <!-- Book Image -->
            <router-link :to="`/book/${book.isbn}`" class="block">
              <div class="aspect-[2/3] overflow-hidden">
                <img
                  :src="book.image"
                  :alt="book.title"
                  class="w-full h-full object-cover"
                />
              </div>
            </router-link>
            <!-- Book Info -->
            <div class="p-4">
              <router-link :to="`/book/${book.isbn}`" class="block">
                <h3
                  class="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {{ book.title }}
                </h3>
              </router-link>
              <div class="space-y-1">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ book.publisher }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ book.pages }} pages
                </p>
                <p
                  v-if="book.date_published"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  Published {{ book.date_published }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore && !searchQuery" class="mt-8 flex justify-center">
          <Button @click="loadMore" :disabled="loadingMore" class="px-6 py-2">
            <span v-if="loadingMore" class="flex items-center">
              <span
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
              ></span>
              Loading...
            </span>
            <span v-else>
              Load More Books
              <template v-if="totalBooks !== undefined">
                ({{ allBooks.length }} of {{ totalBooks }})
              </template>
            </span>
          </Button>
        </div>
      </div>
    </div>

    <!-- No Author Found -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No author details found</p>
    </div>
  </div>
</template>
