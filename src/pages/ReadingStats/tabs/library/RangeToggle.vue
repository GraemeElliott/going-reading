<script setup lang="ts">
import type { ChartRange } from '@/utils/library-stats';

// Pill buttons for a chart's range: the last 12 months or all time
const range = defineModel<ChartRange>({ required: true });

const options: { value: ChartRange; label: string }[] = [
  { value: 'year', label: '12 months' },
  { value: 'all', label: 'All time' },
];
</script>

<template>
  <div class="flex gap-1" role="group" aria-label="Chart range">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="range === option.value"
      class="inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold transition-colors"
      :class="
        range === option.value
          ? 'bg-gr-accent-soft text-gr-accent'
          : 'text-gr-muted hover:bg-gr-surface-2 hover:text-gr-text'
      "
      @click="range = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
