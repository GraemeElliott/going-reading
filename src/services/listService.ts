import { supabase } from '../supabase/supabase';
import type { List } from '../types/list';
import type { UserBook } from '../types/book';
import { ReadingActivityService, ActivityType } from './activityService';

export class ListService {
  static async fetchUserListsAndBooks(userId: string) {
    const { data: listsWithBooks, error: fetchError } = await supabase
      .from('lists')
      .select(
        `
        *,
        books_in_lists (
          isbn
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    const processedLists: List[] = [];
    const isbnSet = new Set<string>();

    listsWithBooks?.forEach((listData: any) => {
      const { books_in_lists, ...listInfo } = listData;
      processedLists.push(listInfo);
      books_in_lists.forEach((item: { isbn: string }) => {
        isbnSet.add(item.isbn);
      });
    });

    if (isbnSet.size === 0) {
      return {
        lists: processedLists,
        booksInLists: Object.fromEntries(
          processedLists.map((list) => [list.id, []])
        ),
      };
    }

    const { data: userBooksData, error: booksError } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .in('isbn', Array.from(isbnSet));

    if (booksError) throw booksError;

    const booksByIsbn = new Map(
      (userBooksData || []).map((book: UserBook) => [book.isbn, book])
    );

    const processedBooks: Record<string, UserBook[]> = {};
    listsWithBooks?.forEach((listData: any) => {
      const books: UserBook[] = [];
      listData.books_in_lists.forEach((item: { isbn: string }) => {
        const book = booksByIsbn.get(item.isbn);
        if (book) {
          books.push(book);
        }
      });
      processedBooks[listData.id] = books;
    });

    return { lists: processedLists, booksInLists: processedBooks };
  }

  static async createList(userId: string, name: string, details: string = '') {
    const { data, error: createError } = await supabase
      .from('lists')
      .insert({
        user_id: userId,
        name,
        details,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        throw new Error('A list with this name already exists');
      }
      throw createError;
    }

    return data as List;
  }

  static async updateList(
    userId: string,
    listId: string,
    name: string,
    details: string
  ) {
    const { error: updateError } = await supabase
      .from('lists')
      .update({ name, details })
      .eq('id', listId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  }

  static async isBookInList(listId: string, isbn: string): Promise<boolean> {
    const { data, error: checkError } = await supabase
      .from('books_in_lists')
      .select('id')
      .eq('list_id', listId)
      .eq('isbn', isbn);

    if (checkError) throw checkError;
    return data && data.length > 0;
  }

  static async addBookToList(
    userId: string,
    listId: string,
    isbn: string,
    listName: string | undefined
  ) {
    const { error: addError } = await supabase.from('books_in_lists').insert({
      list_id: listId,
      isbn,
      user_id: userId,
    });

    if (addError) throw addError;

    const { data: bookData, error: bookError } = await supabase
      .from('user_books')
      .select('*')
      .eq('isbn', isbn)
      .eq('user_id', userId)
      .single();

    if (bookError) throw bookError;

    await ReadingActivityService.logActivity(
      userId,
      ActivityType.BOOK_ADDED_TO_LIST,
      isbn,
      {
        listId,
        listName,
        bookTitle: bookData.title,
      }
    );

    return bookData as UserBook;
  }

  static async removeBookFromList(
    userId: string,
    listId: string,
    isbn: string,
    listName: string | undefined,
    bookTitle: string | undefined
  ) {
    const { error: removeError } = await supabase
      .from('books_in_lists')
      .delete()
      .eq('list_id', listId)
      .eq('isbn', isbn)
      .eq('user_id', userId);

    if (removeError) throw removeError;

    await ReadingActivityService.logActivity(
      userId,
      ActivityType.BOOK_REMOVED_FROM_LIST,
      isbn,
      {
        listId,
        listName,
        bookTitle,
      }
    );
  }

  static async deleteList(
    userId: string,
    listId: string,
    listName: string | undefined
  ) {
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    await ReadingActivityService.logActivity(
      userId,
      ActivityType.LIST_DELETED,
      undefined,
      {
        listId,
        listName,
      }
    );
  }
}
