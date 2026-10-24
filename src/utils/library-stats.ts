// Pure aggregates for the Library tab of the Reading Dashboard. No store or
// DOM access, so they can be unit tested; useLibraryStats wires them up.
import type { BookStatus } from '../types/book';
import { formatDayMonth, formatMonthShort, localDateUtils } from './date-utils';

// ---------------------------------------------------------------------------
// First bulk import

/** A day counts as a bulk import when at least this many books were added... */
export const IMPORT_MIN_BOOKS = 10;
/** ...and they make up at least this share of the library */
export const IMPORT_MIN_SHARE = 0.2;

/**
 * The earliest day on which a large batch of books was added (the first bulk
 * import), or null when there wasn't one. Takes 'YYYY-MM-DD' dates.
 */
export const detectFirstImport = (
  dates: string[]
): { date: string; count: number } | null => {
  const perDay = new Map<string, number>();
  for (const date of dates) {
    const day = date.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const threshold = Math.max(IMPORT_MIN_BOOKS, Math.ceil(dates.length * IMPORT_MIN_SHARE));
  const bulkDays = [...perDay]
    .filter(([, count]) => count >= threshold)
    .sort(([a], [b]) => a.localeCompare(b));
  return bulkDays.length ? { date: bulkDays[0][0], count: bulkDays[0][1] } : null;
};

// ---------------------------------------------------------------------------
// Chart periods

export type Granularity = 'month' | 'week';

export interface Period {
  start: Date;
  /** Exclusive */
  end: Date;
  /** Axis label: "Oct 26" or "6 Oct" */
  label: string;
}

export interface LibraryTimeline {
  granularity: Granularity;
  periods: Period[];
  /** True when the first period is the one holding the first bulk import */
  startsAtImport: boolean;
}

const monthStart = (year: number, month: number) => new Date(year, month, 1);
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
/** Monday of the date's week */
const weekStart = (date: Date) => addDays(date, -((date.getDay() + 6) % 7));

/**
 * Periods for the growth and read-vs-added charts: the last 12 months, unless
 * the first bulk import falls inside them, in which case the periods start at
 * the import. With fewer than 3 months since the import, periods are weeks.
 */
export const buildTimeline = (now: Date, importDate: string | null): LibraryTimeline => {
  const thisMonth = monthStart(now.getFullYear(), now.getMonth());
  const windowStart = monthStart(now.getFullYear(), now.getMonth() - 11);
  const imported = importDate ? localDateUtils.parseLocalDate(importDate) : null;
  const startsAtImport = !!imported && imported >= windowStart && imported <= now;

  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (imported && startsAtImport && imported > threeMonthsAgo) {
    const periods: Period[] = [];
    for (let start = weekStart(imported); start <= now; start = addDays(start, 7)) {
      periods.push({ start, end: addDays(start, 7), label: formatDayMonth(start) });
    }
    return { granularity: 'week', periods, startsAtImport };
  }

  const first = startsAtImport && imported
    ? monthStart(imported.getFullYear(), imported.getMonth())
    : windowStart;
  const periods: Period[] = [];
  for (let start = first; start <= thisMonth; start = monthStart(start.getFullYear(), start.getMonth() + 1)) {
    periods.push({
      start,
      end: monthStart(start.getFullYear(), start.getMonth() + 1),
      label: formatMonthShort(start),
    });
  }
  return { granularity: 'month', periods, startsAtImport };
};

/** How many of the dates fall in each period */
export const countPerPeriod = (dates: Date[], periods: Period[]): number[] =>
  periods.map((p) => dates.filter((d) => d >= p.start && d < p.end).length);

/**
 * Library size at the end of each period, plus the size it grew from: the
 * import total when the timeline starts at the import, otherwise the size
 * just before the first period.
 */
export const growthSeries = (
  dates: Date[],
  timeline: LibraryTimeline
): { totals: number[]; baseline: number } => {
  const { periods, startsAtImport } = timeline;
  const totals = periods.map((p) => dates.filter((d) => d < p.end).length);
  if (!periods.length) return { totals, baseline: 0 };
  const baseline = startsAtImport
    ? totals[0]
    : dates.filter((d) => d < periods[0].start).length;
  return { totals, baseline };
};

/** Read vs added starts after the import's period so the import doesn't dwarf it */
export const readVsAddedPeriods = (timeline: LibraryTimeline): Period[] =>
  timeline.startsAtImport ? timeline.periods.slice(1) : timeline.periods;

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
