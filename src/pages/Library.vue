<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import ListPagination from '@/components/layout/ListPagination.vue';
import { useQueryPagination } from '@/composables/useQueryPagination';
import LibraryBookCard from '@/components/library/LibraryBookCard.vue';
import AddToLibraryDialog from '@/components/library/AddToLibraryDialog.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { queryLibrary } from '@/services/libraryService';
import {
  LIBRARY_FORMATS,
  type LibraryFormat,
  type LibrarySearchField,
  type LibrarySort,
} from '@/types/library';
import { STATUS_DISPLAY_NAMES, type BookStatus } from '@/types/book';

const libraryStore = useLibraryStore();
const userBooksStore = useUserBooksStore();

type FormatFilter = LibraryFormat | 'all';
const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'physical', label: 'Physical' },
  { value: 'digital', label: 'Digital' },
];
const SEARCH_OPTIONS: { value: LibrarySearchField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'isbn', label: 'ISBN' },
];
const SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: 'added', label: 'Recently added' },
  { value: 'title', label: 'Title A to Z' },
  { value: 'author', label: 'Author A to Z' },
];

const format = ref<FormatFilter>('all');
const searchBy = ref<LibrarySearchField>('title');
const search = ref('');
const sort = ref<LibrarySort>('added');

// Shelf status filter ('none' = owned but not on any shelf; Radix Select can't use '')
type StatusFilter = 'all' | 'none' | Exclude<BookStatus, ''>;
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'want-to-read', label: STATUS_DISPLAY_NAMES['want-to-read'] },
  { value: 'currently-reading', label: STATUS_DISPLAY_NAMES['currently-reading'] },
  { value: 'read', label: STATUS_DISPLAY_NAMES.read },
  { value: 'did-not-finish', label: STATUS_DISPLAY_NAMES['did-not-finish'] },
  { value: 'none', label: 'Not on a shelf' },
];
const statusFilter = ref<StatusFilter>('all');

