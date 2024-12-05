<script setup lang="ts">
import { ref } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotesStore } from '@/store/notes-store';

const props = defineProps<{
  bookId: string;
}>();

const emit = defineEmits<{
  (e: 'error', value: string | null): void;
}>();

const newTitle = ref('');
const newNote = ref('');
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

// Helper function to check if HTML content is empty
const isHtmlContentEmpty = (content: string) => {
  // Remove HTML tags and trim whitespace
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  return textContent === '';
};

const clearForm = () => {
  newTitle.value = '';
  newNote.value = '<p><br></p>'; // Set to empty Quill editor content
  emit('error', null);
};

const handleCreateNote = async () => {
  if (!newTitle.value.trim()) {
    emit('error', 'Title is required');
    return;
  }

  if (isHtmlContentEmpty(newNote.value)) {
    emit('error', 'Note content is required');
    return;
  }

  try {
    emit('error', null);
    isSubmitting.value = true;
    await notesStore.createNote(
      props.bookId,
      newNote.value,
      newTitle.value.trim()
    );
    clearForm();
  } catch (err) {
    console.error('Failed to create note:', err);
    emit('error', 'Failed to create note. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

defineExpose({
  clearForm,
});
</script>

<template>
  <div class="space-y-3">
    <Input
      v-model="newTitle"
      placeholder="Title (required)"
      class="w-full text-sm md:text-base"
    />
    <QuillEditor
      v-model:content="newNote"
      :options="editorOptions"
      contentType="html"
      class="note-editor"
    />
    <Button
      class="w-full mt-2"
      @click="handleCreateNote"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Adding...' : 'Add Note' }}
    </Button>
  </div>
</template>

<style scoped>
.note-editor {
  @apply min-h-[150px] max-h-[300px];
}

:deep(.ql-toolbar) {
  @apply rounded-t-md border-border;
}

:deep(.ql-container) {
  @apply rounded-b-md border-border text-sm md:text-base;
}

:deep(.ql-editor) {
  @apply min-h-[150px] max-h-[300px] overflow-y-auto;
}

/* Make toolbar more compact on mobile */
@media (max-width: 640px) {
  :deep(.ql-toolbar) {
    @apply p-1.5;
  }

  :deep(.ql-toolbar button) {
    @apply p-1;
  }
}
</style>
