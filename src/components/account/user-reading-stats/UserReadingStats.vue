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
import UserReadingProgressChart from './charts/UserReadingProgressChart.vue';
import UserReadingPagesPerDay from './charts/UserReadingPagesPerDay.vue';

const userAnalyticsStore = useUserAnalyticsStore();
const userBooksStore = useUserBooksStore();

onMounted(async () => {
  await userBooksStore.initialize();
  // Load yearly data first for the cards
  await userAnalyticsStore.updateYearlyData();
  // Then load monthly data for the chart
  await userAnalyticsStore.updateMonthlyData('by-year');
});
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 grid-cols-2">
      <TotalBooksReadCard />
      <TotalPagesReadCard />
      <CurrentYearBooksReadCard />
      <CurrentYearPagesReadCard />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Reading Progress</CardTitle>
        <CardDescription>Track your reading activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <UserReadingProgressChart initial-period="by-year" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Pages Read By Day</CardTitle>
        <CardDescription
          >Pages read per day over the last 14 days</CardDescription
        >
      </CardHeader>
      <CardContent>
        <UserReadingPagesPerDay />
      </CardContent>
    </Card>
  </div>
</template>
