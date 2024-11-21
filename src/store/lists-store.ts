import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase/supabase';
import { useAuthStore } from './auth-store';
import type { UserBook } from '@/types/book';

interface List {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<List[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const authStore = useAuthStore();

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
    isPublic: boolean = false
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
          is_public: isPublic,
        })
        .select()
        .single();

      if (createError) {
        // Check if error is a unique constraint violation
        if (createError.code === '23505') {
          throw new Error('A list with this name already exists');
        }
        throw createError;
      }

      const newList = data as List;
      lists.value = [newList, ...lists.value];

      return newList;
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

      // Check if book is already in the list
      const alreadyInList = await isBookInList(listId, isbn);
      if (alreadyInList) {
        return; // Silently succeed if book is already in list
      }

      // Add to books_in_lists without modifying user_books
      const { error: addError } = await supabase.from('books_in_lists').insert({
        list_id: listId,
        isbn,
        user_id: authStore.user.id,
      });

      if (addError) throw addError;
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
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getBooksInList = async (listId: string): Promise<UserBook[]> => {
    try {
      loading.value = true;
      error.value = null;

      // First get all book ISBNs in the list
      const { data: bookListData, error: bookListError } = await supabase
        .from('books_in_lists')
        .select('isbn')
        .eq('list_id', listId);

      if (bookListError) throw bookListError;

      if (!bookListData || bookListData.length === 0) {
        return [];
      }

      // Get the book details from user_books
      const isbns = bookListData.map((item) => item.isbn);
      const { data: bookData, error: bookError } = await supabase
        .from('user_books')
        .select('*')
        .in('isbn', isbns)
        .eq('user_id', authStore.user?.id);

      if (bookError) throw bookError;

      return bookData as UserBook[];
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initialize = async (): Promise<void> => {
    await fetchUserLists();
  };

  return {
    lists: userLists,
    loading,
    error,
    fetchUserLists,
    createList,
    addBookToList,
    removeBookFromList,
    deleteList,
    getBooksInList,
    initialize,
    isBookInList,
  };
});
