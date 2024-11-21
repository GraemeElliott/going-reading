<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useListsStore } from '@/store/lists-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth-store';
import { storeToRefs } from 'pinia';
import type { UserBook } from '@/types/book';
import ListCard from '@/components/my-lists/ListCard.vue';
const listsStore = useListsStore();
const userBooksStore = useUserBooksStore();
const authStore = useAuthStore();
const { lists, loading } = storeToRefs(listsStore);
const newListName = ref('');
const isPublic = ref(false);
const expandedLists = ref<Set<string>>(new Set());
const listBooks = ref<Record<string, UserBook[]>>({});
const loadingBooks = ref<Set<string>>(new Set());
const toggleListExpansion = (listId: string) => {
  if (expandedLists.value.has(listId)) {
    expandedLists.value.delete(listId);
  } else {
    expandedLists.value.add(listId);
  }
};
const loadBooksForList = async (listId: string) => {
  if (listBooks.value[listId]) return; // Skip if already loaded
  try {
    loadingBooks.value.add(listId);
    const books = await listsStore.getBooksInList(listId);
    listBooks.value[listId] = books;
  } catch (error) {
    console.error('Failed to load books for list:', error);
    listBooks.value[listId] = [];
  } finally {
    loadingBooks.value.delete(listId);
  }
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
const handleDeleteList = async (listId: string) => {
  try {
    await listsStore.deleteList(listId);
    expandedLists.value.delete(listId);
    delete listBooks.value[listId];
  } catch (error) {
    console.error('Failed to delete list:', error);
  }
};
const handleRemoveBook = async (listId: string, isbn: string) => {
  try {
    loadingBooks.value.add(listId);
    await listsStore.removeBookFromList(listId, isbn);
    await loadBooksForList(listId);
  } catch (error) {
    console.error('Failed to remove book from list:', error);
  } finally {
    loadingBooks.value.delete(listId);
  }
};
const handlePublicToggle = (checked: boolean) => {
  isPublic.value = checked;
};
// Pre-load all list data
const preloadListData = async () => {
  if (!lists.value) return;
  await Promise.all(lists.value.map((list) => loadBooksForList(list.id)));
};
onMounted(async () => {
  if (!authStore.user) return;
  await Promise.all([listsStore.initialize(), userBooksStore.initialize()]);
  await preloadListData();
});
</script>
<template>
  <div class="mt-8 space-y-4">
    <div class="w-full py-4">
      <div class="flex flex-col gap-1">
        <h3 class="text-lg font-medium">Lists</h3>
      </div>
      <Separator class="my-6" />
    </div>
    <div class="lg:mx-10">
      <div class="mb-8 border rounded-lg p-10">
        <div>
          <div class="grid gap-4">
            <div class="flex items-center gap-4">
              <Input
                v-model="newListName"
                placeholder="Enter list name"
                class="flex-1"
              />
              <div class="flex items-center gap-2">
                <Switch
                  :checked="isPublic"
                  @update:checked="handlePublicToggle"
                />
                <span class="text-sm">Public</span>
              </div>
              <Button @click="handleCreateList" :disabled="!newListName.trim()">
                Create List
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin h-8 w-8 mx-auto"></div>
    </div>
    <div v-else-if="lists.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No lists created yet</p>
    </div>
    <div v-else class="space-y-4">
      <ListCard
        v-for="list in lists"
        :key="list.id"
        :list="list"
        :expanded="expandedLists.has(list.id)"
        :loading-books="loadingBooks.has(list.id)"
        :books="listBooks[list.id]"
        @delete-list="handleDeleteList"
        @remove-book="handleRemoveBook"
        @toggle-expansion="toggleListExpansion"
      />
    </div>
  </div>
</template>
