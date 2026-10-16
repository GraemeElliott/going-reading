import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Book, BookBasicInfo } from '../types/book';
import type { LibraryEntry, LibraryFormat } from '../types/library';
import { LibraryService } from '../services/libraryService';
import { useAuthStore } from './auth-store';

// Books the user owns. Deliberately separate from the shelves (user-books-store)
// and lists stores: nothing here reads or writes those.
export const useLibraryStore = defineStore('library', () => {
  const authStore = useAuthStore();
  const entries = ref<LibraryEntry[]>([]);
  const initialized = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const counts = computed(() => ({
    all: entries.value.length,
    physical: entries.value.filter((e) => e.formats.includes('physical')).length,
    digital: entries.value.filter((e) => e.formats.includes('digital')).length,
  }));

  const ownedIsbns = computed(() => new Set(entries.value.map((e) => e.isbn)));

  const requireUserId = () => {
    const id = authStore.user?.id;
    if (!id) throw new Error('You must be logged in to manage your library');
    return id;
  };

  const replaceEntry = (updated: LibraryEntry) => {
    entries.value = entries.value.map((e) => (e.id === updated.id ? updated : e));
  };

  const fetchEntries = async () => {
    loading.value = true;
    error.value = null;
    try {
      entries.value = await LibraryService.fetchEntries(requireUserId());
      initialized.value = true;
    } catch (err: any) {
      error.value = err.message || 'Failed to load your library';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initialize = async () => {
    if (!initialized.value) await fetchEntries();
  };

  const addEntry = async (
    book: Book | BookBasicInfo,
    formats: LibraryFormat[],
    dateAdded: string
  ) => {
    const entry = await LibraryService.addEntry(requireUserId(), book, formats, dateAdded);
    entries.value = [entry, ...entries.value];
    return entry;
  };

  const updateFormats = async (entryId: string, formats: LibraryFormat[]) => {
    replaceEntry(await LibraryService.updateFormats(requireUserId(), entryId, formats));
  };

  const updateDateAdded = async (entryId: string, dateAdded: string) => {
    replaceEntry(await LibraryService.updateDateAdded(requireUserId(), entryId, dateAdded));
  };

  const updateDetails = async (
    entryId: string,
    details: Pick<LibraryEntry, 'title' | 'authors' | 'formats' | 'date_added'>
  ) => {
    replaceEntry(await LibraryService.updateDetails(requireUserId(), entryId, details));
  };

  const removeEntry = async (entryId: string) => {
    await LibraryService.removeEntry(requireUserId(), entryId);
    entries.value = entries.value.filter((e) => e.id !== entryId);
  };

  return {
    entries,
    initialized,
    loading,
    error,
    counts,
    ownedIsbns,
    fetchEntries,
    initialize,
    addEntry,
    updateFormats,
    updateDateAdded,
    updateDetails,
    removeEntry,
  };
});
