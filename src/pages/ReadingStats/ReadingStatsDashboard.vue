<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OverviewTab from './tabs/OverviewTab.vue';
import ProgressTab from './tabs/ProgressTab.vue';
import LibraryTab from './tabs/LibraryTab.vue';
import InsightsTab from './tabs/InsightsTab.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useDarkModeStore } from '@/store/store';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';
import { backfillGenres, renormaliseStoredGenres } from '@/services/genreBackfillService';

const darkModeStore = useDarkModeStore();
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();
const goalsStore = useReadingGoalsStore();

const route = useRoute();
const router = useRouter();

const currentYear = new Date().getFullYear();
const isBackfilling = ref(false);

const VALID_TABS = ['overview', 'progress', 'library', 'insights'] as const;
type Tab = typeof VALID_TABS[number];

const activeTab = computed<Tab>(() => {
  const t = route.query.tab as string;
  return (VALID_TABS.includes(t as Tab) ? t : 'overview') as Tab;
});

function setTab(tab: Tab) {
  router.replace({ query: { ...route.query, tab } });
}

const goalSummary = computed(() => {
  const goal = goalsStore.currentGoal?.goal;
  if (!goal) return String(currentYear);
  return `${currentYear} · ${goal}-book goal`;
});

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'progress', label: 'Progress' },
  { key: 'library', label: 'Library' },
  { key: 'insights', label: 'Insights' },
] as const;

async function refreshAnalytics() {
  await Promise.all([
    analyticsStore.calculateTotalPagesRead(),
    analyticsStore.calculateStreakData(),
    analyticsStore.calculateTotalReadingTime(),
  ]);
}

onMounted(async () => {
  const userId = authStore.user?.id;
  if (!userId) return;

  isBackfilling.value = true;
  try {
    const [backfillResult, renormaliseResult] = await Promise.all([
      backfillGenres(userId),
      renormaliseStoredGenres(userId),
      goalsStore.fetchGoal(userId, currentYear),
      ...(!userBooksStore.initialized ? [userBooksStore.fetchUserBooks()] : []),
      ...(!analyticsStore.pagesReadInitialized ? [analyticsStore.calculateTotalPagesRead()] : []),
      ...(!analyticsStore.streakInitialized ? [analyticsStore.calculateStreakData()] : []),
      ...(!analyticsStore.readingTimeInitialized ? [analyticsStore.calculateTotalReadingTime()] : []),
    ]);
    if ((backfillResult.updated > 0 || renormaliseResult.updated > 0) && userBooksStore.initialized) {
      await userBooksStore.fetchUserBooks();
    }
  } finally {
    isBackfilling.value = false;
  }
});

// When analytics are invalidated (e.g. after a progress update), refetch immediately
watch(() => analyticsStore.pagesReadInitialized, (initialized) => {
  if (!initialized) refreshAnalytics();
});
</script>

<template>
  <div
    class="py-6"
    :class="darkModeStore.darkMode ? 'text-white' : 'text-gray-900'"
  >
    <!-- Header -->
    <div class="flex items-baseline justify-between mb-6 flex-wrap gap-2">
      <h1 class="text-2xl font-bold tracking-tight">Reading dashboard</h1>
      <div class="flex items-center gap-3">
        <span
          v-if="isBackfilling"
          class="text-xs flex items-center gap-1.5"
          :class="darkModeStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Updating genre data…
        </span>
      </div>
    </div>

    <!-- Loading skeleton / empty state / tabs -->
    <template v-if="userBooksStore.initialized && analyticsStore.pagesReadInitialized && analyticsStore.streakInitialized && analyticsStore.readingTimeInitialized">
      <!-- Empty state for new users with no books -->
      <EmptyState
        v-if="userBooksStore.userBooks.length === 0"
        icon="fa-solid fa-chart-line"
        title="Your reading dashboard is waiting"
        description="Add your first book and start reading. Streaks, pages, insights, and goals will all appear here as your library grows."
        cta-label="Add your first book"
        :cta-action="() => router.push('/search/')"
        size="lg"
      />

      <template v-else>
        <!-- Tab nav -->
        <div
          class="flex gap-1 mb-7 border-b"
          :class="darkModeStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="text-sm px-4 py-2 border-b-2 -mb-px transition-colors duration-150"
            :class="activeTab === tab.key
              ? (darkModeStore.darkMode ? 'border-white text-white font-medium' : 'border-gray-900 text-gray-900 font-medium')
              : (darkModeStore.darkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700')"
            @click="setTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <OverviewTab v-show="activeTab === 'overview'" />
        <ProgressTab v-show="activeTab === 'progress'" />
        <LibraryTab v-show="activeTab === 'library'" />
        <InsightsTab v-show="activeTab === 'insights'" />
      </template>
    </template>

    <div v-else class="space-y-3 animate-pulse">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div v-for="i in 4" :key="i" class="rounded-lg p-4 h-20" :class="darkModeStore.darkMode ? 'bg-gray-800' : 'bg-gray-100'"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-3">
        <div class="rounded-lg h-64" :class="darkModeStore.darkMode ? 'bg-gray-800' : 'bg-gray-100'"></div>
        <div class="rounded-lg h-64" :class="darkModeStore.darkMode ? 'bg-gray-800' : 'bg-gray-100'"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="rounded-lg h-48" :class="darkModeStore.darkMode ? 'bg-gray-800' : 'bg-gray-100'"></div>
        <div class="rounded-lg h-48" :class="darkModeStore.darkMode ? 'bg-gray-800' : 'bg-gray-100'"></div>
      </div>
    </div>
  </div>
</template>
