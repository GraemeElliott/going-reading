import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase/supabase';
import { useAuthStore } from './auth-store';
import type { UserBook } from '../types/book';
import {
  ReadingActivityService,
  ActivityType,
} from '../services/activityService';

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

  const fetchUserListsAndBooks = async (): Promise<void> => {
    if (!authStore.user) {
      lists.value = [];
      booksInLists.value = {};
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const { data: listsWithBooks, error: fetchError } = await supabase
        .from('lists')
        .select(
          `
          *,
          books_in_lists (
            isbn
          )
        `
        )
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const processedLists: List[] = [];
      const isbnSet = new Set<string>();

      listsWithBooks?.forEach((listData: any) => {
        const { books_in_lists, ...listInfo } = listData;
        processedLists.push(listInfo);

        books_in_lists.forEach((item: { isbn: string }) => {
          isbnSet.add(item.isbn);
        });
      });

      lists.value = processedLists;

      if (isbnSet.size === 0) {
        processedLists.forEach((list) => {
          booksInLists.value[list.id] = [];
        });
        return;
      }

      const { data: userBooksData, error: booksError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', authStore.user.id)
        .in('isbn', Array.from(isbnSet));

      if (booksError) throw booksError;

      const booksByIsbn = new Map(
        (userBooksData || []).map((book: UserBook) => [book.isbn, book])
      );

      const processedBooks: Record<string, UserBook[]> = {};

      listsWithBooks?.forEach((listData: any) => {
        const books: UserBook[] = [];
        listData.books_in_lists.forEach((item: { isbn: string }) => {
          const book = booksByIsbn.get(item.isbn);
          if (book) {
            books.push(book);
          }
        });
        processedBooks[listData.id] = books;
      });

      booksInLists.value = processedBooks;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchUserLists = async (): Promise<void> => {
    await fetchUserListsAndBooks();
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

      const { data: bookData, error: bookError } = await supabase
        .from('user_books')
        .select('*')
        .eq('isbn', isbn)
        .eq('user_id', authStore.user.id)
        .single();

      if (bookError) throw bookError;

      if (!booksInLists.value[listId]) {
        booksInLists.value[listId] = [];
      }
      booksInLists.value[listId].push(bookData as UserBook);

      // Get list name for activity log
      const list = lists.value.find((l) => l.id === listId);

      // Log book added to list
      await ReadingActivityService.logActivity(
        authStore.user.id,
        ActivityType.BOOK_ADDED_TO_LIST,
        isbn,
        {
          listId,
          listName: list?.name,
          bookTitle: (bookData as UserBook).title,
        }
      );
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

      // Get book and list info before removal for activity log
      const book = booksInLists.value[listId]?.find((b) => b.isbn === isbn);
      const list = lists.value.find((l) => l.id === listId);

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

      // Log book removed from list
      await ReadingActivityService.logActivity(
        authStore.user.id,
        ActivityType.BOOK_REMOVED_FROM_LIST,
        isbn,
        {
          listId,
          listName: list?.name,
          bookTitle: book?.title,
        }
      );
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

      // Get list info before deletion for activity log
      const list = lists.value.find((l) => l.id === listId);

      const { error: deleteError } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', authStore.user.id);

      if (deleteError) throw deleteError;

      // Log list deletion before removing from local state
      await ReadingActivityService.logActivity(
        authStore.user.id,
        ActivityType.LIST_DELETED,
        undefined,
        {
          listId,
          listName: list?.name,
        }
      );

      lists.value = lists.value.filter((list) => list.id !== listId);
      delete booksInLists.value[listId];
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initialize = async (): Promise<void> => {
    await fetchUserListsAndBooks();
  };

  return {
    lists: userLists,
    loading,
    error,
    booksInLists,
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
