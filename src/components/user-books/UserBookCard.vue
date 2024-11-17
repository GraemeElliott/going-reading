<script setup lang="ts">
import type { UserBook, BookStatus } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import AddToCustomList from '@/components/user-books/AddToCustomList.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import UserBookStatusSelect from '@/components/user-books/UserBookStatusSelect.vue';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { useUserBooksStore } from '@/store/user-books-store';

const props = defineProps<{
  book: UserBook;
}>();

const emit = defineEmits<{
  (e: 'delete', isbn: string): void;
}>();

const router = useRouter();
const isDeleting = ref(false);
const isUpdating = ref(false);
const userBooksStore = useUserBooksStore();
const error = ref<string | null>(null);
const currentStatus = ref<BookStatus>(props.book.status);

// Compute the basic book info for UserBookStatus
const bookBasicInfo = computed(() => ({
  isbn: props.book.isbn,
  title: props.book.title,
  authors: props.book.authors,
  image: props.book.image,
  date_published: props.book.date_published,
  publisher: props.book.publisher,
  pages: props.book.pages,
}));

const formatYear = (dateString: string | undefined) => {
  if (!dateString) return '';
  // If it's already just a year (4 digits)
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }
  // For date formats like 01-01-2020 or similar
  const matches = dateString.match(/\d{4}/);
  return matches ? matches[0] : dateString;
};

const navigateToBook = () => {
  router.push(`/book/${props.book.isbn}`);
};

const handleDelete = () => {
  emit('delete', props.book.isbn);
  isDeleting.value = false;
};

const handleStatusChange = async (newStatus: BookStatus) => {
  if (isUpdating.value) return;

  error.value = null;
  isUpdating.value = true;

  try {
    await userBooksStore.updateBookStatus(bookBasicInfo.value, newStatus);
    currentStatus.value = newStatus;
    props.book.status = newStatus; // Update local state
  } catch (err: any) {
    error.value = 'Failed to update status. Please try again.';
    console.error('Failed to update book status:', err);
    // Revert to previous status
    currentStatus.value = props.book.status;
  } finally {
    isUpdating.value = false;
  }
};
</script>

<template>
  <div v-if="!isDeleting" class="overflow-x-hidden">
    <div
      class="relative flex flex-col md:flex-row items-start justify-between py-4 w-full"
    >
      <div class="flex items-start w-full gap-4">
        <div class="flex-shrink-0 cursor-pointer" @click="navigateToBook">
          <img
            :src="book.image"
            :alt="book.title"
            class="w-24 h-36 object-fill rounded mr-4"
          />
        </div>
        <div class="flex-grow min-w-0 space-y-1">
          <div class="cursor-pointer" @click="navigateToBook">
            <div>
              <h2 class="font-semibold text-lg break-words w-full">
                {{ book.title }}
              </h2>
              <p class="text-sm font-semibold text-gray-600 mt-1">
                by {{ book.authors.join(', ') }}
              </p>
              <div class="text-sm text-gray-600 space-y-0.5 mt-1">
                <p v-if="book.date_published">
                  {{ formatYear(book.date_published) }}
                </p>
              </div>
              <div
                class="mt-4 space-y-2 hidden md:flex md:flex-col md:space-y-1 md:mt-2"
              >
                <p class="text-xs text-gray-500">
                  Added: {{ new Date(book.date_added).toLocaleDateString() }}
                </p>

                <div class="flex flex-row">
                  <span class="text-sm font-semibold text-gray-600 mr-2"
                    >Your Rating:</span
                  >
                  <UserRating v-model="book.userRating" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 space-y-2 md:hidden">
        <p class="text-xs text-gray-500">
          Added: {{ new Date(book.date_added).toLocaleDateString() }}
        </p>

        <div class="flex flex-row">
          <span class="text-sm font-semibold text-gray-600 mr-2"
            >Your Rating:</span
          >
          <UserRating v-model="book.userRating" />
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-5 md:w-[180px]">
        <div v-if="error" class="text-sm text-red-500 mb-2 w-full">
          {{ error }}
        </div>
        <div class="relative w-[180px]">
          <div
            v-if="isUpdating"
            class="absolute inset-0 bg-black/5 flex items-center justify-center rounded"
          >
            <div
              class="w-4 h-4 border-2 border-goingTeal border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
          <UserBookStatusSelect
            v-model="currentStatus"
            :book="bookBasicInfo"
            @update:model-value="handleStatusChange"
            :disabled="isUpdating"
          />
        </div>
        <AddToCustomList :isbn="book.isbn" :book="bookBasicInfo" />
        <Button
          @click="isDeleting = true"
          class="bg-goingRed text-white w-[180px]"
        >
          Delete
        </Button>
      </div>
    </div>
    <Separator />
  </div>
  <div v-else class="overflow-x-hidden p-4 bg-gray-50 dark:bg-gray-800 rounded">
    <p class="text-center mb-4">
      Are you sure you want to delete "{{ book.title }}"?
    </p>
    <div class="flex justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        type="button"
        @click="isDeleting = false"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        size="sm"
        type="button"
        @click="handleDelete"
      >
        Delete
      </Button>
    </div>
    <Separator class="mt-4" />
  </div>
</template>
