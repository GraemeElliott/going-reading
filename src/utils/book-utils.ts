import type { BookStatus, UserBook } from '../types/book';

export const extractYear = (
  dateStr: string | undefined | null
): number | null => {
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

export const sortBooksByDate = (
  books: UserBook[],
  status: BookStatus
): UserBook[] => {
  if (status === 'read') {
    return books.sort((a, b) => {
      const dateA = a.date_finished
        ? new Date(a.date_finished).getTime()
        : new Date(a.date_added).getTime();
      const dateB = b.date_finished
        ? new Date(b.date_finished).getTime()
        : new Date(b.date_added).getTime();
      return dateB - dateA;
    });
  }

  return books.sort(
    (a, b) =>
      new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
  );
};

export const groupBooksByStatus = (
  books: UserBook[]
): Record<BookStatus, UserBook[]> => {
  const groups: Record<BookStatus, UserBook[]> = {
    'want-to-read': [],
    'currently-reading': [],
    read: [],
    'did-not-finish': [],
    '': [],
  };

  books.forEach((book) => {
    if (book.status in groups) {
      groups[book.status].push(book);
    }
  });

  // Sort books in each group
  Object.keys(groups).forEach((status) => {
    groups[status as BookStatus] = sortBooksByDate(
      groups[status as BookStatus],
      status as BookStatus
    );
  });

  return groups;
};
