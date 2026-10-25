<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'radix-vue';
import { useLibraryStore } from '@/store/library-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { useUserAnalyticsStore } from '@/store/user-analytics-store';
import { STATUS_DISPLAY_NAMES } from '@/types/book';
import { toast } from '@/components/ui/toast';
import type { LibraryEntry, LibraryFormat } from '@/types/library';
import { LIBRARY_FORMATS } from '@/types/library';
import ThemedSelect from '@/components/layout/ThemedSelect.vue';
import {
  FORMAT_META,
  NO_SHELF_OPTION,
  READ_SHELF_OPTION,
  SHELF_OPTIONS,
  todayStr,
  type ShelfChoice,
} from './formatMeta';

// Edit a library entry's title, authors, formats and date added.
// Styled to match the "Add to library" dialog.
const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  entry: LibraryEntry;
}>();

const libraryStore = useLibraryStore();
const userBooksStore = useUserBooksStore();
const analyticsStore = useUserAnalyticsStore();

// Reading status lives on the shelves (user_books), not the library entry
const shelfBook = computed(() => userBooksStore.userBooks.find((b) => b.isbn === props.entry.isbn));
const alreadyRead = computed(() => shelfBook.value?.status === 'read');
const markRead = ref(false);
const finishedOn = ref('');
const originalFinishedOn = ref('');
const shelf = ref<ShelfChoice>('none');

// Ticking "Mark as read" locks the picker to Read. "No shelf" is only offered
// before the book is on one: taking it off would delete its rating and notes.
const shelfOptions = computed(() => {
  if (markRead.value) return [READ_SHELF_OPTION];
  return shelfBook.value?.status ? SHELF_OPTIONS : [NO_SHELF_OPTION, ...SHELF_OPTIONS];
});
const shelfValue = computed<ShelfChoice>({
  get: () => (markRead.value ? 'read' : shelf.value),
  set: (value) => {
    if (value !== 'read') shelf.value = value;
  },
});

// Timestamp -> local 'YYYY-MM-DD' for the date input
const toLocalDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const title = ref('');
// One field per author: stored names can contain commas ("Orme, Nicholas"),
// so a single comma-separated field wouldn't round-trip
const authors = ref<string[]>([]);
const formats = ref<LibraryFormat[]>([]);
const dateAdded = ref('');
const saving = ref(false);
const errorMessage = ref<string | null>(null);
const authorInputs = ref<HTMLInputElement[]>([]);

// Fill the form from the entry each time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return;
  title.value = props.entry.title;
  authors.value = props.entry.authors.length ? [...props.entry.authors] : [''];
  formats.value = [...props.entry.formats];
  dateAdded.value = props.entry.date_added;
  errorMessage.value = null;
  markRead.value = alreadyRead.value;
  originalFinishedOn.value =
    alreadyRead.value && shelfBook.value?.date_finished ? toLocalDate(shelfBook.value.date_finished) : '';
  finishedOn.value = originalFinishedOn.value || todayStr();
  const status = shelfBook.value?.status;
  shelf.value = status && status !== 'read' ? status : 'none';
});

const canSave = computed(
  () =>
    !!title.value.trim() &&
    formats.value.length > 0 &&
    !!dateAdded.value &&
    (!markRead.value || !!finishedOn.value) &&
    !saving.value
);

const toggleFormat = (format: LibraryFormat) => {
  formats.value = formats.value.includes(format)
    ? formats.value.filter((f) => f !== format)
    : [...formats.value, format];
};

const addAuthor = async () => {
  authors.value = [...authors.value, ''];
  await nextTick();
  authorInputs.value[authors.value.length - 1]?.focus();
};

const removeAuthor = (index: number) => {
  authors.value = authors.value.filter((_, i) => i !== index);
  if (!authors.value.length) authors.value = [''];
};

