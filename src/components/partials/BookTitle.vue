<script setup lang="ts">
import { computed } from 'vue';
import { formatBookTitle } from '@/utils/book-display';

// Renders a book title, splitting "Main: Subtitle" onto two lines.
// `compact` shows just the main title, with the full title as a tooltip.
const props = defineProps<{
  title: string;
  compact?: boolean;
  /** Classes for the main title line (size, weight, clamping) */
  titleClass?: string;
}>();

const parts = computed(() => formatBookTitle(props.title));
</script>

<template>
  <span class="block min-w-0">
    <span
      class="block [text-wrap:balance]"
      :class="titleClass"
      :title="parts.subtitle && compact ? title : undefined"
      >{{ parts.main }}</span
    >
    <span
      v-if="parts.subtitle && !compact"
      class="mt-0.5 line-clamp-2 block text-sm font-medium text-gr-muted [text-wrap:balance]"
      >{{ parts.subtitle }}</span
    >
  </span>
</template>
