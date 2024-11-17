<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { STATUS_DISPLAY_NAMES, type BookStatus } from '@/types/book';
import UserBookCard from '@/components/user-books/UserBookCard.vue';

const route = useRoute();
const username = route.params.username;
const status = route.params.status as BookStatus;
const authStore = useAuthStore();
const userBooksStore = useUserBooksStore();

const isLoading = computed(() => userBooksStore.loading);
const error = computed(() => userBooksStore.error);
const books = computed(() => {
  const allBooks = userBooksStore.groupedBooks;
  return allBooks[status] || [];
});

const handleBookDelete = async (isbn: string) => {
  try {
    await userBooksStore.deleteBook(isbn);
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
};

onMounted(async () => {
  if (authStore.user) {
    await userBooksStore.initialize();
  }
});
</script>

<template>
  <div class="mx-auto py-8">
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
        <h1
          class="text-3xl font-bold mb-2"
          v-if="authStore.user && authStore.user.username === username"
        >
          {{ STATUS_DISPLAY_NAMES[status] }} Books
        </h1>
        <h1 class="text-3xl font-bold mb-2" v-else>
          {{ username }}'s {{ STATUS_DISPLAY_NAMES[status] }} Books
        </h1>
      </div>

      <!-- Books List -->
      <div class="space-y-4">
        <div v-if="books.length === 0" class="text-gray-500 italic">
          No books in this category
        </div>

        <div v-else class="space-y-4">
          <UserBookCard
            v-for="book in books"
            :key="book.isbn"
            :book="book"
            @delete="handleBookDelete"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
