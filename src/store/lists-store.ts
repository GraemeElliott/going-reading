import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase/supabase';
import { useAuthStore } from './auth-store';
import type { UserBook } from '@/types/book';

interface List {
  id: string;
  user_id: string;
  name: string;
  details: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<List[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authStore = useAuthStore();
  const booksInLists = ref<Record<string, UserBook[]>>({});

  const userLists = computed(() => lists.value);

  const fetchUserLists = async (): Promise<void> => {
    if (!authStore.user) {
      lists.value = [];
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      lists.value = data as List[];
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createList = async (
    name: string,
    isPublic: boolean = false,
    details: string = ''
  ): Promise<List> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to create a list');
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: createError } = await supabase
        .from('lists')
        .insert({
          user_id: authStore.user.id,
          name,
          details,
          is_public: isPublic,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new Error('A list with this name already exists');
        }
        throw createError;
      }

      const newList = data as List;
      lists.value = [newList, ...lists.value];
      booksInLists.value[newList.id] = [];

      return newList;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const editListDetails = async (
    listId: string,
    name: string,
    details: string,
    isPublic?: boolean
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to edit a list');
    }

    try {
      loading.value = true;
      error.value = null;

      const updateData: { name: string; details: string; is_public?: boolean } =
        {
          name,
          details,
        };

      if (typeof isPublic !== 'undefined') {
        updateData.is_public = isPublic;
      }

      const { error: updateError } = await supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)
        .eq('user_id', authStore.user.id);

      if (updateError) throw updateError;

      lists.value = lists.value.map((list) =>
        list.id === listId ? { ...list, ...updateData } : list
      );
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const isBookInList = async (
    listId: string,
    isbn: string
  ): Promise<boolean> => {
    try {
      const { data, error: checkError } = await supabase
        .from('books_in_lists')
        .select('id')
        .eq('list_id', listId)
        .eq('isbn', isbn);

      if (checkError) throw checkError;

      return data && data.length > 0;
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
      loading.value = true;
      error.value = null;

      const alreadyInList = await isBookInList(listId, isbn);
      if (alreadyInList) {
        return;
      }

      const { error: addError } = await supabase.from('books_in_lists').insert({
        list_id: listId,
        isbn,
        user_id: authStore.user.id,
      });

      if (addError) throw addError;

      // Update local state
      const books = await getBooksInList(listId);
      booksInLists.value[listId] = books;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
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
      loading.value = true;
      error.value = null;

      const { error: removeError } = await supabase
        .from('books_in_lists')
        .delete()
        .eq('list_id', listId)
        .eq('isbn', isbn)
        .eq('user_id', authStore.user.id);

      if (removeError) throw removeError;

      // Update local state
      if (booksInLists.value[listId]) {
        booksInLists.value[listId] = booksInLists.value[listId].filter(
          (book) => book.isbn !== isbn
        );
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteList = async (listId: string): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to delete a list');
    }

    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', authStore.user.id);

      if (deleteError) throw deleteError;

      lists.value = lists.value.filter((list) => list.id !== listId);
      delete booksInLists.value[listId];
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getBooksInList = async (listId: string): Promise<UserBook[]> => {
    try {
      const { data: bookListData, error: bookListError } = await supabase
        .from('books_in_lists')
        .select('isbn')
        .eq('list_id', listId);

      if (bookListError) throw bookListError;

      if (!bookListData || bookListData.length === 0) {
        booksInLists.value[listId] = [];
        return [];
      }

      const isbns = bookListData.map((item) => item.isbn);
      const { data: bookData, error: bookError } = await supabase
        .from('user_books')
        .select('*')
        .in('isbn', isbns)
        .eq('user_id', authStore.user?.id);

      if (bookError) throw bookError;

      const books = bookData as UserBook[];
      booksInLists.value[listId] = books;
      return books;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  };

  const initialize = async (): Promise<void> => {
    try {
      loading.value = true;
      await fetchUserLists();
      // Load books for all lists
      await Promise.all(lists.value.map((list) => getBooksInList(list.id)));
    } finally {
      loading.value = false;
    }
  };

  return {
    lists: userLists,
    loading,
    error,
    booksInLists,
    fetchUserLists,
    createList,
    editListDetails,
    addBookToList,
    removeBookFromList,
    deleteList,
    getBooksInList,
    initialize,
    isBookInList,
  };
});
