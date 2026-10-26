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
 * When each Want to read book started waiting: the date it went on the shelf,
 * or the date it was added to the library when the shelf date is missing.
 * Books with neither are left out.
 */
const waitingSince = <T extends { isbn: string; date_added?: string | null }>(
  books: T[],
  libraryDates: Map<string, string>
): { book: T; since: Date }[] =>
  books
    .map((book) => {
      const date = book.date_added || libraryDates.get(book.isbn);
      return date ? { book, since: localDateUtils.toLocalDate(date) } : null;
    })
    .filter((item): item is { book: T; since: Date } => item !== null);

/** Want to read books that have waited longest */
export const longestWaiting = <T extends { isbn: string; date_added?: string | null }>(
  books: T[],
  libraryDates: Map<string, string>,
  limit = 5
): { book: T; since: Date }[] =>
  waitingSince(books, libraryDates)
    .sort((a, b) => a.since.getTime() - b.since.getTime())
    .slice(0, limit);

export interface WaitTimes {
  /** Books with a known waiting date */
  count: number;
  /** Start dates of the average and median waits, for formatDuration */
  averageSince: Date | null;
  medianSince: Date | null;
  overAYear: number;
  /** How many books have waited for each span, shortest first */
  buckets: { label: string; count: number }[];
}

// Upper bounds in days (exclusive); the last bucket is open-ended
const WAIT_BUCKETS = [
  { label: '<1 mo', maxDays: 30 },
  { label: '1–3 mo', maxDays: 91 },
  { label: '3–6 mo', maxDays: 182 },
  { label: '6–12 mo', maxDays: 365 },
  { label: '1–2 yr', maxDays: 730 },
  { label: '2+ yr', maxDays: Infinity },
];

/** How long Want to read books have been waiting: average, median and spread */
export const waitTimes = <T extends { isbn: string; date_added?: string | null }>(
  books: T[],
  libraryDates: Map<string, string>,
  now: Date = new Date()
): WaitTimes => {
  const times = waitingSince(books, libraryDates)
    .map(({ since }) => since.getTime())
    .sort((a, b) => a - b);
  const days = times.map((t) => Math.max(0, localDateUtils.daysBetween(new Date(t), now)));

  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 ? times[mid] : (times[mid - 1] + times[mid]) / 2;

  return {
    count: times.length,
    averageSince: times.length ? new Date(times.reduce((sum, t) => sum + t, 0) / times.length) : null,
    medianSince: times.length ? new Date(median) : null,
    overAYear: days.filter((d) => d >= 365).length,
    buckets: WAIT_BUCKETS.map(({ label, maxDays }, i) => {
      const minDays = i ? WAIT_BUCKETS[i - 1].maxDays : 0;
      return { label, count: days.filter((d) => d >= minDays && d < maxDays).length };
    }),
  };
};
