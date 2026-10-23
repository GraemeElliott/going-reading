import { supabase } from '../supabase/supabase';
import bookApiService from './bookApiService';
import type { BackfillResult } from './genreBackfillService';

const DEFAULT_COVER = '/default-book-cover.jpg';

// Covers saved from ISBNdb, plus books saved without one
const NEEDS_COVER = `image.ilike.%isbndb%,image.is.null,image.eq."${DEFAULT_COVER}"`;

// Lists show covers from user_books, so these are the only copies to update
const COVER_TABLES = ['user_books', 'library_entries'] as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Replaces saved ISBNdb (and missing) covers with covers from the current book
// APIs. Updated rows stop matching NEEDS_COVER, so later runs only retry books
// that still have no cover.
export const backfillCovers = async (userId: string): Promise<BackfillResult> => {
  const lookups = await Promise.all(
    COVER_TABLES.map((table) =>
      supabase.from(table).select('isbn').eq('user_id', userId).or(NEEDS_COVER)
    )
  );
  for (const { error } of lookups) {
    if (error) throw error;
  }

  // A book can be on a shelf and in the library; look each ISBN up once
  const isbns = [
    ...new Set(
      lookups.flatMap(({ data }) => (data ?? []).map((row) => row.isbn as string))
    ),
  ];
  const result: BackfillResult = { total: isbns.length, updated: 0, failed: 0 };

  for (const isbn of isbns) {
    try {
      const book = await bookApiService.getBookByIsbn(isbn);

      if (book?.image && book.image !== DEFAULT_COVER) {
        const updates = await Promise.all(
          COVER_TABLES.map((table) =>
            supabase
              .from(table)
              .update({ image: book.image })
              .eq('user_id', userId)
              .eq('isbn', isbn)
              .or(NEEDS_COVER)
          )
        );

        if (updates.some(({ error }) => error)) {
          result.failed++;
        } else {
          result.updated++;
        }
      }
    } catch {
      result.failed++;
    }

    // Stay under Hardcover's 60 requests per minute
    await delay(1100);
  }

  return result;
};
