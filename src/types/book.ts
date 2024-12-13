import type { Author } from './author';

// Core book properties that are common across all book types
export interface BookCore {
  isbn: string;
  title: string;
  authors: string[];
  image: string;
  date_published?: string;
  publisher?: string;
  pages?: number;
}

// Basic book info type for UserStatus table
export interface BookBasicInfo extends BookCore {}

// Extended book details
export interface Book extends BookCore {
  title_long: string;
  language: string;
  synopsis: string;
  subjects: string[];
  binding: string;
  other_isbns?: {
    isbn: string;
    binding: string;
  }[];
  overview?: string;
  excerpt?: string;
  msrp?: number;
  edition?: string;
  dimensions?: string;
  // User-specific properties
  user_rating?: number | null;
  status?: BookStatus;
  average_rating?: number;
}

// User's book type from database
export interface UserBook extends BookCore {
  id: string;
  user_id: string;
  status: BookStatus;
  date_added: string;
  date_updated: string;
  date_finished?: string | null;
  user_rating: number | null;
  current_page?: number;
}

// Book status type
export type BookStatus =
  | 'want-to-read'
  | 'currently-reading'
  | 'read'
  | 'did-not-finish'
  | '';

// Status display names mapping
export const STATUS_DISPLAY_NAMES: Record<BookStatus, string> = {
  'want-to-read': 'Want To Read',
  'currently-reading': 'Currently Reading',
  read: 'Read',
  'did-not-finish': 'Did Not Finish',
  '': '',
};

// API Types
export interface APIBookResponse {
  isbn?: string;
  isbn13?: string;
  title?: string;
  title_long?: string;
  authors?: string | string[];
  publisher?: string;
  language?: string;
  date_published?: string;
  pages?: number;
  image?: string;
  synopsis?: string;
  subjects?: string[];
  binding?: string;
  other_isbns?: { isbn: string; binding: string }[];
  overview?: string;
  excerpt?: string;
  msrp?: number;
  edition?: string;
  dimensions?: string;
}

export interface AuthorBookResponse {
  book: APIBookResponse;
}

// Search Types
export interface ScoredBook extends Book {
  score: number;
}

export interface SearchCache<T> {
  timestamp: number;
  results: T[];
}

export type BookSearchCache = SearchCache<Book | Author>;
