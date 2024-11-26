import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useUserBooksStore } from './user-books-store';
import { ReadingProgressService } from '../services/readingProgressService';
import { useAuthStore } from './auth-store';

const formatter = new Intl.NumberFormat('en-US');

interface ReadingData {
  name: string;
  'Total Books Read': number;
  'Pages Read': number;
}

export type TimePeriod = 'month' | '3months' | '6months' | 'by-year';

export const useUserAnalyticsStore = defineStore('userAnalytics', () => {
  const userBooksStore = useUserBooksStore();
  const authStore = useAuthStore();
  const monthlyData = ref<ReadingData[]>([]);

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

  const maxMonthlyBooks = computed(() => {
    const max = Math.max(
      ...monthlyData.value.map((data) => data['Total Books Read'])
    );
    return max + 5;
  });

  async function calculateYearlyPagesRead(
    year: number,
    userId: string
  ): Promise<number> {
    let yearlyPages = 0;
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      yearlyPages += await ReadingProgressService.getMonthlyPagesRead(
        userId,
        startDate,
        endDate
      );
    }
    return yearlyPages;
  }

  async function getYearlyData(): Promise<ReadingData[]> {
    try {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

      return await Promise.all(
        years.map(async (year) => {
          const booksReadThisYear = userBooksStore.groupedBooks.read.filter(
            (book) => {
              if (!book.date_finished) return false;
              return new Date(book.date_finished).getFullYear() === year;
            }
          );

          const yearlyPages = await calculateYearlyPagesRead(
            year,
            authStore.user?.id || ''
          );

          return {
            name: year.toString(),
            'Total Books Read': booksReadThisYear.length,
            'Pages Read': yearlyPages,
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
      }));
    }
  }

  async function getMonthlyData(monthCount: number): Promise<ReadingData[]> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const months = Array.from({ length: monthCount }, (_, i) => {
      let month = currentMonth - (monthCount - 1) + i;
      let year = currentYear;
      while (month < 0) {
        month += 12;
        year -= 1;
      }
      return { month, year };
    });

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

        const pagesReadThisMonth =
          await ReadingProgressService.getMonthlyPagesRead(
            authStore.user?.id || '',
            startDate,
            endDate
          );

        return {
          name: `${startDate.toLocaleString('default', {
            month: 'short',
          })} ${year}`,
          'Total Books Read': booksReadThisMonth.length,
          'Pages Read': pagesReadThisMonth,
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

  return {
    totalBooksRead,
    totalPagesRead,
    formattedTotalBooksRead,
    formattedTotalPagesRead,
    monthlyData,
    maxMonthlyBooks,
    updateMonthlyData,
  };
});
