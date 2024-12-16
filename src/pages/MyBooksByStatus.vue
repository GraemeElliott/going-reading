<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { STATUS_DISPLAY_NAMES, type BookStatus } from '@/types/book';
import UserBookCard from '@/components/user-books/UserBookCard.vue';
import { Skeleton } from '@/components/ui/skeleton';
import type { ComponentPublicInstance } from 'vue';

const route = useRoute();
const username = route.params.username;
const status = route.params.status as BookStatus;
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const isInitializing = ref(true);
const isLoading = computed(() => userBooksStore.loading);
const error = computed(() => userBooksStore.error);
const hasBooks = computed(() => userBooksStore.userBooks.length > 0);

// Pagination state
const currentPage = ref(1);
const booksPerPage = 20;
const isLoadingMore = ref(false);
const hasMoreBooks = ref(true);
const displayedBooks = ref<any[]>([]);

// Get all books for current status
const allBooks = computed(() => {
  return userBooksStore.groupedBooks[status] || [];
});

// Watch for changes in allBooks or currentPage and update displayed books
watch(
  [allBooks, currentPage],
  () => {
    const endIndex = currentPage.value * booksPerPage;
    const newBooks = allBooks.value.slice(0, endIndex);
    displayedBooks.value = newBooks;

    // Check if we've loaded all books
    hasMoreBooks.value = endIndex < allBooks.value.length;
  },
  { immediate: true }
);

// Watch for status changes to reset pagination
watch(
  () => status,
  () => {
    currentPage.value = 1;
    hasMoreBooks.value = true;
    displayedBooks.value = allBooks.value.slice(0, booksPerPage);
  }
);

// Intersection observer for infinite scroll
const observer = ref<IntersectionObserver | null>(null);

const setupIntersectionObserver = () => {
  observer.value = new IntersectionObserver(
    (entries) => {
      const firstEntry = entries[0];
      if (
        firstEntry.isIntersecting &&
        !isLoading.value &&
        hasMoreBooks.value &&
        !isLoadingMore.value
      ) {
        loadMoreBooks();
      }
    },
    { threshold: 0.1 }
  );
};

const loadMoreBooks = async () => {
  if (isLoadingMore.value || !hasMoreBooks.value) return;

  isLoadingMore.value = true;

  try {
    // Simulate a delay to prevent instant loading
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentPage.value++;
  } finally {
    isLoadingMore.value = false;
  }
};

const handleBookDelete = async (isbn: string) => {
  try {
    await userBooksStore.deleteBook(isbn);
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
};

// Update intersection observer when books change
const observeLastBook = (
  el: Element | ComponentPublicInstance | null,
  refs: Record<string, any>
) => {
  if (el instanceof Element && observer.value) {
    observer.value.disconnect();
    observer.value.observe(el);
  }
};

onMounted(async () => {
  try {
    // If we have a user and no books loaded (even from persistence), fetch them
    if (authStore.user?.id && !hasBooks.value) {
      await userBooksStore.fetchUserBooks();
    }
    setupIntersectionObserver();
  } catch (error) {
    console.error('Failed to initialize books:', error);
  } finally {
    isInitializing.value = false;
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script>

<template>
  <div class="mx-auto py-8">
    <!-- Initialization Loading State -->
    <div v-if="isInitializing" class="space-y-6">
      <div class="mb-8">
        <Skeleton class="h-10 w-64 mb-2" />
      </div>
      <div class="space-y-4">
        <div v-for="n in 2" :key="n">
          <Skeleton class="h-24 w-full" />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="space-y-6">
      <!-- Header Skeleton -->
      <div class="mb-8">
        <Skeleton class="h-10 w-64 mb-2" />
      </div>

      <!-- Books List Skeleton -->
      <div class="space-y-4">
        <div v-for="n in 3" :key="n" class="w-full">
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

    <!-- Error State -->
    <div v-else-if="error" class="text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- User Header -->
      <div class="mb-8">
        <h1
          class="text-3xl font-bold mb-2"
          v-if="authStore.user && authStore.userMetadata.username === username"
        >
          {{ STATUS_DISPLAY_NAMES[status] }} Books
        </h1>
        <h1 class="text-3xl font-bold mb-2" v-else>
          {{ username }}'s {{ STATUS_DISPLAY_NAMES[status] }} Books
        </h1>
      </div>

      <!-- Books List -->
      <div class="space-y-4">
        <div v-if="displayedBooks.length === 0" class="text-gray-500 italic">
          No books in this category
        </div>

        <div v-else class="space-y-4">
          <template v-for="(book, index) in displayedBooks" :key="book.isbn">
            <div
              :ref="
                index === displayedBooks.length - 1
                  ? observeLastBook
                  : undefined
              "
            >
              <UserBookCard :book="book" @delete="handleBookDelete" />
            </div>
          </template>

          <!-- Loading More Skeleton -->
          <div v-if="isLoadingMore" class="space-y-4">
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

          <!-- No More Books Message -->
          <div
            v-if="!hasMoreBooks && displayedBooks.length > 0"
            class="text-center text-gray-500 py-4"
          >
            No more books to load
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
