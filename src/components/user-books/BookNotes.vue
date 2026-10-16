<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'radix-vue';
import { useNotesStore } from '@/store/notes-store';
import CreateNote from './notes/CreateNote.vue';
import NotesList from './notes/NotesList.vue';
import BookTitle from '@/components/partials/BookTitle.vue';
import { formatAuthors } from '@/utils/book-display';

const props = defineProps<{
  bookId: string;
  bookTitle: string;
  bookAuthors?: string[];
}>();

const isSheetOpen = ref(false);
const notesStore = useNotesStore();
const error = ref<string | null>(null);
const createNoteRef = ref<InstanceType<typeof CreateNote> | null>(null);

onMounted(async () => {
  try {
    await notesStore.fetchBookNotes(props.bookId);
  } catch (err) {
    console.error('Failed to fetch notes:', err);
    error.value = 'Failed to load notes';
  }
});

const handleError = (errorMessage: string | null) => {
  error.value = errorMessage;
};
</script>

<template>
  <DialogRoot v-model:open="isSheetOpen">
    <DialogTrigger class="gr-btn gr-btn-outline">
      <font-awesome-icon icon="fa-regular fa-note-sticky" />
      Notes
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-gr-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <!-- Slides in from the right; full width on mobile -->
      <DialogContent
        aria-modal="true"
        class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-gr-line bg-gr-surface p-6 font-body text-base leading-[1.4] text-gr-text shadow-gr-modal duration-300 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right md:w-[640px] md:border-l"
      >
        <!-- Header band: tinted and ruled off so it reads apart from the notes -->
        <div
          class="-mx-6 -mt-6 border-b border-gr-line bg-gr-surface-2 px-6 pb-5 pt-5"
        >
          <div class="flex items-center justify-between gap-4">
            <DialogTitle
              class="font-heading text-[28px] font-medium leading-tight"
            >
              Notes
            </DialogTitle>
            <DialogClose
              class="gr-icon-btn -mr-2 hover:!bg-gr-surface"
              aria-label="Close"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg" />
            </DialogClose>
          </div>
          <!-- Book the notes belong to -->
          <DialogDescription class="mt-4 text-[15px] text-gr-muted">
            <BookTitle
              :title="bookTitle"
              title-class="text-[17px] font-bold text-gr-text line-clamp-2"
            />
            <span v-if="bookAuthors?.length" class="mt-0.5 block line-clamp-1">
              by {{ formatAuthors(bookAuthors) }}
            </span>
          </DialogDescription>
        </div>

        <!-- Notes List -->
        <div class="mt-6">
          <NotesList :book-id="bookId" @error="handleError" />
        </div>

        <!-- Error Message -->
        <p
          v-if="error"
          role="alert"
          class="mt-4 rounded-[10px] border border-gr-line bg-gr-surface-2 p-3 text-sm text-gr-danger-text"
        >
          {{ error }}
        </p>

        <!-- Notes Form Section -->
        <div class="mt-8">
          <CreateNote
            ref="createNoteRef"
            :book-id="bookId"
            @error="handleError"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
