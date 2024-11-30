<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Author } from '@/types/author';
import type { Book } from '@/types/book';
import isbndbService from '@/services/isbndbService';
import { Button } from '@/components/ui/button';

const route = useRoute();
const author = ref<Author | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref('');
const currentPage = ref(1);
const allBooks = ref<Book[]>([]);
const hasMore = ref(false);
const totalBooks = ref(0);

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
        // Use the length of filtered books for the first page to estimate total
        const booksPerPage = authorDetails.books.length;
        // If we got a full page of results, use the API total
        totalBooks.value =
          booksPerPage === 20 ? authorDetails.total || 0 : booksPerPage;
      } else {
        allBooks.value = [...allBooks.value, ...authorDetails.books];
        // Update total based on actual books received
        if (authorDetails.books.length < 20) {
          totalBooks.value = allBooks.value.length;
        }
      }

      // Check if we have more books to load based on actual books received
      hasMore.value = authorDetails.books.length === 20;
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
      totalBooks.value = 0;
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
        <!-- Author Photo -->
        <div
          v-if="author.photoUrl"
          class="w-48 h-48 rounded-lg overflow-hidden shrink-0"
        >
          <img
            :src="author.photoUrl"
            :alt="author.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div
          v-else
          class="w-48 h-48 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"
        >
          <span class="text-4xl text-gray-400">📷</span>
        </div>

        <!-- Author Info -->
        <div class="flex-grow">
          <h1 class="text-3xl font-bold mb-4">{{ author.name }}</h1>
          <p v-if="author.bio" class="text-gray-600 dark:text-gray-300 mb-4">
            {{ author.bio }}
          </p>
          <p class="text-gray-500 dark:text-gray-400">
            {{ totalBooks }} published {{ totalBooks === 1 ? 'book' : 'books' }}
            <span v-if="allBooks.length < totalBooks">
              (Showing {{ allBooks.length }})
            </span>
          </p>
        </div>
      </div>

      <!-- Books Grid -->
      <div>
        <h2 class="text-2xl font-semibold mb-6">Books by {{ author.name }}</h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <!-- Book Card -->
          <div
            v-for="book in allBooks"
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
                <p
                  v-if="book.binding"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ book.binding }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore" class="mt-8 flex justify-center">
          <Button @click="loadMore" :disabled="loadingMore" class="px-6 py-2">
            <span v-if="loadingMore" class="flex items-center">
              <span
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
              ></span>
              Loading...
            </span>
            <span v-else>
              Load More Books ({{ allBooks.length }} of {{ totalBooks }})
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
