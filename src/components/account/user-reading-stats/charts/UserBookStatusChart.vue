<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Pie } from 'vue-chartjs';
import { useUserBooksStore } from '@/store/user-books-store';
import { useDarkModeStore } from '@/store/store';
import { computed } from 'vue';

const darkModeStore = useDarkModeStore();

ChartJS.register(ArcElement, Tooltip, Legend);

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

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right' as const,
      labels: {
        color: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
        font: {
          size: window.innerWidth < 640 ? 10 : 12,
        },
        padding: window.innerWidth < 640 ? 10 : 20,
      },
    },
    tooltip: {
      backgroundColor: darkModeStore.darkMode
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(255, 255, 255, 1)',
      titleColor: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      bodyColor: darkModeStore.darkMode ? '#FFFFFF' : '#000000',
      padding: window.innerWidth < 640 ? 6 : 10,
      displayColors: true,
      borderWidth: 1,
      borderColor: darkModeStore.darkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(220, 220, 220, 1)',
      callbacks: {
        label: function (context: any) {
          const value = context.raw;
          const percentage = (
            (value /
              context.dataset.data.reduce((a: number, b: number) => a + b, 0)) *
            100
          ).toFixed(1);
          return `${value} books (${percentage}%)`;
        },
      },
    },
  },
}));
</script>

<template>
  <div class="w-full h-[300px] sm:h-[400px] pl-4 pb-4 lg:pl-0 lg:pb-2">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
