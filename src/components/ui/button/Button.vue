<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { Primitive, type PrimitiveProps } from 'radix-vue';
import { type ButtonVariants, buttonVariants } from '.';
import { cn } from '@/lib/utils';
import { useDarkModeStore } from '@/store/store';

const darkModeStore = useDarkModeStore();

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="
      cn(buttonVariants({ variant, size }), props.class, {
        'bg-white hover:bg-white text-black': darkModeStore.darkMode, // Dark mode classes
        'bg-gray-900 hover:bg-gray-900 text-white': !darkModeStore.darkMode, // Light mode classes
      })
    "
  >
    <slot />
  </Primitive>
</template>
