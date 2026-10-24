<script setup lang="ts">
import { computed } from 'vue';
import type { UnreadBreakdown } from '@/utils/library-stats';
import StatsCard from './StatsCard.vue';

const props = defineProps<{
  unread: UnreadBreakdown;
}>();

// Where the unread books are. Did not finish is left out: those were read in part.
const rows = computed(() => [
  { label: 'On Want to read', count: props.unread.wantToRead, swatch: 'bg-gr-status-want' },
  { label: 'Currently reading', count: props.unread.currentlyReading, swatch: 'bg-gr-status-reading' },
  { label: 'Not on a shelf', count: props.unread.notOnShelf, swatch: 'bg-gr-status-none' },
]);

// Read, then the unread statuses in table order. Did not finish books count
// as unread but aren't broken down, so they're the neutral remainder.
const segments = computed(() => {
  const listed = rows.value.reduce((sum, row) => sum + row.count, 0);
  return [
    { label: 'Read', count: props.unread.read, swatch: 'bg-gr-status-read' },
    ...rows.value,
    { label: 'Did not finish', count: props.unread.unread - listed, swatch: 'bg-gr-track' },
  ].filter((segment) => segment.count > 0);
});

const barLabel = computed(
  () =>
    `${props.unread.owned} owned books: ` +
    segments.value.map((s) => `${s.label} ${s.count}`).join(', ')
);
</script>

<template>
  <StatsCard title="Owned but unread">
    <p v-if="!unread.owned" class="text-sm text-gr-muted">Not enough data yet</p>

    <div v-else class="flex flex-col gap-4">
      <p>
        <span class="text-[36px] font-bold leading-none tracking-[-0.02em]">{{ unread.unread.toLocaleString() }}</span>
        <span class="ml-1.5 text-gr-muted">
          of {{ unread.owned.toLocaleString() }} {{ unread.owned === 1 ? 'book' : 'books' }} you own
          {{ unread.unread === 1 ? "hasn't" : "haven't" }} been read yet
        </span>
      </p>

      <div>
        <div role="img" :aria-label="barLabel" class="flex h-5 gap-0.5">
          <div
            v-for="segment in segments"
            :key="segment.label"
            class="h-full min-w-[6px] first:rounded-l-[4px] last:rounded-r-[4px]"
            :class="segment.swatch"
            :style="{ flex: `${segment.count} 1 0` }"
          ></div>
        </div>
      </div>

      <ul class="text-sm">
        <li
          v-for="row in rows"
          :key="row.label"
          class="flex h-10 items-center gap-3 border-t border-gr-line"
          :class="{ 'text-gr-muted': !row.count }"
        >
          <span class="h-3 w-3 shrink-0 rounded-[3px]" :class="[row.swatch, { 'opacity-40': !row.count }]" aria-hidden="true"></span>
          <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
          <span class="font-bold tabular-nums">{{ row.count.toLocaleString() }}</span>
        </li>
      </ul>
    </div>
  </StatsCard>
</template>
