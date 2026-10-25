<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { supabase } from '@/supabase/supabase';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import ListPagination from '@/components/layout/ListPagination.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import BookLink from '@/components/partials/BookLink.vue';
import UserRating from '@/components/user-books/UserRating.vue';
import { toast } from '@/components/ui/toast';
import { authorMatches, formatAuthors } from '@/utils/book-display';
import type { UserBook } from '@/types/book';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const ALL_GENRES = 'all';
const search = ref('');
const filterGenre = ref(ALL_GENRES);
const filterSort = ref('date');
const bookReadingTime = ref<Record<string, number>>({});

const PAGE_SIZE = 20;
const currentPage = ref(1);
const listTop = ref<HTMLElement | null>(null);

const SORT_OPTIONS = [
  { value: 'date', label: 'Date finished' },
  { value: 'rating', label: 'Rating' },
  { value: 'pages', label: 'Pages' },
  { value: 'title', label: 'Title A to Z' },
];

onMounted(async () => {
  const userId = authStore.user?.id;
  if (!userId) return;

  const { data } = await supabase
    .from('reading_progress')
    .select('book_isbn, time_reading_in_session_mins')
    .eq('user_id', userId);

  if (data) {
    const timeMap: Record<string, number> = {};
    for (const row of data) {
      if (row.book_isbn) {
        timeMap[row.book_isbn] = (timeMap[row.book_isbn] ?? 0) + (row.time_reading_in_session_mins || 0);
      }
    }
    bookReadingTime.value = timeMap;
  }
});

// Reset to page 1 when filters change
watch([search, filterGenre, filterSort], () => { currentPage.value = 1; });

const readBooks = computed(() => userBooksStore.groupedBooks['read']);

const availableGenres = computed(() => {
  const genres = new Set<string>();
  for (const book of readBooks.value) {
    for (const g of book.genres ?? []) genres.add(g);
  }
  return [...genres].sort();
});

const genreOptions = computed(() => [
  { value: ALL_GENRES, label: 'All genres' },
  ...availableGenres.value.map((g) => ({ value: g, label: g })),
]);

const filteredBooks = computed(() => {
  const term = search.value.trim().toLowerCase();
  let books = readBooks.value.filter(
    (b) =>
      (filterGenre.value === ALL_GENRES || (b.genres ?? []).includes(filterGenre.value)) &&
      (!term ||
        b.title.toLowerCase().includes(term) ||
        authorMatches(b.authors, term))
  );

  if (filterSort.value === 'rating') {
    books.sort((a, b) => (b.user_rating ?? 0) - (a.user_rating ?? 0));
  } else if (filterSort.value === 'pages') {
    books.sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0));
  } else if (filterSort.value === 'title') {
    books.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    books.sort((a, b) => {
      const da = a.date_finished ? new Date(a.date_finished).getTime() : 0;
      const db = b.date_finished ? new Date(b.date_finished).getTime() : 0;
      return db - da;
    });
  }
  return books;
});

const pageCount = computed(() => Math.ceil(filteredBooks.value.length / PAGE_SIZE));

const pagedBooks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredBooks.value.slice(start, start + PAGE_SIZE);
});

// ── Month groups ──────────────────────────────────────────────────────────
const isGrouped = computed(() => filterSort.value === 'date');

