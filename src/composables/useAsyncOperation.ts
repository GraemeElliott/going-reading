import { ref } from 'vue';

export function useAsyncOperation<T>() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execute = async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      loading.value = true;
      error.value = null;
      return await operation();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    execute,
  };
}
