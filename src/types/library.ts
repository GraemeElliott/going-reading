export type LibraryFormat = 'physical' | 'digital';

export const LIBRARY_FORMATS: LibraryFormat[] = ['physical', 'digital'];

// A book the user owns. Independent of shelves (user_books) and lists, so it
// keeps its own copy of the book details like user_books does.
export interface LibraryEntry {
  id: string;
  user_id: string;
  isbn: string;
  title: string;
  authors: string[];
  image: string | null;
  date_published: string | null;
  publisher: string | null;
  pages: number | null;
  /** Never empty; one entry per book even when owned in both formats */
  formats: LibraryFormat[];
  /** 'YYYY-MM-DD' */
  date_added: string;
  created_at: string;
  updated_at: string;
}

export type LibrarySort = 'added' | 'title' | 'author';
export type LibrarySearchField = 'title' | 'author' | 'isbn';
