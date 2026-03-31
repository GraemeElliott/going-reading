<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed, onMounted, ref } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler, BarController, LineController
);

const darkModeStore = useDarkModeStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();
const goalsStore = useReadingGoalsStore();
const isDark = computed(() => darkModeStore.darkMode);

const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;
const currentMonth = new Date().getMonth(); // 0-indexed
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const yearlyDataLoading = ref(true);

onMounted(async () => {
  await analyticsStore.updateYearlyData();
  yearlyDataLoading.value = false;
});

// ── Theme helpers ────────────────────────────────────────────────────────
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

// ── Pages per month for current and previous year (from dailyPagesMap) ───
const pagesPerYearMonthly = computed(() => {
  const thisYear = Array(12).fill(0);
  const prevYear = Array(12).fill(0);
  for (const [dateStr, pages] of analyticsStore.dailyPagesMap) {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth();
    if (y === currentYear) thisYear[m] += pages;
    else if (y === lastYear) prevYear[m] += pages;
  }
  return { thisYear, prevYear };
});

const pagesThisYear = computed(() =>
  pagesPerYearMonthly.value.thisYear.reduce((a, b) => a + b, 0)
);
const pagesLastYear = computed(() =>
  pagesPerYearMonthly.value.prevYear.reduce((a, b) => a + b, 0)
);

// ── Books read last year (from store, no extra fetch needed) ─────────────
const booksReadLastYear = computed(() =>
  userBooksStore.groupedBooks.read.filter(b => {
    if (!b.date_finished) return false;
    return new Date(b.date_finished).getFullYear() === lastYear;
  }).length
);

// ── Books added per year ─────────────────────────────────────────────────
const booksAddedThisYear = computed(() =>
  userBooksStore.userBooks.filter(b =>
    new Date(b.date_added).getFullYear() === currentYear
  ).length
);
const booksAddedLastYear = computed(() =>
  userBooksStore.userBooks.filter(b =>
    new Date(b.date_added).getFullYear() === lastYear
  ).length
);

// ── Reading time per year (requires yearlyData) ──────────────────────────
const currentYearEntry = computed(() =>
  analyticsStore.yearlyData.find(d => d.name === String(currentYear))
);
const lastYearEntry = computed(() =>
  analyticsStore.yearlyData.find(d => d.name === String(lastYear))
);
const readingTimeThisYear = computed(() => currentYearEntry.value?.['Reading Time'] ?? 0);
const readingTimeLastYear = computed(() => lastYearEntry.value?.['Reading Time'] ?? 0);

// ── Goal ─────────────────────────────────────────────────────────────────
const goalValue = computed(() => goalsStore.currentGoal?.goal ?? 0);

// ── Books read by month (current year) ───────────────────────────────────
const booksReadByMonth = computed(() => {
  const counts = Array(12).fill(0);
  for (const book of userBooksStore.groupedBooks.read) {
    if (!book.date_finished) continue;
    const d = new Date(book.date_finished);
    if (d.getFullYear() === currentYear) counts[d.getMonth()]++;
  }
  return counts;
});

// ── Books/month needed to hit annual goal ────────────────────────────────
// For past/current months: rolling calc showing how pace requirement changed.
// For future months: flat projection based on today's deficit so the line
// doesn't spike as the denominator shrinks toward 1 on unread future months.
const neededPerMonth = computed(() => {
  if (!goalValue.value) return Array(12).fill(0);
  const monthsLeft = 12 - (currentMonth + 1);
  const deficit = Math.max(goalValue.value - userBooksStore.booksReadThisYear, 0);
  const flatProjection = monthsLeft > 0 ? Math.round((deficit / monthsLeft) * 10) / 10 : 0;

  return booksReadByMonth.value.map((_, i) => {
    if (i > currentMonth) return flatProjection;
    const cum = booksReadByMonth.value.slice(0, i + 1).reduce((a, b) => a + b, 0);
    const rem = Math.max(goalValue.value - cum, 0);
    const mLeft = 12 - (i + 1);
    return mLeft > 0 ? Math.round((rem / mLeft) * 10) / 10 : 0;
  });
});

// ── Reading pace: avg pages per active reading day, by month ─────────────
const readingPaceByMonth = computed(() => {
  const totals = Array(12).fill(0);
  const activeDays = Array(12).fill(0);
  for (const [dateStr, pages] of analyticsStore.dailyPagesMap) {
    if (pages <= 0) continue;
    const d = new Date(dateStr);
    if (d.getFullYear() !== currentYear) continue;
    const m = d.getMonth();
    totals[m] += pages;
    activeDays[m]++;
  }
  return totals.map((total, i) =>
    activeDays[i] > 0 ? Math.round(total / activeDays[i]) : 0
  );
});

// ── Longest / shortest reads by page count (current year) ────────────────
const sortedByPages = computed(() =>
  userBooksStore.groupedBooks.read
    .filter(b => (b.pages ?? 0) > 0 && b.date_finished && new Date(b.date_finished).getFullYear() === currentYear)
    .slice()
    .sort((a, b) => (b.pages ?? 0) - (a.pages ?? 0))
);
const longestBook = computed(() => sortedByPages.value[0] ?? null);
const shortestBook = computed(() => sortedByPages.value[sortedByPages.value.length - 1] ?? null);

