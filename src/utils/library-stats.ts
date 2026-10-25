// Pure aggregates for the Library tab of the Reading Dashboard. No store or
// DOM access, so they can be unit tested; useLibraryStats wires them up.
import type { BookStatus } from '../types/book';
import { formatDayMonth, formatMonthShort, localDateUtils } from './date-utils';

// ---------------------------------------------------------------------------
// Chart periods

export type Granularity = 'month' | 'week';

export interface Period {
  start: Date;
  /** Exclusive */
  end: Date;
  /** Axis label: "Oct ’26" or "6 Oct" */
  label: string;
}

/** How far back the growth chart goes */
export type ChartRange = 'year' | 'all';

const monthStart = (year: number, month: number) => new Date(year, month, 1);
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
/** Monday of the date's week */
const weekStart = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));

/**
 * Periods from the given date up to now: weeks from its Monday when it's
 * under 3 months ago, otherwise months from its month.
 */
export const periodsFrom = (
  now: Date,
  from: Date
): { granularity: Granularity; periods: Period[] } => {
  const periods: Period[] = [];
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (from > threeMonthsAgo) {
    for (let start = weekStart(from); start <= now; start = addDays(start, 7)) {
      periods.push({ start, end: addDays(start, 7), label: formatDayMonth(start) });
    }
    return { granularity: 'week', periods };
  }

  const thisMonth = monthStart(now.getFullYear(), now.getMonth());
  const first = monthStart(from.getFullYear(), from.getMonth());
  for (let start = first; start <= thisMonth; start = monthStart(start.getFullYear(), start.getMonth() + 1)) {
    periods.push({
      start,
      end: monthStart(start.getFullYear(), start.getMonth() + 1),
      label: formatMonthShort(start),
    });
  }
  return { granularity: 'month', periods };
};

/**
 * Periods for the growth chart. 'all' starts at the first
 * book added; 'year' starts 12 months ago, or at the first book when that's
 * more recent. hasOlder is true when books predate the 12 months, which is
 * the only time the two ranges differ.
 */
export const libraryPeriods = (
  dates: Date[],
  now: Date,
  range: ChartRange
): { granularity: Granularity; periods: Period[]; hasOlder: boolean } => {
  if (!dates.length) return { granularity: 'month', periods: [], hasOlder: false };
  const first = new Date(Math.min(...dates.map((d) => d.getTime())));
  const windowStart = monthStart(now.getFullYear(), now.getMonth() - 11);
  const hasOlder = first < windowStart;
  return { ...periodsFrom(now, range === 'year' && hasOlder ? windowStart : first), hasOlder };
};

/**
 * Library size at the end of each period, plus the size it grew from: the
 * total at the end of the first period.
 */
export const growthSeries = (
  dates: Date[],
  periods: Period[]
): { totals: number[]; baseline: number } => {
  const totals = periods.map((p) => dates.filter((d) => d < p.end).length);
  return { totals, baseline: totals[0] ?? 0 };
};

// ---------------------------------------------------------------------------
// Other aggregates

export interface GenreBreakdown {
  rows: { genre: string; count: number }[];
  /** Books in genres outside the top rows */
  other: number;
  /** Distinct genres */
  distinct: number;
}

/** Top genres by number of books (one primary genre per book; nulls skipped) */
export const topGenres = (primaryGenres: (string | null)[], limit = 6): GenreBreakdown => {
  const counts = new Map<string, number>();
  for (const genre of primaryGenres) {
    if (genre) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  const sorted = [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
  return {
    rows: sorted.slice(0, limit),
    other: sorted.slice(limit).reduce((sum, row) => sum + row.count, 0),
    distinct: sorted.length,
  };
};

export interface UnreadBreakdown {
  owned: number;
  read: number;
  /** Everything not on Read, including Did not finish */
  unread: number;
  wantToRead: number;
  notOnShelf: number;
  currentlyReading: number;
  didNotFinish: number;
}

/** Owned books split by whether they've been read. Takes each owned book's shelf status. */
export const unreadBreakdown = (statuses: BookStatus[]): UnreadBreakdown => {
  const count = (status: BookStatus) => statuses.filter((s) => s === status).length;
  const read = count('read');
  return {
    owned: statuses.length,
    read,
    unread: statuses.length - read,
    wantToRead: count('want-to-read'),
    notOnShelf: count(''),
    currentlyReading: count('currently-reading'),
    didNotFinish: count('did-not-finish'),
  };
};

/** Newest first by date added, then by when the row was created */
export const recentlyAdded = <T extends { date_added: string; created_at?: string }>(
  entries: T[],
  limit = 5
): T[] =>
  [...entries]
    .sort(
      (a, b) =>
        b.date_added.localeCompare(a.date_added) ||
        (b.created_at ?? '').localeCompare(a.created_at ?? '')
    )
    .slice(0, limit);

/**
 * Want to read books that have waited longest. Waiting is measured from the
 * date the book went on the shelf, or the date it was added to the library
 * when the shelf date is missing.
 */
export const longestWaiting = <T extends { isbn: string; date_added?: string | null }>(
  books: T[],
  libraryDates: Map<string, string>,
  limit = 5
): { book: T; since: Date }[] =>
  books
    .map((book) => {
      const date = book.date_added || libraryDates.get(book.isbn);
      return date ? { book, since: localDateUtils.toLocalDate(date) } : null;
    })
    .filter((item): item is { book: T; since: Date } => item !== null)
    .sort((a, b) => a.since.getTime() - b.since.getTime())
    .slice(0, limit);
