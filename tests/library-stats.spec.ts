// Unit tests for the Library tab helpers. Plain functions, so no page is opened.
import { test, expect } from '@playwright/test';
import { formatDuration, formatMonthYear } from '../src/utils/date-utils';
import { formatPercent } from '../src/utils/book-display';
import {
  growthSeries,
  libraryPeriods,
  longestWaiting,
  recentlyAdded,
  topGenres,
  unreadBreakdown,
} from '../src/utils/library-stats';

const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const repeat = (date: string, n: number) => Array(n).fill(date) as string[];

test.describe('date helpers', () => {
  test('formatMonthYear gives short month and full year', () => {
    expect(formatMonthYear(day('2026-10-14'))).toBe('Oct 2026');
    expect(formatMonthYear(day('2025-01-01'))).toBe('Jan 2025');
  });

  test('formatDuration picks the coarsest sensible unit', () => {
    const now = day('2026-10-24');
    expect(formatDuration(day('2026-10-24'), now)).toBe('Less than a day');
    expect(formatDuration(day('2026-10-23'), now)).toBe('1 day');
    expect(formatDuration(day('2026-10-19'), now)).toBe('5 days');
    expect(formatDuration(day('2026-10-03'), now)).toBe('3 weeks');
    expect(formatDuration(day('2026-08-10'), now)).toBe('2 months');
    expect(formatDuration(day('2025-11-20'), now)).toBe('11 months');
    expect(formatDuration(day('2024-10-30'), now)).toBe('23 months');
    expect(formatDuration(day('2023-10-01'), now)).toBe('3 years');
  });

  test('formatPercent', () => {
    expect(formatPercent(0, 10)).toBe('0%');
    expect(formatPercent(1, 500)).toBe('<1%');
    expect(formatPercent(68, 122)).toBe('56%');
    expect(formatPercent(3, 0)).toBe('0%');
  });
});

test.describe('libraryPeriods', () => {
  const now = day('2026-10-24');
  const older = ['2024-05-01', '2025-10-31', ...repeat('2026-10-06', 40), '2026-10-20'].map(day);

  test('all time starts at the first book added', () => {
    const t = libraryPeriods(older, now, 'all');
    expect(t.granularity).toBe('month');
    expect(t.hasOlder).toBe(true);
    expect(t.periods[0].start).toEqual(day('2024-05-01'));
    expect(t.periods).toHaveLength(30);
    expect(t.periods.at(-1)!.end).toEqual(day('2026-11-01'));
    expect(t.periods.at(-1)!.label).toBe('Oct ’26');
  });

  test('12 months starts a year ago when books are older', () => {
    const t = libraryPeriods(older, now, 'year');
    expect(t.granularity).toBe('month');
    expect(t.periods).toHaveLength(12);
    expect(t.periods[0].start).toEqual(day('2025-11-01'));
  });

  test('12 months starts at the first book when that is more recent', () => {
    const dates = ['2026-02-10', '2026-06-01'].map(day);
    for (const range of ['year', 'all'] as const) {
      const t = libraryPeriods(dates, now, range);
      expect(t.hasOlder).toBe(false);
      expect(t.periods[0].start).toEqual(day('2026-02-01'));
      expect(t.periods).toHaveLength(9);
    }
  });

  test('weekly when the first book was under 3 months ago', () => {
    const t = libraryPeriods([day('2026-09-02')], now, 'all'); // a Wednesday
    expect(t.granularity).toBe('week');
    expect(t.periods[0].start).toEqual(day('2026-08-31')); // its Monday
    expect(t.periods[0].label).toBe('31 Aug');
    expect(t.periods.at(-1)!.start).toEqual(day('2026-10-19'));
    expect(t.periods).toHaveLength(8);
  });

  test('handles an empty library', () => {
    expect(libraryPeriods([], now, 'all')).toEqual({ granularity: 'month', periods: [], hasOlder: false });
  });
});

test.describe('series', () => {
  const now = day('2026-10-24');

  test('growthSeries counts the library at the end of each period', () => {
    const dates = ['2024-05-01', '2025-10-31', ...repeat('2026-10-06', 40), '2026-10-20'].map(day);
    const all = growthSeries(dates, libraryPeriods(dates, now, 'all').periods);
    expect(all.baseline).toBe(1);
    expect(all.totals.at(-2)).toBe(2);
    expect(all.totals.at(-1)).toBe(43);
    const year = growthSeries(dates, libraryPeriods(dates, now, 'year').periods);
    expect(year.baseline).toBe(2);
    expect(year.totals.at(-1)).toBe(43);
  });

  test('growthSeries handles no periods', () => {
    expect(growthSeries([], [])).toEqual({ totals: [], baseline: 0 });
  });
});

test.describe('aggregates', () => {
  test('topGenres keeps the top rows and groups the rest', () => {
    const genres = [
      ...repeat('Fantasy', 5), ...repeat('History', 4), ...repeat('Poetry', 3),
      ...repeat('Travel', 2), 'Horror', 'Romance', 'Humor', 'Science & Nature', null, null,
    ];
    const result = topGenres(genres);
    expect(result.rows.map((r) => r.genre)).toEqual([
      'Fantasy', 'History', 'Poetry', 'Travel', 'Horror', 'Humor',
    ]);
    expect(result.other).toBe(2);
    expect(result.distinct).toBe(8);
    expect(topGenres([null, null])).toEqual({ rows: [], other: 0, distinct: 0 });
  });

  test('unreadBreakdown counts everything not on Read as unread', () => {
    const result = unreadBreakdown([
      'read', 'read', 'want-to-read', 'want-to-read', 'want-to-read',
      '', 'currently-reading', 'did-not-finish',
    ]);
    expect(result).toEqual({
      owned: 8, read: 2, unread: 6, wantToRead: 3, notOnShelf: 1, currentlyReading: 1, didNotFinish: 1,
    });
  });

  test('recentlyAdded sorts newest first, then by creation time', () => {
    const entries = [
      { id: 'a', date_added: '2026-01-01', created_at: '2026-01-01T10:00:00Z' },
      { id: 'b', date_added: '2026-03-01', created_at: '2026-03-01T09:00:00Z' },
      { id: 'c', date_added: '2026-03-01', created_at: '2026-03-01T12:00:00Z' },
    ];
    expect(recentlyAdded(entries, 2).map((e) => e.id)).toEqual(['c', 'b']);
  });

  test('longestWaiting uses the shelf date, falling back to the library date', () => {
    const books = [
      { isbn: '1', date_added: '2026-05-01' },
      { isbn: '2', date_added: null },
      { isbn: '3', date_added: '2025-12-24T08:00:00Z' },
      { isbn: '4', date_added: null },
    ];
    const libraryDates = new Map([['2', '2025-06-01']]);
    const result = longestWaiting(books, libraryDates, 5);
    expect(result.map((r) => r.book.isbn)).toEqual(['2', '3', '1']);
    expect(result[0].since).toEqual(day('2025-06-01'));
  });
});
