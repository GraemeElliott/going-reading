<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/ui/EmptyState.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

const darkModeStore = useDarkModeStore();
const isDark = computed(() => darkModeStore.darkMode);
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();
const goalsStore = useReadingGoalsStore();
const router = useRouter();

const hasReadBooks = computed(() => userBooksStore.groupedBooks.read.length > 0);
const noRatings = computed(() => ratingData.value.datasets[0].data.every(v => v === 0));
const noDowData = computed(() => analyticsStore.avgPagesPerDayOfWeek.avgs.every(v => v === 0));

const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
const tickColor = computed(() => isDark.value ? '#9ca3af' : '#6b7280');
const tooltipBg = computed(() => isDark.value ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)');
const tooltipText = computed(() => isDark.value ? '#f9fafb' : '#111827');
const tooltipBorder = computed(() => isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');

const baseTooltip = computed(() => ({
  backgroundColor: tooltipBg.value,
  titleColor: tooltipText.value,
  bodyColor: tooltipText.value,
  borderColor: tooltipBorder.value,
  borderWidth: 1,
}));

const noXGrid = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 12 } } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
  },
}));

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

// Pages by day of week — from analytics store
const dowData = computed(() => ({
  labels: analyticsStore.avgPagesPerDayOfWeek.labels,
  datasets: [{
    data: analyticsStore.avgPagesPerDayOfWeek.avgs,
    backgroundColor: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)',
    borderRadius: 3,
    borderSkipped: false,
  }],
}));

// Top genres by avg rating — aggregate user_rating per genre from read books
const GENRE_COLORS = ['#185FA5', '#3B6D11', '#BA7517', '#3C3489', '#993556'];
const topGenresByRating = computed(() => {
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const book of userBooksStore.groupedBooks.read) {
    if (!book.user_rating || !book.genres?.length) continue;
    for (const genre of book.genres) {
      if (!totals[genre]) totals[genre] = { sum: 0, count: 0 };
      totals[genre].sum += book.user_rating;
      totals[genre].count++;
    }
  }
  return Object.entries(totals)
    .filter(([, v]) => v.count >= 2)
    .map(([genre, v]) => ({ genre, avg: Math.round((v.sum / v.count) * 10) / 10 }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);
});
const genres = computed(() => topGenresByRating.value.map(g => g.genre));
const avgRatings = computed(() => topGenresByRating.value.map(g => g.avg));
const gColors = GENRE_COLORS;

type Highlight = { color: string; text: string; bold: string; after: string; bold2?: string; after2?: string };

// Weekend vs weekday reading ratio
function insightWeekendRatio(): Highlight | null {
  const { avgs, bestDay } = analyticsStore.avgPagesPerDayOfWeek;
  const weekdayAvg = avgs.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const weekendAvg = (avgs[5] + avgs[6]) / 2;
  if (weekdayAvg === 0 || weekendAvg === 0) return null;
  const pct = Math.round(Math.abs(weekendAvg - weekdayAvg) / weekdayAvg * 100);
  if (pct < 5) return null;
  const more = weekendAvg > weekdayAvg;
  return {
    color: '#3B6D11',
    text: 'You read ',
    bold: `${pct}% ${more ? 'more' : 'less'}`,
    after: ` on weekends vs weekdays. `,
    bold2: bestDay,
    after2: ' is your peak day.',

  };
}

// Busiest month by pages read
function insightBusiestMonth(): Highlight | null {
  const map = analyticsStore.dailyPagesMap;
  if (map.size === 0) return null;
  const monthTotals: Record<string, { pages: number; year: number; month: number }> = {};
  for (const [dateStr, pages] of map) {
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthTotals[key]) monthTotals[key] = { pages: 0, year: d.getFullYear(), month: d.getMonth() };
    monthTotals[key].pages += pages;
  }
  const best = Object.values(monthTotals).sort((a, b) => b.pages - a.pages)[0];
  if (!best || best.pages === 0) return null;
  const monthName = new Date(best.year, best.month, 1).toLocaleString('default', { month: 'long' });
  const booksInMonth = userBooksStore.groupedBooks.read.filter(b => {
    if (!b.date_finished) return false;
    const d = new Date(b.date_finished);
    return d.getMonth() === best.month && d.getFullYear() === best.year;
  }).length;
  const bookStr = booksInMonth > 0 ? ` across ${booksInMonth} book${booksInMonth !== 1 ? 's' : ''}` : '';
  return {
    color: '#3C3489',
    text: 'Busiest month was ',
    bold: monthName,
    after: ` — ${best.pages.toLocaleString()} pages${bookStr}.`,
  };
}

