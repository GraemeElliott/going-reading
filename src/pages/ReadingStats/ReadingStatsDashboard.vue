<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OverviewTab from './tabs/OverviewTab.vue';
import ProgressTab from './tabs/ProgressTab.vue';
import BooksReadTab from './tabs/BooksReadTab.vue';
import LibraryTab from './tabs/LibraryTab.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { useReadingGoalsStore } from '@/store/reading-goals-store';
import { backfillGenres, renormaliseStoredGenres } from '@/services/genreBackfillService';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();
const goalsStore = useReadingGoalsStore();

const route = useRoute();
const router = useRouter();

const currentYear = new Date().getFullYear();
const isBackfilling = ref(false);

const VALID_TABS = ['overview', 'progress', 'books-read', 'library'] as const;
type Tab = typeof VALID_TABS[number];

const activeTab = computed<Tab>(() => {
  let t = route.query.tab as string;
  // The Library tab used to be "my-library"; keep old links working
  if (t === 'my-library') t = 'library';
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
  { key: 'books-read', label: 'Books Read' },
  { key: 'library', label: 'Library' },
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
  <PageLayout
    title="Reading Dashboard"
    :count="isBackfilling ? 'Updating genre data…' : undefined"
  >
    <div>
      <!-- Loading skeleton / empty state / tabs -->
      <template v-if="userBooksStore.initialized && analyticsStore.pagesReadInitialized && analyticsStore.streakInitialized && analyticsStore.readingTimeInitialized">
        <!-- Empty state for new users with no books -->
        <EmptyState
          v-if="userBooksStore.userBooks.length === 0"
          icon="fa-solid fa-chart-line"
          title="Your reading dashboard is waiting"
          description="Add your first book and start reading. Streaks, pages, ratings and goals will all appear here as your library grows."
          cta-label="Add your first book"
          :cta-action="() => router.push('/search/')"
          size="lg"
        />

        <template v-else>
          <!-- Tab nav: same pill tabs as the Bookshelves page -->
          <nav
            aria-label="Dashboard sections"
            class="-mt-4 mb-6 flex gap-2 overflow-x-auto"
          >
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              :aria-current="activeTab === tab.key ? 'true' : undefined"
              class="inline-flex h-10 shrink-0 items-center rounded-full px-3.5 !text-[15px] font-semibold transition-colors"
              :class="
                activeTab === tab.key
                  ? 'bg-gr-accent-soft text-gr-accent'
                  : 'text-gr-muted hover:bg-gr-surface-2 hover:text-gr-text'
              "
              @click="setTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </nav>

          <!-- Tab content -->
          <OverviewTab v-show="activeTab === 'overview'" />
          <ProgressTab v-show="activeTab === 'progress'" />
          <BooksReadTab v-show="activeTab === 'books-read'" />
          <LibraryTab v-show="activeTab === 'library'" :genres-loading="isBackfilling" />
        </template>
      </template>

      <div v-else class="space-y-3 animate-pulse" aria-busy="true">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div v-for="i in 4" :key="i" class="rounded-lg p-4 h-20 bg-gr-surface-2"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-3">
          <div class="rounded-lg h-64 bg-gr-surface-2"></div>
          <div class="rounded-lg h-64 bg-gr-surface-2"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-lg h-48 bg-gr-surface-2"></div>
          <div class="rounded-lg h-48 bg-gr-surface-2"></div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
