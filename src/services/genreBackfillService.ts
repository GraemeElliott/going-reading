import { supabase } from '../supabase/supabase';
import isbndbService from './isbndbService';
import { mapToStandardGenre, normaliseSubjects } from '../utils/book-utils';

// The full set of standard genre names — used to detect already-normalised records
const STANDARD_GENRES = new Set([
  'Literary Fiction', 'Science Fiction', 'Fantasy', 'Mystery & Thriller',
  'Horror', 'Romance', 'Historical Fiction', 'Adventure', 'Young Adult',
  "Children's", 'Biography & Memoir', 'History', 'Science & Nature',
  'Technology & Computing', 'Self-Help', 'Business & Economics',
  'Politics & Society', 'Psychology & Philosophy', 'Health & Wellness',
  'Travel', 'True Crime', 'Arts & Music', 'Religion & Spirituality',
  'Cooking & Food', 'Graphic Novel & Comics', 'Humor', 'Poetry',
]);

export interface BackfillResult {
  total: number;
  updated: number;
  failed: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Re-maps books that already have genres stored using the old raw subjects.
// Skips books whose genres are already all standard — so after the first run
// this becomes a near-instant no-op.
export const renormaliseStoredGenres = async (userId: string): Promise<BackfillResult> => {
  const { data: books, error } = await supabase
    .from('user_books')
    .select('id, genres')
    .eq('user_id', userId)
    .not('genres', 'is', null);

  if (error) throw error;
  if (!books || books.length === 0) return { total: 0, updated: 0, failed: 0 };

  const result: BackfillResult = { total: books.length, updated: 0, failed: 0 };

  for (const book of books) {
    const existing = book.genres as string[];

    // Skip books already fully normalised
    if (existing.every((g) => STANDARD_GENRES.has(g))) continue;

    const remapped = [
      ...new Set(existing.map((g) => mapToStandardGenre(g)).filter(Boolean) as string[]),
    ];

    const { error: updateError } = await supabase
      .from('user_books')
      .update({ genres: remapped.length > 0 ? remapped : null })
      .eq('id', book.id);

    if (updateError) {
      result.failed++;
    } else {
      result.updated++;
    }
  }

  return result;
};

export const backfillGenres = async (userId: string): Promise<BackfillResult> => {
  // Fetch all books for this user that have no genres yet
  const { data: books, error } = await supabase
    .from('user_books')
    .select('id, isbn')
    .eq('user_id', userId)
    .is('genres', null);

  if (error) throw error;
  if (!books || books.length === 0) return { total: 0, updated: 0, failed: 0 };

  const result: BackfillResult = { total: books.length, updated: 0, failed: 0 };

  for (const book of books) {
    try {
      const apiBook = await isbndbService.getBookByIsbn(book.isbn);
      const genres = apiBook ? normaliseSubjects(apiBook.subjects) : [];

      const { error: updateError } = await supabase
        .from('user_books')
        .update({ genres: genres.length > 0 ? genres : null })
        .eq('id', book.id);

      if (updateError) {
        result.failed++;
      } else {
        result.updated++;
      }
    } catch {
      result.failed++;
    }

    // Respect ISBNDB rate limits
    await delay(200);
  }

  return result;
};