// Books per shelf across the whole library, like the format counts
const statusOptions = computed(() => {
  const counts: Partial<Record<StatusFilter, number>> = {};
  for (const entry of libraryStore.entries) {
    const status = userBooksStore.getUserBookStatus(entry.isbn) || 'none';
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return STATUS_OPTIONS.map((option) =>
    option.value === 'all' ? option : { ...option, count: counts[option.value] ?? 0 }
  );
});
const addOpen = ref(false);
const addFormat = ref<LibraryFormat | null>(null);

const openAdd = (preset: LibraryFormat | null = null) => {
  addFormat.value = preset;
  addOpen.value = true;
};

// Links from My Books: ?format=digital filters the list, ?add=digital opens the
// add dialog with that format preselected (a bare ?add opens it as normal)
const route = useRoute();
const router = useRouter();
const asFormat = (value: unknown): LibraryFormat | null =>
  LIBRARY_FORMATS.find((f) => f === value) ?? null;

const queryFormat = asFormat(route.query.format);
if (queryFormat) format.value = queryFormat;
if ('add' in route.query) {
  openAdd(asFormat(route.query.add));
  // Drop it so a refresh or Back doesn't reopen the dialog
  const { add: _add, ...rest } = route.query;
  router.replace({ query: rest });
}

const visibleEntries = computed(() =>
  queryLibrary(libraryStore.entries, {
    search: search.value,
    searchBy: searchBy.value,
    format: format.value,
    sort: sort.value,
  }).filter((entry) => {
    if (statusFilter.value === 'all') return true;
    const status = userBooksStore.getUserBookStatus(entry.isbn);
    return statusFilter.value === 'none' ? !status : status === statusFilter.value;
  })
);

const {
  currentPage,
  pageCount,
  pagedItems: pagedEntries,
} = useQueryPagination(visibleEntries, {
  pageSize: 20,
  resetOn: [format, searchBy, search, sort, statusFilter],
  ready: () => libraryStore.initialized,
});

onMounted(async () => {
  try {
    // Shelf statuses are shown on each card
    await Promise.all([
      libraryStore.initialize(),
      userBooksStore.initialized ? null : userBooksStore.initialize(),
    ]);
  } catch (error) {
    console.error('Failed to load library:', error);
  }
});
</script>

<template>
  <PageLayout
    title="Library"
    subtitle="The books you own, in print and on screen"
    back-to="/my-books"
    back-label="My Books"
  >
    <template #actions>
      <button type="button" class="gr-btn gr-btn-primary" @click="openAdd()">
        <font-awesome-icon icon="fa-solid fa-plus" />
        Add book
      </button>
    </template>

    <div>
      <!-- Filter, search and sort -->
      <div class="-mt-4 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter by format"
          class="flex basis-full gap-2 overflow-x-auto md:basis-auto"
        >
          <button
            v-for="f in FORMAT_FILTERS"
            :key="f.value"
            type="button"
            :aria-pressed="format === f.value"
            class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 !text-[15px] font-semibold transition-colors"
            :class="
              format === f.value
                ? 'bg-gr-accent-soft text-gr-accent'
                : 'text-gr-muted hover:bg-gr-surface-2 hover:text-gr-text'
            "
            @click="format = f.value"
          >
            {{ f.label }}
            <span class="font-normal">{{ libraryStore.counts[f.value] }}</span>
          </button>
        </div>

        <div class="flex min-w-0 flex-1 basis-full gap-2 md:basis-[360px]">
          <div class="w-[118px] shrink-0">
            <ThemedSelect v-model="searchBy" :options="SEARCH_OPTIONS" label="Search library by" />
          </div>
          <div class="relative min-w-0 flex-1">
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass"
              class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
            />
            <input
              v-model="search"
              type="search"
              class="gr-input bg-gr-surface pl-10"
              placeholder="Search your library"
              aria-label="Search your library"
            />
          </div>
        </div>

        <!-- Status and sort share a line on mobile -->
        <div class="flex basis-full gap-2 md:basis-auto">
          <div class="min-w-0 flex-1 md:w-[180px] md:flex-none">
            <ThemedSelect v-model="statusFilter" :options="statusOptions" label="Filter by shelf" />
          </div>
          <div class="min-w-0 flex-1 md:w-[180px] md:flex-none">
            <ThemedSelect v-model="sort" :options="SORT_OPTIONS" label="Sort by" />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="!libraryStore.initialized && libraryStore.loading"
        class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,480px),1fr))] gap-3"
        aria-busy="true"
      >
        <Skeleton v-for="n in 4" :key="n" class="h-[142px] rounded-2xl bg-gr-surface-2" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="libraryStore.error && !libraryStore.entries.length"
        role="alert"
        class="gr-card mt-6 p-4 text-center text-gr-danger-text"
      >
        {{ libraryStore.error }}
      </div>

      <!-- Empty library -->
      <div v-else-if="!libraryStore.entries.length" class="gr-empty mt-6">
        <p>Your library is empty. Add the books you own, in print or on screen.</p>
        <button type="button" class="gr-btn gr-btn-primary mt-4" @click="openAdd()">
          <font-awesome-icon icon="fa-solid fa-plus" />
          Add book
        </button>
      </div>

      <!-- No matches -->
      <p v-else-if="!visibleEntries.length" class="gr-empty mt-6">
        No books in your library match your filters.
      </p>

      <template v-else>
        <ul
          class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,480px),1fr))] gap-3"
        >
          <li v-for="entry in pagedEntries" :key="entry.id">
            <LibraryBookCard :entry="entry" class="h-full" />
          </li>
        </ul>
        <!-- The router's scrollBehavior handles scrolling: top on a click, saved position on Back -->
        <ListPagination v-model:page="currentPage" :page-count="pageCount" />
      </template>
    </div>

    <AddToLibraryDialog v-model:open="addOpen" :preset-format="addFormat" />
  </PageLayout>
</template>
