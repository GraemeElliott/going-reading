// Reading data structure
export interface ReadingData {
  name: string;
  'Total Books Read': number;
  'Pages Read': number;
  'Reading Time': number;
}

// Available time periods for analytics
export type TimePeriod = 'month' | '3months' | '6months' | 'by-year';

// Analytics state for time-based comparisons
export interface AnalyticsState {
  currentPeriod: ReadingData;
  previousPeriod: ReadingData;
  timePeriod: TimePeriod;
  loading: boolean;
  error: string | null;
}

// Progress tracking data
export interface ProgressSnapshot {
  timestamp: string;
  pagesRead: number;
  readingTimeMinutes: number;
}

// Reading streak information
export interface ReadingStreak {
  current: number;
  longest: number;
  lastReadDate: string;
}
