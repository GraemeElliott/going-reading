<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentlyReadingCarousel from '@/components/my-books/CurrentlyReadingCarousel.vue';
import BookStatusNavigation from '@/components/my-books/BookStatusNavigation.vue';
import ListsNavigation from '@/components/my-books/ListsNavigation.vue';
import ReadingActivityNavigation from '@/components/my-books/ReadingActivityNavigation.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const isInitializing = ref(true);
const isLoading = computed(() => userBooksStore.loading);
const error = computed(() => userBooksStore.error);
const hasBooks = computed(() => userBooksStore.userBooks.length > 0);

onMounted(async () => {
  try {
    // If we have a user and no books loaded (even from persistence), fetch them
    if (authStore.user?.id && !hasBooks.value) {
      await userBooksStore.fetchUserBooks();
    }
  } catch (error) {
    console.error('Failed to initialize books:', error);
  } finally {
    isInitializing.value = false;
  }
});
</script>

<template>
  <div class="mx-auto py-1">
    <!-- Initialization Loading State -->
    <div v-if="isInitializing" class="space-y-6">
      <div class="mb-8">
        <Skeleton class="h-8 w-32 mb-6" />
        <Skeleton class="h-4 w-48" />
      </div>
    </div>

    <!-- Store Loading State -->
    <div v-else-if="isLoading" class="space-y-6">
      <!-- Header Skeleton -->
      <div class="mb-8">
        <Skeleton class="h-8 w-32 mb-6" />

        <!-- Currently Reading Carousel Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-48 mb-4" />
          <div class="flex gap-4 overflow-hidden">
            <div v-for="n in 3" :key="n" class="flex-none">
              <Skeleton class="h-48 w-32" />
              <Skeleton class="h-4 w-24 mt-2" />
              <Skeleton class="h-3 w-20 mt-1" />
            </div>
          </div>
        </div>

        <!-- Book Status Navigation Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-48 mb-4" />
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="n in 4" :key="n">
              <Skeleton class="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Lists Navigation Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-48 mb-4" />
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="n in 3" :key="n">
              <Skeleton class="h-24 w-full rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Reading Activity Navigation Skeleton -->
        <div class="mb-8">
          <Skeleton class="h-6 w-48 mb-4" />
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="n in 3" :key="n">
              <Skeleton class="h-24 w-full rounded-lg" />
            </div>
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
      <div class="mb-8">
        <h2 class="text-2xl font-bold tracking-tight mb-6">My Books</h2>
        <!-- Currently Reading Carousel -->
        <CurrentlyReadingCarousel />

        <!-- Book Status Navigation -->
        <BookStatusNavigation />

        <!-- Lists Navigation -->
        <ListsNavigation />

        <!-- Reading Activity Navigation -->
        <ReadingActivityNavigation />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
