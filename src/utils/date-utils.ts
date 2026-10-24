const MS_PER_DAY = 86400000;

/** Locale the stats pages format dates in */
export const SITE_LOCALE = 'en-GB';

export const localDateUtils = {
  /**
   * Parse a 'YYYY-MM-DD' string as local midnight.
   * `new Date('YYYY-MM-DD')` parses as UTC midnight, which lands on the
   * previous day for anyone in a timezone behind UTC.
   */
  parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  /** Format a Date as a local 'YYYY-MM-DD' string */
  toLocalDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  /**
   * Whole calendar days between two local dates. Rounded so the 23/25-hour
   * days at daylight-saving changes still count as exactly one day.
   */
  daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
  },

  /** 'YYYY-MM-DD' as local midnight; anything longer (a timestamp) via Date */
  toLocalDate(value: string): Date {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? this.parseLocalDate(value)
      : new Date(value);
  },
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** "Oct 2026" */
export const formatMonthYear = (date: Date): string =>
  date.toLocaleDateString(SITE_LOCALE, { month: 'short', year: 'numeric' });

/** "Oct 26", for chart axes */
export const formatMonthShort = (date: Date): string =>
  date.toLocaleDateString(SITE_LOCALE, { month: 'short', year: '2-digit' });

/** "6 Oct", for weekly chart axes */
export const formatDayMonth = (date: Date): string =>
  date.toLocaleDateString(SITE_LOCALE, { day: 'numeric', month: 'short' });

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/**
 * How long ago `from` was, at the coarsest sensible unit: "5 days" up to two
 * weeks, then "3 weeks" up to two months, "11 months" up to two years, then years.
 */
export const formatDuration = (from: Date, to: Date = new Date()): string => {
  const days = localDateUtils.daysBetween(startOfDay(from), startOfDay(to));
  if (days < 1) return 'Less than a day';
  if (days < 14) return plural(days, 'day');
  if (days < 60) return plural(Math.floor(days / 7), 'week');
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) -
    (to.getDate() < from.getDate() ? 1 : 0);
  if (months < 24) return plural(months, 'month');
  return plural(Math.floor(months / 12), 'year');
};
