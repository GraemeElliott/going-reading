<script setup lang="ts">
import { BarChart } from '@/components/ui/chart-bar';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';

const userAnalyticsStore = useUserAnalyticsStore();

const formatYAxis = (tick: number | Date) => {
  if (typeof tick !== 'number') return '';
  // Only show whole numbers
  if (Number.isInteger(tick)) {
    return tick.toString();
  }
  return '';
};
</script>

<template>
  <BarChart
    :data="userAnalyticsStore.monthlyReadingData"
    index="name"
    :categories="['Total Books Read']"
    :y-formatter="formatYAxis"
    :show-grid-line="true"
  />
</template>
