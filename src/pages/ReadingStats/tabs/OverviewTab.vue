<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed, ref, onMounted } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { useAuthStore } from '@/store/auth-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import ReadingHeatmap from './ReadingHeatmap.vue';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler, BarController, LineController, DoughnutController
);

const darkModeStore = useDarkModeStore();
const authStore = useAuthStore();
const goalsStore = useReadingGoalsStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();
const isDark = computed(() => darkModeStore.darkMode);

const currentYear = new Date().getFullYear();
const goalInput = ref('');
const isEditingGoal = ref(false);

const avgPagesPerBook = computed(() => {
  if (!userBooksStore.totalBooksRead) return 0;
  return Math.round(analyticsStore.totalPagesRead / userBooksStore.totalBooksRead);
});


onMounted(async () => {
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.fetchGoal(userId, currentYear);
});

const goalValue = computed(() => goalsStore.currentGoal?.goal ?? null);

const goalProgress = computed(() => {
  if (!goalValue.value || goalValue.value === 0) return 0;
  return Math.min(userBooksStore.booksReadThisYear / goalValue.value, 1);
});

const CIRCUMFERENCE = 276.46; // 2 * π * 44
const ringOffset = computed(() => CIRCUMFERENCE * (1 - goalProgress.value));
const goalPercent = computed(() => Math.round(goalProgress.value * 100));
const remaining = computed(() => Math.max((goalValue.value ?? 0) - userBooksStore.booksReadThisYear, 0));

const startEditingGoal = () => {
  goalInput.value = goalValue.value ? String(goalValue.value) : '';
  isEditingGoal.value = true;
};

const saveGoal = async () => {
  const parsed = parseInt(goalInput.value, 10);
  if (!parsed || parsed < 1) return;
  const userId = authStore.user?.id;
  if (!userId) return;
  await goalsStore.setGoal(userId, currentYear, parsed);
  isEditingGoal.value = false;
};

const cancelEdit = () => {
  isEditingGoal.value = false;
  goalInput.value = '';
};

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

// Pages per month chart
const pagesChartData = computed(() => ({
  labels: analyticsStore.last12MonthsPagesPerMonth.labels,
  datasets: [{
    data: analyticsStore.last12MonthsPagesPerMonth.data,
    backgroundColor: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)',
    borderRadius: 3,
    borderSkipped: false,
  }],
}));

const pagesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value } },
  scales: {
    x: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
  },
}));

// Currently reading
const currentlyReading = computed(() =>
  [...userBooksStore.groupedBooks['currently-reading']]
    .sort((a, b) => new Date(a.date_added).getTime() - new Date(b.date_added).getTime())
    .map((book) => {
      const page = book.current_page ?? 0;
      const total = book.pages ?? 0;
      const progress = total > 0 ? Math.round((page / total) * 100) : 0;
      return { book, page, total, progress };
    })
);

const BOOKS_PER_PAGE = 2;
const currentlyReadingPage = ref(0);
const currentlyReadingPageCount = computed(() =>
  Math.ceil(currentlyReading.value.length / BOOKS_PER_PAGE)
);
const currentlyReadingVisible = computed(() =>
  currentlyReading.value.slice(
    currentlyReadingPage.value * BOOKS_PER_PAGE,
    currentlyReadingPage.value * BOOKS_PER_PAGE + BOOKS_PER_PAGE
  )
);

// Books by status doughnut
const statusCounts = computed(() => ({
  read: userBooksStore.groupedBooks['read'].length,
  'want-to-read': userBooksStore.groupedBooks['want-to-read'].length,
  'currently-reading': userBooksStore.groupedBooks['currently-reading'].length,
  'did-not-finish': userBooksStore.groupedBooks['did-not-finish'].length,
}));

const statusData = computed(() => ({
  labels: ['Read', 'Want to read', 'Currently reading', 'Did not finish'],
  datasets: [{
    data: [
      statusCounts.value['read'],
      statusCounts.value['want-to-read'],
      statusCounts.value['currently-reading'],
      statusCounts.value['did-not-finish'],
    ],
    backgroundColor: ['#0F6E56','#185FA5','#BA7517','#A32D2D'],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}));

const statusOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value } },
  cutout: '65%',
}));

// Avg pages per session line chart
const sessionData = computed(() => ({
  labels: analyticsStore.avgPagesPerDayOfWeek.labels,
  datasets: [{
    data: analyticsStore.avgPagesPerDayOfWeek.avgs,
    borderColor: '#7F77DD',
    backgroundColor: 'rgba(127,119,221,0.08)',
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointBackgroundColor: '#7F77DD',
  }],
}));

const sessionOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 10 } } },
    y: { display: false },
  },
}));

