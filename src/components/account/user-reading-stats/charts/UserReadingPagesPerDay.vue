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
import { computed, onMounted, ref } from 'vue';
import { ReadingProgressService } from '@/services/readingProgressService';
import { useAuthStore } from '@/store/auth-store';

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

const authStore = useAuthStore();
const dailyData = ref<{ date: string; pagesRead: number }[]>([]);

// Chart options optimized for mobile and desktop
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      padding: 10,
      displayColors: false,
      callbacks: {
        label: function (context: any) {
          return `${context.parsed.y} pages read`;
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
      },
    },
    y: {
      type: 'linear' as const,
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        maxTicksLimit: 6,
        callback: function (this: Scale<any>, tickValue: number | string) {
          return tickValue;
        },
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
};

// Process the reading progress data into daily totals
const processReadingData = (data: any[]) => {
  const dailyTotals = new Map<string, number>();

  data.forEach((entry) => {
    const date = new Date(entry.recorded_at).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const currentTotal = dailyTotals.get(date) || 0;
    dailyTotals.set(date, currentTotal + (entry.pages_read_in_session || 0));
  });

  // Fill in missing dates with 0
  const result = [];
  const endDate = new Date();
  const startDate = new Date(
    Date.now() - (props.days || 14) * 24 * 60 * 60 * 1000
  );

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric', // Added year here to match the format above
    });
    result.push({
      date: dateStr,
      pagesRead: dailyTotals.get(dateStr) || 0,
    });
  }

  return result;
};

// Computed chart data
const chartData = computed(() => ({
  labels: dailyData.value.map((d) => d.date),
  datasets: [
    {
      label: 'Pages Read',
      data: dailyData.value.map((d) => d.pagesRead),
      fill: 'start',
      backgroundColor: 'rgba(0, 124, 137, 0.5)',
      borderColor: 'rgb(0, 124, 137)',
      tension: 0.4,
    },
  ],
}));

// Fetch and process the data
const fetchData = async () => {
  if (!authStore.user?.id) return;

  const data = await ReadingProgressService.getRecentProgress(
    authStore.user.id,
    props.days || 14
  );

  dailyData.value = processReadingData(data);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="chart-container">
    <Line
      v-if="dailyData.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
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

/* Responsive adjustments */
@media (max-width: 640px) {
  .chart-container {
    min-height: 250px;
    height: 40vh;
  }
}
</style>
