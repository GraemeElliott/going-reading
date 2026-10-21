<script setup lang="ts">
import { computed } from 'vue';

// Previous/Next with numbered pages (numbers hidden on mobile). Emits
// `navigate` only for a user's click, so the parent can scroll its list into
// view without reacting to resets made in code.
const page = defineModel<number>('page', { required: true });

const props = defineProps<{
  pageCount: number;
}>();

const emit = defineEmits<{
  (e: 'navigate', page: number): void;
}>();

// First, last, current and its neighbours, with '…' for the gaps
const pageItems = computed(() => {
  const total = props.pageCount;
  const shown = [...new Set([1, page.value - 1, page.value, page.value + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  shown.forEach((p, i) => {
    if (i > 0 && p - shown[i - 1] > 1) items.push('…');
    items.push(p);
  });
  return items;
});

function goToPage(target: number) {
  if (target < 1 || target > props.pageCount || target === page.value) return;
  page.value = target;
  emit('navigate', target);
}

const PAGE_BUTTON =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] border px-3 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gr-accent disabled:pointer-events-none disabled:opacity-45';
</script>

<template>
  <nav
    v-if="pageCount > 1"
    aria-label="Pagination"
    class="mt-6 flex flex-wrap items-center justify-between gap-3"
  >
    <span class="text-sm text-gr-muted">Page {{ page }} of {{ pageCount }}</span>
    <div class="flex items-center gap-1.5">
      <button
        type="button"
        :class="[PAGE_BUTTON, 'border-gr-line hover:bg-gr-surface-2']"
        :disabled="page === 1"
        @click="goToPage(page - 1)"
      >
        <font-awesome-icon icon="fa-solid fa-chevron-left" class="text-xs" />
        Previous
      </button>
      <template v-for="(item, i) in pageItems" :key="i">
        <span v-if="item === '…'" class="hidden px-1 text-gr-muted md:inline">…</span>
        <button
          v-else
          type="button"
          class="hidden md:inline-flex"
          :class="[
            PAGE_BUTTON,
            item === page
              ? 'border-gr-text bg-gr-text text-gr-bg'
              : 'border-gr-line hover:bg-gr-surface-2',
          ]"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="`Page ${item}`"
          @click="goToPage(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        :class="[PAGE_BUTTON, 'border-gr-line hover:bg-gr-surface-2']"
        :disabled="page === pageCount"
        @click="goToPage(page + 1)"
      >
        Next
        <font-awesome-icon icon="fa-solid fa-chevron-right" class="text-xs" />
      </button>
    </div>
  </nav>
</template>
