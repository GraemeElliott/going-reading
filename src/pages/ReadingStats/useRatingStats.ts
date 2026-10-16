import { computed } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useUserBooksStore } from '@/store/user-books-store';

// A genre needs this many rated books before it can be ranked by average rating
export const MIN_BOOKS_PER_GENRE = 5;
export const RATING_GENRE_COLORS = ['#185FA5', '#3B6D11', '#BA7517', '#3C3489', '#993556'];

// Rating stats for the Overview tab's rating breakdown and top-genres-by-rating cards
export function useRatingStats() {
  const darkModeStore = useDarkModeStore();
  const userBooksStore = useUserBooksStore();
  const isDark = computed(() => darkModeStore.darkMode);

  // Rating breakdown — count read books by user_rating (1–5)
  const ratingData = computed(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const book of userBooksStore.groupedBooks.read) {
      if (book.user_rating && book.user_rating >= 1 && book.user_rating <= 5) {
        counts[book.user_rating - 1]++;
      }
    }
    return {
      labels: ['1★', '2★', '3★', '4★', '5★'],
      datasets: [{
        data: counts,
        backgroundColor: ['#D3D1C7', '#B4B2A9', '#BA7517', '#185FA5', '#0F6E56'],
        borderRadius: 4,
        borderSkipped: false,
      }],
    };
  });

  const noRatings = computed(() => ratingData.value.datasets[0].data.every(v => v === 0));

  const ratingOptions = computed(() => {
    const tickColor = isDark.value ? '#9ca3af' : '#6b7280';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark.value ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark.value ? '#f9fafb' : '#111827',
          bodyColor: isDark.value ? '#f9fafb' : '#111827',
          borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
        y: {
          grid: { color: isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
          ticks: { color: tickColor, font: { size: 11 } },
        },
      },
    };
  });

  // Top genres by avg rating. Each rated read book counts once, under its primary
  // genre only (matching "Top genres by books read" on the Overview tab), and a
  // genre needs MIN_BOOKS_PER_GENRE rated books before it can be ranked.
  const topGenresByRating = computed(() => {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const book of userBooksStore.groupedBooks.read) {
      if (!book.user_rating || !book.genres?.length) continue;
      const primaryGenre = book.genres[0];
      if (!totals[primaryGenre]) totals[primaryGenre] = { sum: 0, count: 0 };
      totals[primaryGenre].sum += book.user_rating;
      totals[primaryGenre].count++;
    }
    return Object.entries(totals)
      .filter(([, v]) => v.count >= MIN_BOOKS_PER_GENRE)
      .map(([genre, v]) => ({ genre, rawAvg: v.sum / v.count, count: v.count }))
      // Rank on the unrounded average; ties go to the genre with more books
      .sort((a, b) => b.rawAvg - a.rawAvg || b.count - a.count)
      .slice(0, 5)
      .map(({ genre, rawAvg, count }) => ({ genre, avg: Math.round(rawAvg * 10) / 10, count }));
  });

  return { ratingData, noRatings, ratingOptions, topGenresByRating };
}