// Top genre vs second genre rating gap
function insightTopGenreGap(): Highlight | null {
  if (topGenresByRating.value.length < 2) return null;
  const top = topGenresByRating.value[0];
  const second = topGenresByRating.value[1];
  if (top.avg === second.avg) return null;
  return {
    color: '#BA7517',
    text: `${top.genre} books average `,
    bold: `${top.avg.toFixed(1)}★`,
    after: ` vs ${second.avg.toFixed(1)}★ for ${second.genre}.`,
  };
}

// Unique authors read this year
function insightUniqueAuthors(): Highlight | null {
  const thisYear = new Date().getFullYear();
  const thisYearBooks = userBooksStore.groupedBooks.read.filter(b =>
    b.date_finished && new Date(b.date_finished).getFullYear() === thisYear
  );
  if (thisYearBooks.length === 0) return null;
  const uniqueAuthors = new Set(thisYearBooks.flatMap(b => b.authors ?? []));
  const n = uniqueAuthors.size;
  if (n === 0) return null;
  return {
    color: '#0F6E56',
    text: "You've read ",
    bold: `${n} different author${n !== 1 ? 's' : ''}`,
    after: ' this year.',
  };
}

// Most recently finished 5-star book
function insightHighestRatedBook(): Highlight | null {
  const fiveStars = userBooksStore.groupedBooks.read
    .filter(b => b.user_rating === 5)
    .sort((a, b) => {
      const da = a.date_finished ? new Date(a.date_finished).getTime() : 0;
      const db = b.date_finished ? new Date(b.date_finished).getTime() : 0;
      return db - da;
    });
  if (fiveStars.length === 0) return null;
  return {
    color: '#185FA5',
    text: 'Top-rated read: ',
    bold: fiveStars[0].title,
    after: ' — 5★.',
  };
}

// Longest book read
function insightLongestBook(): Highlight | null {
  const withPages = userBooksStore.groupedBooks.read.filter(b => b.pages && b.pages > 0);
  if (withPages.length === 0) return null;
  const book = withPages.reduce((a, b) => (b.pages! > a.pages! ? b : a));
  return {
    color: '#993556',
    text: 'Longest read: ',
    bold: book.title,
    after: ` — ${book.pages!.toLocaleString()} pages.`,
  };
}

// Goal pace projection
function insightGoalPace(): Highlight | null {
  const goal = goalsStore.currentGoal?.goal;
  if (!goal) return null;
  const thisYear = new Date().getFullYear();
  const booksRead = userBooksStore.groupedBooks.read.filter(b =>
    b.date_finished && new Date(b.date_finished).getFullYear() === thisYear
  ).length;
  if (booksRead === 0) return null;
  const now = new Date();
  const startOfYear = new Date(thisYear, 0, 1);
  const endOfYear = new Date(thisYear, 11, 31);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000));
  const daysInYear = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / 86400000);
  const daysRemaining = daysInYear - daysElapsed;
  if (booksRead >= goal) {
    return {
      color: '#0F6E56',
      text: "You've already hit your ",
      bold: `${goal}-book goal`,
      after: ` for ${thisYear}!`,
    };
  }
  const pace = booksRead / daysElapsed;
  const daysToGoal = (goal - booksRead) / pace;
  const projectedDate = new Date(now.getTime() + daysToGoal * 86400000);
  if (projectedDate <= endOfYear) {
    const month = projectedDate.toLocaleString('default', { month: 'long' });
    const day = projectedDate.getDate();
    const suffix = [, 'st', 'nd', 'rd'][day] ?? 'th';
    return {
      color: '#993556',
      text: `At current pace you'll hit your ${goal}-book goal by `,
      bold: `${month} ${day}${suffix}`,
      after: '.',
    };
  } else {
    const projected = Math.floor(booksRead + pace * daysRemaining);
    return {
      color: '#993556',
      text: 'On track for ',
      bold: `${projected} of ${goal} books`,
      after: ` this year — ${goal - projected} short of goal.`,
    };
  }
}

