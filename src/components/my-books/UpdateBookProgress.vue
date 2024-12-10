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
} from '@/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useForm } from 'vee-validate';
import { useUserBooksStore } from '@/store/user-books-store';
import { toast } from '@/components/ui/toast';
import { updateBookErrorMessages } from '@/store/error-handler';
import { updateProgressSchema } from '@/store/form-validation-schemas';
import { useDarkModeStore } from '@/store/store';

const props = defineProps<{
  book: UserBook;
}>();

const userBooksStore = useUserBooksStore();
const currentPage = ref(props.book.current_page || 0);
const timeReadingInMins = ref<number>();
const totalPages = ref(props.book.pages || 0);
const isDialogOpen = ref(false);
const currentPageError = ref('');
const isEditingTotalPages = ref(false);
const darkModeStore = useDarkModeStore();

const { handleSubmit, setFieldValue, validate } = useForm({
  validationSchema: updateProgressSchema,
});

// Function to toggle body scroll
const toggleBodyScroll = (disable: boolean) => {
  if (disable) {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  } else {
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }
};

// Watch for dialog state changes
watch(isDialogOpen, (newValue) => {
  toggleBodyScroll(newValue);
});

// Watch for changes in currentPage and validate against total pages
watch(currentPage, (newValue) => {
  if (!isEditingTotalPages.value) {
    if (newValue > totalPages.value) {
      currentPageError.value = `Current page cannot exceed total pages (${totalPages.value})`;
    } else {
      currentPageError.value = '';
    }
    setFieldValue('currentPage', newValue);
  }
});

watch(timeReadingInMins, (newValue) => {
  if (!isEditingTotalPages.value) {
    setFieldValue('timeReadingInMins', newValue);
  }
});

const emit = defineEmits<{
  (e: 'update', progress: { currentPage: number }): void;
  (e: 'statusUpdate', status: BookStatus): void;
}>();

const validateForm = async () => {
  const result = await validate();
  if (!result.valid) return false;

  if (currentPage.value > totalPages.value) {
    currentPageError.value = `Current page cannot exceed total pages (${totalPages.value})`;
    return false;
  }

  if (!timeReadingInMins.value) {
    return false;
  }

  return true;
};

const handleUpdate = async (e: Event) => {
  e.preventDefault();

  if (isEditingTotalPages.value) {
    await handleTotalPagesUpdate();
    return;
  }

  if (!(await validateForm())) return;

  try {
    await userBooksStore.updateBookProgress(
      props.book.isbn,
      currentPage.value,
      timeReadingInMins.value!
    );

    // If current page equals total pages, mark as read
    if (totalPages.value && currentPage.value === totalPages.value) {
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
      totalPages.value,
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
    currentPage.value = totalPages.value;
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

const handleTotalPagesUpdate = async () => {
  try {
    if (totalPages.value < 1) {
      toast({
        title: 'Invalid total pages',
        description: 'Total pages must be greater than 0',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    // If current page is greater than new total pages, adjust it
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }

    await userBooksStore.updateBookTotalPages(
      props.book.isbn,
      totalPages.value
    );

    toast({
      title: 'Total Pages Updated',
      description: 'The total pages has been successfully updated',
      variant: 'success',
      duration: 2000,
    });

    isEditingTotalPages.value = false;
  } catch (err: unknown) {
    const error = err as Error;
    toast({
      title: 'Error updating total pages',
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
    <DialogContent
      :class="{
        'bg-white border-black text-black': !darkModeStore.darkMode,
        'bg-gray-900 text-white border-none': darkModeStore.darkMode,
      }"
    >
      <DialogHeader>
        <DialogTitle>Update Reading Progress</DialogTitle>
        <div class="flex flex-row mt-4">
          <img
            :src="book.image"
            :alt="book.title"
            class="w-[80px] rounded-lg mr-4"
            @error="book.image = '/default-book-cover.jpg'"
          />
          <DialogDescription
            class="flex flex-col gap-1 justify-center text-left"
          >
            <p class="font-bold">{{ book.title }}</p>
            <p class="text-xs">by: {{ book.authors.join(', ') }}</p>
            <p class="text-xs">{{ book.publisher }}</p>
            <p class="text-xs">{{ book.date_published }}</p>
            <p class="text-xs">
              Date Added: {{ new Date(book.date_added).toLocaleDateString() }}
            </p>
          </DialogDescription>
        </div>
      </DialogHeader>
      <form @submit.prevent="handleUpdate" class="space-y-4" novalidate>
        <div class="flex items-center justify-between">
          <FormField v-slot="{ errorMessage }" name="currentPage">
            <FormItem class="flex-grow">
              <FormLabel :required="!isEditingTotalPages"
                >Current Page</FormLabel
              >
              <FormControl>
                <input
                  type="number"
                  v-model="currentPage"
                  min="0"
                  :disabled="isEditingTotalPages"
                  class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted-foreground" v-if="totalPages">
                  of {{ totalPages }} pages
                </p>
                <p
                  class="text-xs p-0 h-auto hover:cursor-pointer"
                  @click="isEditingTotalPages = !isEditingTotalPages"
                >
                  {{ isEditingTotalPages ? '' : 'Edit total pages' }}
                </p>
              </div>
              <p
                v-if="
                  !isEditingTotalPages && (currentPageError || errorMessage)
                "
                class="text-sm font-medium text-destructive"
              >
                {{ currentPageError || errorMessage }}
              </p>
            </FormItem>
          </FormField>
        </div>

        <FormField
          v-if="isEditingTotalPages"
          v-slot="{ errorMessage }"
          name="totalPages"
        >
          <FormItem>
            <FormLabel required>Total Pages</FormLabel>
            <FormControl>
              <input
                type="number"
                v-model="totalPages"
                min="1"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormControl>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-muted-foreground">
                Update if the total page count is incorrect
              </p>
              <div class="space-x-2">
                <Button
                  size="sm"
                  class="text-xs p-2 text-black bg-white rounded-full hover:bg-goingRed hover:text-white hover:border-none"
                  @click="isEditingTotalPages = false"
                >
                  <font-awesome-icon icon="fa-solid fa-ban" />
                </Button>
                <Button
                  size="sm"
                  class="text-xs p-2 text-black bg-white rounded-full hover:bg-goingGreen hover:text-white hover:border-none"
                  type="submit"
                >
                  <font-awesome-icon icon="fa-solid fa-floppy-disk" />
                </Button>
              </div>
            </div>
          </FormItem>
        </FormField>

        <FormField v-slot="{ errorMessage }" name="timeReadingInMins">
          <FormItem>
            <FormLabel :required="!isEditingTotalPages"
              >Session time spent reading (mins)</FormLabel
            >
            <FormControl>
              <input
                type="number"
                v-model="timeReadingInMins"
                min="0"
                max="1440"
                placeholder="Enter time in minutes"
                :disabled="isEditingTotalPages"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </FormControl>
            <p
              v-if="!isEditingTotalPages && errorMessage"
              class="text-sm font-medium text-destructive"
            >
              {{ errorMessage }}
            </p>
          </FormItem>
        </FormField>

        <DialogFooter
          v-if="!isEditingTotalPages"
          class="grid grid-cols-2 gap-4"
        >
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
