<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UnreadBreakdown } from '@/utils/library-stats';
import { formatPercent } from '@/utils/book-display';
import StatsCard from './StatsCard.vue';

const props = defineProps<{
  unread: UnreadBreakdown;
}>();

// Where the unread books are
const rows = computed(() => [
  { label: 'On Want to read', count: props.unread.wantToRead, swatch: 'bg-gr-status-want' },
  { label: 'Currently reading', count: props.unread.currentlyReading, swatch: 'bg-gr-status-reading' },
  { label: 'Did not finish', count: props.unread.didNotFinish, swatch: 'bg-gr-status-dnf' },
  { label: 'Not on a shelf', count: props.unread.notOnShelf, swatch: 'bg-gr-status-none' },
]);

// The unread books by status, in table order
const segments = computed(() => rows.value.filter((row) => row.count > 0));

// Hovering or focusing a segment or row highlights that status, as on the
// "Library by shelf status" card
const active = ref<string | null>(null);
const dimmed = (label: string) => active.value !== null && active.value !== label;

const readout = computed(() => {
  const segment = segments.value.find((s) => s.label === active.value);
  if (segment) {
    return `${segment.label} · ${segment.count} (${formatPercent(segment.count, props.unread.owned)})`;
  }
  return `${formatPercent(props.unread.unread, props.unread.owned)} of your library unread`;
});

const barLabel = computed(
  () =>
    `${props.unread.unread} unread owned books: ` +
    segments.value.map((s) => `${s.label} ${s.count}`).join(', ')
);
</script>

<template>
  <StatsCard title="Owned but unread">
    <template #actions>
      <p v-if="unread.owned" aria-live="polite" class="text-sm text-gr-muted">{{ readout }}</p>
    </template>

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
            class="h-full min-w-[6px] transition-opacity duration-150 first:rounded-l-[4px] last:rounded-r-[4px]"
            :class="[segment.swatch, { 'opacity-[0.35]': dimmed(segment.label) }]"
            :style="{ flex: `${segment.count} 1 0` }"
            @mouseenter="active = segment.label"
            @mouseleave="active = null"
          ></div>
        </div>
      </div>

      <ul class="text-sm">
        <li
          v-for="row in rows"
          :key="row.label"
          tabindex="0"
          class="flex h-10 items-center gap-3 rounded-sm border-t border-gr-line px-2 outline-none transition-[opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gr-accent"
          :class="{
            'bg-gr-surface-2': active === row.label,
            'opacity-[0.35]': dimmed(row.label),
            'text-gr-muted': !row.count,
          }"
          @mouseenter="active = row.label"
          @mouseleave="active = null"
          @focus="active = row.label"
          @blur="active = null"
        >
          <span class="h-3 w-3 shrink-0 rounded-[3px]" :class="[row.swatch, { 'opacity-40': !row.count }]" aria-hidden="true"></span>
          <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
          <span class="font-bold tabular-nums">{{ row.count.toLocaleString() }}</span>
        </li>
      </ul>
    </div>
  </StatsCard>
</template>
