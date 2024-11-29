import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useUserBooksStore } from './user-books-store';
import { ReadingProgressService } from '../services/readingProgressService';
import { useAuthStore } from './auth-store';
import { supabase } from '../supabase/supabase';

const formatter = new Intl.NumberFormat('en-US');

export interface ReadingData {
  name: string;
  'Total Books Read': number;
  'Pages Read': number;
  'Reading Time': number;
}

interface ProgressEntry {
  book_isbn: string;
  pages_read: number;
  pages_read_in_session: number;
  recorded_at: string;
}

export type TimePeriod = 'month' | '3months' | '6months' | 'by-year';

export const useUserAnalyticsStore = defineStore('userAnalytics', () => {
  const userBooksStore = useUserBooksStore();
  const authStore = useAuthStore();
  const monthlyData = ref<ReadingData[]>([]);
  const yearlyData = ref<ReadingData[]>([]);
  const totalReadingTime = ref<number>(0);

  const totalBooksRead = computed(
    () => userBooksStore.groupedBooks.read.length
  );

  const totalPagesRead = computed(() => {
    const {
      read,
      'currently-reading': currentlyReading,
      'did-not-finish': didNotFinish,
    } = userBooksStore.groupedBooks;

    return [...read, ...currentlyReading, ...didNotFinish].reduce(
      (total, book) => total + (book.current_page ?? 0),
      0
    );
  });

  const formattedTotalBooksRead = computed(() =>
    formatter.format(totalBooksRead.value)
  );

  const formattedTotalPagesRead = computed(() =>
    formatter.format(totalPagesRead.value)
  );

  function formatReadingTime(minutes: number): string {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (remainingMinutes > 0)
      parts.push(
        `${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`
      );

    return parts.join(' ') || '0 mins';
  }

  const formattedTotalReadingTime = computed(() =>
    formatReadingTime(totalReadingTime.value)
  );

  const maxMonthlyBooks = computed(() => {
    const max = Math.max(
      ...monthlyData.value.map((data) => data['Total Books Read'])
    );
    return max + 5;
  });

  async function calculateTotalReadingTime() {
    try {
      const { data: progressData, error } = await supabase
        .from('reading_progress')
        .select('time_reading_in_session_mins')
        .eq('user_id', authStore.user?.id || '');

      if (error) throw error;

      totalReadingTime.value = (progressData || []).reduce(
        (total, entry) => total + (entry.time_reading_in_session_mins || 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total reading time:', error);
      totalReadingTime.value = 0;
    }
  }

  async function getYearlyData(): Promise<ReadingData[]> {
    try {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

      return await Promise.all(
        years.map(async (year) => {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59);

          const booksReadThisYear = userBooksStore.groupedBooks.read.filter(
            (book) => {
              if (!book.date_finished) return false;
              return new Date(book.date_finished).getFullYear() === year;
            }
          );

          // Get total pages read and reading time in the year
          const { data: progressData, error } = await supabase
            .from('reading_progress')
            .select('pages_read_in_session, time_reading_in_session_mins')
            .eq('user_id', authStore.user?.id || '')
            .gte('recorded_at', startDate.toISOString())
            .lte('recorded_at', endDate.toISOString());

          if (error) throw error;

          const yearlyPages = (progressData || []).reduce(
            (total, entry) => total + (entry.pages_read_in_session || 0),
            0
          );

          const yearlyReadingTime = (progressData || []).reduce(
            (total, entry) => total + (entry.time_reading_in_session_mins || 0),
            0
          );

          return {
            name: year.toString(),
            'Total Books Read': booksReadThisYear.length,
            'Pages Read': yearlyPages,
            'Reading Time': yearlyReadingTime,
          };
        })
      );
    } catch (error) {
      console.error('Error getting yearly data:', error);
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => ({
        name: (currentYear - 4 + i).toString(),
        'Total Books Read': 0,
        'Pages Read': 0,
        'Reading Time': 0,
      }));
    }
  }

  async function getMonthlyData(monthCount: number): Promise<ReadingData[]> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Generate months array
    const months = Array.from({ length: monthCount }, (_, i) => {
      let month = currentMonth - (monthCount - 1) + i;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }
      return { month, year };
    });

    // Calculate pages read for each month
    return await Promise.all(
      months.map(async ({ month, year }) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const booksReadThisMonth = userBooksStore.groupedBooks.read.filter(
          (book) => {
            if (!book.date_finished) return false;
            const finishDate = new Date(book.date_finished);
            return (
              finishDate.getMonth() === month &&
              finishDate.getFullYear() === year
            );
          }
        );

        // Get total pages read and reading time in the month
        const { data: progressData, error } = await supabase
          .from('reading_progress')
          .select('pages_read_in_session, time_reading_in_session_mins')
          .eq('user_id', authStore.user?.id || '')
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString());

        if (error) throw error;

        const monthlyPagesRead = (progressData || []).reduce(
          (total, entry) => total + (entry.pages_read_in_session || 0),
          0
        );

        const monthlyReadingTime = (progressData || []).reduce(
          (total, entry) => total + (entry.time_reading_in_session_mins || 0),
          0
        );

        return {
          name: `${startDate.toLocaleString('default', {
            month: 'short',
          })} ${year}`,
          'Total Books Read': booksReadThisMonth.length,
          'Pages Read': monthlyPagesRead,
          'Reading Time': monthlyReadingTime,
        };
      })
    );
  }

  async function updateMonthlyData(period: TimePeriod = '6months') {
    try {
      if (period === 'by-year') {
        monthlyData.value = await getYearlyData();
      } else {
        const monthCount =
          {
            month: 1,
            '3months': 3,
            '6months': 6,
          }[period] || 6;

        monthlyData.value = await getMonthlyData(monthCount);
      }
    } catch (error) {
      console.error('Error updating data:', error);
      monthlyData.value = [];
    }
  }

  async function updateYearlyData() {
    try {
      yearlyData.value = await getYearlyData();
    } catch (error) {
      console.error('Error updating yearly data:', error);
      yearlyData.value = [];
    }
  }

  return {
    totalBooksRead,
    totalPagesRead,
    formattedTotalBooksRead,
    formattedTotalPagesRead,
    formattedTotalReadingTime,
    formatReadingTime,
    monthlyData,
    yearlyData,
    maxMonthlyBooks,
    updateMonthlyData,
    updateYearlyData,
    calculateTotalReadingTime,
  };
});