const highlights = computed(() =>
  [
    insightWeekendRatio(),
    insightBusiestMonth(),
    insightTopGenreGap(),
    insightUniqueAuthors(),
    insightHighestRatedBook(),
    insightLongestBook(),
    insightGoalPace(),
  ].filter((h): h is Highlight => h !== null)
);
</script>

<template>
  <div>
    <!-- Full tab gate: no read books yet -->
    <EmptyState
      v-if="!hasReadBooks"
      icon="fa-solid fa-magnifying-glass-chart"
      title="Insights unlock as you read"
      description="Rate finished books to see your rating breakdown and top genres. Log reading sessions to see your day-of-week patterns."
      cta-label="Start adding books"
      :cta-action="() => router.push('/search/')"
      size="lg"
    />

    <template v-else>
      <!-- Top 3-col grid: rating, day-of-week, genre ratings -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div
          class="rounded-lg border p-4"
          :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Rating breakdown</div>
          <div class="h-44">
            <Chart v-if="!noRatings" type="bar" :data="ratingData" :options="noXGrid" />
            <EmptyState v-else icon="fa-solid fa-star-half-stroke" title="No rated books yet" size="sm" />
          </div>
        </div>
        <div
          class="rounded-lg border p-4"
          :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Pages by day of week</div>
          <div class="h-44">
            <Chart v-if="!noDowData" type="bar" :data="dowData" :options="noXGrid" />
            <EmptyState v-else icon="fa-solid fa-calendar-days" title="No session data yet" size="sm" />
          </div>
        </div>
        <div
          class="rounded-lg border p-4"
          :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Top genres by avg rating</div>
          <div class="mt-1">
            <div v-if="genres.length > 0">
              <div v-for="(genre, i) in genres" :key="genre" class="flex items-center gap-2.5 mb-2.5 last:mb-0">
                <span class="text-xs w-20 flex-shrink-0" :class="isDark ? 'text-gray-300' : 'text-gray-600'">{{ genre }}</span>
                <div class="flex-1 h-1.5 rounded-full overflow-hidden" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'">
                  <div class="h-full rounded-full" :style="{ width: Math.round(avgRatings[i] / 5 * 100) + '%', background: gColors[i] }"></div>
                </div>
                <span class="text-xs w-7 text-right flex-shrink-0" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ avgRatings[i]?.toFixed(1) }}</span>
              </div>
            </div>
            <EmptyState v-else icon="fa-solid fa-tags" title="Rate 2+ books in the same genre to see rankings" size="sm" />
          </div>
        </div>
      </div>

      <!-- Reading highlights -->
      <div>
        <div
          class="rounded-lg border p-4"
          :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Reading highlights</div>
          <template v-if="highlights.length > 0">
            <div
              v-for="(h, i) in highlights"
              :key="i"
              class="flex items-start gap-2.5 py-2.5 border-b last:border-b-0"
              :class="isDark ? 'border-gray-700' : 'border-gray-100'"
            >
              <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1" :style="{ background: h.color }"></span>
              <span class="text-sm leading-relaxed" :class="isDark ? 'text-gray-300' : 'text-gray-600'">
                {{ h.text }}<strong :class="isDark ? 'text-white' : 'text-gray-900'">{{ h.bold }}</strong>{{ h.after }}<template v-if="h.bold2"><strong :class="isDark ? 'text-white' : 'text-gray-900'">{{ h.bold2 }}</strong>{{ h.after2 }}</template>
              </span>
            </div>
          </template>
          <EmptyState
            v-else
            icon="fa-solid fa-lightbulb"
            title="No highlights yet"
            description="Keep reading and rating — highlights appear once there's enough data."
            size="sm"
          />
        </div>
      </div>
    </template>
  </div>
</template>
