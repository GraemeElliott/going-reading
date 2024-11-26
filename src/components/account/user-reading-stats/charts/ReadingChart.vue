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
  ChartTypeRegistry,
  ChartOptions,
  Scale,
  CoreScaleOptions,
  Tick,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { ref, onMounted, watch, computed } from 'vue';
import type { TimePeriod } from '@/store/user-analytics-store';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const analyticsStore = useUserAnalyticsStore();
const selectedPeriod = ref<TimePeriod>('by-year');

const timePeriods = [
  { value: 'by-year', label: 'By Year' },
  { value: 'month', label: 'Past Month' },
  { value: '3months', label: 'Past 3 Months' },
  { value: '6months', label: 'Past 6 Months' },
] as const;

type Dataset = {
  type: keyof ChartTypeRegistry;
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor: string;
  borderWidth: number;
  order: number;
  yAxisID: string;
  barPercentage?: number;
  categoryPercentage?: number;
  fill?: boolean;
  pointRadius?: number;
  pointHoverRadius?: number;
  tension?: number;
};

const isYearlyView = computed(() => selectedPeriod.value === 'by-year');

const chartData = ref<{
  labels: string[];
  datasets: Dataset[];
}>({
  labels: [],
  datasets: [
    {
      type: 'bar',
      label: 'Books Read',
      data: [],
      backgroundColor: 'rgb(0, 124, 137)',
      borderColor: 'rgb(0, 124, 137)',
      borderWidth: 1,
      order: 2,
      yAxisID: 'y',
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
    {
      type: 'line',
      label: 'Pages Read',
      data: [],
      fill: false,
      borderColor: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(0, 0, 0)',
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.2,
      order: 1,
      yAxisID: 'y1',
    },
  ],
});

const formatTickValue = function (
  this: Scale<CoreScaleOptions>,
  tickValue: number | string
): string {
  return Number(tickValue).toLocaleString();
};

const chartOptions = computed(
  () =>
    ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          padding: 10,
          titleSpacing: 10,
          bodySpacing: 5,
          callbacks: {
            label: function (context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: isYearlyView.value ? 14 : 12,
              weight: isYearlyView.value
                ? ('bold' as const)
                : ('normal' as const),
            },
          },
        },
        y: {
          type: 'linear' as const,
          beginAtZero: true,
          position: 'left' as const,
          title: {
            display: true,
            text: isYearlyView.value ? 'Books Read per Year' : 'Books Read',
            padding: { top: 10, bottom: 10 },
          },
          ticks: {
            stepSize: 1,
            callback: formatTickValue,
          },
        },
        y1: {
          type: 'linear' as const,
          beginAtZero: true,
          position: 'right' as const,
          title: {
            display: true,
            text: isYearlyView.value ? 'Pages Read per Year' : 'Pages Read',
            padding: { top: 10, bottom: 10 },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: formatTickValue,
          },
        },
      },
    } satisfies ChartOptions<'bar'>)
);

const updateChartData = () => {
  const labels = analyticsStore.monthlyData.map((data) => data.name);
  const booksData = analyticsStore.monthlyData.map(
    (data) => data['Total Books Read']
  );
  const pagesData = analyticsStore.monthlyData.map(
    (data) => data['Pages Read']
  );

  chartData.value = {
    labels,
    datasets: [
      {
        ...chartData.value.datasets[0],
        data: booksData,
        barPercentage: isYearlyView.value ? 0.5 : 0.6,
        categoryPercentage: isYearlyView.value ? 0.8 : 0.7,
      } as Dataset,
      {
        ...chartData.value.datasets[1],
        data: pagesData,
        pointRadius: isYearlyView.value ? 6 : 4,
        pointHoverRadius: isYearlyView.value ? 8 : 6,
      } as Dataset,
    ],
  };
};

onMounted(async () => {
  await analyticsStore.updateMonthlyData(selectedPeriod.value);
  updateChartData();
});

watch(() => analyticsStore.monthlyData, updateChartData, { deep: true });
watch(selectedPeriod, () =>
  analyticsStore.updateMonthlyData(selectedPeriod.value)
);
watch(
  [() => analyticsStore.totalBooksRead, () => analyticsStore.totalPagesRead],
  () => analyticsStore.updateMonthlyData(selectedPeriod.value)
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <select
        v-model="selectedPeriod"
        class="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
      >
        <option
          v-for="period in timePeriods"
          :key="period.value"
          :value="period.value"
        >
          {{ period.label }}
        </option>
      </select>
    </div>
    <div class="w-full h-[400px]">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
