<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import isbndbService from '@/services/isbndbService';
import type { Book, BookStatus, BookBasicInfo } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import UserBookStatusSelect from '@/components/user-books/UserBookStatusSelect.vue';
import AddToList from '@/components/user-books/AddToList.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import UserBookActivity from '@/components/user-books/UserBookActivity.vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { Skeleton } from '@/components/ui/skeleton';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const route = useRoute();
const book = ref<Book | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const storeInitialized = ref(false);

// Safe book data for template
const bookData = computed(() => {
  if (!book.value) return null;
  return {
    ...book.value,
    basicInfo: {
      isbn: book.value.isbn,
      title: book.value.title,
      authors: book.value.authors,
      image: book.value.image,
      date_published: book.value.date_published,
      publisher: book.value.publisher,
      pages: book.value.pages,
    } as BookBasicInfo,
  };
});

// Get the book's status from the store
const bookStatus = computed({
  get: () => {
    if (!bookData.value || !storeInitialized.value) return '';
    return userBooksStore.getUserBookStatus(bookData.value.isbn);
  },
  set: async (newStatus: BookStatus) => {
    if (!bookData.value || !authStore.user?.id) return;
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

// Compute if rating should be shown
const showRating = computed(
  () => bookStatus.value === 'read' || bookStatus.value === 'did-not-finish'
);

// Get and set the book's rating
const bookRating = computed({
  get: () => {
    if (!bookData.value || !storeInitialized.value) return null;
    const rating = userBooksStore.getUserBookRating(bookData.value.isbn);
    return rating ?? null;
  },
  set: async (newRating: number | null) => {
    if (!bookData.value || !authStore.user?.id) return;
    try {
      await userBooksStore.updateBookRating(bookData.value.isbn, newRating);
    } catch (err) {
      console.error('Failed to update book rating:', err);
    }
  },
});

const fetchBookDetails = async (isbn: string) => {
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

const formatYear = (dateString: string) => {
  // If it's already just a year (4 digits)
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }

  // For date formats like 01-01-2020 or similar
  const matches = dateString.match(/\d{4}/);
  return matches ? matches[0] : dateString;
};

// Watch for route changes
watch(
  () => route.params.isbn,
  (newIsbn) => {
    if (newIsbn && typeof newIsbn === 'string') {
      fetchBookDetails(newIsbn);
    }
  }
);

onMounted(async () => {
  // Always initialize the store first
  try {
    await userBooksStore.initialize();
    storeInitialized.value = true;
  } catch (e) {
    console.error('Failed to initialize user books:', e);
  }

  const isbn = route.params.isbn;
  if (!isbn || typeof isbn !== 'string') {
    error.value = 'Invalid ISBN';
    loading.value = false;
    return;
  }

  await fetchBookDetails(isbn);
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex flex-col md:flex-row">
          <!-- Book Image Skeleton -->
          <div class="w-full md:w-1/3 p-6">
            <Skeleton class="w-full h-[400px] rounded-lg" />
            <div class="hidden md:flex flex-col items-center gap-4 mt-8">
              <Skeleton class="w-[180px] h-10" />
              <Skeleton class="w-[180px] h-10" />
              <Skeleton class="w-[120px] h-10" />
            </div>
          </div>

          <!-- Book Details Skeleton -->
          <div class="w-full md:w-2/3 p-6">
            <Skeleton class="h-10 w-3/4 mb-4" />
            <Skeleton class="h-6 w-1/2 mb-6" />
            <div class="space-y-4">
              <Skeleton class="h-4 w-1/3" />
              <Skeleton class="h-4 w-1/4" />
              <Skeleton class="h-4 w-1/2" />
              <Skeleton class="h-4 w-1/3" />
            </div>
            <div class="mt-8">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full mt-2" />
              <Skeleton class="h-4 w-3/4 mt-2" />
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
    <div v-else-if="bookData" class="max-w-4xl mx-auto">
      <div class="overflow-hidden">
        <div class="flex flex-col md:flex-row">
          <div class="w-full md:w-1/3 p-6">
            <img
              :src="bookData.image"
              :alt="bookData.title"
              class="w-full rounded-lg object-cover mx-auto"
              @error="bookData.image = '/default-book-cover.jpg'"
            />
            <!-- User Interaction Section --Desktop -->
            <div
              v-if="authStore.user?.id"
              class="hidden md:flex flex-col items-center justify-start gap-6 mt-8"
            >
              <UserBookStatusSelect
                v-model="bookStatus"
                :book="bookData.basicInfo"
              />
              <AddToList :isbn="bookData.isbn" :book="bookData" />
              <div v-if="showRating" class="flex flex-col items-center">
                <UserRating v-model="bookRating" />
                <span class="pt-1">Your Rating</span>
              </div>
            </div>
          </div>

          <div class="w-full md:w-2/3 p-6">
            <h1 class="text-3xl font-bold mb-4">
              {{ bookData.title }}
            </h1>
            <div class="text-lg text-gray-600 mb-4">
              by
              <router-link
                :to="`/author/${encodeURIComponent(
                  bookData.authors.join(', ')
                )}`"
                class="flex-shrink-0"
              >
                <span class="font-medium">{{
                  bookData.authors.join(', ')
                }}</span>
              </router-link>
              <div class="py-4">
                <div class="flex flex-col text-sm text-gray-500">
                  <div>
                    <span class="font-medium mr-2">ISBN:</span>
                    <span>{{ bookData.isbn }}</span>
                  </div>
                  <div>
                    <span class="font-medium mr-2">Publisher:</span>
                    <span>{{ bookData.publisher }}</span>
                  </div>
                  <div>
                    <span class="font-medium mr-2">Year Published:</span>
                    <span>{{
                      bookData.date_published
                        ? formatYear(bookData.date_published)
                        : ''
                    }}</span>
                  </div>
                  <div>
                    <span class="font-medium mr-2">Pages:</span>
                    <span>{{ bookData.pages }}</span>
                  </div>
                  <div class="mt-5">
                    <p>{{ bookData.subjects.join(', ') }}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div class="py-4 flex flex-col">
                <p class="text-md" v-html="bookData.synopsis"></p>
              </div>
              <!-- User Interaction Section --Mobile -->
              <div
                v-if="authStore.user?.id"
                class="md:hidden flex flex-col items-center justify-start gap-6 mt-6"
              >
                <UserBookStatusSelect
                  v-model="bookStatus"
                  :book="bookData.basicInfo"
                />
                <AddToList :isbn="bookData.isbn" :book="bookData" />
                <div v-if="showRating" class="flex flex-col items-center">
                  <UserRating v-model="bookRating" />
                  <span class="pt-1">Your Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Book Activity Feed -->
        <div v-if="authStore.user?.id" class="px-6">
          <Separator class="my-6" />
          <UserBookActivity :isbn="bookData.isbn" />
        </div>
      </div>
    </div>
  </div>
</template>
