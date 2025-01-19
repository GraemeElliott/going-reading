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
import { useAuthStore } from '@/store/auth-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useDarkModeStore } from '@/store/store';
import { supabase } from '@/supabase/supabase';

const darkModeStore = useDarkModeStore();

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
  weeks?: number;
}>();

const authStore = useAuthStore();
const analyticsStore = useUserAnalyticsStore();
const chartData = ref<{ date: string; readingTime: number }[]>([]);
const viewMode = ref<'daily' | 'weekly'>('weekly');

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
          return analyticsStore.formatReadingTime(context.parsed.y);
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
        maxTicksLimit: 7,
        maxRotation: 0,
        autoSkip: true,
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      },
    },
    y: {
      type: 'linear' as const,
      beginAtZero: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Reading Time (minutes)',
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
        callback: function (
          tickValue: number | string,
          index: number,
          ticks: Tick[]
        ) {
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

const processReadingData = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    const daysToFetch = (props.weeks || 12) * 7;
    startDate.setDate(startDate.getDate() - daysToFetch);

    const { data: progressData, error } = await supabase
      .from('reading_progress')
      .select('time_reading_in_session_mins, recorded_at')
      .eq('user_id', authStore.user?.id || '')
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    if (error) throw error;

    if (viewMode.value === 'weekly') {
      const weeklyTotals = new Map<string, number>();

      progressData.forEach((entry) => {
        const date = new Date(entry.recorded_at);
        date.setDate(date.getDate() - date.getDay());
        const weekKey = date.toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        });

        const currentTotal = weeklyTotals.get(weekKey) || 0;
        weeklyTotals.set(
          weekKey,
          currentTotal + (entry.time_reading_in_session_mins || 0)
        );
      });

      const result = [];
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
          readingTime: weeklyTotals.get(weekKey) || 0,
        });

        currentDate.setDate(currentDate.getDate() + 7);
      }

      chartData.value = result;
    } else {
      const dailyTotals = new Map<string, number>();

      progressData.forEach((entry) => {
        const date = new Date(entry.recorded_at);
        const dateKey = date.toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        });

        const currentTotal = dailyTotals.get(dateKey) || 0;
        dailyTotals.set(
          dateKey,
          currentTotal + (entry.time_reading_in_session_mins || 0)
        );
      });

      const result = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateKey = currentDate.toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        });

        result.push({
          date: dateKey,
          readingTime: dailyTotals.get(dateKey) || 0,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      chartData.value = result;
    }
  } catch (error) {
    console.error('Error processing reading data:', error);
    chartData.value = [];
  }
};

const computedChartData = computed(() => ({
  labels: chartData.value.map((d) => d.date),
  datasets: [
    {
      label: 'Reading Time',
      data: chartData.value.map((d) => d.readingTime),
      fill: 'start',
      backgroundColor: 'rgba(96, 63, 139, 0.5)',
      borderColor: 'rgb(96, 63, 139)',
      tension: 0.4,
    },
  ],
}));

watch(viewMode, () => {
  processReadingData();
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
  processReadingData();
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
    <div class="chart-container">
      <Line
        v-if="chartData.length > 0"
        :data="computedChartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  min-height: 300px;
  height: 50vh;
  max-height: 500px;
  width: 100%;
}

@media (max-width: 640px) {
  .chart-container {
    min-height: 250px;
    height: 40vh;
  }
}
</style>
