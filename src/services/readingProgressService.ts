import { supabase } from '../supabase/supabase';

export class ReadingProgressService {
  static async logProgress(
    userId: string,
    bookIsbn: string,
    pagesRead: number,
    totalPages: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('reading_progress').insert({
        user_id: userId,
        book_isbn: bookIsbn,
        pages_read: pagesRead,
        total_pages: totalPages,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging reading progress:', err);
      // We don't want to throw here as logging failures shouldn't break the app
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
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (startDate) {
        query = query.gte('recorded_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('recorded_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate total pages read by summing the differences
      let totalPages = 0;
      const progressByBook: { [key: string]: number } = {};

      data?.forEach((progress) => {
        const lastProgress = progressByBook[progress.book_isbn] || 0;
        const pagesRead = progress.pages_read - lastProgress;
        if (pagesRead > 0) {
          totalPages += pagesRead;
        }
        progressByBook[progress.book_isbn] = progress.pages_read;
      });

      return totalPages;
    } catch (err) {
      console.error('Error calculating total pages read:', err);
      return 0;
    }
  }
}
