<script setup lang="ts">
import type { UserBook, BookStatus } from '@/types/book';
import { ref, watch } from 'vue';
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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'vee-validate';
import { useUserBooksStore } from '@/store/user-books-store';
import { toast } from '@/components/ui/toast';
import { updateBookErrorMessages } from '@/store/error-handler';
import { updateProgressSchema } from '@/store/form-validation-schemas';

const props = defineProps<{
  book: UserBook;
}>();

const userBooksStore = useUserBooksStore();
const currentPage = ref(props.book.current_page || 0);
const timeReadingInMins = ref<number>();
const totalPages = props.book.pages || 0;
const isDialogOpen = ref(false);
const currentPageError = ref('');

const { handleSubmit, setFieldValue, validate } = useForm({
  validationSchema: updateProgressSchema,
});

// Watch for changes in currentPage and validate against total pages
watch(currentPage, (newValue) => {
  if (newValue > totalPages) {
    currentPageError.value = `Current page cannot exceed total pages (${totalPages})`;
  } else {
    currentPageError.value = '';
  }
  setFieldValue('currentPage', newValue);
});

watch(timeReadingInMins, (newValue) => {
  setFieldValue('timeReadingInMins', newValue);
});

const emit = defineEmits<{
  (e: 'update', progress: { currentPage: number }): void;
  (e: 'statusUpdate', status: BookStatus): void;
}>();

const validateForm = async () => {
  const result = await validate();
  if (!result.valid) return false;

  if (currentPage.value > totalPages) {
    currentPageError.value = `Current page cannot exceed total pages (${totalPages})`;
    return false;
  }

  if (!timeReadingInMins.value) {
    return false;
  }

  return true;
};

const handleUpdate = async (e: Event) => {
  e.preventDefault();

  if (!(await validateForm())) return;

  try {
    await userBooksStore.updateBookProgress(
      props.book.isbn,
      currentPage.value,
      timeReadingInMins.value!
    );

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
    isDialogOpen.value = false;
    timeReadingInMins.value = undefined;
  } catch (err: unknown) {
    const error = err as Error;
    toast({
      title: 'Error updating progress',
      description: error.message || updateBookErrorMessages.unknownError,
      variant: 'destructive',
      duration: 2000,
    });
  }
};

const handleFinish = async (e: Event) => {
  e.preventDefault();

  if (!(await validateForm())) return;

  try {
    await userBooksStore.updateBookProgress(
      props.book.isbn,
      totalPages,
      timeReadingInMins.value!
    );
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
    isDialogOpen.value = false;
    currentPage.value = totalPages;
    timeReadingInMins.value = undefined;
  } catch (err: unknown) {
    const error = err as Error;
    toast({
      title: 'Error updating progress',
      description: error.message || updateBookErrorMessages.unknownError,
      variant: 'destructive',
      duration: 2000,
    });
  }
};
</script>

<template>
  <Dialog v-model:open="isDialogOpen">
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
      <form @submit.prevent="handleUpdate" class="space-y-4" novalidate>
        <FormField v-slot="{ field, errorMessage }" name="currentPage">
          <FormItem>
            <FormLabel required>Current Page</FormLabel>
            <FormControl>
              <input
                type="number"
                v-model="currentPage"
                min="0"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormControl>
            <p class="text-xs text-muted-foreground" v-if="totalPages">
              of {{ totalPages }} pages
            </p>
            <p
              v-if="currentPageError || errorMessage"
              class="text-sm font-medium text-destructive"
            >
              {{ currentPageError || errorMessage }}
            </p>
          </FormItem>
        </FormField>

        <FormField v-slot="{ field, errorMessage }" name="timeReadingInMins">
          <FormItem>
            <FormLabel required>Session time spent reading (mins)</FormLabel>
            <FormControl>
              <input
                type="number"
                v-model="timeReadingInMins"
                min="0"
                max="1440"
                placeholder="Enter time in minutes"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormControl>
            <p v-if="errorMessage" class="text-sm font-medium text-destructive">
              {{ errorMessage }}
            </p>
          </FormItem>
        </FormField>

        <DialogFooter class="grid grid-cols-2 gap-4">
          <Button
            type="button"
            @click="handleFinish"
            variant="default"
            class="justify-self-start bg-goingGreen"
          >
            I've Finished
          </Button>
          <Button
            type="submit"
            variant="outline"
            class="justify-self-end bg-black text-white"
          >
            Save Progress
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
