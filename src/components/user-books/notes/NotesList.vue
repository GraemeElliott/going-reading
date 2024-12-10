<script setup lang="ts">
import { ref, computed } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotesStore } from '@/store/notes-store';
import type { Note } from '@/store/notes-store';

const props = defineProps<{
  bookId: string;
}>();

const emit = defineEmits<{
  (e: 'error', value: string | null): void;
}>();

const editingNote = ref<Note | null>(null);
const notesStore = useNotesStore();
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
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="cancelEditing">
            Cancel
          </Button>
          <Button
            size="sm"
            @click="handleUpdateNote(note)"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Saving...' : 'Save' }}
          </Button>
        </div>
      </div>
      <div v-else>
        <div class="flex flex-col gap-3">
          <div class="space-y-2">
            <h4 v-if="note.title" class="font-medium text-base">
              {{ note.title }}
            </h4>
            <p class="text-xs text-muted-foreground">
              {{ formatDate(note.created_at) }}
            </p>
            <div
              v-html="note.note"
              class="prose prose-sm max-w-none text-sm md:text-base"
            ></div>
          </div>
          <div class="flex flex-row space-x-6 my-4">
            <Button
              size="sm"
              class="flex-1 h-8 px-3"
              @click="startEditing(note)"
            >
              Edit
            </Button>
            <Button
              size="sm"
              class="flex-1 h-8 px-3 bg-goingRed"
              @click="handleDeleteNote(note.id)"
            >
              Delete
            </Button>
          </div>
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
</style>
