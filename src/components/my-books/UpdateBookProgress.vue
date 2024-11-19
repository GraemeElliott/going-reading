<script setup lang="ts">
import type { UserBook, BookStatus } from '@/types/book';
import { ref } from 'vue';
import Button from '@/components/ui/button/Button.vue';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useUserBooksStore } from '@/store/user-books-store';
import { toast } from '@/components/ui/toast';
import { updateBookErrorMessages } from '@/store/error-handler';

const props = defineProps<{
  book: UserBook;
}>();

const userBooksStore = useUserBooksStore();
const currentPage = ref(props.book.current_page || 0);
const totalPages = props.book.pages || 0;

const emit = defineEmits<{
  (e: 'update', progress: { currentPage: number }): void;
  (e: 'statusUpdate', status: BookStatus): void;
}>();

async function handleUpdate() {
  try {
    await userBooksStore.updateBookProgress(props.book.isbn, currentPage.value);

    // If current page equals total pages, mark as read
    if (totalPages && currentPage.value === totalPages) {
      await userBooksStore.updateBookStatus(props.book.isbn, 'read');
      emit('statusUpdate', 'read');
      toast({
        title: 'Book Completed',
        description: `You have finished ${
          props.book.title
        } by ${props.book.authors.join(', ')}. Congratulations! 🎉`,
        variant: 'success',
        duration: 2000,
      });
    } else {
      toast({
        title: 'Progress Updated',
        description: 'You have successfully updated your progress',
        variant: 'success',
        duration: 2000,
      });
    }

    emit('update', { currentPage: currentPage.value });
  } catch (err: unknown) {
    const error = err as Error;
    toast({
      title: 'Error updating progress',
      description: error.message || updateBookErrorMessages.unknownError,
      variant: 'destructive',
      duration: 2000,
    });
  }
}

async function handleFinish() {
  try {
    await userBooksStore.updateBookProgress(props.book.isbn, totalPages);
    await userBooksStore.updateBookStatus(props.book.isbn, 'read');

    emit('statusUpdate', 'read');
    toast({
      title: 'Progress Updated',
      description: `You have finished ${
        props.book.title
      } by ${props.book.authors.join(', ')}. Congratulations! 🎉`,
      variant: 'success',
      duration: 2000,
    });
  } catch (err: unknown) {
    const error = err as Error;
    toast({
      title: 'Error updating progress',
      description: error.message || updateBookErrorMessages.unknownError,
      variant: 'destructive',
      duration: 2000,
    });
  }
}
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <Button
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-gray-800 px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm font-medium hover:bg-gray-100 hover:text-black"
      >
        Update
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Reading Progress</DialogTitle>
        <DialogDescription>
          Update your reading progress for <strong>{{ book.title }}</strong>
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <label
            for="current-page"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Current Page
          </label>
          <input
            id="current-page"
            type="number"
            v-model="currentPage"
            :max="totalPages"
            min="0"
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p class="text-xs text-muted-foreground" v-if="totalPages">
            of {{ totalPages }} pages
          </p>
        </div>

        <DialogFooter class="grid grid-cols-2 gap-4">
          <DialogClose asChild>
            <Button
              @click="handleFinish"
              variant="default"
              class="justify-self-start bg-goingGreen"
              >I've Finished</Button
            >
          </DialogClose>
          <DialogClose asChild>
            <Button
              @click="handleUpdate"
              variant="outline"
              class="justify-self-end bg-black text-white"
              >Save Progress</Button
            >
          </DialogClose>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
