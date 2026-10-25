<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
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
import { createManualBookId, formatAuthors, normaliseIsbn } from '@/utils/book-display';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { toast } from '@/components/ui/toast';
import type { Book, BookBasicInfo } from '@/types/book';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import { SHELF_STATUS_META } from '@/components/user-books/shelfStatusMeta';
import type { LibraryFormat, LibrarySearchField } from '@/types/library';
import { LIBRARY_FORMATS } from '@/types/library';
import {
  FORMAT_META,
  NO_SHELF_OPTION,
  READ_SHELF_OPTION,
  SHELF_OPTIONS,
  todayStr,
  type ShelfChoice,
} from './formatMeta';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  /** Preselect this book; the dialog then only asks for format(s) and date */
  presetBook?: Book | null;
  /** Format to preselect instead of physical */
  presetFormat?: LibraryFormat | null;
}>();

const emit = defineEmits<{
  (e: 'added', isbn: string): void;
}>();

const SEARCH_OPTIONS: { value: LibrarySearchField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'isbn', label: 'ISBN' },
];

const libraryStore = useLibraryStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();

// Find the book through the API, or type its details in by hand
type AddMode = 'search' | 'manual';
const mode = ref<AddMode>('search');

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

// Manual entry, laid out like the Edit book dialog
const manualTitle = ref('');
// One field per author, as in the Edit book dialog
const manualAuthors = ref<string[]>(['']);
const manualIsbn = ref('');
const manualPublisher = ref('');
const manualCover = ref('');
const coverFailed = ref(false);
const markRead = ref(false);
const finishedOn = ref(todayStr());
const shelf = ref<ShelfChoice>('none');

// Ticking "Mark as read" locks the picker to Read
const shelfOptions = computed(() =>
  markRead.value ? [READ_SHELF_OPTION] : [NO_SHELF_OPTION, ...SHELF_OPTIONS]
);
const shelfValue = computed<ShelfChoice>({
  get: () => (markRead.value ? 'read' : shelf.value),
  set: (value) => {
    if (value !== 'read') shelf.value = value;
  },
});
const authorInputs = ref<HTMLInputElement[]>([]);

const isbnInvalid = computed(() => !!manualIsbn.value.trim() && !normaliseIsbn(manualIsbn.value));
const isbnOwned = computed(() => {
  const isbn = normaliseIsbn(manualIsbn.value);
  return !!isbn && libraryStore.ownedIsbns.has(isbn);
});
const coverUrl = computed(() => {
  const value = manualCover.value.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
});
watch(manualCover, () => (coverFailed.value = false));

const selectedBook = computed(
  () => results.value.find((b) => b.isbn === selectedIsbn.value) ?? null
);
const manualReady = computed(
  () =>
    !!manualTitle.value.trim() &&
    !isbnInvalid.value &&
    !isbnOwned.value &&
    coverUrl.value !== null &&
    (!markRead.value || !!finishedOn.value)
);
const canAdd = computed(
  () =>
    (mode.value === 'manual' ? manualReady.value : !!selectedBook.value) &&
    formats.value.length > 0 &&
    !!dateAdded.value &&
    !adding.value
);

// Start fresh each time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  // Shelf statuses are needed to rank and label the results
  if (!userBooksStore.userBooks.length) {
    userBooksStore.fetchUserBooks().catch((err) => console.error('Failed to load shelves:', err));
  }
  mode.value = 'search';
  manualTitle.value = '';
  manualAuthors.value = [''];
  manualIsbn.value = '';
  manualPublisher.value = '';
  manualCover.value = '';
  markRead.value = false;
  finishedOn.value = todayStr();
  shelf.value = 'none';
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

// From a search that found nothing useful: carry the search term across
const enterManually = () => {
  const term = query.value.trim();
  if (searchBy.value === 'title' && !manualTitle.value) manualTitle.value = term;
  if (searchBy.value === 'author' && !manualAuthors.value.some(Boolean)) manualAuthors.value = [term];
  if (searchBy.value === 'isbn' && !manualIsbn.value) manualIsbn.value = term;
  mode.value = 'manual';
};

