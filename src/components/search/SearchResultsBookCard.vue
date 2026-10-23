<script setup lang="ts">
import { computed, ref } from 'vue';
import { Book as BookOutlineIcon } from 'lucide-vue-next';
import type { Book, BookBasicInfo } from '@/types/book';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useLibraryStore } from '@/store/library-store';
import ShelfStatusMenu from '@/components/user-books/ShelfStatusMenu.vue';
import AddToList from '@/components/user-books/AddToList.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import LibraryIcon from '@/components/navbar/LibraryIcon.vue';
import { toast } from '@/components/ui/toast';
import { extractYear } from '@/utils/book-utils';
import { formatAuthors } from '@/utils/book-display';

const props = defineProps<{
  book: Book;
}>();

const emit = defineEmits<{
  (e: 'add-to-library', book: Book): void;
}>();

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const libraryStore = useLibraryStore();

const isSignedIn = computed(() => !!authStore.user && !!authStore.userMetadata.username);
const shelfStatus = computed(() => userBooksStore.getUserBookStatus(props.book.isbn));
const isOwned = computed(() => libraryStore.ownedIsbns.has(props.book.isbn));

// The search service substitutes this stock image when a book has no cover
const coverFailed = ref(false);
const hasCover = computed(
  () => !!props.book.image && props.book.image !== '/default-book-cover.jpg' && !coverFailed.value
);

const authorText = computed(() => formatAuthors(props.book.authors));

const metaLine = computed(() =>
  [
    extractYear(props.book.date_published),
    props.book.pages ? `${props.book.pages.toLocaleString()} pages` : null,
  ]
    .filter(Boolean)
    .join(' · ')
);

const bookInfo = computed<BookBasicInfo>(() => ({
  isbn: props.book.isbn,
  title: props.book.title,
  authors: props.book.authors,
  image: props.book.image,
  date_published: props.book.date_published,
  publisher: props.book.publisher,
  pages: props.book.pages,
  subjects: props.book.subjects,
}));

const addToLibraryLabel = computed(() =>
  `Add ${props.book.title}${authorText.value ? ` by ${authorText.value}` : ''} to your library`
);

const onShelfError = (message: string | null) => {
  if (!message) return;
  toast({ title: 'Error updating shelf', description: message, variant: 'destructive', duration: 4000 });
};
</script>

<template>
  <div
    class="gr-card flex flex-wrap items-center gap-x-5 gap-y-4 py-4 pl-4 pr-5"
  >
    <div class="flex min-w-[min(100%,260px)] flex-1 items-center gap-4">
      <router-link
        :to="`/book/${book.isbn}`"
        class="shrink-0"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          v-if="hasCover"
          :src="book.image"
          alt=""
          class="h-[114px] w-[76px] rounded-[5px] object-cover shadow-gr-card"
          @error="coverFailed = true"
        />
        <span
          v-else
          role="img"
          aria-label="No cover available"
          class="flex h-[114px] w-[76px] flex-col items-center justify-center gap-1.5 rounded-[5px] border border-gr-line bg-gr-surface-2 text-gr-muted"
        >
          <BookOutlineIcon :size="22" :stroke-width="1.75" aria-hidden="true" />
          <span class="text-[11px] font-semibold">No cover</span>
        </span>
      </router-link>

      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-[650] leading-snug">
          <router-link
            :to="`/book/${book.isbn}`"
            class="block break-words transition-colors hover:text-gr-accent"
          >
            <BookTitle :title="book.title" />
          </router-link>
        </h3>
        <p v-if="authorText" class="mt-0.5 text-[15px]">{{ authorText }}</p>
        <p v-if="metaLine" class="mt-0.5 text-sm text-gr-muted">{{ metaLine }}</p>
      </div>
    </div>

    <div v-if="isSignedIn" class="flex flex-wrap items-center gap-2">
      <ShelfStatusMenu
        :book="bookInfo"
        :status="shelfStatus"
        show-progress
        @error="onShelfError"
      />
      <AddToList :isbn="book.isbn" :book="book" icon="fa-solid fa-list" />

      <router-link
        v-if="isOwned"
        to="/my-books/library"
        class="gr-icon-btn bg-gr-accent-soft !text-gr-accent hover:!bg-gr-accent-soft"
        aria-label="In your library"
        title="In your library"
      >
        <LibraryIcon class="!h-5 !w-5" />
      </router-link>
      <button
        v-else
        type="button"
        class="gr-icon-btn relative border border-gr-line !text-gr-text"
        :aria-label="addToLibraryLabel"
        :title="addToLibraryLabel"
        @click="emit('add-to-library', book)"
      >
        <LibraryIcon class="!h-5 !w-5" />
        <!-- "books with a plus" -->
        <span
          class="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gr-text text-gr-surface"
          aria-hidden="true"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="text-[8px]" />
        </span>
      </button>
    </div>
  </div>
</template>
