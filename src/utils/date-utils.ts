const MS_PER_DAY = 86400000;

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
};
