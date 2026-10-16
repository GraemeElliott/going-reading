<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'radix-vue';
import type { UserBook, BookStatus } from '@/types/book';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import { extractYear } from '@/utils/book-utils';
import AddToList from '@/components/user-books/AddToList.vue';
import ShelfStatusMenu from '@/components/user-books/ShelfStatusMenu.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import BookNotes from '@/components/user-books/BookNotes.vue';
import { useUserBooksStore } from '@/store/user-books-store';
import BookTitle from '@/components/partials/BookTitle.vue';
import { formatAuthors, formatBookTitle } from '@/utils/book-display';

const props = defineProps<{
  book: UserBook;
}>();

const emit = defineEmits<{
  (e: 'delete', isbn: string): void;
}>();


const userBooksStore = useUserBooksStore();
const error = ref<string | null>(null);

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

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

// e.g. "23 Sep 2026" (toLocaleDateString gives "Sept" in some browsers)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const metaLine = computed(() =>
  [
    extractYear(props.book.date_published),
    `Added ${formatDate(props.book.date_added)}`,
    props.book.date_finished &&
      `Finished ${formatDate(props.book.date_finished)}`,
  ]
    .filter(Boolean)
    .join(' · ')
);

const handleRatingChange = async (newRating: number | null) => {
  error.value = null;
  try {
    await userBooksStore.updateBookRating(props.book.isbn, newRating);
  } catch (err: any) {
    error.value = 'Failed to update rating. Please try again.';
    console.error('Failed to update book rating:', err);
  }
};
</script>

<template>
  <div class="gr-card flex flex-wrap items-center gap-4 p-4">
    <div class="flex min-w-0 flex-1 basis-full items-center gap-4 md:basis-[320px]">
      <router-link
        :to="`/book/${book.isbn}`"
        class="shrink-0"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          :src="book.image"
          alt=""
          class="h-[126px] w-[84px] rounded-md object-cover shadow-gr-card"
        />
      </router-link>
      <div class="min-w-0">
        <h2 class="text-[19px] font-[650] leading-snug">
          <router-link
            :to="`/book/${book.isbn}`"
            class="block break-words transition-colors hover:text-gr-accent"
          >
            <BookTitle :title="book.title" />
          </router-link>
        </h2>
        <p class="mt-0.5 text-[15px] text-gr-muted">
          by
          <router-link
            :to="`/author/${encodeURIComponent(book.authors.join(', '))}`"
            class="transition-colors hover:text-gr-text"
          >
            {{ formatAuthors(book.authors) }}
          </router-link>
        </p>
        <p class="mt-1 text-sm text-gr-muted">{{ metaLine }}</p>
        <div v-if="showRating" class="mt-1 flex items-center gap-2">
          <span class="text-sm text-gr-muted">Your rating:</span>
          <UserRating
            :model-value="book.user_rating"
            @update:model-value="handleRatingChange"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ShelfStatusMenu
        :book="bookBasicInfo"
        :status="book.status"
        @error="error = $event"
      />

      <AddToList :isbn="book.isbn" :book="bookBasicInfo" />
      <BookNotes
        :book-id="book.id"
        :book-title="book.title"
        :book-authors="book.authors"
      />

      <!-- Delete confirmation -->
      <AlertDialogRoot>
        <AlertDialogTrigger
          class="gr-icon-btn hover:!text-gr-danger-text"
          :aria-label="`Delete ${book.title}`"
        >
          <font-awesome-icon icon="fa-regular fa-trash-can" />
        </AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay
            class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <AlertDialogContent
            class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gr-line bg-gr-surface p-6 font-body text-base text-gr-text shadow-gr-modal focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
            <AlertDialogTitle
              class="font-heading text-[26px] font-medium leading-tight"
            >
              Delete this book?
            </AlertDialogTitle>
            <AlertDialogDescription class="mt-3 text-gr-muted">
              <span class="font-[650] text-gr-text">{{ formatBookTitle(book.title).main }}</span>
              will be removed from your library.
            </AlertDialogDescription>
            <div class="mt-6 flex justify-end gap-2">
              <AlertDialogCancel class="gr-btn gr-btn-outline">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                class="gr-btn gr-btn-danger"
                @click="emit('delete', book.isbn)"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </div>

    <p v-if="error" role="alert" class="basis-full text-sm text-gr-danger-text">
      {{ error }}
    </p>
  </div>
</template>
