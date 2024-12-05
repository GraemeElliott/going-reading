<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotesStore } from '@/store/notes-store';
import CreateNote from './notes/CreateNote.vue';
import NotesList from './notes/NotesList.vue';

const props = defineProps<{
  bookId: string;
}>();

const isPopoverOpen = ref(false);
const notesStore = useNotesStore();
const error = ref<string | null>(null);
const createNoteRef = ref<InstanceType<typeof CreateNote> | null>(null);

// Watch for modal open/close to toggle body scroll
watch(isPopoverOpen, (isOpen) => {
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

const closePopover = () => {
  isPopoverOpen.value = false;
  error.value = null;
  if (createNoteRef.value) {
    createNoteRef.value.clearForm();
  }
};

// Ensure we clean up when component is unmounted
onUnmounted(() => {
  document.documentElement.classList.remove('modal-open');
});
</script>

<template>
  <div class="relative">
    <Button class="cursor-pointer w-[180px]" @click="isPopoverOpen = true">
      Notes
    </Button>

    <!-- Modal Overlay -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isPopoverOpen"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        @click="closePopover"
      />
    </Transition>

    <!-- Modal Content -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isPopoverOpen"
        class="fixed inset-x-0 top-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-[600px] mx-auto"
      >
        <div
          class="bg-background rounded-lg shadow-lg border p-4 md:p-6 max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="relative flex flex-col gap-4">
            <!-- Close Button -->
            <button
              @click="closePopover"
              class="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
            <div class="space-y-2">
              <h4 class="font-medium leading-none text-lg">Notes</h4>
              <p class="text-sm text-muted-foreground">
                Add notes, quotes, or a review.
              </p>
            </div>
            <!-- Error Message -->
            <div
              v-if="error"
              class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm"
            >
              {{ error }}
            </div>
            <!-- Create Note Section -->
            <div class="flex-none">
              <CreateNote
                ref="createNoteRef"
                :book-id="bookId"
                @error="handleError"
              />
            </div>
            <Separator class="my-2" />
            <!-- Notes List Section -->
            <div class="flex-1 min-h-0">
              <NotesList :book-id="bookId" @error="handleError" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.note-editor {
  @apply min-h-[150px] max-h-[300px] overflow-y-auto;
}

/* Make Quill editor responsive */
.ql-container {
  @apply text-sm md:text-base;
}

.ql-toolbar {
  @apply flex flex-wrap gap-1 p-2;
}

/* Ensure content doesn't overflow screen */
.popover-content {
  max-height: 90vh;
  overflow-y: auto;
}

/* Modal scroll lock styles */
:root {
  --scroll-position: 0;
}

.modal-open {
  overflow: hidden;
  position: fixed;
  inset: 0;
  padding-right: var(--scrollbar-width, 0);
}

.modal-open body {
  overflow: hidden;
  position: relative;
  height: 100%;
  touch-action: none;
  -webkit-overflow-scrolling: none;
}
</style>
