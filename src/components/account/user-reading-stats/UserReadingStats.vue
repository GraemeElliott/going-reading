<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { onMounted } from 'vue';
import TotalBooksReadCard from './cards/TotalBooksReadCard.vue';
import TotalPagesReadCard from './cards/TotalPagesReadCard.vue';
import CurrentYearBooksReadCard from './cards/CurrentYearBooksReadCard.vue';
import CurrentYearPagesReadCard from './cards/CurrentYearPagesReadCard.vue';
import TotalReadingTimeCard from './cards/TotalReadingTimeCard.vue';
import CurrentYearReadingTimeCard from './cards/CurrentYearReadingTimeCard.vue';
import UserReadingProgressChart from './charts/UserReadingProgressChart.vue';
import UserReadingPagesPerDay from './charts/UserReadingPagesPerDay.vue';
import UserReadingTimeChart from './charts/UserReadingTimeChart.vue';

const userAnalyticsStore = useUserAnalyticsStore();
const userBooksStore = useUserBooksStore();

onMounted(async () => {
  await userBooksStore.initialize();
  // Load yearly data first for the cards
  await userAnalyticsStore.updateYearlyData();
  // Calculate total reading time
  await userAnalyticsStore.calculateTotalReadingTime();
  // Then load monthly data for the chart
  await userAnalyticsStore.updateMonthlyData('by-year');
});
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
      <TotalBooksReadCard />
      <CurrentYearBooksReadCard />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Reading Progress</CardTitle>
        <CardDescription>Track your reading activity over time</CardDescription>
      </CardHeader>
      <CardContent class="p-0 md:p-3">
        <UserReadingProgressChart initial-period="by-year" />
      </CardContent>
    </Card>

    <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
      <TotalPagesReadCard />
      <CurrentYearPagesReadCard />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Pages Read</CardTitle>
        <CardDescription
          >Number of pages read either by day or by week</CardDescription
        >
      </CardHeader>
      <CardContent class="p-0 md:p-3">
        <UserReadingPagesPerDay />
      </CardContent>
    </Card>

    <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
      <TotalReadingTimeCard />
      <CurrentYearReadingTimeCard />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Reading Time</CardTitle>
        <CardDescription
          >Time spent reading either over the past 4 weeks or by
          day</CardDescription
        >
      </CardHeader>
      <CardContent class="p-0 md:p-3">
        <UserReadingTimeChart :weeks="4" />
      </CardContent>
    </Card>
  </div>
</template>
