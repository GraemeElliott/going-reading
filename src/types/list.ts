import type { UserBook } from './book';
import type { UserBase } from './user';

// Base list properties
export interface ListBase {
  name: string;
  details: string;
}

// List entity as stored in database
export interface List extends ListBase {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// List with associated user information
export interface ListWithUser extends List {
  user: UserBase;
}

// List with its books
export interface ListWithBooks extends List {
  books: UserBook[];
}

// Complete list data including user and books
export interface ListComplete extends List {
  user: UserBase;
  books: UserBook[];
}

// State management for lists
export interface ListsState {
  lists: List[];
  booksInLists: Record<string, UserBook[]>;
  loading: boolean;
  loadingBooks: Record<string, boolean>;
  error: string | null;
}

// List creation/update payload
export interface ListInput extends ListBase {
  user_id: string;
}

// List operation response
export interface ListOperationResult {
  success: boolean;
  error?: string;
  list?: List;
}
