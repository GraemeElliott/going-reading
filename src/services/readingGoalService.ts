import { supabase } from '../supabase/supabase';

export interface ReadingGoal {
  id: string;
  user_id: string;
  year: number;
  goal: number;
  created_at: string;
  updated_at: string;
}

export class ReadingGoalService {
  static async getGoal(userId: string, year: number): Promise<ReadingGoal | null> {
    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // no row found
      throw error;
    }
    return data as ReadingGoal;
  }

  static async upsertGoal(userId: string, year: number, goal: number): Promise<ReadingGoal> {
    const { data, error } = await supabase
      .from('reading_goals')
      .upsert(
        { user_id: userId, year, goal, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,year' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as ReadingGoal;
  }

  static async deleteGoal(userId: string, year: number): Promise<void> {
    const { error } = await supabase
      .from('reading_goals')
      .delete()
      .eq('user_id', userId)
      .eq('year', year);

    if (error) throw error;
  }

  static async getAllGoals(userId: string): Promise<ReadingGoal[]> {
    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false });

    if (error) throw error;
    return data as ReadingGoal[];
  }
}
