import { supabase } from '../supabase/supabase';

export class ReadingProgressService {
  static async logProgress(
    userId: string,
    bookIsbn: string,
    pagesRead: number,
    totalPages: number
  ): Promise<void> {
    try {
      // Get the last progress entry for this book
      const { data: lastProgress } = await supabase
        .from('reading_progress')
        .select('pages_read')
        .eq('user_id', userId)
        .eq('book_isbn', bookIsbn)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const lastPagesRead = lastProgress?.[0]?.pages_read || 0;
      const pagesReadInSession = pagesRead - lastPagesRead;

      const { error } = await supabase.from('reading_progress').insert({
        user_id: userId,
        book_isbn: bookIsbn,
        pages_read: pagesRead,
        total_pages: totalPages,
        pages_read_in_session: pagesReadInSession > 0 ? pagesReadInSession : 0,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging reading progress:', err);
    }
  }

  static async getBookProgress(
    userId: string,
    bookIsbn: string,
    limit = 100
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('book_isbn', bookIsbn)
        .order('recorded_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching book progress:', err);
      return [];
    }
  }

  static async getRecentProgress(userId: string, days = 28): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .gte(
          'recorded_at',
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching recent progress:', err);
      return [];
    }
  }

  static async getTotalPagesRead(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      let query = supabase
        .from('reading_progress')
        .select('pages_read_in_session')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).reduce(
        (total, entry) => total + (entry.pages_read_in_session || 0),
        0
      );
    } catch (err) {
      console.error('Error calculating total pages read:', err);
      return 0;
    }
  }

  static async getYearlyPagesRead(
    userId: string,
    year: number
  ): Promise<number> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    return this.getTotalPagesRead(userId, startDate, endDate);
  }

  static async getMonthlyPagesRead(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return this.getTotalPagesRead(userId, startDate, endDate);
  }
}
