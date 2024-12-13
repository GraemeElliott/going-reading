import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase/supabase';
import type { BookStatus, UserBook, BookBasicInfo } from '../types/book';
import { useAuthStore } from './auth-store';
import { updateBookErrorMessages } from './error-handler';
import {
  ReadingActivityService,
  ActivityType,
} from '../services/activityService';
import { ReadingProgressService } from '../services/readingProgressService';

// Utility function to extract year from date string
const extractYear = (dateStr: string | undefined | null): number | null => {
  if (!dateStr) return null;

  // If it's already a year (4 digits), convert to number
  if (/^\d{4}$/.test(dateStr)) {
    return parseInt(dateStr, 10);
  }

  // Try to extract year from the date string
  const matches = dateStr.toString().match(/\d{4}/);
  if (matches) {
    return parseInt(matches[0], 10);
  }

  return null;
};

export const useUserBooksStore = defineStore('userBooks', () => {
  const booksMap = ref(new Map<string, UserBook>());
  const loading = ref(false);
  const error = ref<string | null>(null);
  const statusUpdateInProgress = ref(new Set<string>());
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
      if (status === 'read') {
        groups[status as BookStatus].sort((a, b) => {
          const dateA = a.date_finished
            ? new Date(a.date_finished).getTime()
            : new Date(a.date_added).getTime();
          const dateB = b.date_finished
            ? new Date(b.date_finished).getTime()
            : new Date(b.date_added).getTime();
          return dateB - dateA;
        });
      } else {
        groups[status as BookStatus].sort(
          (a, b) =>
            new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
        );
      }
    });
    return groups;
  });

  const fetchUserBooks = async (): Promise<void> => {
    if (!authStore.userMetadata) {
      booksMap.value.clear();
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', authStore.userMetadata.id)
        .order('date_added', { ascending: false });

      if (fetchError) throw fetchError;

      booksMap.value = new Map(
        (data as UserBook[]).map((book) => [book.isbn, book])
      );
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initialize = async (): Promise<void> => {
    await fetchUserBooks();
  };

  const updateBookTotalPages = async (
    isbn: string,
    totalPages: number
  ): Promise<void> => {
    if (!authStore.user)
      throw new Error('User must be logged in to update book pages');

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
          pages: totalPages,
          date_updated: now,
        })
        .eq('user_id', authStore.user.id)
        .eq('isbn', isbn);

      if (updateError) throw updateError;

      existingBook.pages = totalPages;
      existingBook.date_updated = now;
      booksMap.value.set(isbn, existingBook);
      booksMap.value = new Map(booksMap.value);

      // Update total_pages in reading_progress table
      await ReadingProgressService.updateTotalPages(
        authStore.user.id,
        isbn,
        totalPages
      );

      // Log the total pages update
      await ReadingActivityService.logActivity(
        authStore.user.id,
        ActivityType.BOOK_TOTAL_PAGES_UPDATED,
        isbn,
        {
          totalPages,
          bookTitle: existingBook.title,
        }
      );
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateBookProgress = async (
    isbn: string,
    currentPage: number,
    timeReadingInMins: number = 0
  ): Promise<void> => {
    if (!authStore.user)
      throw new Error('User must be logged in to update book progress');

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

      // Log to both activity feed and progress tracking
      await Promise.all([
        ReadingActivityService.logActivity(
          authStore.user.id,
          ActivityType.BOOK_PROGRESS_UPDATED,
          isbn,
          {
            currentPage,
            totalPages: existingBook.pages,
            bookTitle: existingBook.title,
          }
        ),
        ReadingProgressService.logProgress(
          authStore.user.id,
          isbn,
          currentPage,
          existingBook.pages || 0,
          timeReadingInMins
        ),
      ]);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getUserBookRating = (isbn: string): number | null => {
    return booksMap.value.get(isbn)?.user_rating ?? null;
  };

  const updateBookRating = async (
    isbn: string,
    rating: number | null
  ): Promise<void> => {
    if (!authStore.user)
      throw new Error('User must be logged in to update book rating');

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
          user_rating: rating,
          date_updated: now,
        })
        .eq('user_id', authStore.user.id)
        .eq('isbn', isbn);

      if (updateError) throw updateError;

      existingBook.user_rating = rating;
      existingBook.date_updated = now;
      booksMap.value.set(isbn, existingBook);
      booksMap.value = new Map(booksMap.value);

      // Log the rating update
      if (rating !== null) {
        await ReadingActivityService.logActivity(
          authStore.user.id,
          ActivityType.BOOK_RATED,
          isbn,
          {
            rating,
            bookTitle: existingBook.title,
          }
        );
      }
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getUserBookStatus = (isbn: string): BookStatus =>
    booksMap.value.get(isbn)?.status || '';

  const updateBookStatus = async (
    bookOrIsbn: BookBasicInfo | string,
    status: BookStatus
  ): Promise<void> => {
    if (!authStore.user)
      throw new Error(updateBookErrorMessages.userNotLoggedInStatus);

    const isbn = typeof bookOrIsbn === 'string' ? bookOrIsbn : bookOrIsbn.isbn;

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
        if (existingBook.status === status) {
          return;
        }

        const updateData: any = {
          status,
          date_updated: now,
        };
        if (status === 'read') {
          updateData.date_finished = now;
        } else {
          updateData.date_finished = null;
        }

        const { error: updateError } = await supabase
          .from('user_books')
          .update(updateData)
          .eq('user_id', userId)
          .eq('isbn', isbn);

        if (updateError) throw updateError;

        const oldStatus = existingBook.status;
        existingBook.status = status;
        existingBook.date_updated = now;
        existingBook.date_finished = status === 'read' ? now : null;
        booksMap.value.set(isbn, existingBook);

        // Log status change
        await ReadingActivityService.logActivity(
          userId,
          ActivityType.BOOK_STATUS_CHANGED,
          isbn,
          {
            oldStatus,
            newStatus: status,
            bookTitle: existingBook.title,
          }
        );
      } else {
        if (typeof bookOrIsbn === 'string') {
          throw new Error('Full book info required for new books');
        }

        const { data: newBook, error: insertError } = await supabase
          .from('user_books')
          .insert({
            user_id: userId,
            isbn: bookOrIsbn.isbn,
            status,
            title: bookOrIsbn.title,
            authors: bookOrIsbn.authors,
            image: bookOrIsbn.image,
            date_added: now,
            date_updated: now,
            date_published: extractYear(bookOrIsbn.date_published),
            publisher: bookOrIsbn.publisher,
            pages: bookOrIsbn.pages || 0,
            user_rating: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newBook) {
          booksMap.value.set(bookOrIsbn.isbn, newBook as UserBook);

          // Log new book added
          await ReadingActivityService.logActivity(
            userId,
            ActivityType.BOOK_ADDED,
            bookOrIsbn.isbn,
            {
              newStatus: status,
              bookTitle: bookOrIsbn.title,
            }
          );

          // Initialize progress tracking if pages are available
          if (bookOrIsbn.pages) {
            await ReadingProgressService.logProgress(
              userId,
              bookOrIsbn.isbn,
              0, // Start at page 0
              bookOrIsbn.pages,
              0 // Initialize with 0 minutes read
            );
          }
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

  const deleteBook = async (isbn: string): Promise<void> => {
    if (!authStore.user)
      throw new Error('User must be logged in to delete a book');

    try {
      loading.value = true;
      error.value = null;

      const existingBook = booksMap.value.get(isbn);
      if (!existingBook) {
        throw new Error(updateBookErrorMessages.bookNotFound);
      }

      const { error: deleteError } = await supabase
        .from('user_books')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('isbn', isbn);

      if (deleteError) throw deleteError;

      // Log book deletion before removing from local state
      await ReadingActivityService.logActivity(
        authStore.user.id,
        ActivityType.BOOK_DELETED,
        isbn,
        {
          bookTitle: existingBook.title,
        }
      );

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
    getUserBookStatus,
    getUserBookRating,
    updateBookRating,
    updateBookStatus,
    updateBookProgress,
    updateBookTotalPages,
    fetchUserBooks,
    initialize,
    deleteBook,
  };
});
