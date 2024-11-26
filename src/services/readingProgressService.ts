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

      const progressByBook: { [key: string]: number } = {};
      return (data || []).reduce((total, progress) => {
        const lastProgress = progressByBook[progress.book_isbn] || 0;
        const pagesRead = progress.pages_read - lastProgress;
        progressByBook[progress.book_isbn] = progress.pages_read;
        return total + (pagesRead > 0 ? pagesRead : 0);
      }, 0);
    } catch (err) {
      console.error('Error calculating total pages read:', err);
      return 0;
    }
  }

  static async getMonthlyPagesRead(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const { data: progressData, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      if (!progressData?.length) return 0;

      const progressByBook: { [key: string]: any[] } = {};
      progressData.forEach((entry) => {
        if (!progressByBook[entry.book_isbn]) {
          progressByBook[entry.book_isbn] = [];
        }
        progressByBook[entry.book_isbn].push(entry);
      });

      return Object.values(progressByBook).reduce((total, bookEntries) => {
        let previousPages = 0;
        bookEntries.forEach((entry) => {
          const pagesRead = entry.pages_read - previousPages;
          if (pagesRead > 0) {
            total += pagesRead;
          }
          previousPages = entry.pages_read;
        });
        return total;
      }, 0);
    } catch (err) {
      console.error('Error calculating monthly pages read:', err);
      return 0;
    }
  }
}
