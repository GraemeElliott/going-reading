import { supabase } from '../supabase/supabase';

export interface ProgressData {
  pages_read_in_session: number;
  time_reading_in_session_mins: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Keep dateUtils export for backward compatibility
export const dateUtils = {
  createMonthRange(year: number, month: number): DateRange {
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0, 23, 59, 59),
    };
  },

  createYearRange(year: number): DateRange {
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    };
  },

  generatePastMonths(count: number): Array<{ month: number; year: number }> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return Array.from({ length: count }, (_, i) => {
      let month = currentMonth - (count - 1) + i;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }
      return { month, year };
    });
  },

  generatePastYears(count: number): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: count },
      (_, i) => currentYear - (count - 1) + i
    );
  },

  formatMonthYear(date: Date): string {
    return `${date.toLocaleString('default', {
      month: 'short',
    })} ${date.getFullYear()}`;
  },
};

export class AnalyticsService {
  private static formatDateForDB(date: Date): string {
    return date.toISOString();
  }

  private static async fetchProgressData(
    userId: string,
    dateRange: DateRange
  ): Promise<ProgressData[]> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('pages_read_in_session, time_reading_in_session_mins')
      .eq('user_id', userId)
      .gte('recorded_at', this.formatDateForDB(dateRange.startDate))
      .lte('recorded_at', this.formatDateForDB(dateRange.endDate));

    if (error)
      throw new Error(`Error fetching progress data: ${error.message}`);
    return data || [];
  }

  static async getTotalReadingTime(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('time_reading_in_session_mins')
      .eq('user_id', userId);

    if (error) throw new Error(`Error fetching reading time: ${error.message}`);
    return (data || []).reduce(
      (total, entry) => total + (entry.time_reading_in_session_mins || 0),
      0
    );
  }

  static async getProgressForDateRange(
    userId: string,
    dateRange: DateRange
  ): Promise<{
    pagesRead: number;
    readingTime: number;
  }> {
    const progressData = await this.fetchProgressData(userId, dateRange);

    return {
      pagesRead: progressData.reduce(
        (total, entry) => total + (entry.pages_read_in_session || 0),
        0
      ),
      readingTime: progressData.reduce(
        (total, entry) => total + (entry.time_reading_in_session_mins || 0),
        0
      ),
    };
  }
}
