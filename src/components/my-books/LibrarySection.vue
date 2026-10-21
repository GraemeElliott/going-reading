<script setup lang="ts">
import { computed, onMounted } from 'vue';
import PageSection from '@/components/layout/PageSection.vue';
import StatCard from './StatCard.vue';
import LibraryIcon from '@/components/navbar/LibraryIcon.vue';
import { useLibraryStore } from '@/store/library-store';
import { FORMAT_META } from '@/components/library/formatMeta';
import { LIBRARY_FORMATS } from '@/types/library';
import { bookCount, percentLabel } from '@/utils/book-display';

const libraryStore = useLibraryStore();
const total = computed(() => libraryStore.counts.all);

const EMPTY_TEXT = {
  physical: { emptyText: 'No print books yet', caption: 'Add your first physical book' },
  digital: { emptyText: 'No ebooks yet', caption: 'Add your first digital book' },
};

// A book owned in both formats counts in both cards, so their shares can add
// up to more than 100%
const formatCards = computed(() =>
  LIBRARY_FORMATS.map((format) => {
    const count = libraryStore.counts[format];
    const empty = count === 0;
    return {
      format,
      label: FORMAT_META[format].label,
      icon: FORMAT_META[format].icon,
      count,
      variant: empty ? ('add' as const) : ('stat' as const),
      // The Library page opens its add dialog with this format preselected
      to: empty
        ? { name: 'library', query: { add: format } }
        : { name: 'library', query: { format } },
      emptyText: EMPTY_TEXT[format].emptyText,
      caption: empty
        ? EMPTY_TEXT[format].caption
        : percentLabel(count, total.value, 'of what you own'),
    };
  })
);

onMounted(async () => {
  try {
    await libraryStore.initialize();
  } catch (error) {
    console.error('Failed to load library:', error);
  }
});
</script>

<template>
  <PageSection title="Library" :count="`${bookCount(total)} owned`">
    <div
      class="grid grid-cols-1 gap-5 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]"
    >
      <StatCard
        v-if="!total"
        :to="{ name: 'library', query: { add: null } }"
        variant="add"
        label="Library"
        empty-text="No books in your library yet"
        caption="Add your first book"
      >
        <template #icon><LibraryIcon /></template>
      </StatCard>

      <template v-else>
        <StatCard
          :to="{ name: 'library' }"
          label="All owned"
          :count="total"
          caption="Browse your whole library"
        >
          <template #icon><LibraryIcon /></template>
        </StatCard>
        <StatCard
          v-for="card in formatCards"
          :key="card.format"
          :to="card.to"
          :variant="card.variant"
          :label="card.label"
          :count="card.count"
          :empty-text="card.emptyText"
          :caption="card.caption"
          :icon="card.icon"
        />
      </template>
    </div>
  </PageSection>
</template>
