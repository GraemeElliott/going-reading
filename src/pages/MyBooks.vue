<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentlyReadingCarousel from '@/components/my-books/CurrentlyReadingCarousel.vue';
import BookStatusNavigation from '@/components/my-books/BookStatusNavigation.vue';
import ListsNavigation from '@/components/my-books/ListsNavigation.vue';
import ReadingActivityNavigation from '@/components/my-books/ReadingActivityNavigation.vue';

const router = useRouter();
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const authInitialized = ref(false);

const isLoading = computed(
  () => userBooksStore.loading || !authInitialized.value
);
const error = computed(() => userBooksStore.error);

// Initialize data in parallel
const initializeData = async () => {
  try {
    // Initialize auth first
    await authStore.initializeAuth();
    authInitialized.value = true;

    // Check if user is authenticated
    if (!authStore.user?.id) {
      router.push('/auth');
      return;
    }

    // Initialize user books store with a small delay to ensure auth is ready
    await new Promise((resolve) => setTimeout(resolve, 100));
    await userBooksStore.initialize();
  } catch (e) {
    console.error('Initialization failed:', e);
    router.push('/auth');
  }
};

onMounted(() => {
  initializeData();
});
</script>

<template>
  <div class="mx-auto py-1">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
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
    <div v-else-if="authInitialized && authStore.user?.id">
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
