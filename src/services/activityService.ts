import { supabase } from '../supabase/supabase';
import type { BookStatus } from '../types/book';

export enum ActivityType {
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_STATUS_CHANGED = 'BOOK_STATUS_CHANGED',
  BOOK_PROGRESS_UPDATED = 'BOOK_PROGRESS_UPDATED',
  BOOK_RATED = 'BOOK_RATED',
  BOOK_DELETED = 'BOOK_DELETED',
  BOOK_ADDED_TO_LIST = 'BOOK_ADDED_TO_LIST',
  BOOK_REMOVED_FROM_LIST = 'BOOK_REMOVED_FROM_LIST',
  LIST_DELETED = 'LIST_DELETED',
}

interface ActivityMetadata {
  oldStatus?: BookStatus;
  newStatus?: BookStatus;
  currentPage?: number;
  totalPages?: number;
  rating?: number;
  listId?: string;
  listName?: string;
  bookTitle?: string;
}

export class ReadingActivityService {
  static async logActivity(
    userId: string,
    activityType: ActivityType,
    bookIsbn?: string,
    metadata: ActivityMetadata = {}
  ): Promise<void> {
    try {
      const { error } = await supabase.from('reading_activities').insert({
        user_id: userId,
        activity_type: activityType,
        book_isbn: bookIsbn,
        metadata,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging activity:', err);
      // We don't want to throw here as logging failures shouldn't break the app
    }
  }

  static async getUserActivities(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reading_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user activities:', err);
      return [];
    }
  }
}
