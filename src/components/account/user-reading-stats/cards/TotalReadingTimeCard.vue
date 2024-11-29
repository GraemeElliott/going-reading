<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';

const userAnalyticsStore = useUserAnalyticsStore();
</script>

<template>
  <Card>
    <CardHeader
      class="flex flex-row items-center justify-between space-y-0 pb-2"
    >
      <CardTitle class="text-sm font-medium">Total Reading Time</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">
        {{ userAnalyticsStore.formattedTotalReadingTime }}
      </div>
      <p class="text-xs text-muted-foreground">Time spent reading</p>
    </CardContent>
  </Card>
</template>
