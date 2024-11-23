<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Separator } from '@/components/ui/separator';
import { useListsStore } from '@/store/lists-store';
import ListCard from '@/components/lists/ListCard.vue';
import CreateList from '../lists/CreateList.vue';
import type { UserBook } from '@/types/book';

const listsStore = useListsStore();
const expandedLists = ref<Set<string>>(new Set());
const loadingBooks = ref<Set<string>>(new Set());

const handleNewList = async (listId: string) => {
  loadingBooks.value.add(listId);
  try {
    await listsStore.getBooksInList(listId);
  } catch (error) {
    console.error('Error loading books for new list:', error);
  } finally {
    loadingBooks.value.delete(listId);
  }
};

const toggleExpansion = async (listId: string) => {
  if (expandedLists.value.has(listId)) {
    expandedLists.value.delete(listId);
  } else {
    expandedLists.value.add(listId);
  }
};

const handleListDeleted = (listId: string) => {
  expandedLists.value.delete(listId);
};

const handleBookListUpdated = async (listId: string) => {
  loadingBooks.value.add(listId);
  try {
    await listsStore.getBooksInList(listId);
  } finally {
    loadingBooks.value.delete(listId);
  }
};
</script>

<template>
  <div class="mt-8 space-y-4">
    <div class="w-full py-4">
      <div class="flex flex-col gap-1">
        <h3 class="text-lg font-medium">Lists</h3>
      </div>
      <Separator class="my-6" />
      <CreateList @list-created="handleNewList" />

      <div v-if="listsStore.loading" class="text-center py-4">
        <div class="animate-spin h-6 w-6 mx-auto"></div>
      </div>

      <div v-else-if="listsStore.error" class="text-center py-4 text-red-500">
        {{ listsStore.error }}
      </div>

      <div
        v-else-if="listsStore.lists.length === 0"
        class="text-center py-4 text-muted-foreground"
      >
        You haven't created any lists yet.
      </div>

      <div v-else class="space-y-4">
        <ListCard
          v-for="list in listsStore.lists"
          :key="list.id"
          :list="list"
          :expanded="expandedLists.has(list.id)"
          :loading-books="loadingBooks.has(list.id)"
          :books="listsStore.booksInLists[list.id]"
          @toggle-expansion="toggleExpansion"
          @list-deleted="handleListDeleted"
          @book-list-updated="handleBookListUpdated"
        />
      </div>
    </div>
  </div>
</template>
