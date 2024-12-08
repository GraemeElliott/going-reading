<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TotalBooksReadCard from '@/components/account/user-reading-stats/cards/TotalBooksReadCard.vue';
import TotalPagesReadCard from '@/components/account/user-reading-stats/cards/TotalPagesReadCard.vue';
import TotalReadingTimeCard from '@/components/account/user-reading-stats/cards/TotalReadingTimeCard.vue';
import CurrentYearBooksAddedCard from '@/components/account/user-reading-stats/cards/CurrentYearBooksAddedCard.vue';
import RecentlyReadCarousel from '@/components/account/profile/RecentlyReadCarousel.vue';
import RecentlyAddedCarousel from '@/components/account/profile/RecentlyAddedCarousel.vue';
import ProfileListsSection from '@/components/account/profile/ProfileListsSection.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const userAnalyticsStore = useUserAnalyticsStore();
const listsStore = useListsStore();
const darkModeStore = useDarkModeStore();

const isLoading = ref(true);

onMounted(async () => {
  try {
    await Promise.all([
      userBooksStore.initialize(),
      listsStore.fetchUserListsAndBooks(),
      userAnalyticsStore.calculateTotalReadingTime(),
    ]);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- User Profile Section -->
    <div class="flex items-start space-x-6">
      <template v-if="isLoading">
        <Skeleton class="w-32 h-32 rounded-full" />
        <div class="flex-1">
          <Skeleton class="h-8 w-48 mb-4" />
          <Skeleton class="h-6 w-32 mb-4" />
          <Skeleton class="h-16 w-full" />
        </div>
      </template>
      <template v-else>
        <img
          :src="authStore.userMetadata.avatarURL"
          :alt="authStore.userMetadata.username"
          class="w-32 h-32 rounded-xl object-cover"
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
      </template>
    </div>

    <!-- Stats Cards Section -->
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8 mt-8">
      <template v-if="isLoading">
        <Skeleton
          v-for="i in 4"
          :key="i"
          class="h-[200px] rounded-lg"
          :class="{
            'bg-white': !darkModeStore.darkMode,
            'bg-gray-800': darkModeStore.darkMode,
          }"
        />
      </template>
      <template v-else>
        <TotalBooksReadCard
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
        />
        <TotalPagesReadCard
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
        />
        <TotalReadingTimeCard
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
        />
        <CurrentYearBooksAddedCard
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
        />
      </template>
    </div>

    <!-- Recently Read Books Section -->
    <template v-if="isLoading">
      <div class="space-y-4">
        <Skeleton class="h-8 w-48" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton
            v-for="i in 3"
            :key="i"
            class="h-[300px] rounded-lg"
            :class="{
              'bg-white': !darkModeStore.darkMode,
              'bg-gray-800': darkModeStore.darkMode,
            }"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <RecentlyReadCarousel />
    </template>
    <Separator class="my-8" />

    <!-- Recently Added Books Section -->
    <template v-if="isLoading">
      <div class="space-y-4">
        <Skeleton class="h-8 w-48" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton
            v-for="i in 3"
            :key="i"
            class="h-[300px] rounded-lg"
            :class="{
              'bg-white': !darkModeStore.darkMode,
              'bg-gray-800': darkModeStore.darkMode,
            }"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <RecentlyAddedCarousel />
    </template>
    <Separator class="my-8" />

    <!-- Lists Section -->
    <template v-if="isLoading">
      <div class="space-y-4">
        <Skeleton class="h-8 w-48" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton
            v-for="i in 4"
            :key="i"
            class="h-[200px] rounded-lg"
            :class="{
              'bg-white': !darkModeStore.darkMode,
              'bg-gray-800': darkModeStore.darkMode,
            }"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <div>
        <ProfileListsSection :is-profile-page="true" class="w-full" />
      </div>
      <Separator />
    </template>
  </div>
</template>
