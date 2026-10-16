import { supabase } from '../supabase/supabase';
import type { Book, BookBasicInfo } from '../types/book';
import type {
  LibraryEntry,
  LibraryFormat,
  LibrarySearchField,
  LibrarySort,
} from '../types/library';
import { LIBRARY_FORMATS } from '../types/library';
import { authorMatches, compareByAuthor } from '../utils/book-display';

export interface LibraryQuery {
  search?: string;
  searchBy?: LibrarySearchField;
  format?: LibraryFormat | 'all';
  sort?: LibrarySort;
}

export const libraryErrorMessages = {
  noFormat: 'A book needs at least one format.',
  duplicate: 'This book is already in your library.',
  noTitle: 'A book needs a title.',
};

// Dedupe, drop unknown values and keep a stable order
const normaliseFormats = (formats: LibraryFormat[]): LibraryFormat[] => {
  const clean = LIBRARY_FORMATS.filter((f) => formats.includes(f));
  if (!clean.length) throw new Error(libraryErrorMessages.noFormat);
  return clean;
};

const SORTERS: Record<LibrarySort, (a: LibraryEntry, b: LibraryEntry) => number> = {
  // Newest date first; entries added on the same day by when they were created
  added: (a, b) =>
    b.date_added.localeCompare(a.date_added) ||
    b.created_at.localeCompare(a.created_at),
  title: (a, b) => a.title.localeCompare(b.title),
  author: compareByAuthor,
};

// Search, format filter and sort. Run on the client (like the Bookshelves page)
// so results update as the user types without a request per keystroke.
export const queryLibrary = (
  entries: LibraryEntry[],
  { search = '', searchBy = 'title', format = 'all', sort = 'added' }: LibraryQuery
): LibraryEntry[] => {
  const term = search.trim().toLowerCase();
  const digits = term.replace(/[^0-9x]/g, '');
  return entries
    .filter((e) => format === 'all' || e.formats.includes(format))
    .filter((e) => {
      if (!term) return true;
      if (searchBy === 'author')
        return authorMatches(e.authors, term);
      if (searchBy === 'isbn') return !!digits && e.isbn.toLowerCase().includes(digits);
      return e.title.toLowerCase().includes(term);
    })
    .sort(SORTERS[sort]);
};

export class LibraryService {
  static async fetchEntries(userId: string): Promise<LibraryEntry[]> {
    const { data, error } = await supabase
      .from('library_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date_added', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LibraryEntry[];
  }

  static async addEntry(
    userId: string,
    book: Book | BookBasicInfo,
    formats: LibraryFormat[],
    dateAdded: string
  ): Promise<LibraryEntry> {
    const { data, error } = await supabase
      .from('library_entries')
      .insert({
        user_id: userId,
        isbn: book.isbn,
        title: book.title,
        authors: book.authors ?? [],
        image: book.image || null,
        date_published: book.date_published || null,
        publisher: book.publisher || null,
        pages: book.pages || null,
        formats: normaliseFormats(formats),
        date_added: dateAdded,
      })
      .select()
      .single();

    // 23505 = unique violation on (user_id, isbn)
    if (error?.code === '23505') throw new Error(libraryErrorMessages.duplicate);
    if (error) throw error;
    return data as LibraryEntry;
  }

  static async updateFormats(
    userId: string,
    entryId: string,
    formats: LibraryFormat[]
  ): Promise<LibraryEntry> {
    return this.update(userId, entryId, { formats: normaliseFormats(formats) });
  }

  static async updateDateAdded(
    userId: string,
    entryId: string,
    dateAdded: string
  ): Promise<LibraryEntry> {
    return this.update(userId, entryId, { date_added: dateAdded });
  }

  // Edits this library entry's own copy of the book details only; shelves
  // (user_books) and lists keep theirs
  static async updateDetails(
    userId: string,
    entryId: string,
    details: Pick<LibraryEntry, 'title' | 'authors' | 'formats' | 'date_added'>
  ): Promise<LibraryEntry> {
    const title = details.title.trim();
    if (!title) throw new Error(libraryErrorMessages.noTitle);
    return this.update(userId, entryId, {
      title,
      authors: details.authors.map((a) => a.trim()).filter(Boolean),
      formats: normaliseFormats(details.formats),
      date_added: details.date_added,
    });
  }

  static async removeEntry(userId: string, entryId: string): Promise<void> {
    const { error } = await supabase
      .from('library_entries')
      .delete()
      .eq('user_id', userId)
      .eq('id', entryId);

    if (error) throw error;
  }

  private static async update(
    userId: string,
    entryId: string,
    changes: Partial<Pick<LibraryEntry, 'title' | 'authors' | 'formats' | 'date_added'>>
  ): Promise<LibraryEntry> {
    const { data, error } = await supabase
      .from('library_entries')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data as LibraryEntry;
  }
}
