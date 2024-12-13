import { supabase } from '../supabase/supabase';
import type { BookStatus, UserBook, BookBasicInfo } from '../types/book';
import { extractYear } from '../utils/book-utils';

export interface BookUpdateData {
  status?: BookStatus;
  current_page?: number;
  pages?: number;
  user_rating?: number | null;
  date_updated: string;
  date_finished?: string | null;
}

export class UserBookService {
  static async fetchUserBooks(userId: string): Promise<UserBook[]> {
    const { data, error } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .order('date_added', { ascending: false });

    if (error) throw error;
    return data as UserBook[];
  }

  static async updateBookStatus(
    userId: string,
    isbn: string,
    status: BookStatus,
    now: string
  ): Promise<void> {
    const updateData: BookUpdateData = {
      status,
      date_updated: now,
      date_finished: status === 'read' ? now : null,
    };

    const { error } = await supabase
      .from('user_books')
      .update(updateData)
      .eq('user_id', userId)
      .eq('isbn', isbn);

    if (error) throw error;
  }

  static async addNewBook(
    userId: string,
    book: BookBasicInfo,
    status: BookStatus,
    now: string
  ): Promise<UserBook> {
    const { data, error } = await supabase
      .from('user_books')
      .insert({
        user_id: userId,
        isbn: book.isbn,
        status,
        title: book.title,
        authors: book.authors,
        image: book.image,
        date_added: now,
        date_updated: now,
        date_published: extractYear(book.date_published),
        publisher: book.publisher,
        pages: book.pages || 0,
        user_rating: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserBook;
  }

  static async updateBookProgress(
    userId: string,
    isbn: string,
    currentPage: number,
    now: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_books')
      .update({
        current_page: currentPage,
        date_updated: now,
      })
      .eq('user_id', userId)
      .eq('isbn', isbn);

    if (error) throw error;
  }

  static async updateBookTotalPages(
    userId: string,
    isbn: string,
    totalPages: number,
    now: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_books')
      .update({
        pages: totalPages,
        date_updated: now,
      })
      .eq('user_id', userId)
      .eq('isbn', isbn);

    if (error) throw error;
  }

  static async updateBookRating(
    userId: string,
    isbn: string,
    rating: number | null,
    now: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_books')
      .update({
        user_rating: rating,
        date_updated: now,
      })
      .eq('user_id', userId)
      .eq('isbn', isbn);

    if (error) throw error;
  }

  static async deleteBook(userId: string, isbn: string): Promise<void> {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('isbn', isbn);

    if (error) throw error;
  }
}
