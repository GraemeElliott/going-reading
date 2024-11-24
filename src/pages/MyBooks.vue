<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '../store/auth-store';
import { useUserBooksStore } from '../store/user-books-store';
import { useListsStore } from '../store/lists-store';
import { Skeleton } from '../components/ui/skeleton';
import CurrentlyReadingCarousel from '../components/my-books/CurrentlyReadingCarousel.vue';
import BookStatusNavigation from '../components/my-books/BookStatusNavigation.vue';
import ListsSection from '../components/my-books/ListsSection.vue';
import ReadingActivityFeed from '@/components/my-books/ReadingActivityFeed.vue';

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
  <div class="mx-auto py-1">
    <!-- Loading State -->
    <div v-if="isInitialLoading">
      <h2 class="text-2xl font-bold tracking-tight mb-6">My Books</h2>

      <!-- Currently Reading Carousel Skeleton -->
      <div class="mb-8">
        <div class="space-y-4">
          <div class="flex gap-4 overflow-hidden">
            <div v-for="n in 3" :key="n" class="shrink-0">
              <Skeleton class="w-[200px] h-[300px] rounded-lg" />
              <div class="mt-2 space-y-2">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Book Status Navigation Skeleton -->
      <div class="mb-8">
        <div class="flex gap-4">
          <Skeleton v-for="n in 4" :key="n" class="h-10 w-24" />
        </div>
      </div>

      <!-- Lists Section Skeleton -->
      <div class="space-y-4">
        <div v-for="n in 3" :key="n" class="border rounded-lg">
          <div class="p-6">
            <Skeleton class="h-6 w-1/4 mb-2" />
            <Skeleton class="h-4 w-1/3" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600">{{ error }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- User Header -->
      <div class="space-y-8">
        <h2 class="text-2xl font-bold tracking-tight">My Books</h2>

        <!-- Currently Reading Carousel -->
        <CurrentlyReadingCarousel />

        <!-- Book Status Navigation -->
        <BookStatusNavigation />

        <!-- Lists Section -->
        <ListsSection />
      </div>
    </div>
  </div>
</template>
