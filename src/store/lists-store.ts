import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth-store';
import type { List, ListsState } from '../types/list';
import { ListService } from '../services/listService';

export const useListsStore = defineStore('lists', () => {
  const state = ref<ListsState>({
    lists: [],
    booksInLists: {},
    loading: false,
    loadingBooks: {},
    error: null,
  });

  const authStore = useAuthStore();

  const userLists = computed(() => state.value.lists);

  const fetchUserListsAndBooks = async (): Promise<void> => {
    if (!authStore.user) {
      state.value.lists = [];
      state.value.booksInLists = {};
      return;
    }

    try {
      state.value.loading = true;
      state.value.error = null;

      const { lists, booksInLists } = await ListService.fetchUserListsAndBooks(
        authStore.user.id
      );

      state.value.lists = lists;
      state.value.booksInLists = booksInLists;
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const fetchUserLists = async (): Promise<void> => {
    await fetchUserListsAndBooks();
  };

  const createList = async (
    name: string,
    details: string = ''
  ): Promise<List> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to create a list');
    }

    try {
      state.value.loading = true;
      state.value.error = null;

      const newList = await ListService.createList(
        authStore.user.id,
        name,
        details
      );

      state.value.lists = [newList, ...state.value.lists];
      state.value.booksInLists[newList.id] = [];

      return newList;
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const editListDetails = async (
    listId: string,
    name: string,
    details: string
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to edit a list');
    }

    try {
      state.value.loading = true;
      state.value.error = null;

      await ListService.updateList(authStore.user.id, listId, name, details);

      state.value.lists = state.value.lists.map((list) =>
        list.id === listId ? { ...list, name, details } : list
      );
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const isBookInList = async (
    listId: string,
    isbn: string
  ): Promise<boolean> => {
    try {
      return await ListService.isBookInList(listId, isbn);
    } catch (err: any) {
      console.error('Error checking if book is in list:', err);
      return false;
    }
  };

  const addBookToList = async (listId: string, isbn: string): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to add a book to a list');
    }

    try {
      state.value.loadingBooks[listId] = true;
      state.value.error = null;

      const alreadyInList = await isBookInList(listId, isbn);
      if (alreadyInList) {
        return;
      }

      const list = state.value.lists.find((l) => l.id === listId);
      const bookData = await ListService.addBookToList(
        authStore.user.id,
        listId,
        isbn,
        list?.name
      );

      if (!state.value.booksInLists[listId]) {
        state.value.booksInLists[listId] = [];
      }
      state.value.booksInLists[listId].push(bookData);
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loadingBooks[listId] = false;
    }
  };

  const removeBookFromList = async (
    listId: string,
    isbn: string
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to remove a book from a list');
    }

    try {
      state.value.loadingBooks[listId] = true;
      state.value.error = null;

      const book = state.value.booksInLists[listId]?.find(
        (b) => b.isbn === isbn
      );
      const list = state.value.lists.find((l) => l.id === listId);

      await ListService.removeBookFromList(
        authStore.user.id,
        listId,
        isbn,
        list?.name,
        book?.title
      );

      if (state.value.booksInLists[listId]) {
        state.value.booksInLists[listId] = state.value.booksInLists[
          listId
        ].filter((book) => book.isbn !== isbn);
      }
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loadingBooks[listId] = false;
    }
  };

  const deleteList = async (listId: string): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to delete a list');
    }

    try {
      state.value.loading = true;
      state.value.error = null;

      const list = state.value.lists.find((l) => l.id === listId);
      await ListService.deleteList(authStore.user.id, listId, list?.name);

      state.value.lists = state.value.lists.filter(
        (list) => list.id !== listId
      );
      delete state.value.booksInLists[listId];
    } catch (err: any) {
      state.value.error = err.message;
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const initialize = async (): Promise<void> => {
    await fetchUserListsAndBooks();
  };

  return {
    lists: userLists,
    loading: computed(() => state.value.loading),
    loadingBooks: computed(() => state.value.loadingBooks),
    error: computed(() => state.value.error),
    booksInLists: computed(() => state.value.booksInLists),
    createList,
    editListDetails,
    addBookToList,
    removeBookFromList,
    deleteList,
    initialize,
    isBookInList,
    fetchUserLists,
    fetchUserListsAndBooks,
  };
});
