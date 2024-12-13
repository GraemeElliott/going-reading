import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { BookStatus, UserBook, BookBasicInfo } from '../types/book';
import { useAuthStore } from './auth-store';
import { updateBookErrorMessages } from './error-handler';
import {
  ReadingActivityService,
  ActivityType,
} from '../services/activityService';
import { ReadingProgressService } from '../services/readingProgressService';
import { UserBookService } from '../services/userBookService';
import { groupBooksByStatus } from '../utils/book-utils';
import { useAsyncOperation } from '../composables/useAsyncOperation';

export const useUserBooksStore = defineStore('userBooks', () => {
  const booksMap = ref(new Map<string, UserBook>());
  const statusUpdateInProgress = ref(new Set<string>());
  const authStore = useAuthStore();
  const { loading, error, execute } = useAsyncOperation();

  // Computed properties
  const userBooks = computed(() => Array.from(booksMap.value.values()));
  const groupedBooks = computed(() => groupBooksByStatus(userBooks.value));

  // Helper function to update local state
  const updateLocalBook = (isbn: string, updates: Partial<UserBook>) => {
    const existingBook = booksMap.value.get(isbn);
    if (existingBook) {
      booksMap.value.set(isbn, { ...existingBook, ...updates });
      booksMap.value = new Map(booksMap.value);
    }
  };

  // Store actions
  const fetchUserBooks = async (): Promise<void> => {
    if (!authStore.userMetadata) {
      booksMap.value.clear();
      return;
    }

    await execute(async () => {
      const books = await UserBookService.fetchUserBooks(
        authStore.userMetadata.id
      );
      booksMap.value = new Map(books.map((book) => [book.isbn, book]));
    });
  };

  const initialize = async (): Promise<void> => {
    await fetchUserBooks();
  };

  const updateBookTotalPages = async (
    isbn: string,
    totalPages: number
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to update book pages');
    }

    const userId = authStore.user.id;

    await execute(async () => {
      const now = new Date().toISOString();
      const existingBook = booksMap.value.get(isbn);

      if (!existingBook) {
        throw new Error(updateBookErrorMessages.bookNotFound);
      }

      await UserBookService.updateBookTotalPages(userId, isbn, totalPages, now);
      updateLocalBook(isbn, { pages: totalPages, date_updated: now });

      // Update total_pages in reading_progress table and log activity
      await Promise.all([
        ReadingProgressService.updateTotalPages(userId, isbn, totalPages),
        ReadingActivityService.logActivity(
          userId,
          ActivityType.BOOK_TOTAL_PAGES_UPDATED,
          isbn,
          {
            totalPages,
            bookTitle: existingBook.title,
          }
        ),
      ]);
    });
  };

  const updateBookProgress = async (
    isbn: string,
    currentPage: number,
    timeReadingInMins: number = 0
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to update book progress');
    }

    const userId = authStore.user.id;

    await execute(async () => {
      const now = new Date().toISOString();
      const existingBook = booksMap.value.get(isbn);

      if (!existingBook) {
        throw new Error(updateBookErrorMessages.bookNotFound);
      }

      await UserBookService.updateBookProgress(userId, isbn, currentPage, now);
      updateLocalBook(isbn, { current_page: currentPage, date_updated: now });

      // Log to both activity feed and progress tracking
      await Promise.all([
        ReadingActivityService.logActivity(
          userId,
          ActivityType.BOOK_PROGRESS_UPDATED,
          isbn,
          {
            currentPage,
            totalPages: existingBook.pages,
            bookTitle: existingBook.title,
          }
        ),
        ReadingProgressService.logProgress(
          userId,
          isbn,
          currentPage,
          existingBook.pages || 0,
          timeReadingInMins
        ),
      ]);
    });
  };

  const getUserBookRating = (isbn: string): number | null => {
    return booksMap.value.get(isbn)?.user_rating ?? null;
  };

  const updateBookRating = async (
    isbn: string,
    rating: number | null
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to update book rating');
    }

    const userId = authStore.user.id;

    await execute(async () => {
      const now = new Date().toISOString();
      const existingBook = booksMap.value.get(isbn);

      if (!existingBook) {
        throw new Error(updateBookErrorMessages.bookNotFound);
      }

      await UserBookService.updateBookRating(userId, isbn, rating, now);
      updateLocalBook(isbn, { user_rating: rating, date_updated: now });

      // Log the rating update
      if (rating !== null) {
        await ReadingActivityService.logActivity(
          userId,
          ActivityType.BOOK_RATED,
          isbn,
          {
            rating,
            bookTitle: existingBook.title,
          }
        );
      }
    });
  };

  const getUserBookStatus = (isbn: string): BookStatus =>
    booksMap.value.get(isbn)?.status || '';

  const updateBookStatus = async (
    bookOrIsbn: BookBasicInfo | string,
    status: BookStatus
  ): Promise<void> => {
    if (!authStore.user) {
      throw new Error(updateBookErrorMessages.userNotLoggedInStatus);
    }

    const userId = authStore.user.id;
    const isbn = typeof bookOrIsbn === 'string' ? bookOrIsbn : bookOrIsbn.isbn;

    if (statusUpdateInProgress.value.has(isbn)) {
      return;
    }

    try {
      statusUpdateInProgress.value.add(isbn);
      const now = new Date().toISOString();
      const existingBook = booksMap.value.get(isbn);

      await execute(async () => {
        if (existingBook) {
          if (existingBook.status === status) {
            return;
          }

          await UserBookService.updateBookStatus(userId, isbn, status, now);

          const oldStatus = existingBook.status;
          updateLocalBook(isbn, {
            status,
            date_updated: now,
            date_finished: status === 'read' ? now : null,
          });

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

          const newBook = await UserBookService.addNewBook(
            userId,
            bookOrIsbn,
            status,
            now
          );

          booksMap.value.set(bookOrIsbn.isbn, newBook);
          booksMap.value = new Map(booksMap.value);

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
              0,
              bookOrIsbn.pages,
              0
            );
          }
        }
      });
    } finally {
      statusUpdateInProgress.value.delete(isbn);
    }
  };

  const deleteBook = async (isbn: string): Promise<void> => {
    if (!authStore.user) {
      throw new Error('User must be logged in to delete a book');
    }

    const userId = authStore.user.id;

    await execute(async () => {
      const existingBook = booksMap.value.get(isbn);
      if (!existingBook) {
        throw new Error(updateBookErrorMessages.bookNotFound);
      }

      await UserBookService.deleteBook(userId, isbn);

      // Log book deletion before removing from local state
      await ReadingActivityService.logActivity(
        userId,
        ActivityType.BOOK_DELETED,
        isbn,
        {
          bookTitle: existingBook.title,
        }
      );

      booksMap.value.delete(isbn);
      booksMap.value = new Map(booksMap.value);
    });
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
