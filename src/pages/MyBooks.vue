<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '../store/auth-store';
import { useUserBooksStore } from '../store/user-books-store';
import { useListsStore } from '../store/lists-store';
import { Skeleton } from '../components/ui/skeleton';
import PageLayout from '../components/layout/PageLayout.vue';
import PageSection from '../components/layout/PageSection.vue';
import CurrentlyReadingCarousel from '../components/my-books/CurrentlyReadingCarousel.vue';
import BookStatusNavigation from '../components/my-books/BookStatusNavigation.vue';
import ListsSection from '../components/my-books/ListsSection.vue';
import LibrarySection from '../components/my-books/LibrarySection.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const listsStore = useListsStore();

const initialLoadComplete = ref(false);

// Only show loading state during initial load
const isInitialLoading = computed(() => {
  return !initialLoadComplete.value;
});

const error = computed(() => userBooksStore.error || listsStore.error);

onMounted(async () => {
  if (authStore.user) {
    try {
      await Promise.all([userBooksStore.initialize(), listsStore.initialize()]);
    } catch (err) {
      console.error('Error initializing stores:', err);
    } finally {
      initialLoadComplete.value = true;
    }
  }
});
</script>

<template>
  <PageLayout title="My Books">
    <!-- Loading State -->
    <template v-if="isInitialLoading">
      <PageSection title="Currently Reading" aria-busy="true">
        <div class="flex justify-around overflow-hidden">
          <div
            v-for="n in 3"
            :key="n"
            class="flex-col items-center gap-3"
            :class="n === 1 ? 'flex' : 'hidden md:flex'"
          >
            <Skeleton class="h-[225px] w-[150px] rounded-lg bg-gr-surface-2" />
            <Skeleton class="h-2 w-[150px] bg-gr-surface-2" />
            <Skeleton class="h-4 w-28 bg-gr-surface-2" />
          </div>
        </div>
      </PageSection>

      <PageSection title="Bookshelves" aria-busy="true">
        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]"
        >
          <Skeleton
            v-for="n in 3"
            :key="n"
            class="h-[142px] rounded-2xl bg-gr-surface-2"
          />
        </div>
      </PageSection>

      <PageSection title="Lists" aria-busy="true">
        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
        >
          <Skeleton
            v-for="n in 3"
            :key="n"
            class="h-[78px] rounded-2xl bg-gr-surface-2"
          />
        </div>
      </PageSection>
    </template>

    <!-- Error State -->
    <div
      v-else-if="error"
      role="alert"
      class="gr-card p-4 text-center text-destructive"
    >
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else>
      <CurrentlyReadingCarousel />
      <BookStatusNavigation />
      <LibrarySection />
      <ListsSection />
    </template>
  </PageLayout>
</template>
