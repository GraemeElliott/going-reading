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
import { computed } from 'vue';
import type { WaitTimes } from '@/utils/library-stats';
import { formatDuration } from '@/utils/date-utils';
import { useChartTheme } from '../../useChartTheme';
import StatsCard from './StatsCard.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip);

const props = defineProps<{
  times: WaitTimes;
}>();

const { isDark, gridColor, tickColor, tooltip } = useChartTheme();

// Styled like "Books added per month", in its Physical teal
const chartData = computed(() => ({
  labels: props.times.buckets.map((b) => b.label),
  datasets: [{
    label: 'Books',
    data: props.times.buckets.map((b) => b.count),
    backgroundColor: isDark.value ? 'rgba(0,128,128,0.8)' : 'rgba(0,128,128,0.7)',
    borderRadius: 3,
    borderSkipped: false,
  }],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltip.value,
      callbacks: {
        label: (ctx: any) => ` ${ctx.parsed.y} book${ctx.parsed.y !== 1 ? 's' : ''}`,
      },
    },
  },
  scales: {
    x: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 } } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
  },
}));

const chartLabel = computed(
  () =>
    'Owned books on Want to read by time waiting: ' +
    props.times.buckets.map((b) => `${b.label} ${b.count}`).join(', ')
);
</script>

<template>
  <StatsCard title="Time on Want to read">
    <p v-if="!times.count" class="text-sm text-gr-muted">Not enough data yet</p>

    <div v-else class="flex flex-1 flex-col gap-4">
      <p>
        <span class="text-[36px] font-bold leading-none tracking-[-0.02em]">{{ formatDuration(times.averageSince!) }}</span>
        <span class="ml-1.5 text-gr-muted">
          average wait across {{ times.count.toLocaleString() }} owned {{ times.count === 1 ? 'book' : 'books' }}
        </span>
      </p>

      <dl class="flex flex-wrap gap-2 text-sm">
        <div class="flex gap-1.5 rounded-full bg-gr-surface-2 px-3 py-1">
          <dt class="text-gr-muted">Median</dt>
          <dd class="font-bold">{{ formatDuration(times.medianSince!) }}</dd>
        </div>
        <div class="flex gap-1.5 rounded-full bg-gr-surface-2 px-3 py-1">
          <dt class="text-gr-muted">Over a year</dt>
          <dd class="font-bold tabular-nums">{{ times.overAYear.toLocaleString() }}</dd>
        </div>
      </dl>

      <!-- Histogram of wait times; fills the card's height -->
      <div role="img" :aria-label="chartLabel" class="relative min-h-44 flex-1">
        <div class="absolute inset-0">
          <Chart type="bar" :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </StatsCard>
</template>
