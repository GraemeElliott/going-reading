<script setup lang="ts">
import { ref, onMounted, watch, computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import isbndbService from '@/services/isbndbService';
import type { Book, BookStatus, BookBasicInfo } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { Skeleton } from '@/components/ui/skeleton';
import { useDarkModeStore } from '@/store/store';

// Lazy load all interactive components
const UserBookStatusSelect = defineAsyncComponent(
  () => import('@/components/user-books/UserBookStatusSelect.vue')
);
const AddToList = defineAsyncComponent(
  () => import('@/components/user-books/AddToList.vue')
);
const Notes = defineAsyncComponent(
  () => import('@/components/user-books/BookNotes.vue')
);
const UserRating = defineAsyncComponent(
  () => import('@/components/user-books/UserRating.vue')
);
const UserBookActivity = defineAsyncComponent(
  () => import('@/components/user-books/UserBookActivity.vue')
);

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const darkModeStore = useDarkModeStore();
const route = useRoute();
const book = ref<Book | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Simplified book data computation with user book ID
const bookData = computed(() => {
  if (!book.value) return null;

  const isbn = book.value.isbn;
  // Find the user's book to get the ID
  const userBook = userBooksStore.userBooks.find((b) => b.isbn === isbn);

  return {
    ...book.value,
    id: userBook?.id, // Include the book ID from user_books table
    basicInfo: {
      isbn,
      title: book.value.title,
      authors: book.value.authors,
      image: book.value.image,
      date_published: book.value.date_published,
      publisher: book.value.publisher,
      pages: book.value.pages,
    } as BookBasicInfo,
  };
});

// Simplified status management
const bookStatus = computed({
  get: () => userBooksStore.getUserBookStatus(bookData.value?.isbn || ''),
  set: async (newStatus: BookStatus) => {
    if (!bookData.value?.basicInfo || !authStore.user?.id) return;
    try {
      await userBooksStore.updateBookStatus(
        bookData.value.basicInfo,
        newStatus
      );
    } catch (err) {
      console.error('Failed to update book status:', err);
    }
  },
});

const showRating = computed(() =>
  ['read', 'did-not-finish'].includes(bookStatus.value)
);

const bookRating = computed({
  get: () =>
    userBooksStore.getUserBookRating(bookData.value?.isbn || '') ?? null,
  set: async (newRating: number | null) => {
    if (!bookData.value?.isbn || !authStore.user?.id) return;
    try {
      await userBooksStore.updateBookRating(bookData.value.isbn, newRating);
    } catch (err) {
      console.error('Failed to update book rating:', err);
    }
  },
});

const formatYear = (dateString: string) => {
  if (/^\d{4}$/.test(dateString)) return dateString;
  const matches = dateString.match(/\d{4}/);
  return matches ? matches[0] : dateString;
};

const fetchBookDetails = async (isbn: string) => {
  if (!isbn) {
    error.value = 'Invalid ISBN';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const bookData = await isbndbService.getBookByIsbn(isbn);
    if (bookData) {
      book.value = bookData;
    } else {
      error.value = 'Book not found';
    }
  } catch (e) {
    error.value = 'Error loading book details';
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// Initialize only what's needed immediately
onMounted(async () => {
  const isbn = route.params.isbn;
  if (!isbn || typeof isbn !== 'string') {
    error.value = 'Invalid ISBN';
    loading.value = false;
    return;
  }

  // Only initialize store if user is logged in
  if (authStore.user?.id) {
    await userBooksStore.initialize();
  }

  await fetchBookDetails(isbn);
});

// Simplified route change handling
watch(
  () => route.params.isbn,
  (newIsbn) => {
    if (newIsbn && typeof newIsbn === 'string') {
      fetchBookDetails(newIsbn);
    }
  }
);
</script>

<template>
  <div class="mx-auto py-8">
    <!-- Simplified Loading State -->
    <div v-if="loading" class="max-w-4xl mx-auto">
      <div class="flex flex-col md:flex-row gap-6">
        <Skeleton class="w-full md:w-1/3 h-[400px]" />
        <div class="w-full md:w-2/3 space-y-4">
          <Skeleton class="h-8 w-3/4" />
          <Skeleton class="h-6 w-1/2" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
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
    <div v-else-if="bookData" class="max-w-4xl mx-auto">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Book Image and Basic Info -->
        <div class="w-full md:w-1/3">
          <img
            :src="bookData.image"
            :alt="bookData.title"
            class="w-full rounded-lg"
            @error="bookData.image = '/default-book-cover.jpg'"
          />

          <!-- User Actions -->
          <div
            v-if="authStore.user?.id"
            class="mt-6 flex flex-col items-center"
          >
            <Suspense>
              <template #default>
                <div class="flex flex-col items-center space-y-4">
                  <UserBookStatusSelect
                    v-model="bookStatus"
                    :book="bookData.basicInfo"
                    class="w-48"
                  />
                  <AddToList
                    :isbn="bookData.isbn"
                    :book="bookData"
                    class="w-48"
                  />
                  <Notes
                    v-if="bookData.id"
                    :book-id="bookData.id"
                    :book-title="bookData.title"
                  />
                  <UserRating
                    v-if="showRating"
                    v-model="bookRating"
                    class="w-48 justify-center"
                  />
                </div>
              </template>
              <template #fallback>
                <div class="flex justify-center">
                  <Skeleton class="h-32 w-48" />
                </div>
              </template>
            </Suspense>
          </div>
        </div>

        <!-- Book Details -->
        <div class="w-full md:w-2/3">
          <h1 class="text-3xl font-bold mb-4">
            {{ bookData.title }}
          </h1>

          <div class="space-y-4">
            <!-- Authors -->
            <div class="text-lg">
              by
              <router-link
                :to="`/author/${encodeURIComponent(
                  bookData.authors.join(', ')
                )}`"
              >
                <span class="font-medium">{{
                  bookData.authors.join(', ')
                }}</span>
              </router-link>
            </div>

            <!-- Book Metadata -->
            <div class="text-sm text-gray-500 space-y-1">
              <div>
                <span class="font-medium">ISBN:</span> {{ bookData.isbn }}
              </div>
              <div>
                <span class="font-medium">Publisher:</span>
                {{ bookData.publisher }}
              </div>
              <div v-if="bookData.date_published">
                <span class="font-medium">Published:</span>
                {{ formatYear(bookData.date_published) }}
              </div>
              <div v-if="bookData.pages">
                <span class="font-medium">Pages:</span> {{ bookData.pages }}
              </div>
            </div>

            <!-- Synopsis -->
            <Separator />
            <div
              class="prose max-w-none"
              :class="{
                'prose-dark': darkModeStore.darkMode,
              }"
            >
              <p v-html="bookData.synopsis"></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <Suspense v-if="authStore.user?.id">
        <template #default>
          <div class="mt-8">
            <Separator class="mb-6" />
            <UserBookActivity :isbn="bookData.isbn" />
          </div>
        </template>
        <template #fallback>
          <div class="mt-8">
            <Separator class="mb-6" />
            <Skeleton class="h-32" />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>
