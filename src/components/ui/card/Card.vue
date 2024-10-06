<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { useDarkModeStore } from '@/store/store';

const darkModeStore = useDarkModeStore();

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        props.class,
        {
          'bg-white text-black': !darkModeStore.darkMode, // Light mode classes
          'bg-gray-900 text-white': darkModeStore.darkMode, // Dark mode classes
        }
      )
    "
  >
    <slot />
  </div>
</template>
