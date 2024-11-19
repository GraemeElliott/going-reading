<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import CurrentlyReadingCarousel from '@/components/my-books/CurrentlyReadingCarousel.vue';
import BookStatusNavigation from '@/components/my-books/BookStatusNavigation.vue';
import ListsNavigation from '@/components/my-books/ListsNavigation.vue';
import ReadingActivityNavigation from '@/components/my-books/ReadingActivityNavigation.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const isLoading = computed(() => userBooksStore.loading);
const error = computed(() => userBooksStore.error);

onMounted(async () => {
  if (authStore.user) {
    await userBooksStore.initialize();
  }
});
</script>

<template>
  <div class="mx-auto py-1">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center">
      <div class="animate-spin h-12 w-12 mx-auto"></div>
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
