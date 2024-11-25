import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useUserBooksStore } from './user-books-store';

const formatter = new Intl.NumberFormat('en-US');

export const useUserAnalyticsStore = defineStore('userAnalytics', () => {
  const userBooksStore = useUserBooksStore();

  const totalBooksRead = computed(() => {
    return userBooksStore.groupedBooks.read.length;
  });

  const totalPagesRead = computed(() => {
    const {
      read,
      'currently-reading': currentlyReading,
      'did-not-finish': didNotFinish,
    } = userBooksStore.groupedBooks;

    const allRelevantBooks = [...read, ...currentlyReading, ...didNotFinish];

    return allRelevantBooks.reduce((total, book) => {
      return total + (book.current_page ?? 0);
    }, 0);
  });

  const formattedTotalBooksRead = computed(() => {
    return formatter.format(totalBooksRead.value);
  });

  const formattedTotalPagesRead = computed(() => {
    return formatter.format(totalPagesRead.value);
  });

  const monthlyReadingData = computed(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month < 0) {
        month += 12;
        year -= 1;
      }

      months.push({ month, year });
    }

    // Count books read per month
    return months.map(({ month, year }) => {
      const date = new Date(year, month);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const yearString = date.getFullYear().toString();

      const booksReadThisMonth = userBooksStore.groupedBooks.read.filter(
        (book) => {
          if (!book.date_finished) return false;
          const finishDate = new Date(book.date_finished);
          return (
            finishDate.getMonth() === month && finishDate.getFullYear() === year
          );
        }
      );

      return {
        name: `${monthName} ${yearString}`,
        'Total Books Read': booksReadThisMonth.length,
      };
    });
  });

  const maxMonthlyBooks = computed(() => {
    const max = Math.max(
      ...monthlyReadingData.value.map((data) => data['Total Books Read'])
    );
    return max + 5; // Add 5 for y-axis padding
  });

  return {
    totalBooksRead,
    totalPagesRead,
    formattedTotalBooksRead,
    formattedTotalPagesRead,
    monthlyReadingData,
    maxMonthlyBooks,
  };
});
