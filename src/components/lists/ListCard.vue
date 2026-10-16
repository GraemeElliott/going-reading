<script setup lang="ts">
import { computed } from 'vue';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';

interface Props {
  list: List;
  books?: UserBook[];
  readonly?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'open', listId: string): void;
  (e: 'edit', listId: string): void;
  (e: 'delete', listId: string): void;
}>();

const bookCount = computed(() => props.books?.length || 0);

const bookCountLabel = computed(
  () => `${bookCount.value} ${bookCount.value === 1 ? 'book' : 'books'}`
);

const ICON_BUTTON_CLASS =
  'h-11 w-11 flex items-center justify-center rounded-[10px] text-gr-muted transition-colors hover:bg-gr-surface-2 hover:text-gr-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent';
</script>

<template>
  <div class="gr-card relative flex min-h-[78px] items-center gap-4 p-4">
    <div class="min-w-0 flex-1">
      <!-- The ::after stretches the click target over the whole card -->
      <button
        type="button"
        class="block max-w-full text-left transition-colors hover:text-gr-accent focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-gr-accent"
        @click="emit('open', list.id)"
      >
        <span class="block truncate text-[17px] font-[650]">
          {{ list.name }}
        </span>
      </button>
      <p class="text-sm text-gr-muted">{{ bookCountLabel }}</p>
    </div>

    <div v-if="!readonly" class="relative z-10 flex shrink-0">
      <button
        type="button"
        title="Edit list"
        :aria-label="`Edit ${list.name}`"
        :class="ICON_BUTTON_CLASS"
        @click="emit('edit', list.id)"
      >
        <font-awesome-icon icon="fa-regular fa-pen-to-square" />
      </button>
      <button
        type="button"
        title="Delete list"
        :aria-label="`Delete ${list.name}`"
        :class="ICON_BUTTON_CLASS"
        @click="emit('delete', list.id)"
      >
        <font-awesome-icon icon="fa-regular fa-trash-can" />
      </button>
    </div>
  </div>
</template>
