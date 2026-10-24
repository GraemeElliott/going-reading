<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatPercent } from '@/utils/book-display';

export type LibraryStatusKey =
  | 'read'
  | 'currently-reading'
  | 'want-to-read'
  | 'did-not-finish'
  | 'none';

// Library books by shelf status: a 100% stacked bar plus a breakdown table.
// Hovering or focusing a segment or row highlights that status.
const props = defineProps<{
  counts: Record<LibraryStatusKey, number>;
}>();

const STATUSES: { key: LibraryStatusKey; label: string; swatchClass: string }[] = [
  { key: 'want-to-read', label: 'Want to read', swatchClass: 'bg-gr-status-want' },
  { key: 'currently-reading', label: 'Currently reading', swatchClass: 'bg-gr-status-reading' },
  { key: 'read', label: 'Read', swatchClass: 'bg-gr-status-read' },
  { key: 'did-not-finish', label: 'Did not finish', swatchClass: 'bg-gr-status-dnf' },
  { key: 'none', label: 'Not on a shelf', swatchClass: 'bg-gr-status-none' },
];

const total = computed(() => STATUSES.reduce((sum, s) => sum + props.counts[s.key], 0));

const rows = computed(() =>
  STATUSES.map((s) => ({
    ...s,
    count: props.counts[s.key],
    percent: formatPercent(props.counts[s.key], total.value),
  }))
);
const segments = computed(() => rows.value.filter((r) => r.count > 0));

const active = ref<LibraryStatusKey | null>(null);
const dimmed = (key: LibraryStatusKey) => active.value !== null && active.value !== key;

const readout = computed(() => {
  const row = rows.value.find((r) => r.key === active.value);
  if (row) return `${row.label} · ${row.count} (${row.percent})`;
  return `${formatPercent(props.counts.read, total.value)} of your library read`;
});

const barLabel = computed(() =>
  `Library by shelf status: ${rows.value.map((r) => `${r.label} ${r.count}`).join(', ')}`
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Title, total and readout -->
    <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div>
        <h3 class="text-xs font-medium uppercase tracking-wider text-gr-muted">
          Library by shelf status
        </h3>
        <p class="mt-1.5">
          <span class="text-[36px] font-bold leading-none tracking-[-0.02em]">{{ total.toLocaleString() }}</span>
          <span class="ml-1.5 text-gr-muted">{{ total === 1 ? 'book' : 'books' }}</span>
        </p>
      </div>
      <p v-if="total" aria-live="polite" class="text-sm text-gr-muted">{{ readout }}</p>
    </div>

    <p v-if="!total" class="text-sm text-gr-muted">No books in your library yet</p>

    <template v-else>
      <!-- 100% stacked bar. Its segments are presentational inside role="img",
           so keyboard users highlight a status through the table rows below. -->
      <div role="img" :aria-label="barLabel" class="flex h-5 gap-0.5">
        <div
          v-for="segment in segments"
          :key="segment.key"
          class="h-full min-w-[6px] transition-opacity duration-150 first:rounded-l-[4px] last:rounded-r-[4px]"
          :class="[segment.swatchClass, { 'opacity-[0.35]': dimmed(segment.key) }]"
          :style="{ flex: `${segment.count} 1 0` }"
          @mouseenter="active = segment.key"
          @mouseleave="active = null"
        ></div>
      </div>

      <!-- Breakdown table -->
      <ul class="text-sm">
        <li
          v-for="row in rows"
          :key="row.key"
          tabindex="0"
          class="flex h-10 items-center gap-3 rounded-sm border-t border-gr-line px-2 outline-none transition-[opacity,background-color] duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gr-accent"
          :class="{
            'bg-gr-surface-2': active === row.key,
            'opacity-[0.35]': dimmed(row.key),
            'text-gr-muted': row.count === 0,
          }"
          @mouseenter="active = row.key"
          @mouseleave="active = null"
          @focus="active = row.key"
          @blur="active = null"
        >
          <span
            class="h-3 w-3 shrink-0 rounded-[3px]"
            :class="[row.swatchClass, { 'opacity-40': row.count === 0 }]"
            aria-hidden="true"
          ></span>
          <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
          <span class="text-right font-bold tabular-nums">{{ row.count.toLocaleString() }}</span>
          <span class="min-w-[44px] text-right tabular-nums text-gr-muted">{{ row.percent }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
