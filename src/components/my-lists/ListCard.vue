<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';

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
    <div
      class="p-6 flex items-center justify-between cursor-pointer"
      @click="emit('toggleExpansion', list.id)"
    >
      <div>
        <h3 class="text-lg font-semibold">{{ list.name }}</h3>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{ getBookCount() }}</span>
          <span>•</span>
          <span>{{ list.is_public ? 'Public' : 'Private' }} List</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          class="bg-goingRed text-white"
          @click.stop="emit('deleteList', list.id)"
        >
          Delete List
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
        <div
          v-show="loadingBooks"
          class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]"
        >
          <div class="animate-spin h-6 w-6"></div>
        </div>
        <div
          v-show="!loadingBooks && books?.length === 0"
          class="p-4 text-center"
        >
          <p class="text-muted-foreground">No books in this list</p>
        </div>
        <div
          v-show="!loadingBooks && books && books.length > 0"
          class="divide-y"
        >
          <div
            v-for="book in books"
            :key="book.isbn"
            class="p-4 flex items-center justify-between"
          >
            <router-link :to="`/book/${book.isbn}`">
              <div class="flex items-center gap-4">
                <img
                  :src="book.image"
                  :alt="book.title"
                  class="w-16 h-24 object-cover rounded"
                  @error="book.image = '/default-book-cover.jpg'"
                />
                <div>
                  <h4 class="font-medium">{{ book.title }}</h4>
                  <p class="text-sm text-muted-foreground">
                    {{ book.authors.join(', ') }}
                  </p>
                </div>
              </div>
            </router-link>
            <Button
              variant="ghost"
              size="sm"
              @click="emit('removeBook', list.id, book.isbn)"
            >
              Remove
            </Button>
          </div>
        </div>
        <Separator />
      </div>
    </div>
  </div>
</template>
