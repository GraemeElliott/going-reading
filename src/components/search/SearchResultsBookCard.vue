<script setup lang="ts">
import type { Book, BookStatus } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import UserBookStatusSelect from '@/components/user-books/UserBookStatusSelect.vue';
import AddToList from '@/components/user-books/AddToList.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
  book: Book;
}>();

const emit = defineEmits<{
  (e: 'update:status', status: BookStatus): void;
}>();

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const currentStatus = ref<BookStatus>(props.book.status || '');
const error = ref<string | null>(null);

// Initialize user rating from the database
onMounted(() => {
  if (authStore.user && authStore.userMetadata.username) {
    const dbRating = userBooksStore.getUserBookRating(props.book.isbn);
    if (dbRating !== undefined) {
      props.book.user_rating = dbRating;
    }
  }
});

// Compute if rating should be shown
const showRating = computed(
  () =>
    currentStatus.value === 'read' || currentStatus.value === 'did-not-finish'
);

// Compute the rating value, ensuring it's either a number or null
const userRating = computed(() => props.book.user_rating ?? null);

const handleStatusUpdate = (newStatus: BookStatus) => {
  currentStatus.value = newStatus;
  emit('update:status', newStatus);
};

const handleRatingChange = async (newRating: number | null) => {
  error.value = null;
  try {
    await userBooksStore.updateBookRating(props.book.isbn, newRating);
    props.book.user_rating = newRating; // Update local state
  } catch (err: any) {
    error.value = 'Failed to update rating. Please try again.';
    console.error('Failed to update book rating:', err);
    // Revert to previous rating
    props.book.user_rating = userBooksStore.getUserBookRating(props.book.isbn);
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
</script>

<template>
  <div class="overflow-x-hidden">
    <div
      class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full"
    >
      <div class="flex items-start w-full gap-4">
        <router-link :to="`/book/${book.isbn}`" class="flex-shrink-0">
          <img
            :src="book.image"
            :alt="book.title"
            class="w-24 h-36 object-fill rounded mr-4"
          />
        </router-link>
        <div class="flex-grow min-w-0 space-y-1">
          <router-link :to="`/book/${book.isbn}`">
            <div>
              <h2 class="font-semibold text-lg break-words w-4/5">
                {{ book.title }}
              </h2>
              <p class="text-sm font-semibold text-gray-600 mt-1">
                by {{ book.authors.join(', ') }}
              </p>
              <p class="text-sm font-semibold text-gray-600 pt-1">
                {{ book.date_published ? formatYear(book.date_published) : '' }}
              </p>
              <div class="text-sm font-semibold text-gray-600 space-y-1 mt-1">
                <p v-if="book.publisher">{{ book.publisher }}</p>
                <p v-if="book.pages">Pages: {{ book.pages }}</p>
              </div>
            </div>
          </router-link>

          <div
            v-if="authStore.user && authStore.userMetadata.username"
            class="flex flex-col gap-2"
          >
            <div v-if="error" class="text-sm text-red-500">
              {{ error }}
            </div>
            <div v-if="showRating" class="flex flex-row">
              <span class="text-sm font-semibold text-gray-600 mr-2"
                >Your Rating:</span
              >
              <UserRating
                v-model="userRating"
                @update:model-value="handleRatingChange"
              />
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex flex-row md:flex-col space-x-3 md:space-x-0 md:space-y-3 mt-5 md:mt-0 self-center w-full md:w-auto"
      >
        <UserBookStatusSelect
          v-model="currentStatus"
          :book="{
            isbn: book.isbn,
            title: book.title,
            authors: book.authors,
            image: book.image,
            date_published: book.date_published,
            publisher: book.publisher,
            pages: book.pages,
          }"
          @update:model-value="handleStatusUpdate"
        />
        <AddToList :isbn="book.isbn" :book="book" />
      </div>
    </div>
    <Separator />
  </div>
</template>
