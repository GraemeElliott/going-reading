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
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { ref, onMounted, watch, computed } from 'vue';
import type { TimePeriod, ReadingData } from '@/store/user-analytics-store';

const props = defineProps<{
  initialPeriod: TimePeriod;
}>();

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
);

const analyticsStore = useUserAnalyticsStore();
const selectedPeriod = ref<TimePeriod>(props.initialPeriod);

const timePeriods = [
  { value: 'by-year', label: 'By Year' },
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
  pointStyle?: string;
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
      borderWidth: 3,
      pointStyle: 'circle',
      pointHoverRadius: 2,
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
            padding: window.innerWidth < 640 ? 8 : 15,
            font: {
              size: window.innerWidth < 640 ? 8 : 12,
            },
          },
        },
        tooltip: {
          padding: window.innerWidth < 640 ? 6 : 10,
          titleSpacing: window.innerWidth < 640 ? 6 : 10,
          bodySpacing: window.innerWidth < 640 ? 3 : 5,
          backgroundColor: 'rgba(255,255,255, 1)',
          titleColor: 'rgb(0, 0, 0)',
          bodyColor: 'rgb(0, 0, 0)',
          titleFont: {
            size: window.innerWidth < 640 ? 16 : 26,
          },
          bodyFont: {
            size: window.innerWidth < 640 ? 11 : 12.5,
          },
          boxPadding: window.innerWidth < 640 ? 6 : 10,
          borderWidth: 1,
          borderColor: 'rgba(220,220,220, 1)',
          usePointStyle: true,
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
            maxRotation: window.innerWidth < 640 ? 45 : 0,
            minRotation: window.innerWidth < 640 ? 45 : 0,
            font: {
              size:
                window.innerWidth < 640
                  ? isYearlyView.value
                    ? 12
                    : 10
                  : isYearlyView.value
                  ? 14
                  : 12,
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
            font: {
              size: window.innerWidth < 640 ? 11 : 14,
            },
          },
          ticks: {
            stepSize: 1,
            callback: formatTickValue,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
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
            font: {
              size: window.innerWidth < 640 ? 11 : 14,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: formatTickValue,
            font: {
              size: window.innerWidth < 640 ? 10 : 12,
            },
          },
        },
      },
    } satisfies ChartOptions<'bar'>)
);

const updateChartData = () => {
  const labels = analyticsStore.monthlyData.map(
    (data: ReadingData) => data.name
  );
  const booksData = analyticsStore.monthlyData.map(
    (data: ReadingData) => data['Total Books Read']
  );
  const pagesData = analyticsStore.monthlyData.map(
    (data: ReadingData) => data['Pages Read']
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
        pointRadius: isYearlyView.value ? 2 : 1.5,
        pointHoverRadius: isYearlyView.value ? 3 : 2.5,
      } as Dataset,
    ],
  };
};

onMounted(async () => {
  await analyticsStore.updateMonthlyData(selectedPeriod.value);
  updateChartData();
});

watch(selectedPeriod, () =>
  analyticsStore.updateMonthlyData(selectedPeriod.value)
);
watch(() => analyticsStore.monthlyData, updateChartData, { deep: true });
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
    <div class="w-full h-[250px] sm:h-[400px]">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
