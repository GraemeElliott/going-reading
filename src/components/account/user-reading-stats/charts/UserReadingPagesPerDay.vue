<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  Scale,
  Tick,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { computed, onMounted, ref, watch } from 'vue';
import { ReadingProgressService } from '@/services/readingProgressService';
import { useAuthStore } from '@/store/auth-store';
import { useDarkModeStore } from '@/store/store';

const darkModeStore = useDarkModeStore();

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const props = defineProps<{
  days?: number;
}>();

interface ChartDataPoint {
  date: string;
  pagesRead: number;
}

const authStore = useAuthStore();
const chartData = ref<ChartDataPoint[]>([]);
const viewMode = ref<'daily' | 'weekly'>('daily');

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: false,
      labels: {
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: darkModeStore.darkMode
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(255, 255, 255, 1)',
      titleColor: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      bodyColor: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      padding: window.innerWidth < 640 ? 6 : 10,
      displayColors: false,
      borderWidth: 1,
      borderColor: darkModeStore.darkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(220, 220, 220, 1)',
      callbacks: {
        label: function (context: any) {
          return `${context.parsed.y.toLocaleString()} pages read`;
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
        maxTicksLimit: viewMode.value === 'weekly' ? 4 : 7,
        maxRotation: 0,
        autoSkip: true,
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      },
    },
    y: {
      type: 'linear' as const,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Pages Read',
        padding: { top: 10, bottom: 10 },
        font: {
          size: window.innerWidth < 640 ? 11 : 14,
        },
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      },
      grid: {
        color: darkModeStore.darkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(102, 102, 102, 0.1)',
        lineWidth: 1,
      },
      ticks: {
        maxTicksLimit: 6,
        callback: function (tickValue: number | string) {
          return Math.round(Number(tickValue)).toLocaleString('en-US');
        },
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
    },
    point: {
      radius: 3,
      hitRadius: 8,
      hoverRadius: 4,
    },
  },
}));

const processReadingData = (data: any[]) => {
  if (viewMode.value === 'weekly') {
    const weeklyTotals = new Map<string, number>();

    data.forEach((entry) => {
      const date = new Date(entry.recorded_at);
      date.setDate(date.getDate() - date.getDay());
      const weekKey = date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      });

      const currentTotal = weeklyTotals.get(weekKey) || 0;
      weeklyTotals.set(
        weekKey,
        currentTotal + (entry.pages_read_in_session || 0)
      );
    });

    const result = [];
    const endDate = new Date();
    const startDate = new Date();
    // Set to 28 days (4 weeks) for weekly view
    startDate.setDate(startDate.getDate() - 28);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const weekStartDate = new Date(currentDate);
      weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());

      const weekKey = weekStartDate.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      });

      result.push({
        date: weekKey,
        pagesRead: weeklyTotals.get(weekKey) || 0,
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return result;
  } else {
    const dailyTotals = new Map<string, number>();

    data.forEach((entry) => {
      const date = new Date(entry.recorded_at);
      const dateKey = date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      });

      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(
        dateKey,
        currentTotal + (entry.pages_read_in_session || 0)
      );
    });

    const result = [];
    const endDate = new Date();
    const startDate = new Date(
      Date.now() - (props.days || 14) * 24 * 60 * 60 * 1000
    );
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      });

      result.push({
        date: dateKey,
        pagesRead: dailyTotals.get(dateKey) || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
};

const computedChartData = computed(() => ({
  labels: chartData.value.map((d: ChartDataPoint) => d.date),
  datasets: [
    {
      label: 'Pages Read',
      data: chartData.value.map((d: ChartDataPoint) => d.pagesRead),
      fill: false,
      borderColor: darkModeStore.darkMode
        ? 'rgb(255, 205, 86)'
        : 'rgb(178, 34, 34)',
      borderWidth: 2,
      tension: 0.3,
      pointStyle: 'circle',
      pointRadius: 2,
      pointHoverRadius: 4,
    },
  ],
}));

const fetchData = async () => {
  if (!authStore.user?.id) return;

  // Use 28 days for weekly view to ensure we have 4 weeks of data
  const daysToFetch = viewMode.value === 'weekly' ? 28 : props.days || 14;

  const data = await ReadingProgressService.getRecentProgress(
    authStore.user.id,
    daysToFetch
  );

  chartData.value = processReadingData(data);
};

watch(viewMode, () => {
  fetchData();
});

watch(
  () => darkModeStore.darkMode,
  () => {
    // Force chart update when dark mode changes
    if (chartData.value.length > 0) {
      chartData.value = [...chartData.value];
    }
  }
);

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <select
        v-model="viewMode"
        class="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
      >
        <option value="daily">Daily View</option>
        <option value="weekly">Weekly View</option>
      </select>
    </div>
    <div
      class="relative w-full min-h-[250px] sm:min-h-[300px] h-[40vh] sm:h-[50vh] max-h-[500px]"
    >
      <Line
        v-if="chartData.length > 0"
        :data="computedChartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>
