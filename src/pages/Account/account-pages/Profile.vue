<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import ListsSection from '@/components/my-books/ListsSection.vue';
import { Separator } from '@/components/ui/separator';
import TotalBooksReadCard from '@/components/account/user-reading-stats/cards/TotalBooksReadCard.vue';
import TotalPagesReadCard from '@/components/account/user-reading-stats/cards/TotalPagesReadCard.vue';
import TotalReadingTimeCard from '@/components/account/user-reading-stats/cards/TotalReadingTimeCard.vue';
import CurrentYearBooksAddedCard from '@/components/account/user-reading-stats/cards/CurrentYearBooksAddedCard.vue';
import RecentlyReadCarousel from '@/components/account/profile/RecentlyReadCarousel.vue';
import RecentlyAddedCarousel from '@/components/account/profile/RecentlyAddedCarousel.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const userAnalyticsStore = useUserAnalyticsStore();
const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();

onMounted(async () => {
  await Promise.all([
    userBooksStore.initialize(),
    listsStore.fetchUserListsAndBooks(),
    userAnalyticsStore.calculateTotalReadingTime(),
  ]);
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- User Profile Section -->
    <div class="flex items-start space-x-6">
      <img
        :src="authStore.userMetadata.avatarURL"
        :alt="authStore.userMetadata.username"
        class="w-32 h-32 rounded-full object-cover"
      />
      <div class="flex-1">
        <h1 class="text-2xl font-bold">
          {{ authStore.userMetadata.username }}
        </h1>
        <p class="text-lg mt-2">
          {{ authStore.userMetadata.firstName }}
          {{ authStore.userMetadata.lastName }}
        </p>
        <p class="text-gray-600 dark:text-gray-400 mt-4">
          {{ authStore.userMetadata.bio || 'No bio provided' }}
        </p>
      </div>
    </div>

    <Separator class="my-8" />
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8">
      <TotalBooksReadCard
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      />
      <TotalPagesReadCard
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      />
      <TotalReadingTimeCard
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      />
      <CurrentYearBooksAddedCard
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        }"
      />
    </div>

    <!-- Recently Read Books Section -->
    <RecentlyReadCarousel />
    <Separator class="my-8" />

    <RecentlyAddedCarousel />
    <Separator class="my-8" />

    <!-- Lists Section -->
    <div class="mt-8">
      <ListsSection :is-profile-page="true" />
    </div>
  </div>
</template>
