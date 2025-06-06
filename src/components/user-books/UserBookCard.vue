<script setup lang="ts">
import type { UserBook, BookStatus } from '@/types/book';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import AddToList from '@/components/user-books/AddToList.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import UserBookStatusSelect from '@/components/user-books/UserBookStatusSelect.vue';
import BookNotes from '@/components/user-books/BookNotes.vue';
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
const isPopoverOpen = ref(false);
const isUpdating = ref(false);
const userBooksStore = useUserBooksStore();
const error = ref<string | null>(null);
const currentStatus = ref<BookStatus>(props.book.status);

// Compute if rating should be shown
const showRating = computed(
  () => props.book.status === 'read' || props.book.status === 'did-not-finish'
);

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
  isPopoverOpen.value = false;
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
</script>

<template>
  <div class="overflow-x-hidden">
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
          <div class="cursor-pointer">
            <div>
              <h2
                class="font-semibold text-lg break-words w-full"
                @click="navigateToBook"
              >
                {{ book.title }}
              </h2>

              <p class="text-sm font-semibold text-gray-600 mt-1">
                by
                <router-link
                  :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
                >
                  <span class="font-medium">{{ book.authors.join(', ') }}</span>
                </router-link>
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

                <p v-if="book.date_finished" class="text-xs text-gray-500">
                  Finished:
                  {{ new Date(book.date_finished).toLocaleDateString() }}
                </p>

                <div v-if="showRating" class="flex flex-row">
                  <span class="text-sm font-semibold text-gray-600 mr-2"
                    >Your Rating:</span
                  >
                  <UserRating
                    v-model="book.user_rating"
                    @update:model-value="handleRatingChange"
                  />
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

        <p v-if="book.date_finished" class="text-xs text-gray-500">
          Finished: {{ new Date(book.date_finished).toLocaleDateString() }}
        </p>

        <div v-if="showRating" class="flex flex-row">
          <span class="text-sm font-semibold text-gray-600 mr-2"
            >Your Rating:</span
          >
          <UserRating
            v-model="book.user_rating"
            @update:model-value="handleRatingChange"
          />
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
        <AddToList :isbn="book.isbn" :book="bookBasicInfo" />
        <BookNotes :book-id="book.id" :book-title="book.title" />
        <Popover v-model:open="isPopoverOpen">
          <PopoverTrigger>
            <Button
              class="bg-goingRed hover:bg-goingRed text-white hover:text-white w-[180px]"
            >
              Delete
            </Button>
          </PopoverTrigger>
          <PopoverContent class="p-4">
            <p class="text-center mb-4">
              Are you sure you want to delete <strong>{{ book.title }}</strong
              >?
            </p>
            <div class="flex justify-center gap-4">
              <Button variant="outline" @click="isPopoverOpen = false">
                Cancel
              </Button>
              <Button
                size="sm"
                class="bg-goingRed text-white border-none hover:bg-goingRed"
                @click="handleDelete"
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <Separator />
  </div>
</template>
