<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController,
  Filler,
  type Plugin,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { computed, ref, watch } from 'vue';
import type { ChartRange, Granularity } from '@/utils/library-stats';
import { useChartFocus, useChartTheme } from '../../useChartTheme';
import StatsCard from './StatsCard.vue';
import RangeToggle from './RangeToggle.vue';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, LineController, Filler);

const range = defineModel<ChartRange>('range', { required: true });

const props = defineProps<{
  growth: {
    granularity: Granularity;
    /** Books predate the last 12 months, so the range toggle is shown */
    hasOlder: boolean;
    labels: string[];
    totals: number[];
    baseline: number;
    current: number;
  };
}>();

const { gridColor, tickColor, token } = useChartTheme();
const accent = token('--gr-accent');
const accentSoft = token('--gr-accent-soft');
const surface = token('--gr-surface');
const muted = token('--gr-muted');

const focus = useChartFocus(() => props.growth.labels.length);
const chartRef = ref<{ chart?: ChartJS } | null>(null);
// The crosshair is drawn by the plugin below, so redraw when it moves
watch(focus.active, () => chartRef.value?.chart?.draw());

const enoughData = computed(() => props.growth.labels.length >= 2);
const periodName = (i: number) =>
  props.growth.granularity === 'week' ? `w/c ${props.growth.labels[i]}` : props.growth.labels[i];

const change = computed(() => props.growth.current - props.growth.baseline);
const summary = computed(() =>
  change.value > 0
    ? `books, up from ${props.growth.baseline.toLocaleString()} in ${periodName(0)}`
    : `books, the same as in ${periodName(0)}`
);

const readout = computed(() => {
  const i = focus.active.value;
  if (i !== null) return `${periodName(i)} · ${props.growth.totals[i].toLocaleString()} books`;
  const sign = change.value >= 0 ? '+' : '−';
  return `${sign}${Math.abs(change.value).toLocaleString()} since ${periodName(0)}`;
});

const ariaLabel = computed(() =>
  `Library size at the end of each ${props.growth.granularity}: ` +
  props.growth.labels.map((label, i) => `${label} ${props.growth.totals[i]}`).join(', ') +
  '. Use the arrow keys to step through.'
);

// Vertical crosshair and a dot on the line at the active period
const crosshair: Plugin<'line'> = {
  id: 'growthCrosshair',
  afterDatasetsDraw(chart) {
    const i = focus.active.value;
    const point = i === null ? null : chart.getDatasetMeta(0).data[i];
    if (!point) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = muted.value;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(point.x, chartArea.top);
    ctx.lineTo(point.x, chartArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = accent.value;
    ctx.strokeStyle = surface.value;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
};

const chartData = computed(() => ({
  labels: props.growth.labels,
  datasets: [{
    data: props.growth.totals,
    borderColor: accent.value,
    backgroundColor: accentSoft.value,
    borderWidth: 2,
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    pointHoverRadius: 0,
  }],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  interaction: { mode: 'index' as const, intersect: false },
  onHover: focus.onHover,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: tickColor.value, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 8 } },
    y: { grid: { color: gridColor.value }, ticks: { color: tickColor.value, font: { size: 11 }, precision: 0 } },
  },
}));
</script>

<template>
  <StatsCard title="Growth over time">
    <template #actions>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p v-if="enoughData" aria-live="polite" class="text-sm text-gr-muted">{{ readout }}</p>
        <RangeToggle v-if="growth.hasOlder" v-model="range" />
      </div>
    </template>

    <template v-if="enoughData">
      <p class="mb-4">
        <span class="text-2xl font-medium leading-none">{{ growth.current.toLocaleString() }}</span>
        <span class="ml-1.5 text-gr-muted">{{ summary }}</span>
      </p>
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
        <Chart ref="chartRef" type="line" :data="chartData" :options="chartOptions" :plugins="[crosshair]" />
      </div>
    </template>
    <p v-else class="text-sm text-gr-muted">Not enough data yet</p>
  </StatsCard>
</template>
