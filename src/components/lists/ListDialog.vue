<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from 'radix-vue';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import EditListDetails from '@/components/lists/EditListDetails.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import { authorMatches, formatAuthors } from '@/utils/book-display';
import { useListsStore } from '@/store/lists-store';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';

interface Props {
  list: List | null;
  books?: UserBook[];
  readonly?: boolean;
  mode?: 'view' | 'edit' | 'delete';
}

const props = withDefaults(defineProps<Props>(), { mode: 'view' });
const open = defineModel<boolean>('open', { required: true });

const listsStore = useListsStore();

const ICON_BUTTON_CLASS =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-gr-muted transition-colors hover:bg-gr-surface-2 hover:text-gr-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent';
const editing = ref(false);
const confirmingDelete = ref(false);
const deleting = ref(false);
const selecting = ref(false);
const selectedIsbns = ref<Set<string>>(new Set());
const removing = ref(false);
const search = ref('');

watch(
  () => [open.value, props.list?.id, props.mode],
  () => {
    editing.value = !props.readonly && props.mode === 'edit';
    confirmingDelete.value = !props.readonly && props.mode === 'delete';
    search.value = '';
    stopSelecting();
  }
);

function stopSelecting() {
  selecting.value = false;
  selectedIsbns.value = new Set();
}

// Editing details and selecting books are separate modes
const startEditing = () => {
  stopSelecting();
  confirmingDelete.value = false;
  editing.value = true;
};

const toggleSelected = (isbn: string) => {
  const next = new Set(selectedIsbns.value);
  if (next.has(isbn)) next.delete(isbn);
  else next.add(isbn);
  selectedIsbns.value = next;
};

const bookCount = computed(() => {
  const count = props.books?.length || 0;
  return `${count} ${count === 1 ? 'book' : 'books'}`;
});

const filteredBooks = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return props.books ?? [];
  return (props.books ?? []).filter(
    (book) =>
      book.title.toLowerCase().includes(term) ||
      authorMatches(book.authors, term)
  );
});

const allVisibleSelected = computed(
  () =>
    filteredBooks.value.length > 0 &&
    filteredBooks.value.every((b) => selectedIsbns.value.has(b.isbn))
);

const toggleSelectAll = () => {
  selectedIsbns.value = allVisibleSelected.value
    ? new Set()
    : new Set(filteredBooks.value.map((b) => b.isbn));
};

const handleDeleteList = async () => {
  if (!props.list) return;
  const { id, name } = props.list;
  deleting.value = true;
  try {
    await listsStore.deleteList(id);
    open.value = false;
    toast({
      title: 'List deleted',
      description: `You have successfully deleted ${name}.`,
      variant: 'success',
      duration: 2000,
    });
  } catch (error) {
    toast({
      title: 'Error Deleting List',
      description: `There has been an error deleting ${name}: ${error}.`,
      variant: 'destructive',
      duration: 4000,
    });
  } finally {
    deleting.value = false;
  }
};

const handleRemoveSelected = async () => {
  if (!props.list || removing.value || !selectedIsbns.value.size) return;
  const { id, name } = props.list;
  const isbns = [...selectedIsbns.value];
  removing.value = true;

  let removed = 0;
  const failed: string[] = [];
  for (const isbn of isbns) {
    const title = props.books?.find((b) => b.isbn === isbn)?.title ?? isbn;
    try {
      await listsStore.removeBookFromList(id, isbn);
      removed++;
    } catch {
      failed.push(title);
    }
  }
  removing.value = false;

  if (removed) {
    toast({
      title: removed === 1 ? 'Book Removed' : 'Books Removed',
      description: `You have successfully removed ${removed} ${
        removed === 1 ? 'book' : 'books'
      } from ${name}.`,
      variant: 'success',
      duration: 2000,
    });
  }

  if (failed.length) {
    // Keep only the books that are still in the list selected, so the user can retry
    selectedIsbns.value = new Set(
      isbns.filter((isbn) => props.books?.some((b) => b.isbn === isbn))
    );
    toast({
      title: 'Error Removing Books',
      description: `There was an error removing ${failed.join(', ')} from ${name}.`,
      variant: 'destructive',
      duration: 4000,
    });
  } else {
    stopSelecting();
  }
};
</script>

