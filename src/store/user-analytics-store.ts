import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useUserBooksStore } from './user-books-store';
import { useAuthStore } from './auth-store';
import { AnalyticsService, dateUtils } from '../services/analyticsService';
import type { ReadingData, TimePeriod } from '../types/analytics';
import { formatUtils } from '../utils/format-utils';
import { supabase } from '../supabase/supabase';

export const useUserAnalyticsStore = defineStore('userAnalytics', () => {
  const userBooksStore = useUserBooksStore();
  const authStore = useAuthStore();
  const monthlyData = ref<ReadingData[]>([]);
  const yearlyData = ref<ReadingData[]>([]);
  const totalReadingTime = ref<number>(0);
  const totalPagesRead = ref<number>(0);
  const pagesReadInitialized = ref(false);
  const currentStreak = ref(0);
  const personalBestStreak = ref(0);
  const dailyPagesMap = ref<Map<string, number>>(new Map());
  const streakInitialized = ref(false);
  const readingTimeInitialized = ref(false);

  // Computed values for total statistics
  const totalBooksRead = computed(
    () => userBooksStore.groupedBooks.read.length
  );

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

  const avgPagesPerDayOfWeek = computed(() => {
    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = Array(7).fill(0);
    const counts = Array(7).fill(0);

    for (const [dateStr, pages] of dailyPagesMap.value) {
      const d = new Date(dateStr);
      // getDay(): 0=Sun,1=Mon...6=Sat → remap to Mon=0...Sun=6
      const dow = (d.getDay() + 6) % 7;
      totals[dow] += pages;
      counts[dow]++;
    }

    const avgs = totals.map((total, i) =>
      counts[i] > 0 ? Math.round(total / counts[i]) : 0
    );

    const totalPages = totals.reduce((a, b) => a + b, 0);

    // Weekly avg: total pages / calendar weeks since first reading day
    const allDates = Array.from(dailyPagesMap.value.keys()).sort();
    let weeklyAvg = 0;
    if (allDates.length > 0) {
      const firstDay = new Date(allDates[0]);
      const today = new Date();
      const calendarWeeks = Math.max(1, (today.getTime() - firstDay.getTime()) / (7 * 86400000));
      weeklyAvg = Math.round(totalPages / calendarWeeks);
    }

    const bestDowIndex = avgs.indexOf(Math.max(...avgs));
    const bestDay = avgs[bestDowIndex] > 0 ? DAY_NAMES[bestDowIndex] : '—';

    return { labels: DAY_NAMES, avgs, weeklyAvg, bestDay };
  });

  const last12MonthsPagesPerMonth = computed(() => {
    const now = new Date();
    // Build ordered list of the last 12 months: oldest first, current month last
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      });
    }

    const totals = Array(12).fill(0);
    for (const [dateStr, pages] of dailyPagesMap.value) {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = d.getMonth();
      const idx = months.findIndex((e) => e.year === y && e.month === m);
      if (idx !== -1) totals[idx] += pages;
    }

    return {
      labels: months.map((e) => e.label),
      data: totals,
    };
  });

  const maxMonthlyBooks = computed(() => {
    const max = Math.max(
      ...monthlyData.value.map((data) => data['Total Books Read'])
    );
    return max + 5;
  });

  // Data fetching methods
  async function calculateTotalPagesRead() {
    try {
      if (!authStore.user?.id) return;

      const { data, error } = await supabase
        .from('reading_progress')
        .select('pages_read_in_session')
        .eq('user_id', authStore.user.id);

      if (error) throw error;

      totalPagesRead.value = (data || []).reduce(
        (total: number, entry: any) =>
          total + (entry.pages_read_in_session || 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total pages read:', error);
      totalPagesRead.value = 0;
    } finally {
      pagesReadInitialized.value = true;
    }
  }

  function toLocalDateStr(timestamp: string): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function calculateStreakData() {
    try {
      if (!authStore.user?.id) return;

      // Fetch both tables in parallel
      const [progressResult, activityResult] = await Promise.all([
        supabase
          .from('reading_progress')
          .select('recorded_at, pages_read_in_session')
          .eq('user_id', authStore.user.id)
          .gt('pages_read_in_session', 0),
        supabase
          .from('reading_activities')
          .select('created_at')
          .eq('user_id', authStore.user.id)
          .eq('activity_type', 'BOOK_PROGRESS_UPDATED'),
      ]);

      if (progressResult.error) throw progressResult.error;
      if (activityResult.error) throw activityResult.error;

      // Build dailyPagesMap from reading_progress (local dates)
      const pagesMap = new Map<string, number>();
      for (const row of progressResult.data || []) {
        const dateStr = toLocalDateStr(row.recorded_at);
        pagesMap.set(dateStr, (pagesMap.get(dateStr) ?? 0) + row.pages_read_in_session);
      }
      dailyPagesMap.value = pagesMap;

      // Union of reading days from both tables (local dates)
      const readingDaySet = new Set<string>(pagesMap.keys());
      for (const row of activityResult.data || []) {
        readingDaySet.add(toLocalDateStr(row.created_at));
      }

      const sortedDates = Array.from(readingDaySet).sort();

      // Local today/yesterday strings
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

      // Current streak: alive if read today or yesterday, walk back from there
      let streak = 0;
      const anchor = readingDaySet.has(todayStr)
        ? todayStr
        : readingDaySet.has(yesterdayStr)
          ? yesterdayStr
          : null;

      if (anchor) {
        const check = new Date(anchor);
        check.setHours(0, 0, 0, 0);
        while (readingDaySet.has(`${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`)) {
          streak++;
          check.setDate(check.getDate() - 1);
        }
      }
      currentStreak.value = streak;

      // Personal best: longest consecutive run across all dates
      let best = 0;
      let run = 0;
      let prev: Date | null = null;
      for (const dateStr of sortedDates) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (prev === null || (d.getTime() - prev.getTime()) / 86400000 !== 1) {
          run = 1;
        } else {
          run++;
        }
        if (run > best) best = run;
        prev = d;
      }
      personalBestStreak.value = best;
    } catch (error) {
      console.error('Error calculating streak data:', error);
    } finally {
      streakInitialized.value = true;
    }
  }

  async function calculateTotalReadingTime() {
    try {
      if (!authStore.user?.id) return;
      totalReadingTime.value = await AnalyticsService.getTotalReadingTime(
        authStore.user.id
      );
    } catch (error) {
      console.error('Error calculating total reading time:', error);
      totalReadingTime.value = 0;
    } finally {
      readingTimeInitialized.value = true;
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

  function invalidate() {
    pagesReadInitialized.value = false;
    streakInitialized.value = false;
    readingTimeInitialized.value = false;
  }

  return {
    totalBooksRead,
    totalPagesRead,
    pagesReadInitialized,
    currentStreak,
    personalBestStreak,
    dailyPagesMap,
    streakInitialized,
    readingTimeInitialized,
    last12MonthsPagesPerMonth,
    avgPagesPerDayOfWeek,
    formattedTotalBooksRead,
    formattedTotalPagesRead,
    formattedTotalReadingTime,
    monthlyData,
    yearlyData,
    maxMonthlyBooks,
    updateMonthlyData,
    updateYearlyData,
    calculateTotalPagesRead,
    calculateStreakData,
    calculateTotalReadingTime,
    invalidate,
    // Expose formatting utilities that components might need
    formatReadingTime: formatUtils.formatReadingTime,
    formatNumber: formatUtils.formatNumber,
  };
});
