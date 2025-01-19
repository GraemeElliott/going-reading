<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNotesStore } from '@/store/notes-store';
import { useDarkModeStore } from '@/store/store';
import CreateNote from './notes/CreateNote.vue';
import NotesList from './notes/NotesList.vue';

const props = defineProps<{
  bookId: string;
  bookTitle: string;
}>();

const isSheetOpen = ref(false);
const notesStore = useNotesStore();
const darkModeStore = useDarkModeStore();
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
  <div class="relative">
    <Sheet v-model:open="isSheetOpen">
      <SheetTrigger>
        <Button
          class="cursor-pointer w-[180px]"
          :class="{
            'bg-white border-black text-black': !darkModeStore.darkMode,
            'bg-gray-900 border-white text-white': darkModeStore.darkMode,
          }"
          @pointerdown.stop
        >
          Notes
        </Button>
      </SheetTrigger>
      <SheetContent
        @pointerdown.stop
        class="h-full flex flex-col border-none"
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white': darkModeStore.darkMode,
        }"
      >
        <div class="flex-1 overflow-y-auto px-2">
          <div class="flex-1 min-h-0">
            <div class="h-full overflow-y-auto">
              <SheetHeader>
                <SheetTitle
                  :class="{
                    'bg-white text-black': !darkModeStore.darkMode,
                    'bg-gray-900 text-white': darkModeStore.darkMode,
                  }"
                  >Notes for {{ bookTitle }}</SheetTitle
                >
                <SheetDescription>
                  Add and manage your notes, quotes, and reviews for this book.
                </SheetDescription>
              </SheetHeader>
              <!-- Notes List -->
              <div class="mt-6">
                <NotesList :book-id="bookId" @error="handleError" />
              </div>
              <!-- Error Message -->
              <div
                v-if="error"
                class="mt-4 bg-red-50 border border-red-200 text-goingRed p-3 rounded-md text-sm"
              >
                {{ error }}
              </div>
            </div>
          </div>
          <!-- Notes Form Section -->
          <div class="flex-shrink-0 mt-8">
            <h2 class="my-3 font-bold">Add notes, quotes, or a review.</h2>
            <CreateNote
              ref="createNoteRef"
              :book-id="bookId"
              @error="handleError"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
