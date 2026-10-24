<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useResizeObserver } from '@vueuse/core';
import { Book as BookOutlineIcon } from 'lucide-vue-next';
import type { Author } from '@/types/author';
import type { Book } from '@/types/book';
import bookApiService, {
  DEFAULT_COVER,
  UNKNOWN_PUBLISHER,
} from '@/services/bookApiService';
import PageSection from '@/components/layout/PageSection.vue';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { extractYear } from '@/utils/book-utils';
import { bookCount } from '@/utils/book-display';

const PAGE_SIZE = 20;

const route = useRoute();
const author = ref<Author | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref('');
const currentPage = ref(1);
const allBooks = ref<Book[]>([]);
const hasMore = ref(false);
const totalBooks = ref<number | undefined>(undefined);

type BookSort = 'newest' | 'oldest' | 'title';
const SORT_OPTIONS: { value: BookSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A–Z' },
];
const search = ref('');
const sort = ref<BookSort>('newest');

// Covers that failed to load fall back to the placeholder
const failedCovers = ref(new Set<string>());

// The API fills gaps with placeholders, so treat those as missing
const toCard = (book: Book, order: number) => ({
  book,
  // Every edition gets its own card and ISBNs can repeat, so key by load order
  order,
  year: extractYear(book.date_published),
  cover:
    book.image &&
    book.image !== DEFAULT_COVER &&
    !failedCovers.value.has(book.image)
      ? book.image
      : null,
  publisher:
    book.publisher && book.publisher !== UNKNOWN_PUBLISHER
      ? book.publisher
      : null,
});

const visibleBooks = computed(() => {
  const term = search.value.trim().toLowerCase();
  const cards = allBooks.value
    .map(toCard)
    .filter(({ book }) => !term || book.title.toLowerCase().includes(term));

  if (sort.value === 'title') {
    return cards.sort((a, b) => a.book.title.localeCompare(b.book.title));
  }
  const direction = sort.value === 'newest' ? -1 : 1;
  // Undated books go last in both directions
  return cards.sort((a, b) => {
    if (a.year === b.year) return 0;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return (a.year - b.year) * direction;
  });
});

const metaLine = (year: number | null, pages?: number) =>
  [year, pages ? `${pages.toLocaleString()} pages` : null]
    .filter(Boolean)
    .join(' · ');

// Bio is clamped to 4 lines; only offer "Read full bio" when that hides text
const bioEl = ref<HTMLElement | null>(null);
const bioExpanded = ref(false);
const bioClamped = ref(false);

const measureBio = () => {
  if (bioEl.value && !bioExpanded.value) {
    bioClamped.value = bioEl.value.scrollHeight > bioEl.value.clientHeight;
  }
};
useResizeObserver(bioEl, measureBio);
watch([() => author.value?.bio, bioExpanded], measureBio, { flush: 'post' });

// Ignore responses for an author we've since navigated away from
let latestRequest = 0;