const monthKey = (book: UserBook) => {
  if (!book.date_finished) return 'unknown';
  const d = new Date(book.date_finished);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const monthLabel = (book: UserBook) =>
  book.date_finished
    ? new Date(book.date_finished).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'Date unknown';

// Totals cover every matching book in the month, not just this page
const monthTotals = computed(() => {
  const totals: Record<string, { books: number; pages: number }> = {};
  for (const book of filteredBooks.value) {
    const t = (totals[monthKey(book)] ??= { books: 0, pages: 0 });
    t.books++;
    t.pages += book.pages ?? 0;
  }
  return totals;
});

const groups = computed(() => {
  if (!isGrouped.value) return [{ key: 'all', label: '', summary: '', books: pagedBooks.value }];
  const result: { key: string; label: string; summary: string; books: UserBook[] }[] = [];
  for (const book of pagedBooks.value) {
    const key = monthKey(book);
    let group = result.find((g) => g.key === key);
    if (!group) {
      const t = monthTotals.value[key];
      group = {
        key,
        label: monthLabel(book),
        summary: `${t.books} ${t.books === 1 ? 'book' : 'books'} · ${t.pages.toLocaleString()} pages`,
        books: [],
      };
      result.push(group);
    }
    group.books.push(book);
  }
  return result;
});

// ── Row text ──────────────────────────────────────────────────────────────
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

function formatReadingTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const bylineFor = (book: UserBook) =>
  [formatAuthors(book.authors), book.genres?.[0]].filter(Boolean).join(' · ');

const pagesLabel = (book: UserBook) =>
  book.pages ? `${book.pages.toLocaleString()} pages` : '';

const timeLabel = (book: UserBook) =>
  bookReadingTime.value[book.isbn] ? formatReadingTime(bookReadingTime.value[book.isbn]) : '';

const finishedMonth = (book: UserBook) => {
  if (!book.date_finished) return '';
  const d = new Date(book.date_finished);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// Mobile meta line, e.g. "Oct 2026 · 496 pages · 8h 42m"
const mobileMeta = (book: UserBook) =>
  [!isGrouped.value && finishedMonth(book), pagesLabel(book), timeLabel(book)]
    .filter(Boolean)
    .join(' · ');

async function handleRatingChange(book: UserBook, rating: number | null) {
  try {
    await userBooksStore.updateBookRating(book.isbn, rating);
  } catch (error) {
    toast({
      title: 'Error Updating Rating',
      description: `There was an error updating your rating for ${book.title}: ${error}.`,
      variant: 'destructive',
      duration: 4000,
    });
  }
}

// ── Pagination ────────────────────────────────────────────────────────────
const scrollToList = () =>
  listTop.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
</script>

<template>
  <div>
    <!-- Filter bar -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <div class="relative basis-full md:min-w-[260px] md:flex-1 md:basis-auto">
        <font-awesome-icon
          icon="fa-solid fa-magnifying-glass"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
        />
        <input
          v-model="search"
          type="search"
          class="gr-input bg-gr-surface pl-10"
          placeholder="Search books read"
          aria-label="Search books read"
        />
      </div>
      <div class="min-w-0 flex-1 md:w-[200px] md:flex-none">
        <ThemedSelect v-model="filterGenre" :options="genreOptions" label="Genre" />
      </div>
      <div class="min-w-0 flex-1 md:w-[200px] md:flex-none">
        <ThemedSelect v-model="filterSort" :options="SORT_OPTIONS" label="Sort by" />
      </div>
      <span class="basis-full text-right text-sm text-gr-muted md:ml-auto md:basis-auto">
        {{ filteredBooks.length }} {{ filteredBooks.length === 1 ? 'book' : 'books' }}
      </span>
    </div>

    <!-- Empty states -->
    <p v-if="readBooks.length === 0" class="gr-empty">
      No books marked as read yet.
    </p>
    <p v-else-if="!filteredBooks.length" class="gr-empty">
      No books read match your search.
    </p>

    <template v-else>
      <div ref="listTop" class="scroll-mt-6 space-y-7">
        <section v-for="group in groups" :key="group.key">
          <div v-if="isGrouped" class="mb-2.5 flex items-baseline justify-between gap-4">
            <h2 class="font-heading text-[22px] font-medium leading-tight">
              {{ group.label }}
            </h2>
            <span class="shrink-0 text-sm text-gr-muted">{{ group.summary }}</span>
          </div>

          <ul class="overflow-hidden rounded-2xl border border-gr-line bg-gr-surface shadow-gr-card">
            <li
              v-for="book in group.books"
              :key="book.isbn"
              class="border-t border-gr-line first:border-t-0"
            >
              <!-- The title link stretches over the whole row; the rating sits above it -->
              <div
                class="relative flex items-start gap-3.5 py-3.5 pl-3.5 pr-4 transition-colors hover:bg-gr-surface-2 has-[a:focus-visible]:bg-gr-surface-2 md:items-center md:gap-4 md:pl-4 md:pr-5"
              >
                <!-- Cover -->
                <img
                  v-if="book.image"
                  :src="book.image"
                  alt=""
                  class="h-[66px] w-11 shrink-0 rounded object-cover shadow-gr-card"
                  @error="book.image = ''"
                />
                <span
                  v-else
                  class="flex h-[66px] w-11 shrink-0 items-center justify-center rounded bg-gr-surface-2 text-gr-muted"
                  aria-hidden="true"
                >
                  <font-awesome-icon icon="fa-solid fa-book" />
                </span>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <p class="text-[15px] font-[650] leading-snug md:text-base">
                    <BookLink
                      :isbn="book.isbn"
                      class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      <BookTitle :title="book.title" compact />
                    </BookLink>
                  </p>
                  <p v-if="bylineFor(book)" class="truncate text-sm text-gr-muted">
                    {{ bylineFor(book) }}
                  </p>
                  <UserRating
                    :model-value="book.user_rating ?? null"
                    class="relative z-10 mt-1 w-fit text-[15px]"
                    @update:model-value="(rating) => handleRatingChange(book, rating)"
                  />
                  <p v-if="mobileMeta(book)" class="mt-1 text-[13px] text-gr-muted md:hidden">
                    {{ mobileMeta(book) }}
                  </p>
                  <p
                    v-if="!isGrouped && finishedMonth(book)"
                    class="mt-1 hidden text-[13px] text-gr-muted md:block"
                  >
                    Finished {{ finishedMonth(book) }}
                  </p>
                </div>

                <!-- Pages / time -->
                <div class="hidden shrink-0 text-right md:block">
                  <p class="text-[15px] font-[650]">{{ pagesLabel(book) || '—' }}</p>
                  <p v-if="timeLabel(book)" class="whitespace-nowrap text-[13px] text-gr-muted">
                    {{ timeLabel(book) }} read
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <ListPagination
        v-model:page="currentPage"
        :page-count="pageCount"
        @navigate="scrollToList"
      />
    </template>
  </div>
</template>
