<script setup lang="ts">
import { onMounted } from 'vue';
import PageSection from '@/components/layout/PageSection.vue';
import { useLibraryStore } from '@/store/library-store';
import { FORMAT_META } from '@/components/library/formatMeta';
import type { LibraryFormat } from '@/types/library';

const libraryStore = useLibraryStore();
const TILES: LibraryFormat[] = ['physical', 'digital'];

onMounted(async () => {
  try {
    await libraryStore.initialize();
  } catch (error) {
    console.error('Failed to load library:', error);
  }
});
</script>

<template>
  <PageSection
    title="Library"
    :count="`${libraryStore.counts.all} ${libraryStore.counts.all === 1 ? 'book' : 'books'} owned`"
  >
    <router-link
      to="/my-books/library"
      class="gr-card group flex flex-wrap items-center gap-x-8 gap-y-4 p-6 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
    >
      <div class="basis-full md:basis-auto">
        <p class="font-semibold">Books you own</p>
        <p
          class="mt-1 text-4xl font-bold leading-tight transition-colors duration-200 group-hover:text-gr-accent"
        >
          {{ libraryStore.counts.all }}
        </p>
        <p v-if="!libraryStore.counts.all" class="mt-1 text-sm text-gr-muted">
          Add the books you own
        </p>
      </div>

      <!-- A book owned in both formats counts in both tiles -->
      <div class="grid basis-full grid-cols-2 gap-3 md:ml-auto md:w-[420px] md:basis-auto">
        <div
          v-for="f in TILES"
          :key="f"
          class="flex items-center gap-3 rounded-xl bg-gr-surface-2 px-3.5 py-3"
        >
          <font-awesome-icon :icon="FORMAT_META[f].icon" class="text-gr-muted" />
          <div>
            <p class="text-xl font-bold leading-tight">{{ libraryStore.counts[f] }}</p>
            <p class="text-[13px] text-gr-muted">{{ FORMAT_META[f].label }}</p>
          </div>
        </div>
      </div>

      <span class="ml-auto inline-flex items-center gap-2 font-semibold text-gr-accent">
        Open library
        <font-awesome-icon
          icon="fa-solid fa-chevron-right"
          class="text-xs transition-transform duration-200 group-hover:translate-x-1"
        />
      </span>
    </router-link>
  </PageSection>
</template>
