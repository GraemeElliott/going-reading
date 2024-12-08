<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useListsStore } from '@/store/lists-store';
import { useUserBooksStore } from '@/store/user-books-store';
import { storeToRefs } from 'pinia';
import type { Book, BookBasicInfo, UserBook } from '@/types/book';

const props = defineProps<{
  isbn: string;
  book?: Book | BookBasicInfo | UserBook;
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
      <Button class="cursor-pointer w-[180px]" @click.stop>
        Add To List
      </Button>
    </PopoverTrigger>
    <PopoverContent
      class="w-80"
      :open="isPopoverOpen"
      @update:open="isPopoverOpen = $event"
    >
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="font-medium leading-none">Add to List</h4>
          <p class="text-sm text-muted-foreground">
            Choose a list or create a new one
          </p>
        </div>
        <div
          v-if="feedback"
          :class="{
            'p-2 rounded text-sm': true,
            'bg-red-100 text-red-600': feedback.type === 'error',
            'bg-green-100 text-green-600': feedback.type === 'success',
          }"
        >
          {{ feedback.message }}
        </div>
        <div class="grid gap-2">
          <div class="space-y-4">
            <div class="grid gap-2">
              <Input
                v-model="newListName"
                type="text"
                placeholder="New list name"
                class="w-full"
              />
              <div class="flex items-center space-x-2 py-2"></div>
              <Button
                @click="handleCreateList"
                :disabled="!newListName.trim() || isCreatingList"
              >
                {{ isCreatingList ? 'Creating...' : 'Create & Add Book' }}
              </Button>
            </div>
          </div>
          <Separator class="my-2" />
          <div
            v-if="!lists.length"
            class="text-center py-2 text-sm text-muted-foreground"
          >
            No lists created yet
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="list in lists"
              :key="list.id"
              class="flex flex-row items-center"
            >
              <font-awesome-icon
                v-if="listsContainingBook.has(list.id)"
                icon="fa-regular fa-circle-xmark"
                class="cursor-pointer text-red-500 hover:text-red-700"
                @click="handleRemoveFromList(list.id)"
              />
              <button
                class="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent flex items-center justify-between"
                @click="handleAddToList(list.id)"
                :disabled="isAddingToList"
              >
                <span>{{ list.name }}</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="listsContainingBook.has(list.id)"
                    class="text-green-500"
                    >✓</span
                  >
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
