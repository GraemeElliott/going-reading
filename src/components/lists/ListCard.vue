<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';
import { useDarkModeStore } from '@/store/store';
import { useListsStore } from '@/store/lists-store';
import { toast } from '@/components/ui/toast';
import EditListDetails from '@/components/lists/EditListDetails.vue';

const darkModeStore = useDarkModeStore();
const listsStore = useListsStore();
const removingBookIsbn = ref<string | null>(null);

interface Props {
  list: List;
  expanded: boolean;
  loadingBooks: boolean;
  books?: UserBook[];
  isProfilePage?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'bookListUpdated', listId: string): void;
  (e: 'listDeleted', listId: string): void;
  (e: 'toggleExpansion', listId: string): void;
}>();

const handleDeleteList = async (listId: string) => {
  try {
    await listsStore.deleteList(listId);
    emit('listDeleted', listId);
    toast({
      title: 'List deleted',
      description: `You have successfully deleted ${props.list.name}.`,
      variant: 'success',
      duration: 2000,
    });
  } catch (error) {
    toast({
      title: 'Error Deleting List',
      description: `There has been an error deleting ${props.list.name}: ${error}.`,
      variant: 'destructive',
      duration: 4000,
    });
  }
};

const handleRemoveBook = async (listId: string, isbn: string) => {
  if (removingBookIsbn.value) return;

  try {
    const book = props.books?.find((b) => b.isbn === isbn);
    if (!book) return;

    removingBookIsbn.value = isbn;
    await listsStore.removeBookFromList(listId, isbn);
    emit('bookListUpdated', listId);
    toast({
      title: 'Book Removed',
      description: `You have successfully removed ${book.title} from ${props.list.name}.`,
      variant: 'success',
      duration: 2000,
    });
  } catch (error) {
    const book = props.books?.find((b) => b.isbn === isbn);
    toast({
      title: 'Error Removing Book',
      description: `There was an error removing ${
        book?.title || 'the book'
      } from ${props.list.name}: "${error}".`,
      variant: 'destructive',
      duration: 4000,
    });
  } finally {
    removingBookIsbn.value = null;
  }
};

const getBookCount = (): string => {
  const count = props.books?.length || 0;
  return `${count} ${count === 1 ? 'book' : 'books'}`;
};
</script>

<template>
  <div>
    <div class="p-6 flex items-center justify-between cursor-pointer">
      <div class="w-full" @click="emit('toggleExpansion', list.id)">
        <h3 class="text-lg font-semibold">{{ list.name }}</h3>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{ getBookCount() }}</span>
        </div>
        <p v-if="list.details" class="mt-2 text-sm text-muted-foreground">
          {{ list.details }}
        </p>
      </div>
      <div v-if="!isProfilePage" class="flex items-center gap-2">
        <EditListDetails :list="list" />
        <Button
          size="sm"
          class="hover:bg-goingRed hover:text-white hover:border hover:border-goingRed"
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
          @click.stop="handleDeleteList(list.id)"
        >
          <font-awesome-icon icon="fa-regular fa-trash-can" />
        </Button>
      </div>
    </div>
    <Separator />
    <div
      :class="{
        hidden: !expanded,
      }"
    >
      <div class="border-t">
        <div v-if="loadingBooks" class="divide-y">
          <div v-for="n in 3" :key="n" class="p-4">
            <div class="flex items-center gap-4">
              <Skeleton class="w-16 h-24 rounded" />
              <div class="flex-grow space-y-2">
                <Skeleton class="h-5 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
              <Skeleton class="h-9 w-24" />
            </div>
          </div>
        </div>

        <div v-else-if="!books?.length" class="p-4 text-center">
          <p class="text-muted-foreground">No books in this list</p>
        </div>

        <div v-else class="divide-y">
          <div
            v-for="book in books"
            :key="book.isbn"
            class="p-4 flex items-center"
            :class="{ 'opacity-50': removingBookIsbn === book.isbn }"
          >
            <router-link :to="`/book/${book.isbn}`" class="flex-grow min-w-0">
              <div class="flex items-center gap-4">
                <img
                  :src="book.image"
                  :alt="book.title"
                  class="w-16 h-24 object-cover rounded shrink-0"
                  @error="book.image = '/default-book-cover.jpg'"
                />
                <div class="min-w-0 flex-grow">
                  <h4 class="font-medium">{{ book.title }}</h4>
                  <p class="text-sm text-muted-foreground truncate">
                    {{ book.authors.join(', ') }}
                  </p>
                </div>
              </div>
            </router-link>
            <Button
              v-if="!isProfilePage"
              @click="handleRemoveBook(list.id, book.isbn)"
              class="hover:bg-goingRed hover:text-white shrink-0"
              :class="{
                'pointer-events-none': removingBookIsbn === book.isbn,
                'bg-white text-black': !darkModeStore.darkMode,
                'bg-gray-900 text-white border border-white':
                  darkModeStore.darkMode,
              }"
              :disabled="removingBookIsbn === book.isbn"
            >
              <font-awesome-icon icon="fa-solid fa-minus" /> Remove
            </Button>
          </div>
        </div>
        <Separator />
      </div>
    </div>
  </div>
</template>
