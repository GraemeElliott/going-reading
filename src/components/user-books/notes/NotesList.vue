<script setup lang="ts">
import { ref, computed } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotesStore } from '@/store/notes-store';
import type { Note } from '@/store/notes-store';
import { useDarkModeStore } from '@/store/store';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  bookId: string;
}>();

const emit = defineEmits<{
  (e: 'error', value: string | null): void;
}>();

const editingNote = ref<Note | null>(null);
const notesStore = useNotesStore();
const darkModeStore = useDarkModeStore();
const isSubmitting = ref(false);

// Quill editor options with full toolbar
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ align: [] }],
      [{ color: [] }],
      ['link'],
      ['clean'],
    ],
  },
  placeholder: 'Write a new note... (required)',
};

// Use computed to get notes for this specific book
const notes = computed(() => notesStore.getNotesForBook(props.bookId));

// Computed property for editing title that handles null
const editingTitle = computed({
  get: () => editingNote.value?.title || '',
  set: (value: string) => {
    if (editingNote.value) {
      editingNote.value = {
        ...editingNote.value,
        title: value,
      };
    }
  },
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to check if HTML content is empty
const isHtmlContentEmpty = (content: string) => {
  // Remove HTML tags and trim whitespace
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  return textContent === '';
};

const handleUpdateNote = async (note: Note) => {
  if (!editingTitle.value.trim()) {
    emit('error', 'Title is required');
    return;
  }

  if (!editingNote.value?.note || isHtmlContentEmpty(editingNote.value.note)) {
    emit('error', 'Note content is required');
    return;
  }

  try {
    emit('error', null);
    isSubmitting.value = true;
    await notesStore.updateNote(
      note.id,
      editingNote.value.note,
      editingTitle.value.trim()
    );
    editingNote.value = null;
  } catch (err) {
    console.error('Failed to update note:', err);
    emit('error', 'Failed to update note. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

const handleDeleteNote = async (noteId: string) => {
  try {
    emit('error', null);
    await notesStore.deleteNote(noteId, props.bookId);
  } catch (err) {
    console.error('Failed to delete note:', err);
    emit('error', 'Failed to delete note. Please try again.');
  }
};

const startEditing = (note: Note) => {
  editingNote.value = { ...note };
};

const cancelEditing = () => {
  editingNote.value = null;
  emit('error', null);
};
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="!notes.length"
      class="text-center py-4 text-sm text-muted-foreground"
    >
      No notes yet
    </div>
    <div v-for="note in notes" :key="note.id" class="space-y-3">
      <div v-if="editingNote?.id === note.id">
        <Input
          v-model="editingTitle"
          placeholder="Title (required)"
          class="w-full mb-3"
        />
        <QuillEditor
          v-model:content="editingNote.note"
          :options="editorOptions"
          contentType="html"
          class="note-editor mb-3"
        />
        <div class="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            class="hover:bg-goingRed hover:border-none hover:text-white"
            @click="cancelEditing"
          >
            <font-awesome-icon icon="fa-solid fa-ban" />
          </Button>
          <Button
            size="sm"
            class="hover:bg-goingGreen hover:text-white hover:border hover:border-goingGreen"
            :class="{
              'bg-white text-black': !darkModeStore.darkMode,
              'bg-gray-900 text-white border border-white':
                darkModeStore.darkMode,
            }"
            @click="handleUpdateNote(note)"
            :disabled="isSubmitting"
          >
            <font-awesome-icon icon="fa-solid fa-floppy-disk" />
          </Button>
        </div>
        <Separator class="my-4" />
      </div>
      <div v-else>
        <div class="flex flex-col gap-3">
          <div class="space-y-2">
            <div class="flex flex-row justify-between">
              <h4 v-if="note.title" class="font-medium text-base">
                {{ note.title }}
              </h4>
              <div class="flex flex-row space-x-3">
                <Button
                  size="sm"
                  class="hover:bg-goingTeal hover:text-white hover:border hover:border-goingTeal"
                  :class="{
                    'bg-white text-black': !darkModeStore.darkMode,
                    'bg-gray-900 text-white border border-white':
                      darkModeStore.darkMode,
                  }"
                  @click="startEditing(note)"
                >
                  <font-awesome-icon icon="fa-solid fa-pen-to-square" />
                </Button>
                <Button
                  size="sm"
                  class="hover:bg-goingRed hover:text-white hover:border hover:border-goingRed"
                  :class="{
                    'bg-white text-black': !darkModeStore.darkMode,
                    'bg-gray-900 text-white border border-white':
                      darkModeStore.darkMode,
                  }"
                  @click="handleDeleteNote(note.id)"
                >
                  <font-awesome-icon icon="fa-solid fa-trash-can" />
                </Button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ formatDate(note.created_at) }}
            </p>
            <div
              v-html="note.note"
              class="prose prose-sm max-w-none text-sm md:text-base ql-content"
              :class="{
                'prose-invert': darkModeStore.darkMode,
              }"
            ></div>
          </div>
          <Separator />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-editor {
  @apply min-h-[150px] max-h-[300px];
}

/* Ensure proper spacing in prose content */
:deep(.prose) {
  @apply space-y-2;
}

:deep(.prose p:last-child) {
  @apply mb-0;
}

/* Quill content styling */
:deep(.ql-content) {
  @apply leading-relaxed;
}

:deep(.ql-content p) {
  @apply my-2;
}

:deep(.ql-content blockquote) {
  @apply pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic my-4;
}

:deep(.ql-content ul) {
  @apply list-disc list-inside my-4 space-y-1;
}

:deep(.ql-content ol) {
  @apply list-decimal list-inside my-4 space-y-1;
}

:deep(.ql-content li) {
  @apply ml-4;
}

:deep(.ql-content a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

:deep(.ql-content strong) {
  @apply font-bold;
}

:deep(.ql-content em) {
  @apply italic;
}

:deep(.ql-content s) {
  @apply line-through;
}

:deep(.ql-content sub) {
  @apply align-sub text-xs;
}

:deep(.ql-content sup) {
  @apply align-super text-xs;
}

:deep(.ql-content img) {
  @apply max-w-full h-auto my-4 rounded-lg;
}

:deep(.ql-content .ql-align-center) {
  @apply text-center;
}

:deep(.ql-content .ql-align-right) {
  @apply text-right;
}

:deep(.ql-content .ql-align-justify) {
  @apply text-justify;
}

:deep(.ql-content .ql-indent-1) {
  @apply ml-4;
}

:deep(.ql-content .ql-indent-2) {
  @apply ml-8;
}
</style>
