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
        {
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white border border-white': darkModeStore.darkMode,
        },
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