<template>
  <Dialog v-model:open="open">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <!-- Full-screen on mobile, centred card from md up -->
      <DialogContent
        v-if="list"
        aria-modal="true"
        class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gr-surface font-body text-base leading-[1.4] text-gr-text shadow-gr-modal duration-200 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[calc(100vh-4rem)] md:w-[calc(100%-4rem)] md:max-w-[1080px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:border md:border-gr-line"
      >
        <!-- Header -->
        <div class="shrink-0 border-b border-gr-line px-4 pb-5 pt-6 md:px-8">
          <template v-if="!editing">
            <div
              class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4"
            >
              <div class="min-w-0 basis-full md:flex-1 md:basis-[240px]">
                <DialogTitle
                  class="break-words font-heading text-[26px] font-medium leading-tight md:text-[32px]"
                >
                  {{ list.name }}
                </DialogTitle>
                <p class="mt-1 text-[15px] text-gr-muted">{{ bookCount }}</p>
                <DialogDescription
                  v-if="list.details"
                  class="mt-2 text-[15px] text-gr-muted"
                >
                  {{ list.details }}
                </DialogDescription>
                <DialogDescription v-else class="sr-only">
                  Books in {{ list.name }}
                </DialogDescription>
              </div>

              <div
                class="flex basis-full flex-wrap items-center gap-2 md:basis-auto"
              >
                <template v-if="!readonly">
                  <button
                    type="button"
                    class="gr-btn gr-btn-outline"
                    @click="startEditing"
                  >
                    <font-awesome-icon icon="fa-regular fa-pen-to-square" />
                    Edit details
                  </button>
                  <button
                    type="button"
                    class="gr-btn gr-btn-outline text-gr-danger-text"
                    @click="confirmingDelete = true"
                  >
                    <font-awesome-icon icon="fa-regular fa-trash-can" />
                    Delete list
                  </button>
                </template>
                <DialogClose
                  aria-label="Close"
                  :class="[ICON_BUTTON_CLASS, 'ml-auto md:ml-0']"
                >
                  <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg" />
                </DialogClose>
              </div>
            </div>

            <div
              v-if="confirmingDelete"
              role="alert"
              class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-gr-line bg-gr-surface-2 px-4 py-3"
            >
              <span class="font-semibold">Delete this list permanently?</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="gr-btn gr-btn-outline"
                  @click="confirmingDelete = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="gr-btn gr-btn-danger"
                  :disabled="deleting"
                  @click="handleDeleteList"
                >
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="mb-4 flex items-start justify-between gap-4">
              <DialogTitle
                class="font-heading text-[26px] font-medium leading-tight md:text-[32px]"
              >
                Edit list details
              </DialogTitle>
              <DialogClose aria-label="Close" :class="ICON_BUTTON_CLASS">
                <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg" />
              </DialogClose>
            </div>
            <DialogDescription class="sr-only">
              Update the name and details of {{ list.name }}
            </DialogDescription>
            <EditListDetails :list="list" @done="editing = false" />
          </template>
        </div>

        <!-- Books -->
        <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 md:px-8">
          <div v-if="books?.length" class="mb-5 flex flex-wrap items-center gap-3">
            <div class="relative min-w-[12rem] flex-1">
              <font-awesome-icon
                icon="fa-solid fa-magnifying-glass"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gr-muted"
              />
              <input
                v-model="search"
                type="search"
                class="gr-input pl-10"
                placeholder="Search this list"
                aria-label="Search this list"
              />
            </div>
            <template v-if="!readonly">
              <button
                v-if="!selecting"
                type="button"
                class="gr-btn gr-btn-outline"
                :disabled="editing"
                @click="selecting = true"
              >
                Select books
              </button>
              <template v-else>
                <button
                  type="button"
                  class="gr-btn gr-btn-outline"
                  @click="toggleSelectAll"
                >
                  {{ allVisibleSelected ? 'Deselect all' : 'Select all' }}
                </button>
                <button
                  type="button"
                  class="gr-btn gr-btn-solid"
                  @click="stopSelecting"
                >
                  Done
                </button>
              </template>
            </template>
          </div>

          <div
            v-if="!books?.length"
            class="flex flex-col items-center justify-center gap-2 py-16 text-center text-gr-muted"
          >
            <font-awesome-icon icon="fa-solid fa-book-open" class="fa-2x" />
            <p class="font-semibold text-gr-text">This list is empty</p>
            <p class="text-sm">Add books to it from any book's page.</p>
          </div>

          <p
            v-else-if="!filteredBooks.length"
            class="py-12 text-center text-sm text-gr-muted"
          >
            No books match "{{ search }}"
          </p>

          <ul
            v-else
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-3"
          >
            <li
              v-for="book in filteredBooks"
              :key="book.isbn"
              :class="{
                'pointer-events-none opacity-50':
                  removing && selectedIsbns.has(book.isbn),
              }"
            >
              <!-- In select mode the whole row toggles the book -->
              <component
                :is="selecting ? 'button' : 'div'"
                v-bind="
                  selecting
                    ? {
                        type: 'button',
                        'aria-pressed': selectedIsbns.has(book.isbn),
                        'aria-label': `Select ${book.title}`,
                      }
                    : {}
                "
                class="flex h-full w-full items-center gap-3.5 rounded-[14px] border bg-gr-bg py-3 pl-3 pr-4 text-left transition-colors"
                :class="[
                  selecting && selectedIsbns.has(book.isbn)
                    ? 'border-gr-accent shadow-[inset_0_0_0_1px_var(--gr-accent)]'
                    : 'border-gr-line',
                  selecting &&
                    'hover:bg-gr-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent',
                ]"
                @click="selecting && toggleSelected(book.isbn)"
              >
                <span
                  v-if="selecting"
                  class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px]"
                  :class="
                    selectedIsbns.has(book.isbn)
                      ? 'bg-gr-accent text-gr-accent-ink'
                      : 'border-2 border-gr-muted'
                  "
                >
                  <font-awesome-icon
                    v-if="selectedIsbns.has(book.isbn)"
                    icon="fa-solid fa-check"
                    class="text-xs"
                  />
                </span>
                <component
                  :is="selecting ? 'span' : RouterLink"
                  v-bind="
                    selecting
                      ? {}
                      : {
                          to: `/book/${book.isbn}`,
                          tabindex: -1,
                          'aria-hidden': true,
                        }
                  "
                  class="shrink-0"
                  @click="!selecting && (open = false)"
                >
                  <img
                    :src="book.image"
                    alt=""
                    class="h-[84px] w-14 rounded-[5px] object-cover shadow-gr-card"
                    @error="book.image = '/default-book-cover.jpg'"
                  />
                </component>
                <span class="min-w-0">
                  <component
                    :is="selecting ? 'span' : RouterLink"
                    v-bind="selecting ? {} : { to: `/book/${book.isbn}` }"
                    class="block text-base font-[650] leading-snug"
                    :class="{
                      'rounded-sm transition-colors hover:text-gr-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent':
                        !selecting,
                    }"
                    @click="!selecting && (open = false)"
                  >
                    <BookTitle :title="book.title" title-class="line-clamp-2" />
                  </component>
                  <span class="mt-0.5 line-clamp-1 text-sm text-gr-muted">
                    {{ formatAuthors(book.authors) }}
                  </span>
                </span>
              </component>
            </li>
          </ul>
        </div>

        <!-- Remove selected books -->
        <div
          v-if="selecting"
          class="flex shrink-0 items-center justify-between gap-3 border-t border-gr-line bg-gr-surface-2 px-4 py-4 md:px-8"
        >
          <span role="status" class="font-semibold">
            {{ selectedIsbns.size }} selected
          </span>
          <button
            type="button"
            class="gr-btn"
            :class="
              selectedIsbns.size
                ? 'gr-btn-danger'
                : 'gr-btn-outline text-gr-muted disabled:opacity-100'
            "
            :disabled="!selectedIsbns.size || removing"
            @click="handleRemoveSelected"
          >
            <font-awesome-icon icon="fa-regular fa-trash-can" />
            {{ removing ? 'Removing...' : 'Remove from list' }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>
