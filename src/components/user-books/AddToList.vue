<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/components/ui/toast';
import { useListsStore } from '@/store/lists-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { storeToRefs } from 'pinia';
import type { Book, BookBasicInfo, UserBook } from '@/types/book';

const props = defineProps<{
  isbn: string;
  book?: Book | BookBasicInfo | UserBook;
  /** Icon on the trigger button */
  icon?: string;
}>();

const emit = defineEmits<{
  (e: 'addToList', listId: string): void;
  (e: 'createList', name: string): void;
}>();

const isPopoverOpen = ref(false);
const newListName = ref('');
const listsStore = useListsStore();
const userBooksStore = useUserBooksStore();
const { lists } = storeToRefs(listsStore);
const feedback = ref<{ message: string; type: 'success' | 'error' } | null>(
  null
);
const listsContainingBook = ref<Set<string>>(new Set());
const isAddingToList = ref(false);
const isCreatingList = ref(false);

const bookCountLabel = (listId: string) => {
  const count = listsStore.booksInLists[listId]?.length || 0;
  return `${count} ${count === 1 ? 'book' : 'books'}`;
};

onMounted(async () => {
  await listsStore.fetchUserLists();
  // Check which lists contain the book
  for (const list of lists.value) {
    const hasBook = await listsStore.isBookInList(list.id, props.isbn);
    if (hasBook) {
      listsContainingBook.value.add(list.id);
    }
  }
});

const showFeedback = (message: string, type: 'success' | 'error') => {
  feedback.value = { message, type };
  setTimeout(() => {
    feedback.value = null;
  }, 3000);
};

const ensureBookInUserBooks = async () => {
  if (!props.book) return;

  const bookInfo: BookBasicInfo = {
    isbn: props.isbn,
    title: props.book.title,
    authors: props.book.authors,
    image: props.book.image,
    date_published: props.book.date_published,
    publisher: props.book.publisher,
    pages: props.book.pages,
    subjects: (props.book as { subjects?: string[] }).subjects,
  };

  // Get current status if it exists
  const currentStatus = userBooksStore.getUserBookStatus(props.isbn);

  // Add or update the book in user_books
  await userBooksStore.updateBookStatus(bookInfo, currentStatus);
};

const handleAddToList = async (listId: string) => {
  try {
    // Check if book is already in the list
    const alreadyInList = await listsStore.isBookInList(listId, props.isbn);
    if (alreadyInList) {
      showFeedback('Book is already in this list', 'error');
      return;
    }

    isAddingToList.value = true;
    // Close popover immediately
    isPopoverOpen.value = false;

    // Find the list name
    const list = lists.value.find((l) => l.id === listId);
    const listName = list ? list.name : 'list';

    // Ensure book is in user_books first
    await ensureBookInUserBooks();

    // Add to list
    await listsStore.addBookToList(listId, props.isbn);
    listsContainingBook.value.add(listId);
    emit('addToList', listId);
    toast({
      title: `Book added to ${listName}`,
      description: `You have added ${
        props.book?.title || 'book'
      } to ${listName}.`,
      variant: 'success',
      duration: 3000,
    });
  } catch (error) {
    showFeedback('Failed to add book to list', 'error');
    isPopoverOpen.value = true;
  } finally {
    isAddingToList.value = false;
  }
};

