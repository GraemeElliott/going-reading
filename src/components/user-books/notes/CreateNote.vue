<script setup lang="ts">
import { ref } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
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
  placeholder: 'Write a new note...',
  bounds: '.note-editor-container',
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
  <div class="grid gap-4">
    <div class="grid gap-2">
      <label :for="`note-title-${bookId}`" class="text-[15px] font-semibold">
        Title
      </label>
      <input
        :id="`note-title-${bookId}`"
        v-model="newTitle"
        type="text"
        class="gr-input"
      />
    </div>
    <div class="grid gap-2">
      <span :id="`note-body-${bookId}`" class="text-[15px] font-semibold">
        Note
      </span>
      <div
        class="note-editor-container gr-editor"
        role="group"
        :aria-labelledby="`note-body-${bookId}`"
      >
        <QuillEditor
          v-model:content="newNote"
          :options="editorOptions"
          contentType="html"
        />
      </div>
    </div>
    <button
      type="button"
      class="gr-btn gr-btn-primary w-full"
      :disabled="isSubmitting"
      @click="handleCreateNote"
    >
      {{ isSubmitting ? 'Adding...' : 'Add note' }}
    </button>
  </div>
</template>

<style scoped>
.note-editor-container {
  position: relative;
}
</style>
