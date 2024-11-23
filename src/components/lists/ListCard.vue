<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';
import { useDarkModeStore } from '@/store/store';
import EditListDetails from '@/components/lists/EditListDetails.vue';

const darkModeStore = useDarkModeStore();

interface Props {
  list: List;
  expanded: boolean;
  loadingBooks: boolean;
  books?: UserBook[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'deleteList', listId: string): void;
  (e: 'removeBook', listId: string, isbn: string): void;
  (e: 'toggleExpansion', listId: string): void;
}>();

const getBookCount = (): string => {
  if (!props.books) {
    return '...';
  }
  const count = props.books.length;
  return `${count} ${count === 1 ? 'book' : 'books'}`;
};
</script>

<template>
  <div class="overflow-hidden">
    <div class="p-6 flex items-center justify-between cursor-pointer">
      <div class="w-full" @click="emit('toggleExpansion', list.id)">
        <h3 class="text-lg font-semibold">{{ list.name }}</h3>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{ getBookCount() }}</span>
          <span>•</span>
          <span
            :class="{
              'px-2 py-0.5 rounded-full text-xs font-medium': true,
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100':
                list.is_public,
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100':
                !list.is_public,
            }"
            >{{ list.is_public ? 'Public' : 'Private' }} List</span
          >
        </div>
        <p v-if="list.details" class="mt-2 text-sm text-muted-foreground">
          {{ list.details }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <EditListDetails :list="list" />
        <Button
          size="sm"
          class="hover:bg-goingRed hover:text-white hover:border hover:border-goingRed"
          :class="{
            'bg-white text-black': !darkModeStore.darkMode,
            'bg-gray-900 text-white border border-white':
              darkModeStore.darkMode,
          }"
          @click.stop="emit('deleteList', list.id)"
        >
          <font-awesome-icon icon="fa-regular fa-trash-can" />
        </Button>
      </div>
    </div>
    <Separator />
    <div
      :class="[
        'overflow-hidden transition-all duration-300 ease-out transform',
        expanded
          ? 'max-h-[2000px] opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-2',
      ]"
    >
      <div class="border-t relative">
        <!-- Loading State with Skeletons -->
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

        <!-- Empty State -->
        <div v-else-if="books?.length === 0" class="p-4 text-center">
          <p class="text-muted-foreground">No books in this list</p>
        </div>

        <!-- Books List -->
        <div v-else class="divide-y">
          <div
            v-for="book in books"
            :key="book.isbn"
            class="p-4 flex items-center"
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
              @click="emit('removeBook', list.id, book.isbn)"
              class="hover:bg-goingRed hover:text-white"
              :class="{
                'bg-white text-black': !darkModeStore.darkMode,
                'bg-gray-900 text-white border border-white':
                  darkModeStore.darkMode,
              }"
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
