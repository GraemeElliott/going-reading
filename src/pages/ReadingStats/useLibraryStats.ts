import { computed, ref } from 'vue';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import type { LibraryEntry, LibraryFormat } from '@/types/library';
import type { LibraryStatusKey } from './tabs/LibraryStatusBreakdown.vue';
import { formatMonthShort, localDateUtils } from '@/utils/date-utils';
import {
  type ChartRange,
  growthSeries,
  libraryPeriods,
  longestWaiting,
  recentlyAdded,
  topGenres,
  unreadBreakdown,
  waitTimes,
} from '@/utils/library-stats';

// Every aggregate shown on the Library tab, computed once from the library and
// shelf stores and passed down to the cards.
export function useLibraryStats(now: Date = new Date()) {
  const libraryStore = useLibraryStore();
  const userBooksStore = useUserBooksStore();

  const entries = computed(() => libraryStore.entries);
  const shelfBooks = computed(
    () => new Map(userBooksStore.userBooks.map((book) => [book.isbn, book]))
  );
  const statusOf = (isbn: string) => shelfBooks.value.get(isbn)?.status || '';

  // date_added is 'YYYY-MM-DD', so read the year and month straight from the string
  const yearOf = (entry: LibraryEntry) => Number(entry.date_added.slice(0, 4));
  const monthOf = (entry: LibraryEntry) => Number(entry.date_added.slice(5, 7)) - 1;

  // Stat cards: total owned, plus how many were added this year (growth since
  // the end of last year). Removals aren't recorded, so only additions count.
  const metricFor = (label: string, format?: LibraryFormat) => {
    const owned = format
      ? entries.value.filter((e) => e.formats.includes(format))
      : entries.value;
    const addedThisYear = owned.filter((e) => yearOf(e) === now.getFullYear()).length;
    return {
      label,
      value: owned.length.toLocaleString(),
      sub: addedThisYear ? `+${addedThisYear} since last year` : 'No change since last year',
      subClass: addedThisYear ? 'text-green-700 dark:text-green-400' : '',
    };
  };

  const metrics = computed(() => [
    metricFor('Books in Library'),
    metricFor('Physical', 'physical'),
    metricFor('Digital', 'digital'),
  ]);

  // Books added per month over the last 12 months by format, oldest first
  const addedPerMonth = computed(() => {
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: formatMonthShort(d),
      });
    }

    // A book owned in both formats is one entry, so it gets its own "Both" stack
    // rather than being counted twice; each bar's height stays the books added
    const totals = {
      physical: Array(12).fill(0),
      digital: Array(12).fill(0),
      both: Array(12).fill(0),
    };
    for (const entry of entries.value) {
      const idx = months.findIndex((m) => m.year === yearOf(entry) && m.month === monthOf(entry));
      if (idx === -1) continue;
      const key = entry.formats.length > 1 ? 'both' : entry.formats[0];
      totals[key][idx]++;
    }
    return { labels: months.map((m) => m.label), ...totals };
  });

  // Library books by shelf status ('none' = owned but not on any shelf)
  const statusCounts = computed(() => {
    const counts: Record<LibraryStatusKey, number> = {
      read: 0,
      'currently-reading': 0,
      'want-to-read': 0,
      'did-not-finish': 0,
      none: 0,
    };
    for (const entry of entries.value) counts[statusOf(entry.isbn) || 'none']++;
    return counts;
  });

  const recent = computed(() => recentlyAdded(entries.value));

  // Growth shows the last 12 months, or everything since the first book was added
  const growthRange = ref<ChartRange>('year');
  const addedDates = computed(() =>
    entries.value.map((e) => localDateUtils.parseLocalDate(e.date_added))
  );

  const growth = computed(() => {
    const { granularity, periods, hasOlder } = libraryPeriods(addedDates.value, now, growthRange.value);
    const { totals, baseline } = growthSeries(addedDates.value, periods);
    return {
      granularity,
      hasOlder,
      labels: periods.map((p) => p.label),
      totals,
      baseline,
      current: totals[totals.length - 1] ?? entries.value.length,
    };
  });

  // Genres are stored on shelf books, so owned books not on a shelf have none
  const genres = computed(() =>
    topGenres(entries.value.map((e) => shelfBooks.value.get(e.isbn)?.genres?.[0] ?? null), 5)
  );

  const unread = computed(() =>
    unreadBreakdown(entries.value.map((e) => statusOf(e.isbn)))
  );

  // Owned books on the Want to read shelf only
  const waiting = computed(() => {
    const libraryDates = new Map(entries.value.map((e) => [e.isbn, e.date_added]));
    const owned = userBooksStore.groupedBooks['want-to-read'].filter((b) => libraryDates.has(b.isbn));
    return {
      items: longestWaiting(owned, libraryDates),
      count: owned.length,
      times: waitTimes(owned, libraryDates, now),
    };
  });

  return {
    metrics,
    addedPerMonth,
    statusCounts,
    recent,
    growth,
    growthRange,
    genres,
    unread,
    waiting,
  };
}
