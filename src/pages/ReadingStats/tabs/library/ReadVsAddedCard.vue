<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed } from 'vue';
import type { Granularity } from '@/utils/library-stats';
import { useChartFocus, useChartTheme } from '../../useChartTheme';
import StatsCard from './StatsCard.vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController);

const props = defineProps<{
  stats: {
    granularity: Granularity;
    labels: string[];
    added: number[];
    read: number[];
    totalAdded: number;
    totalRead: number;
  };
}>();

const { gridColor, tickColor, token } = useChartTheme();
const readColor = token('--gr-status-read');
// A light tint of the page's teal, so the two series differ in lightness as
// well as hue against the darker Read green
const ADDED_COLOR = '#7cc4c0';

const series = computed(() => [
  { key: 'added' as const, label: 'Added', color: ADDED_COLOR },
  { key: 'read' as const, label: 'Read', color: readColor.value },
]);

const focus = useChartFocus(() => props.stats.labels.length);

const enoughData = computed(
  () => props.stats.labels.length > 0 && props.stats.totalAdded + props.stats.totalRead > 0
);
const periodName = (i: number) =>
  props.stats.granularity === 'week' ? `w/c ${props.stats.labels[i]}` : props.stats.labels[i];
const spanName = computed(() => {
  const n = props.stats.labels.length;
  const unit = props.stats.granularity === 'week' ? 'week' : 'month';
  return n === 1 ? `this ${unit}` : `the last ${n} ${unit}s`;
});

const readout = computed(() => {
  const i = focus.active.value;
  if (i === null) return '';
  return `${periodName(i)} · ${props.stats.added[i]} added, ${props.stats.read[i]} read`;
});

const pileSummary = computed(() => {
  const { totalAdded, totalRead } = props.stats;
  const diff = totalAdded - totalRead;
  const books = (n: number) => `${n} book${n === 1 ? '' : 's'}`;
  const change =
    diff > 0 ? `grew by ${diff}` : diff < 0 ? `shrank by ${-diff}` : 'stayed the same';
  return `In ${spanName.value} you added ${books(totalAdded)} and read ${totalRead}. Your to-read pile ${change}.`;
});

const ariaLabel = computed(() =>
  `Books added and read each ${props.stats.granularity}: ` +
  props.stats.labels
    .map((label, i) => `${label} ${props.stats.added[i]} added, ${props.stats.read[i]} read`)
    .join('; ') +
  '. Use the arrow keys to step through.'
);

// Other periods drop to 35% while one is active
const withAlpha = (color: string, alpha: number) => {
  if (alpha === 1) return color;
  const hex = color.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

const chartData = computed(() => ({
  labels: props.stats.labels,
  datasets: series.value.map((s) => ({
    label: s.label,
    data: props.stats[s.key],
    backgroundColor: props.stats.labels.map((_, i) =>
      withAlpha(s.color, focus.active.value === null || focus.active.value === i ? 1 : 0.35)
    ),
    // Transparent side borders leave a 2px gap between the bars in a pair
    borderColor: 'rgba(0,0,0,0)',
    borderWidth: { top: 0, right: 1, bottom: 0, left: 1 },
    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
    borderSkipped: false,
    barPercentage: 1,
    categoryPercentage: 0.7,
  })),
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 150 },
  interaction: { mode: 'index' as const, intersect: false },
  onHover: focus.onHover,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 8 } },
    y: { beginAtZero: true, grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, precision: 0 } },
  },
}));
</script>

<template>
  <StatsCard title="Read vs added">
    <template #actions>
      <p v-if="enoughData" aria-live="polite" class="min-h-5 text-sm text-gr-muted">{{ readout }}</p>
    </template>

    <template v-if="enoughData">
      <div class="-mt-2 mb-4 flex flex-wrap gap-3">
        <span v-for="s in series" :key="s.key" class="flex items-center gap-1.5 text-xs text-gr-muted">
          <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: s.color }"></span>
          {{ s.label }}
        </span>
      </div>
      <div
        role="img"
        :aria-label="ariaLabel"
        tabindex="0"
        class="h-48 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
        @keydown="focus.onKeydown"
        @focus="focus.onFocus"
        @blur="focus.reset"
        @mouseenter="focus.onPointerEnter"
        @mouseleave="focus.onPointerLeave"
      >
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
      <p class="mt-3 text-sm text-gr-muted">{{ pileSummary }}</p>
    </template>
    <p v-else class="text-sm text-gr-muted">Not enough data yet</p>
  </StatsCard>
</template>