const handleSave = async () => {
  if (!canSave.value) return;
  saving.value = true;
  errorMessage.value = null;
  try {
    await libraryStore.updateDetails(props.entry.id, {
      title: title.value,
      authors: authors.value,
      formats: formats.value,
      date_added: dateAdded.value,
    });
    const book = {
      isbn: props.entry.isbn,
      title: title.value.trim(),
      authors: authors.value.map((a) => a.trim()).filter(Boolean),
      image: props.entry.image ?? '',
      date_published: props.entry.date_published ?? undefined,
      publisher: props.entry.publisher ?? undefined,
      pages: props.entry.pages ?? undefined,
    };
    // Move to Read (or change the finish date) only when something changed
    if (markRead.value && (!alreadyRead.value || finishedOn.value !== originalFinishedOn.value)) {
      await userBooksStore.markAsRead(book, finishedOn.value);
      analyticsStore.invalidate();
    } else if (!markRead.value && shelf.value !== 'none' && shelf.value !== shelfBook.value?.status) {
      await userBooksStore.updateBookStatus(book, shelf.value);
      analyticsStore.invalidate();
    }
    toast({
      title: 'Book updated',
      description: `Your changes to ${title.value.trim()} have been saved.`,
      variant: 'success',
      duration: 2000,
    });
    open.value = false;
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Failed to save your changes. Please try again.';
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        aria-modal="true"
        class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border border-gr-line bg-gr-surface font-body text-base leading-[1.4] text-gr-text shadow-gr-modal focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      >
        <div class="flex shrink-0 items-center justify-between gap-4 px-6 pb-2 pt-5">
          <DialogTitle class="font-heading text-[28px] font-medium leading-tight">
            Edit book
          </DialogTitle>
          <DialogClose class="gr-icon-btn -mr-2" aria-label="Close">
            <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg" />
          </DialogClose>
        </div>
        <DialogDescription class="sr-only">
          Change the title, authors, format and date added for this book in your library.
        </DialogDescription>

        <form
          :id="`edit-library-${entry.id}`"
          class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-3"
          @submit.prevent="handleSave"
        >
          <!-- Title -->
          <div class="grid gap-2">
            <label :for="`edit-title-${entry.id}`" class="text-[15px] font-semibold">Title</label>
            <input
              :id="`edit-title-${entry.id}`"
              v-model="title"
              type="text"
              required
              class="gr-input"
              :aria-invalid="!title.trim()"
            />
            <p v-if="!title.trim()" class="text-[13px] text-gr-danger-text">
              A book needs a title.
            </p>
          </div>

          <!-- Authors -->
          <fieldset class="grid gap-2">
            <legend class="mb-2 text-[15px] font-semibold">
              Author(s) <span class="font-normal text-gr-muted">(optional)</span>
            </legend>
            <div v-for="(_, i) in authors" :key="i" class="flex gap-2">
              <input
                :ref="(el) => { if (el) authorInputs[i] = el as HTMLInputElement }"
                v-model="authors[i]"
                type="text"
                class="gr-input"
                :aria-label="`Author ${i + 1}`"
                placeholder="Author name"
              />
              <button
                v-if="authors.length > 1 || authors[0]"
                type="button"
                class="gr-icon-btn hover:!text-gr-danger-text"
                :aria-label="`Remove author ${i + 1}`"
                @click="removeAuthor(i)"
              >
                <font-awesome-icon icon="fa-solid fa-xmark" />
              </button>
            </div>
            <button
              type="button"
              class="inline-flex h-11 w-fit items-center gap-2 rounded-[10px] px-1 !text-sm font-semibold text-gr-accent hover:underline"
              @click="addAuthor"
            >
              <font-awesome-icon icon="fa-solid fa-plus" />
              Add another author
            </button>
          </fieldset>

          <!-- Format -->
          <div>
            <p :id="`edit-format-${entry.id}`" class="mb-2 text-[15px] font-semibold">Format</p>
            <div
              role="group"
              :aria-labelledby="`edit-format-${entry.id}`"
              class="grid grid-cols-2 gap-1 rounded-xl border border-gr-line bg-gr-bg p-1"
            >
              <button
                v-for="f in LIBRARY_FORMATS"
                :key="f"
                type="button"
                class="gr-btn"
                :class="formats.includes(f) ? 'gr-btn-primary' : 'text-gr-muted hover:text-gr-text'"
                :aria-pressed="formats.includes(f)"
                @click="toggleFormat(f)"
              >
                <font-awesome-icon :icon="FORMAT_META[f].icon" />
                {{ FORMAT_META[f].label }}
              </button>
            </div>
            <p v-if="!formats.length" class="mt-2 text-[13px] text-gr-muted">
              Choose at least one format.
            </p>
          </div>

          <!-- Date added -->
          <div class="grid gap-2">
            <label :for="`edit-date-${entry.id}`" class="text-[15px] font-semibold">Date added</label>
            <input
              :id="`edit-date-${entry.id}`"
              v-model="dateAdded"
              type="date"
              :max="todayStr()"
              required
              class="gr-input dark:[color-scheme:dark]"
            />
          </div>

          <!-- Reading status -->
          <div class="grid gap-2">
            <p class="text-[15px] font-semibold">Reading</p>
            <ThemedSelect
              v-model="shelfValue"
              :options="shelfOptions"
              label="Shelf"
              :disabled="markRead"
            />
            <label
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gr-line bg-gr-bg px-3.5"
              :class="{ 'cursor-default': alreadyRead }"
            >
              <input
                v-model="markRead"
                type="checkbox"
                class="h-5 w-5 shrink-0 accent-gr-accent"
                :disabled="alreadyRead"
              />
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">
                  {{ alreadyRead ? 'Read' : 'Mark as read' }}
                </span>
                <span class="block text-[13px] text-gr-muted">
                  {{
                    alreadyRead
                      ? 'Finished books stay on Read. You can change when you finished it.'
                      : shelfBook?.status
                        ? `Moves it from ${STATUS_DISPLAY_NAMES[shelfBook.status]} to Read`
                        : 'Adds it to your Read shelf'
                  }}
                </span>
              </span>
            </label>
            <div v-if="markRead" class="grid gap-2">
              <label :for="`edit-finished-${entry.id}`" class="text-[15px] font-semibold">
                Date finished
                <span class="font-normal text-gr-muted">(counts as read in this month)</span>
              </label>
              <input
                :id="`edit-finished-${entry.id}`"
                v-model="finishedOn"
                type="date"
                :max="todayStr()"
                required
                class="gr-input dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <p v-if="errorMessage" role="alert" class="text-sm text-gr-danger-text">
            {{ errorMessage }}
          </p>
        </form>

        <div class="flex shrink-0 justify-end gap-2 border-t border-gr-line px-6 py-4">
          <DialogClose class="gr-btn gr-btn-outline">Cancel</DialogClose>
          <button
            type="submit"
            :form="`edit-library-${entry.id}`"
            class="gr-btn gr-btn-primary"
            :disabled="!canSave"
          >
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
