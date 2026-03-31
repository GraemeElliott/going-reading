import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ReadingGoalService } from '../services/readingGoalService';
import type { ReadingGoal } from '../services/readingGoalService';

export const useReadingGoalsStore = defineStore('readingGoals', () => {
  const currentGoal = ref<ReadingGoal | null>(null);
  const allGoals = ref<ReadingGoal[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchGoal = async (userId: string, year: number): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      currentGoal.value = await ReadingGoalService.getGoal(userId, year);
    } catch (e: any) {
      error.value = e.message ?? 'Failed to fetch reading goal';
    } finally {
      loading.value = false;
    }
  };

  const fetchAllGoals = async (userId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      allGoals.value = await ReadingGoalService.getAllGoals(userId);
    } catch (e: any) {
      error.value = e.message ?? 'Failed to fetch reading goals';
    } finally {
      loading.value = false;
    }
  };

  const setGoal = async (userId: string, year: number, goal: number): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const saved = await ReadingGoalService.upsertGoal(userId, year, goal);
      // Keep allGoals in sync
      const idx = allGoals.value.findIndex((g) => g.year === year);
      if (idx >= 0) {
        allGoals.value[idx] = saved;
      } else {
        allGoals.value = [saved, ...allGoals.value].sort((a, b) => b.year - a.year);
      }
      if (saved.year === currentGoal.value?.year || currentGoal.value === null) {
        currentGoal.value = saved;
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to save reading goal';
    } finally {
      loading.value = false;
    }
  };

  const deleteGoal = async (userId: string, year: number): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      await ReadingGoalService.deleteGoal(userId, year);
      allGoals.value = allGoals.value.filter((g) => g.year !== year);
      if (currentGoal.value?.year === year) {
        currentGoal.value = null;
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to delete reading goal';
    } finally {
      loading.value = false;
    }
  };

  return {
    currentGoal,
    allGoals,
    loading,
    error,
    fetchGoal,
    fetchAllGoals,
    setGoal,
    deleteGoal,
  };
});
