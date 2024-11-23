<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useListsStore } from '@/store/lists-store';
import ListCard from '@/components/lists/ListCard.vue';
import CreateList from '../lists/CreateList.vue';
import type { UserBook } from '@/types/book';

const listsStore = useListsStore();
const expandedLists = ref<Set<string>>(new Set());
const loadingBooks = ref<Set<string>>(new Set());
const listBooks = ref<Record<string, UserBook[]>>({});
const newListName = ref('');
const isPublic = ref(false);

const handlePublicToggle = (checked: boolean) => {
  isPublic.value = checked;
};

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      const newList = await listsStore.createList(
        newListName.value.trim(),
        isPublic.value
      );
      newListName.value = '';
      isPublic.value = false;
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  }
};

const loadAllBooks = async () => {
  const lists = listsStore.lists;
  for (const list of lists) {
    loadingBooks.value.add(list.id);
    try {
      const books = await listsStore.getBooksInList(list.id);
      listBooks.value[list.id] = books;
    } catch (error) {
      console.error('Error loading books for list:', error);
    } finally {
      loadingBooks.value.delete(list.id);
    }
  }
};

// Add this function to handle new list creation
const handleNewList = async (listId: string) => {
  loadingBooks.value.add(listId);
  try {
    const books = await listsStore.getBooksInList(listId);
    listBooks.value[listId] = books;
  } catch (error) {
    console.error('Error loading books for new list:', error);
  } finally {
    loadingBooks.value.delete(listId);
  }
};

onMounted(async () => {
  await listsStore.initialize();
  await loadAllBooks();
});

const toggleExpansion = async (listId: string) => {
  if (expandedLists.value.has(listId)) {
    expandedLists.value.delete(listId);
  } else {
    expandedLists.value.add(listId);
  }
};

const handleDeleteList = async (listId: string) => {
  try {
    await listsStore.deleteList(listId);
    expandedLists.value.delete(listId);
    delete listBooks.value[listId];
  } catch (error) {
    console.error('Error deleting list:', error);
  }
};

const handleRemoveBook = async (listId: string, isbn: string) => {
  try {
    await listsStore.removeBookFromList(listId, isbn);
    // Refresh the books in the list
    loadingBooks.value.add(listId);
    try {
      const books = await listsStore.getBooksInList(listId);
      listBooks.value[listId] = books;
    } finally {
      loadingBooks.value.delete(listId);
    }
  } catch (error) {
    console.error('Error removing book from list:', error);
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
          :books="listBooks[list.id]"
          @toggle-expansion="toggleExpansion"
          @delete-list="handleDeleteList"
          @remove-book="handleRemoveBook"
        />
      </div>
    </div>
  </div>
</template>
