<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import EditListDetails from '@/components/lists/EditListDetails.vue';
import { useListsStore } from '@/store/lists-store';
import { useDarkModeStore } from '@/store/store';
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
const darkModeStore = useDarkModeStore();

const buttonClass = computed(() =>
  darkModeStore.darkMode
    ? 'bg-gray-900 text-white border border-white'
    : 'bg-white text-black border border-black'
);
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
      book.authors.some((a) => a.toLowerCase().includes(term))
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
    <DialogContent
      v-if="list"
      class="flex flex-col gap-0 p-0 max-w-4xl w-[calc(100%-2rem)] max-h-[85vh] overflow-hidden"
      :class="{
        'bg-white border-black text-black': !darkModeStore.darkMode,
        'bg-gray-900 text-white border-none': darkModeStore.darkMode,
      }"
    >
      <!-- Header -->
      <div class="px-6 pt-6 pb-5 border-b">
        <template v-if="!editing">
          <DialogTitle class="text-lg font-medium pr-8">
            {{ list.name }}
          </DialogTitle>
          <span class="text-sm text-muted-foreground">{{ bookCount }}</span>
          <DialogDescription
            v-if="list.details"
            class="mt-2 text-sm text-muted-foreground"
          >
            {{ list.details }}
          </DialogDescription>
          <DialogDescription v-else class="sr-only">
            Books in {{ list.name }}
          </DialogDescription>

          <div v-if="!readonly" class="mt-4 flex flex-wrap items-center gap-2">
            <template v-if="!confirmingDelete">
              <Button
                size="sm"
                class="font-normal hover:bg-goingTeal hover:text-white hover:border-goingTeal"
                :class="buttonClass"
                @click="editing = true"
              >
                <font-awesome-icon
                  icon="fa-regular fa-pen-to-square"
                  class="mr-2"
                />
                Edit details
              </Button>
              <Button
                size="sm"
                class="font-normal hover:bg-goingRed hover:text-white hover:border-goingRed"
                :class="buttonClass"
                @click="confirmingDelete = true"
              >
                <font-awesome-icon icon="fa-regular fa-trash-can" class="mr-2" />
                Delete list
              </Button>
            </template>
            <div
              v-else
              class="flex flex-wrap items-center gap-3 border rounded-lg px-3 py-2"
            >
              <span class="text-sm">Delete this list permanently?</span>
              <Button
                size="sm"
                class="bg-black text-white"
                @click="confirmingDelete = false"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                class="bg-goingRed text-white hover:bg-goingRed/90"
                :disabled="deleting"
                @click="handleDeleteList"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </Button>
            </div>
          </div>
        </template>

        <template v-else>
          <DialogTitle class="text-lg font-medium mb-3">
            Edit List Details
          </DialogTitle>
          <DialogDescription class="sr-only">
            Update the name and details of {{ list.name }}
          </DialogDescription>
          <EditListDetails :list="list" @done="editing = false" />
        </template>
      </div>

      <!-- Books -->
      <div class="flex-1 overflow-y-auto px-6 py-5">
        <div
          v-if="books?.length && (books.length > 6 || !readonly)"
          class="mb-5 flex flex-wrap items-center gap-3"
        >
          <div v-if="books.length > 6" class="relative flex-1 min-w-[12rem]">
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 z-10"
            />
            <Input
              v-model="search"
              placeholder="Search this list..."
              class="pl-9"
              :class="{
                '!bg-white/5 backdrop-blur-sm !border-gray-600 placeholder:text-gray-500':
                  darkModeStore.darkMode,
              }"
            />
          </div>
          <div v-if="!readonly" class="ml-auto flex gap-2">
            <Button
              v-if="!selecting"
              class="font-normal hover:bg-goingTeal hover:text-white hover:border-goingTeal"
              :class="buttonClass"
              @click="selecting = true"
            >
              <font-awesome-icon
                icon="fa-regular fa-square-check"
                class="mr-2"
              />
              Select
            </Button>
            <template v-else>
              <Button
                class="font-normal"
                :class="buttonClass"
                @click="toggleSelectAll"
              >
                {{ allVisibleSelected ? 'Deselect all' : 'Select all' }}
              </Button>
              <Button
                class="font-normal bg-black text-white"
                @click="stopSelecting"
              >
                Done
              </Button>
            </template>
          </div>
        </div>

        <div
          v-if="!books?.length"
          class="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500"
        >
          <font-awesome-icon icon="fa-solid fa-book-open" class="fa-2x" />
          <p class="font-medium">This list is empty</p>
          <p class="text-sm">Add books to it from any book's page.</p>
        </div>

        <p
          v-else-if="!filteredBooks.length"
          class="py-12 text-center text-sm text-gray-500"
        >
          No books match "{{ search }}"
        </p>

        <ul
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6"
        >
          <li v-for="book in filteredBooks" :key="book.isbn">
            <!-- In select mode a tap toggles the book; otherwise it opens the book page -->
            <component
              :is="selecting ? 'button' : RouterLink"
              v-bind="
                selecting
                  ? {
                      type: 'button',
                      'aria-pressed': selectedIsbns.has(book.isbn),
                      'aria-label': `Select ${book.title}`,
                    }
                  : { to: `/book/${book.isbn}` }
              "
              class="group block w-full text-left"
              :class="{
                'opacity-50 pointer-events-none':
                  removing && selectedIsbns.has(book.isbn),
              }"
              @click="selecting ? toggleSelected(book.isbn) : (open = false)"
            >
              <div class="relative aspect-[2/3]">
                <img
                  :src="book.image"
                  :alt="book.title"
                  class="w-full h-full object-cover rounded-md shadow-md"
                  :class="{
                    'ring-4 ring-goingRed':
                      selecting && selectedIsbns.has(book.isbn),
                  }"
                  @error="book.image = '/default-book-cover.jpg'"
                />
                <div
                  class="absolute inset-0 bg-black rounded-md transition-opacity duration-200"
                  :class="
                    !selecting
                      ? 'opacity-0 group-hover:opacity-30'
                      : selectedIsbns.has(book.isbn)
                        ? 'opacity-40'
                        : 'opacity-0'
                  "
                ></div>
                <span
                  v-if="selecting"
                  class="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full border-2 text-white shadow transition-colors"
                  :class="
                    selectedIsbns.has(book.isbn)
                      ? 'bg-goingRed border-goingRed'
                      : 'bg-black/30 border-white'
                  "
                >
                  <font-awesome-icon
                    v-if="selectedIsbns.has(book.isbn)"
                    icon="fa-solid fa-check"
                    class="text-xs"
                  />
                </span>
              </div>
              <h4 class="mt-2 font-medium text-sm line-clamp-2">
                {{ book.title }}
              </h4>
              <p class="text-xs text-gray-500 line-clamp-1">
                {{ book.authors.join(', ') }}
              </p>
            </component>
          </li>
        </ul>
      </div>

      <!-- Remove selected books -->
      <div
        v-if="selecting"
        class="flex items-center justify-between gap-3 border-t px-6 py-4"
      >
        <span class="text-sm text-muted-foreground">
          {{ selectedIsbns.size }} selected
        </span>
        <Button
          class="bg-goingRed text-white hover:bg-goingRed/90 w-[180px]"
          :disabled="!selectedIsbns.size || removing"
          @click="handleRemoveSelected"
        >
          <font-awesome-icon icon="fa-regular fa-trash-can" class="mr-2" />
          {{
            removing
              ? 'Removing...'
              : selectedIsbns.size
                ? `Remove (${selectedIsbns.size})`
                : 'Remove'
          }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