const statusLegend = computed(() => [
  { label: 'Read', count: statusCounts.value['read'], color: '#0F6E56' },
  { label: 'Want to read', count: statusCounts.value['want-to-read'], color: '#185FA5' },
  { label: 'Currently reading', count: statusCounts.value['currently-reading'], color: '#BA7517' },
  { label: 'Did not finish', count: statusCounts.value['did-not-finish'], color: '#A32D2D' },
]);

// Books read per year since joining (derived from earliest date_added)
const booksPerYearData = computed(() => {
  const allBooks = userBooksStore.userBooks;
  const readBooks = userBooksStore.groupedBooks.read.filter(b => b.date_finished);

  const joinYear = allBooks.length > 0
    ? Math.min(...allBooks.map(b => new Date(b.date_added).getFullYear()))
    : currentYear;

  const years: number[] = [];
  for (let y = joinYear; y <= currentYear; y++) years.push(y);

  const counts = years.map(y =>
    readBooks.filter(b => new Date(b.date_finished!).getFullYear() === y).length
  );

  return {
    labels: years.map(String),
    datasets: [{
      data: counts,
      backgroundColor: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };
});

const booksPerYearOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...baseTooltip.value, callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} book${ctx.parsed.y !== 1 ? 's' : ''}` } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 12 } } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
  },
}));
</script>

<template>
  <div>
    <!-- Metric cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
      <div
        v-for="metric in [
          { label: 'Total Books Read', value: String(userBooksStore.totalBooksRead), sub: userBooksStore.avgBooksPerYear ? `avg ${userBooksStore.avgBooksPerYear}/year` : '', subClass: '' },
          { label: 'Total Pages Read', value: analyticsStore.formattedTotalPagesRead, sub: avgPagesPerBook ? `avg ${avgPagesPerBook}/book` : '', subClass: '' },
          { label: 'Reading Streak', value: analyticsStore.currentStreak === 1 ? '1 day' : `${analyticsStore.currentStreak} days`, sub: analyticsStore.personalBestStreak > 0 ? `${analyticsStore.personalBestStreak} day personal best` : '', subClass: 'text-green-700 dark:text-green-400' },
          { label: 'Total Reading Time', value: analyticsStore.formattedTotalReadingTime, sub: '', subClass: '' },
        ]"
        :key="metric.label"
        class="rounded-lg p-4"
        :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
      >
        <div class="text-xs mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ metric.label }}</div>
        <div class="text-2xl font-medium leading-none">{{ metric.value }}</div>
        <div class="text-xs mt-1.5" :class="metric.subClass || (isDark ? 'text-gray-400' : 'text-gray-500')">{{ metric.sub }}</div>
      </div>
    </div>

    <!-- Pages chart + Goal ring -->
    <div class="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-3 mb-3">
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Pages per month</div>
        <div class="h-44">
          <Chart type="bar" :data="pagesChartData" :options="pagesChartOptions" />
        </div>
      </div>

      <!-- Goal ring card -->
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="text-xs font-medium uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Annual goal · {{ currentYear }}
          </div>
          <button
            v-if="goalValue && !isEditingGoal"
            class="text-xs flex items-center gap-1"
            :class="isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'"
            @click="startEditingGoal"
          >
            <font-awesome-icon icon="fa-solid fa-pen" class="text-[10px]" />
            Edit
          </button>
        </div>

        <!-- No goal set -->
        <div v-if="!goalValue && !isEditingGoal" class="flex flex-col items-center justify-center py-6 gap-3">
          <p class="text-sm text-center" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Set your {{ currentYear }} reading goal
          </p>
          <button
            class="text-sm px-4 py-1.5 rounded-md font-medium"
            :class="isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'"
            @click="startEditingGoal"
          >
            Set goal
          </button>
        </div>

        <!-- Goal input (set or edit) -->
        <div v-else-if="isEditingGoal" class="flex flex-col items-center justify-center py-4 gap-3">
          <p class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            Books to read in {{ currentYear }}
          </p>
          <input
            v-model="goalInput"
            type="number"
            min="1"
            class="w-24 text-center text-2xl font-medium rounded-md border px-2 py-1 bg-transparent outline-none focus:ring-2 focus:ring-green-600"
            :class="isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-900'"
            @keyup.enter="saveGoal"
          />
          <div class="flex gap-2">
            <button
              class="text-sm px-4 py-1.5 rounded-md font-medium text-white bg-green-700 hover:bg-green-800"
              :disabled="goalsStore.loading"
              @click="saveGoal"
            >
              {{ goalsStore.loading ? 'Saving…' : 'Save' }}
            </button>
            <button
              class="text-sm px-3 py-1.5 rounded-md"
              :class="isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Goal ring -->
        <div v-else class="flex flex-col items-center py-2">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="44" fill="none" stroke-width="8" :stroke="isDark ? '#1f2f28' : '#E1F5EE'"/>
            <circle
              cx="55" cy="55" r="44" fill="none" stroke-width="8" stroke="#0F6E56"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="ringOffset"
              stroke-linecap="round"
              transform="rotate(-90 55 55)"
            />
            <text x="55" y="51" text-anchor="middle" font-size="20" font-weight="500" :fill="isDark ? '#e5e7eb' : '#111827'">
              {{ userBooksStore.booksReadThisYear }}
            </text>
            <text x="55" y="64" text-anchor="middle" font-size="11" fill="#888780">
              of {{ goalValue }}
            </text>
          </svg>
          <div class="grid grid-cols-2 gap-2 mt-3 w-full">
            <div class="text-center">
              <div class="text-lg font-medium">{{ goalPercent }}%</div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">complete</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-medium">{{ remaining }}</div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">remaining</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Currently reading + Status chart -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="text-xs font-medium uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Currently reading</div>
          <div v-if="currentlyReadingPageCount > 1" class="flex items-center gap-2">
            <button
              class="w-5 h-5 flex items-center justify-center rounded transition-colors"
              :class="currentlyReadingPage === 0
                ? (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')
                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')"
              :disabled="currentlyReadingPage === 0"
              @click="currentlyReadingPage--"
            >
              <font-awesome-icon icon="fa-solid fa-chevron-left" class="text-[10px]" />
            </button>
            <span class="text-[11px]" :class="isDark ? 'text-gray-500' : 'text-gray-400'">{{ currentlyReadingPage + 1 }} / {{ currentlyReadingPageCount }}</span>
            <button
              class="w-5 h-5 flex items-center justify-center rounded transition-colors"
              :class="currentlyReadingPage === currentlyReadingPageCount - 1
                ? (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')
                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')"
              :disabled="currentlyReadingPage === currentlyReadingPageCount - 1"
              @click="currentlyReadingPage++"
            >
              <font-awesome-icon icon="fa-solid fa-chevron-right" class="text-[10px]" />
            </button>
          </div>
        </div>
        <p v-if="currentlyReading.length === 0" class="text-sm" :class="isDark ? 'text-gray-400' : 'text-gray-500'">No books currently being read.</p>
        <div
          v-for="{ book, page, total, progress } in currentlyReadingVisible"
          :key="book.isbn"
          class="flex gap-3 items-start py-2.5 border-b last:border-b-0"
          :class="isDark ? 'border-gray-700' : 'border-gray-100'"
        >
          <img
            v-if="book.image"
            :src="book.image"
            :alt="book.title"
            class="w-11 h-16 rounded flex-shrink-0 object-cover"
          />
          <div v-else class="w-11 h-16 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-medium text-center leading-tight p-1" :class="isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'">
            {{ book.title }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ book.title }}</div>
            <div class="text-xs mb-2 truncate" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ book.authors.join(', ') }}</div>
            <div class="h-1.5 rounded-full overflow-hidden mb-1" :class="isDark ? 'bg-gray-700' : 'bg-gray-200'">
              <div class="h-full rounded-full bg-teal-600" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="text-[11px]" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              <template v-if="total > 0">p. {{ page }} of {{ total }} · {{ progress }}%</template>
              <template v-else>p. {{ page }}</template>
            </div>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Books by status</div>
        <div class="h-36">
          <Chart type="doughnut" :data="statusData" :options="statusOptions" />
        </div>
        <div class="flex flex-wrap justify-center gap-3 mt-3">
          <span v-for="item in statusLegend" :key="item.label" class="flex items-center gap-1.5 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
            <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ background: item.color }"></span>
            {{ item.label }} ({{ item.count }})
          </span>
        </div>
      </div>
    </div>

    <!-- Books read per year -->
    <div
      class="rounded-lg border p-4 mb-3"
      :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Books read per year</div>
      <div class="h-44">
        <Chart type="bar" :data="booksPerYearData" :options="booksPerYearOptions" />
      </div>
    </div>

    <!-- Reading activity + Avg pages per session -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ReadingHeatmap />
      <div
        class="rounded-lg border p-4"
        :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div class="text-xs font-medium uppercase tracking-wider mb-4" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Avg pages per session</div>
        <div class="h-28">
          <Chart type="line" :data="sessionData" :options="sessionOptions" />
        </div>
        <div
          class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t"
          :class="isDark ? 'border-gray-700' : 'border-gray-200'"
        >
          <div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Weekly avg</div>
            <div class="text-base font-medium mt-0.5">{{ analyticsStore.avgPagesPerDayOfWeek.weeklyAvg }} pages</div>
          </div>
          <div>
            <div class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Best day</div>
            <div class="text-base font-medium mt-0.5">{{ analyticsStore.avgPagesPerDayOfWeek.bestDay }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
