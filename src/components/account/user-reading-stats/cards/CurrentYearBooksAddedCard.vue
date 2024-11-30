<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserBooksStore } from '@/store/user-books-store';
import { computed } from 'vue';

const formatter = new Intl.NumberFormat('en-US');
const userBooksStore = useUserBooksStore();
const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;

const currentYearBooksAdded = computed(() => {
  return userBooksStore.userBooks.filter((book) => {
    const addedDate = new Date(book.date_added);
    return addedDate.getFullYear() === currentYear;
  }).length;
});

const lastYearBooksAdded = computed(() => {
  return userBooksStore.userBooks.filter((book) => {
    const addedDate = new Date(book.date_added);
    return addedDate.getFullYear() === lastYear;
  }).length;
});

const formattedCurrentYearBooksAdded = computed(() => {
  return formatter.format(currentYearBooksAdded.value);
});

const yearOverYearDifference = computed(() => {
  const diff = currentYearBooksAdded.value - lastYearBooksAdded.value;
  const percentage =
    lastYearBooksAdded.value === 0
      ? 100
      : Math.round((diff / lastYearBooksAdded.value) * 100);

  return {
    value: Math.abs(diff),
    percentage: Math.abs(percentage),
    increased: diff > 0,
    text: `${Math.abs(percentage)}% ${
      diff >= 0 ? 'more' : 'less'
    } than last year`,
  };
});
</script>

<template>
  <Card>
    <CardHeader
      class="flex flex-row items-center justify-between space-y-0 pb-2"
    >
      <CardTitle class="text-sm font-medium"
        >Books Added ({{ currentYear }})</CardTitle
      >
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">
        {{ formattedCurrentYearBooksAdded }}
      </div>
      <p class="text-xs text-muted-foreground flex items-center gap-1">
        <span class="flex items-center">
          <span
            v-if="yearOverYearDifference.increased"
            class="text-goingGreen mr-1"
            ><font-awesome-icon icon="fa-solid fa-arrow-up"
          /></span>
          <span v-else class="text-goingRed mr-1"
            ><font-awesome-icon icon="fa-solid fa-arrow-down"
          /></span>
          {{ formatter.format(yearOverYearDifference.value) }} books
        </span>
        ({{ yearOverYearDifference.text }})
      </p>
    </CardContent>
  </Card>
</template>
