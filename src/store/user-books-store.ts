import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase/supabase';
import type { BookStatus, UserBook, BookBasicInfo } from '../types/book';
import { useAuthStore } from './auth-store';
import { updateBookErrorMessages } from './error-handler';

export const useUserBooksStore = defineStore(
  'userBooks',
  () => {
    const booksMap = ref<Map<string, UserBook>>(new Map());
    const loading = ref(false);
    const error = ref<string | null>(null);
    const initialized = ref(false);
    const statusUpdateInProgress = ref(new Set<string>()); // Track books with status updates in progress
    const authStore = useAuthStore();

    const userBooks = computed(() => Array.from(booksMap.value.values()));

    const groupedBooks = computed(() => {
      const groups: Record<BookStatus, UserBook[]> = {
        'want-to-read': [],
        'currently-reading': [],
        read: [],
        'did-not-finish': [],
        '': [],
      };

      userBooks.value.forEach((book) => {
        if (book.status in groups) {
          groups[book.status].push(book);
        }
      });

      Object.keys(groups).forEach((status) => {
        groups[status as BookStatus].sort(
          (a, b) =>
            new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
        );
      });

      return groups;
    });

    const fetchUserBooks = async (): Promise<void> => {
      if (!authStore.user) {
        booksMap.value.clear();
        return;
      }

      try {
        loading.value = true;
        error.value = null;

        const { data, error: fetchError } = await supabase
          .from('user_books')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('date_added', { ascending: false });

        if (fetchError) throw fetchError;

        const bookEntries = (data as UserBook[]).map(
          (book): [string, UserBook] => [book.isbn, book]
        );
        booksMap.value = new Map(bookEntries);
      } catch (err: any) {
        error.value = err.message;
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const initialize = async (): Promise<void> => {
      if (!initialized.value) {
        await fetchUserBooks();
        initialized.value = true;
      }
    };

    const updateBookProgress = async (
      isbn: string,
      currentPage: number
    ): Promise<void> => {
      if (!authStore.user)
        throw new Error(updateBookErrorMessages.userNotLoggedInProgress);

      try {
        loading.value = true;
        error.value = null;

        const now = new Date().toISOString();
        const existingBook = booksMap.value.get(isbn);

        if (!existingBook) {
          throw new Error(updateBookErrorMessages.bookNotFound);
        }

        const { error: updateError } = await supabase
          .from('user_books')
          .update({
            current_page: currentPage,
            date_updated: now,
          })
          .eq('user_id', authStore.user.id)
          .eq('isbn', isbn);

        if (updateError) throw updateError;

        existingBook.current_page = currentPage;
        existingBook.date_updated = now;
        booksMap.value.set(isbn, existingBook);
        booksMap.value = new Map(booksMap.value);
      } catch (err: any) {
        error.value = err.message;
        throw err;
      } finally {
        loading.value = false;
      }
    };

    const updateBookStatus = async (
      bookOrIsbn: BookBasicInfo | string,
      status: BookStatus
    ): Promise<void> => {
      if (!authStore.user)
        throw new Error(updateBookErrorMessages.userNotLoggedInStatus);

      const isbn =
        typeof bookOrIsbn === 'string' ? bookOrIsbn : bookOrIsbn.isbn;

      // If a status update is already in progress for this book, skip
      if (statusUpdateInProgress.value.has(isbn)) {
        return;
      }

      try {
        statusUpdateInProgress.value.add(isbn);
        loading.value = true;
        error.value = null;

        const userId = authStore.user.id;
        const now = new Date().toISOString();
        const existingBook = booksMap.value.get(isbn);

        if (existingBook) {
          // Skip if status hasn't changed
          if (existingBook.status === status) {
            return;
          }

          const updateData: any = {
            status,
            date_updated: now,
          };

          // Set date_finished when status is 'read'
          if (status === 'read') {
            updateData.date_finished = now;
          } else {
            updateData.date_finished = null; // Clear date_finished for other statuses
          }

          const { error: updateError } = await supabase
            .from('user_books')
            .update(updateData)
            .eq('user_id', userId)
            .eq('isbn', isbn);

          if (updateError) throw updateError;

          existingBook.status = status;
          existingBook.date_updated = now;
          existingBook.date_finished = status === 'read' ? now : null;
          booksMap.value.set(isbn, existingBook);
        } else {
          if (typeof bookOrIsbn === 'string') {
            throw new Error(updateBookErrorMessages.fullBookInfoRequired);
          }

          const newBookData: any = {
            user_id: userId,
            isbn: bookOrIsbn.isbn,
            status,
            title: bookOrIsbn.title,
            authors: bookOrIsbn.authors,
            image: bookOrIsbn.image,
            date_added: now,
            date_updated: now,
            date_published: bookOrIsbn.date_published,
            publisher: bookOrIsbn.publisher,
            pages: bookOrIsbn.pages,
          };

          // Set date_finished for new books marked as read
          if (status === 'read') {
            newBookData.date_finished = now;
          }

          const { data: newBook, error: insertError } = await supabase
            .from('user_books')
            .insert(newBookData)
            .select()
            .single();

          if (insertError) throw insertError;
          if (newBook) {
            booksMap.value.set(bookOrIsbn.isbn, newBook as UserBook);
          }
        }

        booksMap.value = new Map(booksMap.value);
      } catch (err: any) {
        error.value = err.message;
        throw err;
      } finally {
        loading.value = false;
        statusUpdateInProgress.value.delete(isbn);
      }
    };

    const getUserBookStatus = (isbn: string): BookStatus =>
      booksMap.value.get(isbn)?.status || '';

    const deleteBook = async (isbn: string): Promise<void> => {
      if (!authStore.user)
        throw new Error(updateBookErrorMessages.userNotLoggedInDeleteBook);

      try {
        loading.value = true;
        error.value = null;

        const { error: deleteError } = await supabase
          .from('user_books')
          .delete()
          .eq('user_id', authStore.user.id)
          .eq('isbn', isbn);

        if (deleteError) throw deleteError;

        booksMap.value.delete(isbn);
        booksMap.value = new Map(booksMap.value);
      } catch (err: any) {
        error.value = err.message;
        throw err;
      } finally {
        loading.value = false;
      }
    };

    return {
      userBooks,
      groupedBooks,
      loading,
      error,
      initialized,
      fetchUserBooks,
      initialize,
      updateBookStatus,
      updateBookProgress,
      getUserBookStatus,
      deleteBook,
    };
  },
  {
    persist: true,
  }
);
