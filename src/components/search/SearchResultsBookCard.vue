<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Book, BookStatus } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import UserBookStatusSelect from '@/components/user-books/UserBookStatusSelect.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import { useAuthStore } from '@/store/auth-store';

const props = defineProps<{
  book: Book;
}>();

const emit = defineEmits<{
  (e: 'update:status', status: BookStatus): void;
}>();

const authStore = useAuthStore();
const currentStatus = ref<BookStatus>(props.book.status || '');
const imageLoaded = ref(false);

// Computed properties for expensive operations
const formattedYear = computed(() => {
  const dateString = props.book.date_published;
  if (!dateString) return '';

  // If it's already just a year (4 digits)
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }

  // For date formats like 01-01-2020 or similar
  const matches = dateString.match(/\d{4}/);
  return matches ? matches[0] : dateString;
});

const bookInfo = computed(() => ({
  isbn: props.book.isbn,
  title: props.book.title,
  authors: props.book.authors,
  image: props.book.image,
  date_published: props.book.date_published,
  publisher: props.book.publisher,
  pages: props.book.pages,
}));

const handleStatusUpdate = (newStatus: BookStatus) => {
  currentStatus.value = newStatus;
  emit('update:status', newStatus);
};

const handleImageLoad = () => {
  imageLoaded.value = true;
};

const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  imgElement.src = '/placeholder-book.png'; // Make sure you have this placeholder image
};
</script>

<template>
  <div class="overflow-x-hidden">
    <div
      class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full"
    >
      <div class="flex items-start w-full gap-4">
        <router-link :to="`/book/${book.isbn}`" class="flex-shrink-0">
          <div class="relative w-24 h-36">
            <!-- Skeleton loader while image is loading -->
            <div
              v-show="!imageLoaded"
              class="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
            ></div>
            <img
              :src="book.image"
              :alt="book.title"
              class="w-24 h-36 object-fill rounded mr-4"
              :class="{ 'opacity-0': !imageLoaded, 'opacity-100': imageLoaded }"
              @load="handleImageLoad"
              @error="handleImageError"
              loading="lazy"
            />
          </div>
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
              <p
                v-if="formattedYear"
                class="text-sm font-semibold text-gray-600 pt-1"
              >
                {{ formattedYear }}
              </p>
              <div class="text-sm font-semibold text-gray-600 space-y-1 mt-1">
                <p v-if="book.publisher">{{ book.publisher }}</p>
                <p v-if="book.pages">Pages: {{ book.pages }}</p>
              </div>
            </div>
          </router-link>

          <div
            v-if="authStore.user && authStore.user.username"
            class="flex flex-row"
          >
            <span class="text-sm font-semibold text-gray-600 mr-2"
              >Your Rating:</span
            >
            <Suspense>
              <UserRating v-model="book.userRating" />
              <template #fallback>
                <div
                  class="w-24 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
                ></div>
              </template>
            </Suspense>
          </div>
        </div>
      </div>
      <div
        class="flex flex-row md:flex-col space-x-3 md:space-x-0 md:space-y-3 mt-5 md:mt-0 self-center w-full md:w-auto"
      >
        <Suspense>
          <UserBookStatusSelect
            v-model="currentStatus"
            :book="bookInfo"
            @update:model-value="handleStatusUpdate"
          />
          <template #fallback>
            <div
              class="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
            ></div>
          </template>
        </Suspense>
      </div>
    </div>
    <Separator />
  </div>
</template>

<style scoped>
img {
  transition: opacity 0.3s ease-in-out;
}
</style>
