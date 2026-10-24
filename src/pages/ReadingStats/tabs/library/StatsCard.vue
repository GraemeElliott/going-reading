<script setup lang="ts">
import { computed } from 'vue';
import { useDarkModeStore } from '@/store/store';

// The dashboard's chart card: bordered panel with the small uppercase title
// top left and an optional #actions slot top right
defineProps<{
  title?: string;
  subtitle?: string;
}>();

const darkModeStore = useDarkModeStore();
const isDark = computed(() => darkModeStore.darkMode);
</script>

<template>
  <section
    class="flex min-w-0 flex-col rounded-lg border p-4"
    :class="isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
  >
    <div v-if="title || $slots.actions" class="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div v-if="title">
        <h3 class="text-xs font-medium uppercase tracking-wider" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 text-sm text-gr-muted">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
