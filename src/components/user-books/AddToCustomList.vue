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
const isPublic = ref(false);
const listsStore = useListsStore();
const userBooksStore = useUserBooksStore();
const { lists, loading } = storeToRefs(listsStore);
const feedback = ref<{ message: string; type: 'success' | 'error' } | null>(
  null
);
const listsContainingBook = ref<Set<string>>(new Set());

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

const handlePublicToggle = (checked: boolean) => {
  isPublic.value = checked;
};

const handleAddToList = async (listId: string) => {
  try {
    // Check if book is already in the list
    const alreadyInList = await listsStore.isBookInList(listId, props.isbn);
    if (alreadyInList) {
      showFeedback('Book is already in this list', 'error');
      return;
    }

    // Ensure book is in user_books first
    await ensureBookInUserBooks();

    // Add to list
    await listsStore.addBookToList(listId, props.isbn);
    listsContainingBook.value.add(listId);
    showFeedback('Book added to list', 'success');
    emit('addToList', listId);
    isPopoverOpen.value = false;
  } catch (error) {
    showFeedback('Failed to add book to list', 'error');
  }
};

const handleCreateList = async () => {
  if (newListName.value.trim()) {
    try {
      const newList = await listsStore.createList(
        newListName.value.trim(),
        isPublic.value
      );

      // Ensure book is in user_books first
      await ensureBookInUserBooks();

      // Add to new list
      await listsStore.addBookToList(newList.id, props.isbn);
      listsContainingBook.value.add(newList.id);
      showFeedback('List created and book added', 'success');
      emit('createList', newListName.value.trim());
      newListName.value = '';
      isPublic.value = false;
      isPopoverOpen.value = false;
    } catch (error: any) {
      showFeedback(error.message || 'Failed to create list', 'error');
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
          <h4 class="font-medium leading-none">Add to Custom List</h4>
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
              <div class="flex items-center space-x-2">
                <Switch
                  :checked="isPublic"
                  @update:checked="handlePublicToggle"
                />
                <span class="text-sm">{{
                  isPublic ? 'Public' : 'Private'
                }}</span>
              </div>
              <Button @click="handleCreateList" :disabled="!newListName.trim()">
                Create & Add Book
              </Button>
            </div>
          </div>
          <Separator class="my-2" />
          <div v-if="loading" class="text-center py-2">Loading lists...</div>
          <div
            v-else-if="lists.length === 0"
            class="text-center py-2 text-sm text-muted-foreground"
          >
            No lists created yet
          </div>
          <div v-else class="space-y-2">
            <button
              v-for="list in lists"
              :key="list.id"
              class="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent flex items-center justify-between"
              @click="handleAddToList(list.id)"
            >
              <span>{{ list.name }}</span>
              <div class="flex items-center gap-2">
                <span
                  v-if="list.is_public"
                  class="text-xs text-muted-foreground"
                  >Public</span
                >
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
    </PopoverContent>
  </Popover>
</template>
