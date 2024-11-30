import type { Book } from './book';

export interface Author {
  type: 'author';
  name: string;
  books: Book[];
  photoUrl?: string;
  bio?: string;
  total?: number; // Total number of books available
}
