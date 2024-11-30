<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { useUserBooksStore } from '@/store/user-books-store';
import { computed } from 'vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const userBooksStore = useUserBooksStore();

const statusConfig = {
  'want-to-read': {
    label: 'Want to Read',
    color: 'rgb(0, 124, 137)', // goingTeal
  },
  'currently-reading': {
    label: 'Currently Reading',
    color: 'rgb(234, 179, 8)', // goingYellow
  },
  read: {
    label: 'Read',
    color: 'rgb(67, 160, 71)', // goingGreen
  },
  'did-not-finish': {
    label: 'Did Not Finish',
    color: 'rgb(220, 38, 38)', // goingRed
  },
};

const chartData = computed(() => {
  const groupedBooks = userBooksStore.groupedBooks;
  const statuses = Object.keys(statusConfig) as (keyof typeof statusConfig)[];

  return {
    labels: statuses.map((status) => statusConfig[status].label),
    datasets: [
      {
        label: 'Number of Books',
        data: statuses.map((status) => groupedBooks[status].length),
        backgroundColor: statuses.map((status) => statusConfig[status].color),
        borderColor: statuses.map((status) => statusConfig[status].color),
        borderWidth: 1,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      padding: 10,
      displayColors: false,
      callbacks: {
        label: function (context: any) {
          return `${context.parsed.y} books`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxRotation: window.innerWidth < 640 ? 45 : 0,
        minRotation: window.innerWidth < 640 ? 45 : 0,
        font: {
          size: window.innerWidth < 640 ? 10 : 12,
        },
      },
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Books',
        padding: { top: 10, bottom: 10 },
        font: {
          size: window.innerWidth < 640 ? 11 : 14,
        },
      },
      ticks: {
        stepSize: 1,
        font: {
          size: window.innerWidth < 640 ? 10 : 12,
        },
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};
</script>

<template>
  <div class="w-full h-[250px] sm:h-[400px]">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
