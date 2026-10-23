<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'radix-vue';
import { debounce } from 'lodash';
import bookApiService from '@/services/bookApiService';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import { formatAuthors } from '@/utils/book-display';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { toast } from '@/components/ui/toast';
import type { Book } from '@/types/book';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import { SHELF_STATUS_META } from '@/components/user-books/shelfStatusMeta';
import type { LibraryFormat, LibrarySearchField } from '@/types/library';
import { LIBRARY_FORMATS } from '@/types/library';
import { FORMAT_META, todayStr } from './formatMeta';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  /** Preselect this book; the dialog then only asks for format(s) and date */
  presetBook?: Book | null;
  /** Format to preselect instead of physical */
  presetFormat?: LibraryFormat | null;
}>();

const SEARCH_OPTIONS: { value: LibrarySearchField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'isbn', label: 'ISBN' },
];

const libraryStore = useLibraryStore();
const userBooksStore = useUserBooksStore();

// Books already on one of the user's shelves come first, keeping the search's
// own relevance order within each group
const shelfStatus = (isbn: string) => userBooksStore.getUserBookStatus(isbn);
const sortedResults = computed(() => [
  ...results.value.filter((b) => shelfStatus(b.isbn)),
  ...results.value.filter((b) => !shelfStatus(b.isbn)),
]);

const searchBy = ref<LibrarySearchField>('title');
const query = ref('');
const results = ref<Book[]>([]);
const searching = ref(false);
const selectedIsbn = ref<string | null>(null);
const formats = ref<LibraryFormat[]>(['physical']);
const dateAdded = ref(todayStr());
const adding = ref(false);
const errorMessage = ref<string | null>(null);

const selectedBook = computed(
  () => results.value.find((b) => b.isbn === selectedIsbn.value) ?? null
);
const canAdd = computed(
  () => !!selectedBook.value && formats.value.length > 0 && !!dateAdded.value && !adding.value
);

// Start fresh each time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  // Shelf statuses are needed to rank and label the results
  if (!userBooksStore.userBooks.length) {
    userBooksStore.fetchUserBooks().catch((err) => console.error('Failed to load shelves:', err));
  }
  searchBy.value = 'title';
  query.value = '';
  results.value = props.presetBook ? [props.presetBook] : [];
  selectedIsbn.value = props.presetBook?.isbn ?? null;
  formats.value = [props.presetFormat ?? 'physical'];
  dateAdded.value = todayStr();
  errorMessage.value = null;
});

// Uses the same book lookup as the header search. An author search returns
// author names, so we load the best-matching author's books.
const runSearch = debounce(async (term: string, field: LibrarySearchField) => {
  if (term.trim().length < 3) {
    results.value = [];
    searching.value = false;
    return;
  }
  try {
    if (field === 'author') {
      const authors = await bookApiService.searchQuery(term, 'author');
      const top = authors[0];
      const details = top && 'name' in top ? await bookApiService.getAuthorDetails(top.name) : null;
      results.value = details?.books ?? [];
    } else {
      const found = await bookApiService.searchQuery(term, field);
      results.value = found.filter((r): r is Book => !('type' in r && r.type === 'author'));
    }
  } finally {
    searching.value = false;
  }
}, 400);

watch([query, searchBy], ([term, field]) => {
  if (props.presetBook) return;
  selectedIsbn.value = null;
  searching.value = term.trim().length >= 3;
  runSearch(term, field);
});

const selectBook = (book: Book) => {
  if (libraryStore.ownedIsbns.has(book.isbn)) return;
  selectedIsbn.value = book.isbn;
};

const toggleFormat = (format: LibraryFormat) => {
  formats.value = formats.value.includes(format)
    ? formats.value.filter((f) => f !== format)
    : [...formats.value, format];
};

