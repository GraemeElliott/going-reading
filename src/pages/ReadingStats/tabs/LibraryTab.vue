<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { supabase } from '@/supabase/supabase';
import StarRating from '@/components/partials/StarRating.vue';

const darkModeStore = useDarkModeStore();
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const isDark = computed(() => darkModeStore.darkMode);

const filterGenre = ref('');
const filterSort = ref('date');
const bookReadingTime = ref<Record<string, number>>({});

const PAGE_SIZE = 20;
const currentPage = ref(1);

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
watch([filterGenre, filterSort], () => { currentPage.value = 1; });

const readBooks = computed(() => userBooksStore.groupedBooks['read']);

const availableGenres = computed(() => {
  const genres = new Set<string>();
  for (const book of readBooks.value) {
    for (const g of book.genres ?? []) genres.add(g);
  }
  return [...genres].sort();
});

const filteredBooks = computed(() => {
  let books = filterGenre.value
    ? readBooks.value.filter(b => (b.genres ?? []).includes(filterGenre.value))
    : [...readBooks.value];

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

function formatDateFinished(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function formatReadingTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const COVERS = ['#B5D4F4','#C0DD97','#F4C0D1','#FAC775','#9FE1CB','#CECBF6','#F0997B'];
const COVER_TEXT = ['#0C447C','#3B6D11','#72243E','#633806','#085041','#3C3489','#993C1D'];

const selectClass = computed(() =>
  `text-sm px-3 py-1.5 rounded-md border ${isDark.value ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`
);
</script>

<template>
  <div>
    <!-- Filter/sort controls -->
    <div class="flex gap-2 mb-5 flex-wrap items-center">
      <select v-model="filterGenre" :class="selectClass">
        <option value="">All genres</option>
        <option v-for="genre in availableGenres" :key="genre">{{ genre }}</option>
      </select>
      <select v-model="filterSort" :class="selectClass">
        <option value="date">Sort: date finished</option>
        <option value="rating">Sort: rating</option>
        <option value="pages">Sort: pages</option>
        <option value="title">Sort: title</option>
      </select>
      <span class="ml-auto text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        {{ filteredBooks.length }} books
      </span>
    </div>

    <!-- Empty state -->
    <p
      v-if="readBooks.length === 0"
      class="text-sm py-8 text-center"
      :class="isDark ? 'text-gray-400' : 'text-gray-500'"
    >
      No books marked as read yet.
    </p>

    <template v-else>
      <!-- Book list -->
      <div
        class="rounded-lg border"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          v-for="(book, i) in pagedBooks"
          :key="book.isbn"
          class="flex items-center gap-2.5 px-5 py-2.5 border-b last:border-b-0"
          :class="isDark ? 'border-gray-700' : 'border-gray-100'"
        >
          <!-- Cover -->
          <img
            v-if="book.image"
            :src="book.image"
            :alt="book.title"
            class="w-8 h-12 rounded flex-shrink-0 object-cover"
          />
          <div
            v-else
            class="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-medium text-center leading-tight p-1"
            :style="{ background: COVERS[i % COVERS.length], color: COVER_TEXT[i % COVER_TEXT.length] }"
          >
            {{ book.title.split(' ').slice(0, 2).join(' ') }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <RouterLink
              :to="`/book/${book.isbn}`"
              class="text-sm font-medium truncate hover:underline block"
            >{{ book.title }}</RouterLink>
            <div class="text-xs truncate" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ book.authors.join(', ') }}<template v-if="book.genres?.length"> · {{ book.genres[0] }}</template>
            </div>
            <StarRating :model-value="book.user_rating ?? 0" readonly class="mt-1 text-xs" />
          </div>

          <!-- Meta -->
          <div class="text-right flex-shrink-0">
            <div class="text-sm font-medium">{{ book.pages ? `${book.pages}p` : '—' }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              {{ formatDateFinished(book.date_finished) }}
            </div>
            <div
              v-if="bookReadingTime[book.isbn]"
              class="text-xs"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              {{ formatReadingTime(bookReadingTime[book.isbn]) }} read
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pageCount > 1" class="flex items-center justify-between mt-4">
        <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Page {{ currentPage }} of {{ pageCount }}
        </span>
        <div class="flex gap-1">
          <button
            class="px-3 py-1.5 text-sm rounded-md border transition-colors"
            :class="currentPage === 1
              ? (isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-300 cursor-not-allowed')
              : (isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded-md border transition-colors"
            :class="currentPage === pageCount
              ? (isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-300 cursor-not-allowed')
              : (isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')"
            :disabled="currentPage === pageCount"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