// ── Formatters ───────────────────────────────────────────────────────────
function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('default', { month: 'short', year: 'numeric' });
}

function formatHours(minutes: number): string {
  if (minutes === 0) return '0h';
  return `${Math.floor(minutes / 60)}h`;
}

function signedDiff(
  curr: number,
  prev: number,
  fmt: (n: number) => string = (n) => String(n),
): string {
  if (prev === 0) return curr > 0 ? `+${fmt(curr)}` : '—';
  const diff = curr - prev;
  const abs = Math.abs(diff);
  return diff >= 0 ? `+${fmt(abs)}` : `-${fmt(abs)}`;
}

function hoursYoYSub(curr: number, prev: number): string {
  if (yearlyDataLoading.value) return '';
  if (prev === 0) return '';
  const diff = curr - prev;
  const h = Math.floor(Math.abs(diff) / 60);
  if (h === 0) return `${diff >= 0 ? '+' : '-'}<1h vs ${lastYear}`;
  return `${diff >= 0 ? '+' : '-'}${h}h vs ${lastYear}`;
}

// ── Metric cards ─────────────────────────────────────────────────────────
const metricCards = computed(() => {
  const booksThis = userBooksStore.booksReadThisYear;
  const booksLast = booksReadLastYear.value;
  const pagesThis = pagesThisYear.value;
  const pagesLast = pagesLastYear.value;
  const timeThis = readingTimeThisYear.value;
  const timeLast = readingTimeLastYear.value;
  const addedThis = booksAddedThisYear.value;
  const addedLast = booksAddedLastYear.value;

  return [
    {
      label: `Books read ${currentYear}`,
      value: String(booksThis),
      sub: booksLast > 0
        ? `${signedDiff(booksThis, booksLast)} vs ${lastYear}`
        : `0 read in ${lastYear}`,
      pos: booksThis >= booksLast,
    },
    {
      label: `Pages read ${currentYear}`,
      value: pagesThis.toLocaleString(),
      sub: pagesLast > 0
        ? `${signedDiff(pagesThis, pagesLast, (n) => n.toLocaleString())} vs ${lastYear}`
        : '',
      pos: pagesThis >= pagesLast,
    },
    {
      label: `Reading time ${currentYear}`,
      value: yearlyDataLoading.value ? '—' : formatHours(timeThis),
      sub: hoursYoYSub(timeThis, timeLast),
      pos: timeThis >= timeLast,
    },
    {
      label: `Books added ${currentYear}`,
      value: String(addedThis),
      sub: addedLast > 0
        ? `${signedDiff(addedThis, addedLast)} vs ${lastYear}`
        : '',
      pos: addedThis >= addedLast,
    },
    {
      label: `${currentYear} target`,
      value: goalValue.value
        ? `${booksThis} / ${goalValue.value}`
        : `${booksThis} read`,
      sub: (() => {
        if (!goalValue.value) return 'No goal set';
        if (booksThis >= goalValue.value) return `${Math.round((booksThis / goalValue.value) * 100)}% · complete!`;
        const now = new Date();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000));
        const daysInYear = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / 86400000);
        const pace = booksThis / daysElapsed;
        const projected = Math.floor(booksThis + pace * (daysInYear - daysElapsed));
        const onTrack = projected >= goalValue.value;
        return `${Math.round((booksThis / goalValue.value) * 100)}% · ${onTrack ? 'on track' : 'behind pace'}`;
      })(),
      pos: (() => {
        if (!goalValue.value || booksThis >= goalValue.value) return true;
        const now = new Date();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);
        const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000));
        const daysInYear = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / 86400000);
        const pace = booksThis / daysElapsed;
        const projected = Math.floor(booksThis + pace * (daysInYear - daysElapsed));
        return projected >= goalValue.value;
      })(),
    },
  ];
});

// ── Chart data & options ─────────────────────────────────────────────────

const cmpPagesData = computed(() => ({
  labels: months,
  datasets: [
    {
      label: String(currentYear),
      data: pagesPerYearMonthly.value.thisYear,
      backgroundColor: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)',
      borderRadius: 3,
      borderSkipped: false,
    },
    {
      label: String(lastYear),
      data: pagesPerYearMonthly.value.prevYear,
      backgroundColor: isDark.value ? 'rgba(0,128,128,0.3)' : 'rgba(0,128,128,0.25)',
      borderRadius: 3,
      borderSkipped: false,
    },
  ],
}));

const cmpPagesOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: tickColor.value, usePointStyle: true, font: { size: 12 } },
    },
    tooltip: { ...baseTooltip.value },
  },
  scales: {
    x: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, maxRotation: 0 } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
  },
}));

const paceData = computed(() => ({
  labels: months.slice(0, currentMonth + 1),
  datasets: [{
    data: readingPaceByMonth.value.slice(0, currentMonth + 1),
    borderColor: '#7F77DD',
    backgroundColor: 'rgba(127,119,221,0.08)',
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointBackgroundColor: '#7F77DD',
  }],
}));

const paceOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 11 }, maxRotation: 0 } },
    y: {
      grid: { color: gridColor.value },
      ticks: { color: tickColor.value, font: { size: 11 } },
      title: { display: true, text: 'pages/day', color: tickColor.value, font: { size: 11 } },
    },
  },
}));

const goalData = computed(() => ({
  labels: months,
  datasets: [
    {
      type: 'bar' as const,
      label: 'Books read',
      data: booksReadByMonth.value,
      backgroundColor: isDark.value ? 'rgba(15,110,86,0.8)' : 'rgba(15,110,86,0.7)',
      borderRadius: 3,
      borderSkipped: false,
      yAxisID: 'y',
    },
    {
      type: 'line' as const,
      label: 'Needed/month',
      data: neededPerMonth.value,
      borderColor: '#E24B4A',
      borderDash: [4, 3] as number[],
      backgroundColor: 'transparent',
      pointRadius: 3,
      pointBackgroundColor: '#E24B4A',
      yAxisID: 'y',
      tension: 0,
    },
  ],
}));

const goalOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: tickColor.value, usePointStyle: true, font: { size: 12 } },
    },
    tooltip: { ...baseTooltip.value },
  },
  scales: {
    x: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, maxRotation: 0 } },
    y: {
      grid: { color: gridColor.value },
      ticks: { color: tickColor.value, font: { size: 11 } },
      title: { display: true, text: 'books', color: tickColor.value, font: { size: 11 } },
    },
  },
}));
</script>

<template>
  <div>
    <!-- Metric cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="rounded-lg p-4"
        :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
      >
        <div class="text-xs mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ card.label }}</div>
        <div class="text-2xl font-medium leading-none">{{ card.value }}</div>
        <div
          v-if="card.sub"
          class="text-xs mt-1.5"
          :class="card.label.includes('target')
            ? (isDark ? 'text-gray-400' : 'text-gray-500')
            : card.pos
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'"
        >
          {{ card.sub }}
        </div>
      </div>
    </div>

    <!-- YoY pages comparison chart -->
    <div
      class="rounded-lg border p-4 mb-3"
      :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
        Pages read · {{ currentYear }} vs {{ lastYear }}
      </div>
      <div class="h-52">
        <Chart type="bar" :data="cmpPagesData" :options="cmpPagesOptions" />
      </div>
    </div>

    <!-- Reading pace + Goal tracker -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Reading pace · pages/day trend
        </div>
        <div v-if="paceData.datasets[0].data.every(v => v === 0)" class="h-44 flex items-center justify-center">
          <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No reading sessions logged this year.</p>
        </div>
        <div v-else class="h-44">
          <Chart type="line" :data="paceData" :options="paceOptions" />
        </div>
      </div>

      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Monthly goal tracker
        </div>
        <div v-if="!goalValue" class="h-44 flex items-center justify-center">
          <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Set an annual goal to see your monthly tracker.</p>
        </div>
        <div v-else class="h-44">
          <Chart type="bar" :data="goalData" :options="goalOptions" />
        </div>
      </div>
    </div>

    <!-- Longest / shortest reads -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Longest read -->
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Longest read · {{ currentYear }}
        </div>
        <p v-if="!longestBook" class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          No finished books with page counts this year.
        </p>
        <div v-else class="flex gap-4">
          <img
            v-if="longestBook.image"
            :src="longestBook.image"
            :alt="longestBook.title"
            class="w-24 self-stretch object-cover rounded flex-shrink-0"
          />
          <div v-else class="w-24 flex-shrink-0 rounded flex items-center justify-center text-[9px] font-medium text-center leading-tight p-2" :class="isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'">
            {{ longestBook.title }}
          </div>
          <div class="flex flex-col justify-center gap-1.5">
            <div class="text-sm font-medium leading-snug">{{ longestBook.title }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ longestBook.authors.join(', ') }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ (longestBook.pages ?? 0).toLocaleString() }} pages</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ formatMonthYear(longestBook.date_finished) }}</div>
          </div>
        </div>
      </div>

      <!-- Shortest read -->
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          Shortest read · {{ currentYear }}
        </div>
        <p v-if="!shortestBook" class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          No finished books with page counts this year.
        </p>
        <div v-else class="flex gap-4">
          <img
            v-if="shortestBook.image"
            :src="shortestBook.image"
            :alt="shortestBook.title"
            class="w-24 self-stretch object-cover rounded flex-shrink-0"
          />
          <div v-else class="w-24 flex-shrink-0 rounded flex items-center justify-center text-[9px] font-medium text-center leading-tight p-2" :class="isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'">
            {{ shortestBook.title }}
          </div>
          <div class="flex flex-col justify-center gap-1.5">
            <div class="text-sm font-medium leading-snug">{{ shortestBook.title }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ shortestBook.authors.join(', ') }}</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ (shortestBook.pages ?? 0).toLocaleString() }} pages</div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ formatMonthYear(shortestBook.date_finished) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
