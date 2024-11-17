<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserBooksStore } from '@/store/user-books-store';
import BookStatusCovers from '@/components/my-books/BookStatusCovers.vue';
import { STATUS_DISPLAY_NAMES, BookStatus } from '@/types/book';

const route = useRoute();
const router = useRouter();
const userBooksStore = useUserBooksStore();
const username = route.params.username;

// Available statuses for navigation (excluding currently-reading)
const statuses: BookStatus[] = ['want-to-read', 'read', 'did-not-finish'];

const bookCounts = computed(() => {
  const books = userBooksStore.groupedBooks;
  return Object.fromEntries(
    Object.entries(books).map(([status, bookList]) => [status, bookList.length])
  );
});

const navigateToStatus = (status: BookStatus) => {
  router.push(`/user/${username}/my-books/${status}`);
};
</script>
<template>
  <div class="mt-8 space-y-4 lg:mx-10 mb-10">
    <div
      v-for="status in statuses"
      class="grid gap-4 w-full hover:cursor-pointer"
      @click="navigateToStatus(status)"
    >
      <div class="border rounded-lg py-4 px-3 flex flex-row items-center">
        <BookStatusCovers :status="status" class="mx-2" />
        <div class="flex-grow ml-10">
          <p class="text-md font-semibold">
            {{ STATUS_DISPLAY_NAMES[status] }}
          </p>
          <span class="text-sm text-gray-500">
            {{ bookCounts[status] || 0 }}
            {{ bookCounts[status] === 1 ? 'book' : 'books' }}
          </span>
        </div>

        <font-awesome-icon icon="fa-solid fa-angle-right" class="fa-lg ml-2" />
      </div>
    </div>
  </div>
</template>
