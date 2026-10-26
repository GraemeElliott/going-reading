<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLibraryStore } from '@/store/library-store';
import EmptyState from '@/components/ui/EmptyState.vue';
import { formatDuration, formatMonthYear, localDateUtils } from '@/utils/date-utils';
import LibraryStatusBreakdown from './LibraryStatusBreakdown.vue';
import StatsCard from './library/StatsCard.vue';
import LibraryBookTile from './library/LibraryBookTile.vue';
import GrowthCard from './library/GrowthCard.vue';
import TopGenresCard from './library/TopGenresCard.vue';
import OwnedUnreadCard from './library/OwnedUnreadCard.vue';
import WaitTimesCard from './library/WaitTimesCard.vue';
import { useLibraryStats } from '../useLibraryStats';
import { useChartTheme } from '../useChartTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip);

defineProps<{
  /** Genre data is still being backfilled ("Updating genre data…") */
  genresLoading?: boolean;
}>();

const libraryStore = useLibraryStore();
const router = useRouter();
const { isDark, gridColor, tickColor, tooltip } = useChartTheme();
const {
  metrics, addedPerMonth, statusCounts, recent, growth, growthRange, genres, unread, waiting,
} = useLibraryStats();

onMounted(() => {
  libraryStore.initialize().catch((err) => console.error('Failed to load library:', err));
});

const formatSeries = computed(() => [
  { key: 'physical', label: 'Physical', color: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)' },
  { key: 'digital', label: 'Digital', color: '#7F77DD' },
  { key: 'both', label: 'Both', color: '#3C3489' },
] as const);

const addedChartData = computed(() => ({
  labels: addedPerMonth.value.labels,
  datasets: formatSeries.value.map((series) => ({
    label: series.label,
    data: addedPerMonth.value[series.key],
    backgroundColor: series.color,
    borderRadius: 3,
    borderSkipped: false,
  })),
}));

const addedChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltip.value,
      // Hide empty formats; the footer gives the month's total
      filter: (item: any) => item.parsed.y > 0,
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
        footer: (items: any[]) => {
          const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
          return `${total} book${total !== 1 ? 's' : ''}`;
        },
      },
    },
  },
  scales: {
    x: { stacked: true, grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
    y: { stacked: true, grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
  },
}));

// Stacked book rows with dividers, like Overview's Currently reading
const LIST = 'divide-y divide-gr-line [&>li]:py-2.5 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0';
const LINK = 'inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-gr-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent';
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="!libraryStore.initialized && !libraryStore.error" class="space-y-3 animate-pulse" aria-busy="true">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <div v-for="i in 3" :key="i" class="rounded-lg p-4 h-20 bg-gr-surface-2"></div>
      </div>
      <div class="flex flex-wrap gap-5">
        <div class="flex-[7_1_560px] rounded-lg h-64 bg-gr-surface-2"></div>
        <div class="flex-[5_1_360px] rounded-lg h-64 bg-gr-surface-2"></div>
      </div>
    </div>

    <p v-else-if="!libraryStore.initialized" role="alert" class="gr-card p-4 text-center text-gr-danger-text">
      {{ libraryStore.error }}
    </p>

    <!-- Empty library -->
    <EmptyState
      v-else-if="libraryStore.entries.length === 0"
      icon="fa-solid fa-book"
      title="Your library is empty"
      description="Add the books you own, in print or on screen, to see your library stats here."
      cta-label="Add a book"
      :cta-action="() => router.push({ path: '/my-books/library', query: { add: null } })"
      size="lg"
    />

    <template v-else>
      <!-- Metric cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
        <div
          v-for="metric in metrics"
          :key="metric.label"
          class="rounded-lg p-4"
          :class="isDark ? 'bg-gray-800' : 'bg-gray-100'"
        >
          <div class="text-xs mb-1.5" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ metric.label }}</div>
          <div class="text-2xl font-medium leading-none">{{ metric.value }}</div>
          <div class="text-xs mt-1.5" :class="metric.subClass || (isDark ? 'text-gray-400' : 'text-gray-500')">{{ metric.sub }}</div>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <!-- Books added per month + By shelf status -->
        <div class="flex flex-wrap gap-5">
          <StatsCard title="Books added per month" class="flex-[7_1_560px]">
            <template #actions>
              <div class="flex flex-wrap gap-3">
                <span v-for="series in formatSeries" :key="series.key" class="flex items-center gap-1.5 text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ background: series.color }"></span>
                  {{ series.label }}
                </span>
              </div>
            </template>
            <!-- Fills the card's height, which follows the status card beside it -->
            <div class="relative min-h-44 flex-1">
              <div class="absolute inset-0">
                <Chart type="bar" :data="addedChartData" :options="addedChartOptions" />
              </div>
            </div>
          </StatsCard>
          <StatsCard class="flex-[5_1_360px]">
            <LibraryStatusBreakdown :counts="statusCounts" />
          </StatsCard>
        </div>

        <!-- Recently added -->
        <StatsCard title="Recently added">
          <template #actions>
            <router-link to="/my-books/library" :class="LINK">
              Open library
              <font-awesome-icon icon="fa-solid fa-chevron-right" class="text-xs" />
            </router-link>
          </template>
          <p v-if="!recent.length" class="text-sm text-gr-muted">No books yet</p>
          <ul v-else :class="LIST">
            <li v-for="entry in recent" :key="entry.id">
              <LibraryBookTile
                :isbn="entry.isbn"
                :title="entry.title"
                :authors="entry.authors"
                :image="entry.image"
                :pages="entry.pages"
              >
                <template #pill>
                  <font-awesome-icon icon="fa-regular fa-calendar" />
                  Added {{ formatMonthYear(localDateUtils.parseLocalDate(entry.date_added)) }}
                </template>
              </LibraryBookTile>
            </li>
          </ul>
        </StatsCard>

        <!-- Growth over time + Top genres -->
        <div class="flex flex-wrap gap-5">
          <GrowthCard v-model:range="growthRange" :growth="growth" class="flex-[7_1_560px]" />
          <TopGenresCard :genres="genres" :loading="genresLoading" class="flex-[5_1_360px]" />
        </div>

        <!-- Owned but unread and Time on Want to read + Longest waiting on Want to read -->
        <div class="flex flex-wrap gap-5">
          <div class="flex flex-[1_1_400px] flex-col gap-5">
            <OwnedUnreadCard :unread="unread" />
            <!-- Fills whatever height the longest waiting list leaves -->
            <WaitTimesCard :times="waiting.times" class="flex-1" />
          </div>
          <StatsCard title="Longest waiting on Want to read" class="flex-[1_1_400px]">
            <template #actions>
              <router-link
                v-if="waiting.count"
                :to="{ path: '/my-books/bookshelves', query: { shelf: 'want-to-read' } }"
                :class="LINK"
              >
                See all {{ waiting.count }}
                <font-awesome-icon icon="fa-solid fa-chevron-right" class="text-xs" />
              </router-link>
            </template>
            <p v-if="!waiting.items.length" class="text-sm text-gr-muted">Your Want to read shelf is empty</p>
            <ul v-else :class="LIST">
              <li v-for="{ book, since } in waiting.items" :key="book.isbn">
                <LibraryBookTile
                  :isbn="book.isbn"
                  :title="book.title"
                  :authors="book.authors"
                  :image="book.image"
                  :pages="book.pages"
                >
                  <template #pill>
                    <font-awesome-icon icon="fa-regular fa-clock" />
                    {{ formatDuration(since) }}
                  </template>
                </LibraryBookTile>
              </li>
            </ul>
          </StatsCard>
        </div>
      </div>
    </template>
  </div>
</template>