const handleRemoveFromList = async (listId: string) => {
  try {
    // Find the list name
    const list = lists.value.find((l) => l.id === listId);
    const listName = list ? list.name : 'list';

    // Remove from list
    await listsStore.removeBookFromList(listId, props.isbn);
    listsContainingBook.value.delete(listId);
    toast({
      title: `Book removed from ${listName}`,
      description: `You have removed ${
        props.book?.title || 'book'
      } from ${listName}.`,
      variant: 'success',
      duration: 2000,
    });
  } catch (error) {
    showFeedback('Failed to remove book from list', 'error');
  }
};

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      isCreatingList.value = true;
      // Close popover immediately
      isPopoverOpen.value = false;

      const newList = await listsStore.createList(newListName.value.trim());

      // Ensure book is in user_books first
      await ensureBookInUserBooks();

      // Add to new list
      await listsStore.addBookToList(newList.id, props.isbn);
      listsContainingBook.value.add(newList.id);
      emit('createList', newListName.value.trim());
      newListName.value = '';
      toast({
        title: 'New list created',
        description: `You have created a new list and added ${
          props.book?.title || 'book'
        } to the list.`,
        variant: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      showFeedback(error.message || 'Failed to create list', 'error');
      isPopoverOpen.value = true;
    } finally {
      isCreatingList.value = false;
    }
  }
};
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <button type="button" class="gr-btn gr-btn-outline" @click.stop>
        <font-awesome-icon :icon="icon || 'fa-solid fa-plus'" />
        Add to list
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      :side-offset="6"
      :collision-padding="16"
      class="w-[320px] max-w-[calc(100vw-2rem)] rounded-[14px] border-gr-line bg-gr-surface p-0 font-body text-base text-gr-text shadow-gr-modal"
    >
      <div class="flex items-center justify-between py-1.5 pl-4 pr-1.5">
        <h3 class="font-semibold">Add to list</h3>
        <button
          type="button"
          class="gr-icon-btn"
          aria-label="Close"
          @click="isPopoverOpen = false"
        >
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </button>
      </div>

      <p
        v-if="feedback"
        role="status"
        class="mx-4 mb-2 rounded-lg bg-gr-surface-2 px-3 py-2 text-sm"
        :class="
          feedback.type === 'error' ? 'text-gr-danger-text' : 'text-gr-accent'
        "
      >
        {{ feedback.message }}
      </p>

      <!-- Existing lists -->
      <p v-if="!lists.length" class="px-4 pb-3 text-sm text-gr-muted">
        No lists created yet
      </p>
      <ul v-else class="max-h-[264px] overflow-y-auto px-1.5 pb-1.5">
        <li v-for="list in lists" :key="list.id">
          <!-- Already in the list: offer to remove it instead -->
          <div
            v-if="listsContainingBook.has(list.id)"
            class="flex min-h-[52px] items-center gap-3 rounded-lg pl-2.5"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ list.name }}</p>
              <p class="text-[13px] text-gr-accent">
                <font-awesome-icon icon="fa-solid fa-check" />
                In this list
              </p>
            </div>
            <button
              type="button"
              class="gr-icon-btn hover:!text-gr-danger-text"
              :aria-label="`Remove from ${list.name}`"
              @click="handleRemoveFromList(list.id)"
            >
              <font-awesome-icon icon="fa-regular fa-circle-xmark" />
            </button>
          </div>
          <button
            v-else
            type="button"
            class="flex min-h-[52px] w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors hover:bg-gr-surface-2 focus-visible:bg-gr-surface-2 focus-visible:outline-none"
            :disabled="isAddingToList"
            @click="handleAddToList(list.id)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ list.name }}</span>
              <span class="block text-[13px] text-gr-muted">
                {{ bookCountLabel(list.id) }}
              </span>
            </span>
            <font-awesome-icon icon="fa-solid fa-plus" class="text-gr-muted" />
          </button>
        </li>
      </ul>

      <!-- New list -->
      <form
        class="grid gap-2 border-t border-gr-line p-4"
        @submit.prevent="handleCreateList"
      >
        <label :for="`new-list-${isbn}`" class="text-sm text-gr-muted">
          Or start a new list
        </label>
        <input
          :id="`new-list-${isbn}`"
          v-model="newListName"
          type="text"
          class="gr-input"
          placeholder="New list name"
        />
        <button
          type="submit"
          class="gr-btn gr-btn-primary w-full"
          :disabled="!newListName.trim() || isCreatingList"
        >
          {{ isCreatingList ? 'Creating...' : 'Create and add' }}
        </button>
      </form>
    </PopoverContent>
  </Popover>
</template>
