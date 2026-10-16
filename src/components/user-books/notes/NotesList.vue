<script setup lang="ts">
import { ref, computed } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
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
  <div>
    <p v-if="!notes.length" class="gr-empty">
      No notes yet. Add a note, quote or review below.
    </p>
    <ul v-else class="divide-y divide-gr-line">
      <li v-for="note in notes" :key="note.id" class="py-4 first:pt-0">
        <div v-if="editingNote?.id === note.id" class="grid gap-3">
          <input
            v-model="editingTitle"
            type="text"
            class="gr-input"
            aria-label="Title"
            placeholder="Title"
          />
          <div class="gr-editor" role="group" aria-label="Note">
            <QuillEditor
              v-model:content="editingNote.note"
              :options="editorOptions"
              contentType="html"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="gr-btn gr-btn-outline"
              @click="cancelEditing"
            >
              Cancel
            </button>
            <button
              type="button"
              class="gr-btn gr-btn-primary"
              :disabled="isSubmitting"
              @click="handleUpdateNote(note)"
            >
              Save
            </button>
          </div>
        </div>
        <div v-else>
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 v-if="note.title" class="font-[650]">{{ note.title }}</h3>
              <p class="text-[13px] text-gr-muted">
                {{ formatDate(note.created_at) }}
              </p>
            </div>
            <div class="-mt-2 flex shrink-0">
              <button
                type="button"
                class="gr-icon-btn"
                :aria-label="`Edit note ${note.title || ''}`"
                @click="startEditing(note)"
              >
                <font-awesome-icon icon="fa-regular fa-pen-to-square" />
              </button>
              <button
                type="button"
                class="gr-icon-btn hover:!text-gr-danger-text"
                :aria-label="`Delete note ${note.title || ''}`"
                @click="handleDeleteNote(note.id)"
              >
                <font-awesome-icon icon="fa-regular fa-trash-can" />
              </button>
            </div>
          </div>
          <div v-html="note.note" class="ql-content mt-1 text-[15px]"></div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
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
  @apply pl-4 border-l-4 border-gr-line italic my-4;
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
  @apply text-gr-accent hover:underline;
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
