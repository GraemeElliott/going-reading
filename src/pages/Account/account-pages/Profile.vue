<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useListsStore } from '@/store/lists-store';
import ListsSection from '@/components/my-books/ListsSection.vue';
import { Separator } from '@/components/ui/separator';
import TotalBooksReadCard from '@/components/account/user-reading-stats/cards/TotalBooksReadCard.vue';
import TotalPagesReadCard from '@/components/account/user-reading-stats/cards/TotalPagesReadCard.vue';
import TotalReadingTimeCard from '@/components/account/user-reading-stats/cards/TotalReadingTimeCard.vue';
import CurrentYearBooksAddedCard from '@/components/account/user-reading-stats/cards/CurrentYearBooksAddedCard.vue';

const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();
const listsStore = useListsStore();

// Get recently read books (top 5)
const recentlyReadBooks = computed(() => {
  const readBooks = userBooksStore.groupedBooks.read || [];
  return readBooks.slice(0, 5);
});

onMounted(async () => {
  await Promise.all([
    userBooksStore.initialize(),
    listsStore.fetchUserListsAndBooks(),
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
      <TotalBooksReadCard />
      <TotalPagesReadCard />
      <TotalReadingTimeCard />
      <CurrentYearBooksAddedCard />
    </div>

    <!-- Recently Read Books Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Recently Read Books</h2>
      <div
        v-if="recentlyReadBooks.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="book in recentlyReadBooks"
          :key="book.isbn"
          class="flex flex-col items-center"
        >
          <img
            :src="book.image"
            :alt="book.title"
            class="w-32 h-48 object-cover rounded shadow-md hover:shadow-lg transition-shadow"
          />
          <h3 class="text-sm font-medium text-center mt-2">{{ book.title }}</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
            {{ book.authors.join(', ') }}
          </p>
        </div>
      </div>
      <p v-else class="text-gray-600 dark:text-gray-400">No books read yet.</p>
    </div>

    <Separator class="my-8" />

    <!-- Lists Section -->
    <div class="mt-8">
      <ListsSection :is-profile-page="true" />
    </div>
  </div>
</template>
