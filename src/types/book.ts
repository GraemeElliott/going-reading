import type { Author } from './author';

// Raw API response type
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
}

export interface ScoredBook extends Book {
  score: number;
}

// Basic book info type for UserStatus table
export interface BookBasicInfo {
  isbn: string;
  title: string;
  authors: string[];
  image: string;
  date_published?: string;
  publisher?: string;
  pages?: number;
}

export interface Book {
  isbn: string;
  title: string;
  title_long: string;
  authors: string[];
  publisher: string;
  language: string;
  date_published?: string;
  pages: number;
  image: string;
  synopsis: string;
  subjects: string[];
  binding: string;
  other_isbns?: {
    isbn: string;
    binding: string;
  }[];
  // User-specific properties
  userRating?: number;
  status?: BookStatus;
  average_rating?: number;
}

// User's book type from database
export interface UserBook {
  id: string;
  user_id: string;
  isbn: string;
  status: BookStatus;
  title: string;
  authors: string[];
  image: string;
  date_added: string;
  date_updated: string;
  userRating?: number;
  date_published?: string;
  publisher?: string;
  pages?: number;
  current_page?: number;
}

// Book status type
export type BookStatus =
  | 'want-to-read'
  | 'currently-reading'
  | 'read'
  | 'did-not-finish'
  | '';

// Cache entry type for search results
export interface CacheEntry {
  timestamp: number;
  results: (Book | Author)[];
}
