import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useUserBooksStore } from './user-books-store';
import { useAuthStore } from './auth-store';
import { AnalyticsService, dateUtils } from '../services/analyticsService';
import type { ReadingData, TimePeriod } from '../types/analytics';
import { formatUtils } from '../utils/format-utils';

export const useUserAnalyticsStore = defineStore('userAnalytics', () => {
  const userBooksStore = useUserBooksStore();
  const authStore = useAuthStore();
  const monthlyData = ref<ReadingData[]>([]);
  const yearlyData = ref<ReadingData[]>([]);
  const totalReadingTime = ref<number>(0);

  // Computed values for total statistics
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

  // Formatted computed values
  const formattedTotalBooksRead = computed(() =>
    formatUtils.formatNumber(totalBooksRead.value)
  );

  const formattedTotalPagesRead = computed(() =>
    formatUtils.formatNumber(totalPagesRead.value)
  );

  const formattedTotalReadingTime = computed(() =>
    formatUtils.formatReadingTime(totalReadingTime.value)
  );

  const maxMonthlyBooks = computed(() => {
    const max = Math.max(
      ...monthlyData.value.map((data) => data['Total Books Read'])
    );
    return max + 5;
  });

  // Data fetching methods
  async function calculateTotalReadingTime() {
    try {
      if (!authStore.user?.id) return;
      totalReadingTime.value = await AnalyticsService.getTotalReadingTime(
        authStore.user.id
      );
    } catch (error) {
      console.error('Error calculating total reading time:', error);
      totalReadingTime.value = 0;
    }
  }

  async function getYearlyData(): Promise<ReadingData[]> {
    if (!authStore.user?.id) return [];

    try {
      const years = dateUtils.generatePastYears(5);

      return await Promise.all(
        years.map(async (year) => {
          const dateRange = dateUtils.createYearRange(year);
          const booksReadThisYear = userBooksStore.groupedBooks.read.filter(
            (book) => {
              if (!book.date_finished) return false;
              return new Date(book.date_finished).getFullYear() === year;
            }
          );

          const progress = await AnalyticsService.getProgressForDateRange(
            authStore.user!.id,
            dateRange
          );

          return {
            name: year.toString(),
            'Total Books Read': booksReadThisYear.length,
            'Pages Read': progress.pagesRead,
            'Reading Time': progress.readingTime,
          };
        })
      );
    } catch (error) {
      console.error('Error getting yearly data:', error);
      return dateUtils.generatePastYears(5).map((year) => ({
        name: year.toString(),
        'Total Books Read': 0,
        'Pages Read': 0,
        'Reading Time': 0,
      }));
    }
  }

  async function getMonthlyData(monthCount: number): Promise<ReadingData[]> {
    if (!authStore.user?.id) return [];

    try {
      const months = dateUtils.generatePastMonths(monthCount);

      return await Promise.all(
        months.map(async ({ month, year }) => {
          const dateRange = dateUtils.createMonthRange(year, month);
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

          const progress = await AnalyticsService.getProgressForDateRange(
            authStore.user!.id,
            dateRange
          );

          return {
            name: dateUtils.formatMonthYear(dateRange.startDate),
            'Total Books Read': booksReadThisMonth.length,
            'Pages Read': progress.pagesRead,
            'Reading Time': progress.readingTime,
          };
        })
      );
    } catch (error) {
      console.error('Error getting monthly data:', error);
      return [];
    }
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
    monthlyData,
    yearlyData,
    maxMonthlyBooks,
    updateMonthlyData,
    updateYearlyData,
    calculateTotalReadingTime,
    // Expose formatting utilities that components might need
    formatReadingTime: formatUtils.formatReadingTime,
    formatNumber: formatUtils.formatNumber,
  };
});