const addAuthor = async () => {
  manualAuthors.value = [...manualAuthors.value, ''];
  await nextTick();
  authorInputs.value[manualAuthors.value.length - 1]?.focus();
};

const removeAuthor = (index: number) => {
  manualAuthors.value = manualAuthors.value.filter((_, i) => i !== index);
  if (!manualAuthors.value.length) manualAuthors.value = [''];
};

// Without an ISBN the book gets a generated id in its place
const buildManualBook = (): BookBasicInfo => ({
  isbn: normaliseIsbn(manualIsbn.value) ?? createManualBookId(),
  title: manualTitle.value.trim(),
  authors: manualAuthors.value.map((a) => a.trim()).filter(Boolean),
  image: coverUrl.value && !coverFailed.value ? coverUrl.value : '',
  publisher: manualPublisher.value.trim() || undefined,
});

const handleAdd = async () => {
  if (!canAdd.value) return;
  const book = mode.value === 'manual' ? buildManualBook() : selectedBook.value;
  if (!book) return;
  adding.value = true;
  errorMessage.value = null;
  try {
    await libraryStore.addEntry(book, formats.value, dateAdded.value);
    if (mode.value === 'manual' && markRead.value) {
      await userBooksStore.markAsRead(book, finishedOn.value);
      analyticsStore.invalidate();
    } else if (mode.value === 'manual' && shelf.value !== 'none') {
      await userBooksStore.updateBookStatus(book, shelf.value);
      analyticsStore.invalidate();
    }
    emit('added', book.isbn);
    toast({
      title: 'Added to library',
      description: `${book.title} is now in your library.`,
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
          Search for a book or enter its details, choose its format and add it to your library.
        </DialogDescription>

        <form
          id="add-to-library"
          class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-3"
          @submit.prevent="handleAdd"
        >
          <!-- Search or enter by hand -->
          <div
            v-if="!presetBook"
            role="group"
            aria-label="How to add the book"
            class="grid grid-cols-2 gap-1 rounded-xl border border-gr-line bg-gr-bg p-1"
          >
            <button
              v-for="m in (['search', 'manual'] as const)"
              :key="m"
              type="button"
              class="gr-btn"
              :class="mode === m ? 'gr-btn-primary' : 'text-gr-muted hover:text-gr-text'"
              :aria-pressed="mode === m"
              @click="mode = m"
            >
              <font-awesome-icon
                :icon="m === 'search' ? 'fa-solid fa-magnifying-glass' : 'fa-regular fa-pen-to-square'"
              />
              {{ m === 'search' ? 'Search' : 'Enter manually' }}
            </button>
          </div>

          <!-- Find a book -->
          <div v-if="mode === 'search'">
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
            <p v-if="query.trim().length >= 3 && !searching && !presetBook" class="mt-3 text-sm text-gr-muted">
              Can't find it?
              <button
                type="button"
                class="font-semibold text-gr-accent hover:underline"
                @click="enterManually"
              >
                Enter it manually
              </button>
            </p>
          </div>

          <template v-else>
            <!-- Cover -->
            <div class="grid gap-2">
              <label for="manual-cover" class="text-[15px] font-semibold">
                Cover image link <span class="font-normal text-gr-muted">(optional)</span>
              </label>
              <div class="flex items-start gap-3">
                <img
                  v-if="coverUrl && !coverFailed"
                  :src="coverUrl"
                  alt=""
                  class="h-[60px] w-10 shrink-0 rounded object-cover shadow-gr-card"
                  @error="coverFailed = true"
                />
                <span
                  v-else
                  class="flex h-[60px] w-10 shrink-0 items-center justify-center rounded bg-gr-surface-2 text-gr-muted"
                >
                  <font-awesome-icon icon="fa-solid fa-book" />
                </span>
                <div class="grid min-w-0 flex-1 gap-2">
                  <input
                    id="manual-cover"
                    v-model="manualCover"
                    type="url"
                    inputmode="url"
                    class="gr-input"
                    placeholder="https://…"
                    :aria-invalid="coverUrl === null"
                  />
                  <p v-if="coverUrl === null" class="text-[13px] text-gr-danger-text">
                    Enter a link starting with http:// or https://
                  </p>
                  <p v-else-if="coverFailed" class="text-[13px] text-gr-muted">
                    That image couldn't be loaded, so the book will be added without a cover.
                  </p>
                </div>
              </div>
            </div>

            <!-- Title -->
            <div class="grid gap-2">
              <label for="manual-title" class="text-[15px] font-semibold">Title</label>
              <input
                id="manual-title"
                v-model="manualTitle"
                type="text"
                required
                class="gr-input"
              />
            </div>

            <!-- Authors -->
            <fieldset class="grid gap-2">
              <legend class="mb-2 text-[15px] font-semibold">
                Author(s) <span class="font-normal text-gr-muted">(optional)</span>
              </legend>
              <div v-for="(_, i) in manualAuthors" :key="i" class="flex gap-2">
                <input
                  :ref="(el) => { if (el) authorInputs[i] = el as HTMLInputElement }"
                  v-model="manualAuthors[i]"
                  type="text"
                  class="gr-input"
                  :aria-label="`Author ${i + 1}`"
                  placeholder="Author name"
                />
                <button
                  v-if="manualAuthors.length > 1 || manualAuthors[0]"
                  type="button"
                  class="gr-icon-btn hover:!text-gr-danger-text"
                  :aria-label="`Remove author ${i + 1}`"
                  @click="removeAuthor(i)"
                >
                  <font-awesome-icon icon="fa-solid fa-xmark" />
                </button>
              </div>
              <button
                type="button"
                class="inline-flex h-11 w-fit items-center gap-2 rounded-[10px] px-1 !text-sm font-semibold text-gr-accent hover:underline"
                @click="addAuthor"
              >
                <font-awesome-icon icon="fa-solid fa-plus" />
                Add another author
              </button>
            </fieldset>

            <!-- Publisher -->
            <div class="grid gap-2">
              <label for="manual-publisher" class="text-[15px] font-semibold">
                Publisher <span class="font-normal text-gr-muted">(optional)</span>
              </label>
              <input id="manual-publisher" v-model="manualPublisher" type="text" class="gr-input" />
            </div>

            <!-- ISBN -->
            <div class="grid gap-2">
              <label for="manual-isbn" class="text-[15px] font-semibold">
                ISBN <span class="font-normal text-gr-muted">(optional)</span>
              </label>
              <input
                id="manual-isbn"
                v-model="manualIsbn"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                class="gr-input"
                placeholder="10 or 13 digits"
                :aria-invalid="isbnInvalid || isbnOwned"
              />
              <p v-if="isbnInvalid" class="text-[13px] text-gr-danger-text">
                An ISBN is 10 or 13 digits (the last of a 10-digit ISBN can be X).
              </p>
              <p v-else-if="isbnOwned" class="text-[13px] text-gr-danger-text">
                A book with this ISBN is already in your library.
              </p>
            </div>
          </template>

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

          <!-- Reading status (manual entry only, as in the Edit book dialog) -->
          <div v-if="mode === 'manual'" class="grid gap-2">
            <p class="text-[15px] font-semibold">Reading</p>
            <ThemedSelect
              v-model="shelfValue"
              :options="shelfOptions"
              label="Shelf"
              :disabled="markRead"
            />
            <label
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gr-line bg-gr-bg px-3.5"
            >
              <input v-model="markRead" type="checkbox" class="h-5 w-5 shrink-0 accent-gr-accent" />
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">Mark as read</span>
                <span class="block text-[13px] text-gr-muted">Adds it to your Read shelf</span>
              </span>
            </label>
            <div v-if="markRead" class="grid gap-2">
              <label for="manual-finished" class="text-[15px] font-semibold">
                Date finished
                <span class="font-normal text-gr-muted">(counts as read in this month)</span>
              </label>
              <input
                id="manual-finished"
                v-model="finishedOn"
                type="date"
                :max="todayStr()"
                required
                class="gr-input dark:[color-scheme:dark]"
              />
            </div>
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