const handleAdd = async () => {
  if (!canAdd.value || !selectedBook.value) return;
  adding.value = true;
  errorMessage.value = null;
  try {
    await libraryStore.addEntry(selectedBook.value, formats.value, dateAdded.value);
    toast({
      title: 'Added to library',
      description: `${selectedBook.value.title} is now in your library.`,
      variant: 'success',
      duration: 2000,
    });
    open.value = false;
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Failed to add the book. Please try again.';
  } finally {
    adding.value = false;
  }
};
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        aria-modal="true"
        class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border border-gr-line bg-gr-surface font-body text-base leading-[1.4] text-gr-text shadow-gr-modal focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      >
        <div class="flex shrink-0 items-center justify-between gap-4 px-6 pb-2 pt-5">
          <DialogTitle class="font-heading text-[28px] font-medium leading-tight">
            Add to library
          </DialogTitle>
          <DialogClose class="gr-icon-btn -mr-2" aria-label="Close">
            <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg" />
          </DialogClose>
        </div>
        <DialogDescription class="sr-only">
          Search for a book, choose its format and add it to your library.
        </DialogDescription>

        <form
          id="add-to-library"
          class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-3"
          @submit.prevent="handleAdd"
        >
          <!-- Find a book -->
          <div>
            <p id="find-book-label" class="mb-2 text-[15px] font-semibold">
              {{ presetBook ? 'Book' : 'Find a book' }}
            </p>
            <div v-if="!presetBook" class="flex gap-2">
              <div class="w-[118px] shrink-0">
                <ThemedSelect v-model="searchBy" :options="SEARCH_OPTIONS" label="Search by" />
              </div>
              <div class="relative min-w-0 flex-1">
                <font-awesome-icon
                  icon="fa-solid fa-magnifying-glass"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
                />
                <input
                  v-model="query"
                  type="search"
                  class="gr-input pl-10"
                  :placeholder="`Search by ${searchBy === 'isbn' ? 'ISBN' : searchBy}`"
                  aria-labelledby="find-book-label"
                />
              </div>
            </div>

            <p v-if="searching" class="mt-3 text-sm text-gr-muted" role="status">Searching…</p>
            <p
              v-else-if="query.trim().length >= 3 && !results.length"
              class="mt-3 text-sm text-gr-muted"
              role="status"
            >
              No books found.
            </p>
            <ul
              v-else-if="results.length"
              role="listbox"
              aria-label="Search results"
              class="mt-3 max-h-[320px] space-y-2 overflow-y-auto p-0.5"
            >
              <li
                v-for="book in sortedResults"
                :key="book.isbn"
                role="option"
                :aria-selected="selectedIsbn === book.isbn"
                :aria-disabled="libraryStore.ownedIsbns.has(book.isbn) || undefined"
                :tabindex="libraryStore.ownedIsbns.has(book.isbn) ? -1 : 0"
                class="flex items-center gap-3 rounded-xl border p-2.5 pr-3.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent"
                :class="
                  libraryStore.ownedIsbns.has(book.isbn)
                    ? 'cursor-not-allowed border-dashed border-gr-line opacity-60'
                    : selectedIsbn === book.isbn
                      ? 'cursor-pointer border-gr-accent shadow-[inset_0_0_0_1px_var(--gr-accent)]'
                      : 'cursor-pointer border-gr-line hover:bg-gr-surface-2'
                "
                @click="selectBook(book)"
                @keydown.enter.prevent="selectBook(book)"
                @keydown.space.prevent="selectBook(book)"
              >
                <img
                  v-if="book.image"
                  :src="book.image"
                  alt=""
                  class="h-[60px] w-10 shrink-0 rounded object-cover shadow-gr-card"
                />
                <span
                  v-else
                  class="flex h-[60px] w-10 shrink-0 items-center justify-center rounded bg-gr-surface-2 text-gr-muted"
                >
                  <font-awesome-icon icon="fa-solid fa-book" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-start gap-2">
                    <span class="min-w-0 text-[15px] font-[650] leading-snug">
                      <BookTitle :title="book.title" compact title-class="line-clamp-2" />
                    </span>
                    <span
                      v-if="shelfStatus(book.isbn)"
                      class="mt-px shrink-0 whitespace-nowrap rounded-full bg-gr-surface-2 px-2 py-0.5 text-xs font-semibold"
                      :class="SHELF_STATUS_META[shelfStatus(book.isbn) as keyof typeof SHELF_STATUS_META].textClass"
                    >
                      {{ STATUS_DISPLAY_NAMES[shelfStatus(book.isbn)] }}
                    </span>
                  </span>
                  <span class="block truncate text-sm text-gr-muted">{{ formatAuthors(book.authors) }}</span>
                </span>
                <span
                  v-if="libraryStore.ownedIsbns.has(book.isbn)"
                  class="shrink-0 text-[13px] text-gr-muted"
                >
                  Already in library
                </span>
                <span
                  v-else
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  :class="
                    selectedIsbn === book.isbn
                      ? 'bg-gr-accent text-gr-accent-ink'
                      : 'border-2 border-gr-muted'
                  "
                  aria-hidden="true"
                >
                  <font-awesome-icon
                    v-if="selectedIsbn === book.isbn"
                    icon="fa-solid fa-check"
                    class="text-[10px]"
                  />
                </span>
              </li>
            </ul>
          </div>

          <!-- Format -->
          <div>
            <p id="format-label" class="mb-2 text-[15px] font-semibold">Format</p>
            <div
              role="group"
              aria-labelledby="format-label"
              class="grid grid-cols-2 gap-1 rounded-xl border border-gr-line bg-gr-bg p-1"
            >
              <button
                v-for="f in LIBRARY_FORMATS"
                :key="f"
                type="button"
                class="gr-btn"
                :class="formats.includes(f) ? 'gr-btn-primary' : 'text-gr-muted hover:text-gr-text'"
                :aria-pressed="formats.includes(f)"
                @click="toggleFormat(f)"
              >
                <font-awesome-icon :icon="FORMAT_META[f].icon" />
                {{ FORMAT_META[f].label }}
              </button>
            </div>
            <p v-if="!formats.length" class="mt-2 text-[13px] text-gr-muted">
              Choose at least one format.
            </p>
          </div>

          <!-- Date added -->
          <div class="grid gap-2">
            <label for="library-date-added" class="text-[15px] font-semibold">
              Date added <span class="font-normal text-gr-muted">(defaults to today)</span>
            </label>
            <input
              id="library-date-added"
              v-model="dateAdded"
              type="date"
              :max="todayStr()"
              required
              class="gr-input dark:[color-scheme:dark]"
            />
          </div>

          <p v-if="errorMessage" role="alert" class="text-sm text-gr-danger-text">
            {{ errorMessage }}
          </p>
        </form>

        <div class="flex shrink-0 justify-end gap-2 border-t border-gr-line px-6 py-4">
          <DialogClose class="gr-btn gr-btn-outline">Cancel</DialogClose>
          <button
            type="submit"
            form="add-to-library"
            class="gr-btn gr-btn-primary"
            :disabled="!canAdd"
          >
            {{ adding ? 'Adding…' : 'Add to library' }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
