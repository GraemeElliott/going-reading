<script setup lang="ts">
import { computed } from 'vue';
import type { GenreBreakdown } from '@/utils/library-stats';
import { RATING_GENRE_COLORS } from '../../useRatingStats';
import StatsCard from './StatsCard.vue';

const props = defineProps<{
  genres: GenreBreakdown;
  /** Genre data is still being backfilled */
  loading?: boolean;
}>();

const max = computed(() => props.genres.rows[0]?.count ?? 1);
// Same colours as the Overview's "Top genres by books read"
const rows = computed(() => [
  ...props.genres.rows.map((r, i) => ({ label: r.genre, count: r.count, other: false, color: RATING_GENRE_COLORS[i] })),
  ...(props.genres.other ? [{ label: 'Other', count: props.genres.other, other: true, color: undefined }] : []),
]);
// Scaled to the largest genre; "Other" can be larger, so it's capped
const width = (count: number) => `${Math.min(100, Math.round((count / max.value) * 100))}%`;
</script>

<template>
  <StatsCard title="Top genres">
    <template #actions>
      <span v-if="!loading && genres.distinct" class="text-sm text-gr-muted">
        {{ genres.distinct }} {{ genres.distinct === 1 ? 'genre' : 'genres' }}
      </span>
    </template>

    <div v-if="loading" class="space-y-4 animate-pulse" aria-busy="true">
      <div v-for="i in 6" :key="i" class="h-3 rounded-full bg-gr-surface-2"></div>
    </div>

    <p v-else-if="!rows.length" class="text-sm text-gr-muted">No genre data yet</p>

    <ul v-else class="space-y-3">
      <li
        v-for="row in rows"
        :key="row.label"
        class="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-3 text-sm"
      >
        <span class="truncate" :title="row.label">{{ row.label }}</span>
        <span class="h-2.5 overflow-hidden rounded-full bg-gr-track">
          <span
            class="block h-full rounded-full"
            :class="row.other ? 'bg-gr-muted opacity-60' : ''"
            :style="{ width: width(row.count), background: row.color }"
          ></span>
        </span>
        <span class="text-right tabular-nums text-gr-muted">{{ row.count }}</span>
      </li>
    </ul>
  </StatsCard>
</template>
