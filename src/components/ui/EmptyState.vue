<script setup lang="ts">
import { computed } from 'vue';
import { useDarkModeStore } from '@/store/store';
import { Button } from '@/components/ui/button';

interface Props {
  icon: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const darkModeStore = useDarkModeStore();
const isDark = computed(() => darkModeStore.darkMode);

const padding = computed(() => ({
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
}[props.size]));

const iconSize = computed(() => ({
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
}[props.size]));
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center w-full',
      padding,
    ]"
  >
    <font-awesome-icon
      :icon="icon"
      :class="[iconSize, isDark ? 'text-gray-600' : 'text-gray-300']"
    />
    <p :class="['text-sm font-medium mt-4', isDark ? 'text-gray-200' : 'text-gray-700']">
      {{ title }}
    </p>
    <p
      v-if="description"
      :class="['text-sm mt-1 max-w-xs', isDark ? 'text-gray-400' : 'text-gray-500']"
    >
      {{ description }}
    </p>
    <Button
      v-if="ctaLabel && ctaAction"
      size="sm"
      class="mt-5"
      @click="ctaAction"
    >
      {{ ctaLabel }}
    </Button>
  </div>
</template>
