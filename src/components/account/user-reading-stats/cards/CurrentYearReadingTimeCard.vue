<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { computed } from 'vue';

const userAnalyticsStore = useUserAnalyticsStore();
const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;

const currentYearReadingTime = computed(() => {
  return (
    userAnalyticsStore.yearlyData.find(
      (data) => data.name === currentYear.toString()
    )?.['Reading Time'] ?? 0
  );
});

const lastYearReadingTime = computed(() => {
  return (
    userAnalyticsStore.yearlyData.find(
      (data) => data.name === lastYear.toString()
    )?.['Reading Time'] ?? 0
  );
});

const formattedCurrentYearReadingTime = computed(() => {
  return userAnalyticsStore.formatReadingTime(currentYearReadingTime.value);
});

const yearOverYearDifference = computed(() => {
  const diff = currentYearReadingTime.value - lastYearReadingTime.value;
  const percentage =
    lastYearReadingTime.value === 0
      ? 100
      : Math.round((diff / lastYearReadingTime.value) * 100);

  return {
    value: Math.abs(diff),
    percentage: Math.abs(percentage),
    increased: diff > 0,
    same: diff === 0,
    text: `${Math.abs(percentage)}% ${
      diff > 0 ? 'more' : diff < 0 ? 'less' : 'same as'
    } last year`,
  };
});
</script>

<template>
  <Card>
    <CardHeader
      class="flex flex-row items-center justify-between space-y-0 pb-2"
    >
      <CardTitle class="text-sm font-medium"
        >Reading Time ({{ currentYear }})</CardTitle
      >
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">
        {{ formattedCurrentYearReadingTime }}
      </div>
      <p class="text-xs text-muted-foreground flex items-center gap-1">
        <span class="flex items-center">
          <span
            v-if="yearOverYearDifference.increased"
            class="text-goingGreen mr-1"
            ><font-awesome-icon icon="fa-solid fa-arrow-up"
          /></span>
          <span
            v-else-if="yearOverYearDifference.same"
            class="text-goingYellow mr-1"
            ><font-awesome-icon icon="fa-solid fa-minus"
          /></span>
          <span v-else class="text-goingRed mr-1"
            ><font-awesome-icon icon="fa-solid fa-arrow-down"
          /></span>
          {{
            userAnalyticsStore.formatReadingTime(yearOverYearDifference.value)
          }}
        </span>
        ({{ yearOverYearDifference.text }})
      </p>
    </CardContent>
  </Card>
</template>
