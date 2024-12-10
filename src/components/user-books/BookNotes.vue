<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotesStore } from '@/store/notes-store';
import CreateNote from './notes/CreateNote.vue';
import NotesList from './notes/NotesList.vue';
const props = defineProps<{
  bookId: string;
  bookTitle: string;
}>();

const isSheetOpen = ref(false);
const notesStore = useNotesStore();
const error = ref<string | null>(null);
const createNoteRef = ref<InstanceType<typeof CreateNote> | null>(null);
watch(isSheetOpen, (isOpen) => {
  const html = document.documentElement;
  if (isOpen) {
    // Store current scroll position
    const scrollY = window.scrollY;
    html.style.setProperty('--scroll-position', `${scrollY}px`);
    html.classList.add('modal-open');
  } else {
    html.classList.remove('modal-open');
    // Restore scroll position
    const scrollY = html.style.getPropertyValue('--scroll-position');
    window.scrollTo(0, parseInt(scrollY || '0'));
  }
});
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
const closeSheet = () => {
  isSheetOpen.value = false;
  error.value = null;
  if (createNoteRef.value) {
    createNoteRef.value.clearForm();
  }
};
</script>

<template>
  <div class="relative">
    <Sheet>
      <SheetTrigger class="mr-0.5">
        <Button class="cursor-pointer w-[180px]" @click="isSheetOpen = true">
          Notes
        </Button>
      </SheetTrigger>
      <SheetContent class="h-full flex flex-col">
        <div class="flex-1 overflow-y-auto">
          <div class="flex-1 min-h-0">
            <div class="h-full overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Notes for {{ bookTitle }}</SheetTitle>
              </SheetHeader>
              <!-- Notes List -->
              <div class="mt-6">
                <NotesList :book-id="bookId" @error="handleError" />
              </div>
              <!-- Error Message -->
              <div
                v-if="error"
                class="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm"
              >
                {{ error }}
              </div>
            </div>
          </div>
          <!-- Notes Form Section -->
          <div class="flex-shrink-0 mt-8">
            <p class="text-sm text-muted-foreground mb-2">
              Add notes, quotes, or a review.
            </p>
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
