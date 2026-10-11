<script setup lang="ts">
import { computed } from 'vue';
import type { UserBook } from '@/types/book';
import type { List } from '@/types/list';
import { useDarkModeStore } from '@/store/store';

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

const darkModeStore = useDarkModeStore();

// One spine per book (up to six); colours and sizes taken from the design mock-up
const SPINES = [
  { color: 'rgb(65, 137, 216)', width: 17, height: 65 },
  { color: 'rgb(102, 152, 54)', width: 13, height: 50 },
  { color: 'rgb(212, 94, 57)', width: 18, height: 61 },
  { color: 'rgb(128, 119, 215)', width: 15, height: 54 },
  { color: 'rgb(208, 87, 125)', width: 17, height: 68 },
  { color: 'rgb(183, 119, 43)', width: 13, height: 47 },
];

const bookCount = computed(() => props.books?.length || 0);
const spines = computed(() => SPINES.slice(0, Math.min(bookCount.value, 6)));

const bookCountLabel = computed(
  () => `${bookCount.value} ${bookCount.value === 1 ? 'book' : 'books'}`
);

const iconButtonClass = computed(() =>
  darkModeStore.darkMode
    ? 'border-gray-600 text-white'
    : 'border-gray-300 text-black'
);
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="group relative w-full rounded-xl border p-5 text-left transition-all duration-200 hover:cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
    :class="{
      'bg-transparent text-black hover:border-black focus-visible:ring-black':
          !darkModeStore.darkMode,
      'bg-transparent text-white border-gray-700 hover:border-white focus-visible:ring-white':
          darkModeStore.darkMode,
    }"
    @click="emit('open', list.id)"
    @keydown.enter.self="emit('open', list.id)"
    @keydown.space.self.prevent="emit('open', list.id)"
  >
    <div v-if="!readonly" class="absolute top-4 right-4 flex gap-1.5">
      <button
        type="button"
        title="Edit list"
        :aria-label="`Edit ${list.name}`"
        class="h-7 w-7 flex items-center justify-center rounded-md border transition-colors hover:bg-goingTeal hover:border-goingTeal hover:text-white"
        :class="iconButtonClass"
        @click.stop="emit('edit', list.id)"
      >
        <font-awesome-icon icon="fa-regular fa-pen-to-square" class="text-xs" />
      </button>
      <button
        type="button"
        title="Delete list"
        :aria-label="`Delete ${list.name}`"
        class="h-7 w-7 flex items-center justify-center rounded-md border transition-colors hover:bg-goingRed hover:border-goingRed hover:text-white"
        :class="iconButtonClass"
        @click.stop="emit('delete', list.id)"
      >
        <font-awesome-icon icon="fa-regular fa-trash-can" class="text-xs" />
      </button>
    </div>

    <!-- Book spines -->
    <div class="mt-10 h-[68px] flex items-end gap-1">
      <template v-if="spines.length">
        <span
          v-for="(spine, i) in spines"
          :key="i"
          class="rounded-[3px] transition-transform duration-200 group-hover:-translate-y-1"
          :style="{
            backgroundColor: spine.color,
            width: `${spine.width}px`,
            height: `${spine.height}px`,
            transitionDelay: `${i * 30}ms`,
          }"
        ></span>
      </template>
      <template v-else>
        <span
          v-for="n in 3"
          :key="n"
          class="w-4 h-12 rounded-[3px] border-2 border-dashed border-gray-500"
        ></span>
      </template>
    </div>

    <p class="mt-5 text-lg font-semibold line-clamp-1">{{ list.name }}</p>
    <span class="text-sm text-gray-500">{{ bookCountLabel }}</span>
  </div>
</template>
