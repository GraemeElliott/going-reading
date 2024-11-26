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
import ReadingChart from './charts/ReadingChart.vue';

const userAnalyticsStore = useUserAnalyticsStore();
const userBooksStore = useUserBooksStore();

onMounted(async () => {
  await userBooksStore.initialize();
  await userAnalyticsStore.updateMonthlyData();
});
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Total Books Read</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ userAnalyticsStore.formattedTotalBooksRead }}
          </div>
          <p class="text-xs text-muted-foreground">Total books completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Total Pages Read</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ userAnalyticsStore.formattedTotalPagesRead }}
          </div>
          <p class="text-xs text-muted-foreground">Pages across all books</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Reading Progress</CardTitle>
        <CardDescription>Track your reading activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ReadingChart />
      </CardContent>
    </Card>
  </div>
</template>