const fetchAuthorDetails = async (page: number = 1) => {
  const authorName = route.params.name as string;
  if (!authorName) {
    error.value = 'Author name not provided';
    loading.value = false;
    return;
  }

  const request = ++latestRequest;
  if (page === 1) {
    loading.value = true;
    error.value = '';
    author.value = null;
    allBooks.value = [];
  } else {
    loadingMore.value = true;
  }

  try {
    const authorDetails = await bookApiService.getAuthorDetails(
      authorName,
      page
    );
    if (request !== latestRequest) return;

    if (!authorDetails) {
      if (page === 1) error.value = 'Author not found';
      hasMore.value = false;
      return;
    }

    author.value = authorDetails;
    allBooks.value =
      page === 1 ? authorDetails.books : [...allBooks.value, ...authorDetails.books];
    totalBooks.value ??= authorDetails.total;

    // If we have a total, check if we've paged through all books. Works
    // without an ISBN are skipped, so count pages rather than books.
    if (totalBooks.value !== undefined) {
      hasMore.value =
        authorDetails.books.length > 0 && page * PAGE_SIZE < totalBooks.value;
    } else {
      // If no total is available, check if we got a full page
      hasMore.value = authorDetails.books.length === PAGE_SIZE;
    }
  } catch (e) {
    if (request !== latestRequest) return;
    error.value = 'Error fetching author details';
    console.error(e);
  } finally {
    if (request === latestRequest) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
};

const loadMore = async () => {
  if (!loadingMore.value && hasMore.value) {
    currentPage.value++;
    await fetchAuthorDetails(currentPage.value);
  }
};

// Watch for changes in route params
watch(
  () => route.params.name,
  (newName) => {
    if (newName) {
      currentPage.value = 1;
      totalBooks.value = undefined;
      hasMore.value = false;
      search.value = '';
      sort.value = 'newest';
      bioExpanded.value = false;
      fetchAuthorDetails(1);
    }
  }
);

onMounted(() => {
  fetchAuthorDetails(1);
  // Line breaks shift once the web fonts arrive
  document.fonts?.ready.then(measureBio);
});
</script>

<template>
  <div class="flex-grow bg-gr-bg font-body text-base leading-[1.4] text-gr-text">
    <!-- Loading State -->
    <div v-if="loading" aria-busy="true">
      <div class="border-b border-gr-line bg-gr-surface">
        <div class="gr-container py-14">
          <Skeleton
            class="h-[46px] w-[min(100%,420px)] rounded-lg bg-gr-surface-2 md:h-[76px]"
          />
          <div class="mt-6 max-w-[68ch] space-y-3">
            <Skeleton
              v-for="n in 4"
              :key="n"
              class="h-4 rounded bg-gr-surface-2"
              :class="n === 4 ? 'w-3/5' : 'w-full'"
            />
          </div>
        </div>
      </div>
      <div class="gr-container pb-[72px] pt-12">
        <Skeleton class="h-8 w-64 max-w-full rounded-lg bg-gr-surface-2" />
        <div
          class="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-x-6 gap-y-8"
        >
          <Skeleton
            v-for="n in 5"
            :key="n"
            class="aspect-[2/3] rounded-lg bg-gr-surface-2"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="gr-container pb-[72px] pt-12">
      <p role="alert" class="gr-card p-4 text-center text-gr-danger-text">
        {{ error }}
      </p>
    </div>

    <template v-else-if="author">
      <!-- Hero band -->
      <div class="border-b border-gr-line bg-gr-surface">
        <div class="gr-container py-14">
          <div class="flex flex-wrap gap-x-16 gap-y-10">
            <div class="min-w-0 flex-[999_1_520px]">
              <h1
                class="break-words font-heading text-[48px] font-medium leading-[0.95] tracking-[-0.02em] md:text-[80px]"
              >
                {{ author.name }}
              </h1>
              <div v-if="author.bio" class="mt-6">
                <p
                  id="author-bio"
                  ref="bioEl"
                  class="max-w-[68ch] whitespace-pre-line text-base leading-[1.7] text-gr-muted"
                  :class="{ 'line-clamp-4': !bioExpanded }"
                >{{ author.bio }}</p>
                <button
                  v-if="bioClamped"
                  type="button"
                  class="mt-1 inline-flex min-h-11 items-center rounded font-semibold text-gr-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent"
                  :aria-expanded="bioExpanded"
                  aria-controls="author-bio"
                  @click="bioExpanded = !bioExpanded"
                >
                  {{ bioExpanded ? 'Show less' : 'Read full bio' }}
                </button>
              </div>
            </div>
            <!-- Empty right column. Hidden once it would wrap below the bio
                 (520 + 64 gap + 340 + 64 padding = 988px) so it doesn't add a row gap -->
            <div
              aria-hidden="true"
              class="min-w-0 flex-[1_1_340px] max-[987px]:hidden"
            ></div>
          </div>
        </div>
      </div>

      <div class="gr-container pb-[72px] pt-12">
        <PageSection
          :title="`Books by ${author.name}`"
          :count="allBooks.length ? bookCount(visibleBooks.length) : undefined"
        >
          <template v-if="allBooks.length" #actions>
            <!-- Search and sort share a row once there's room for the full placeholder -->
            <div class="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
              <div class="relative min-w-0 flex-[1_1_220px] md:w-[280px] md:flex-none">
                <font-awesome-icon
                  icon="fa-solid fa-magnifying-glass"
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
                />
                <input
                  v-model="search"
                  type="search"
                  class="gr-input bg-gr-surface pl-10"
                  placeholder="Search these books"
                  aria-label="Search these books"
                />
              </div>
              <div class="min-w-0 flex-[1_1_150px] md:w-[180px] md:flex-none">
                <ThemedSelect v-model="sort" :options="SORT_OPTIONS" label="Sort books" />
              </div>
            </div>
          </template>

          <p v-if="!allBooks.length" class="gr-empty">
            No books listed for this author yet.
          </p>

          <p v-else-if="!visibleBooks.length" class="gr-empty">
            No books by {{ author.name }} match that search.
          </p>

          <ul
            v-else
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-x-6 gap-y-8"
          >
            <li
              v-for="{ book, order, year, cover, publisher } in visibleBooks"
              :key="order"
              class="min-w-0"
            >
              <router-link
                :to="`/book/${book.isbn}`"
                class="block aspect-[2/3] overflow-hidden rounded-lg bg-gr-surface-2 shadow-gr-card transition-transform duration-200 hover:-translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent motion-reduce:transition-none"
              >
                <img
                  v-if="cover"
                  :src="cover"
                  :alt="book.title"
                  loading="lazy"
                  class="h-full w-full object-cover"
                  @error="failedCovers.add(cover)"
                />
                <span
                  v-else
                  role="img"
                  :aria-label="book.title"
                  class="flex h-full w-full items-center justify-center text-gr-muted"
                >
                  <BookOutlineIcon :size="32" :stroke-width="1.5" aria-hidden="true" />
                </span>
              </router-link>
              <h3 class="mt-3.5 text-[17px] font-[650] leading-snug">
                <!-- The ::after pads the link out to a 44px target -->
                <router-link
                  :to="`/book/${book.isbn}`"
                  class="relative block break-words rounded-sm transition-colors after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-gr-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent"
                >
                  <BookTitle :title="book.title" />
                </router-link>
              </h3>
              <p v-if="publisher" class="mt-1 text-sm text-gr-muted">
                {{ publisher }}
              </p>
              <p v-if="metaLine(year, book.pages)" class="mt-0.5 text-sm text-gr-muted">
                {{ metaLine(year, book.pages) }}
              </p>
            </li>
          </ul>

          <!-- Load More Button -->
          <div v-if="hasMore && !search" class="mt-10 flex justify-center">
            <button
              type="button"
              class="gr-btn gr-btn-outline"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <template v-if="loadingMore">
                <font-awesome-icon icon="fa-solid fa-spinner" spin />
                Loading…
              </template>
              <template v-else>
                Load more books
                <span v-if="totalBooks !== undefined" class="text-gr-muted">
                  ({{ allBooks.length }} of {{ totalBooks }})
                </span>
              </template>
            </button>
          </div>
        </PageSection>
      </div>
    </template>

    <!-- No Author Found -->
    <div v-else class="gr-container pb-[72px] pt-12">
      <p class="gr-empty">No author details found</p>
    </div>
  </div>
</template>
