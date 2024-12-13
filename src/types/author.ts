import type { Book } from './book';

// Author profile with books and metadata
export interface AuthorBase {
  type: 'author';
  name: string;
  photoUrl?: string;
  bio?: string;
}

// Full author details including books and total count
export interface Author extends AuthorBase {
  books: Book[];
  total?: number; // Total number of books by this author in the database
}

// Author search result with minimal information
export interface AuthorSearchResult extends AuthorBase {
  books: never[]; // Empty books array for search results
}
