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
      cn(
        buttonVariants({ variant, size }),
        darkModeStore.darkMode && variant === 'outline'
          ? 'bg-gray-900 text-white'
          : '',
        darkModeStore.darkMode && variant === undefined
          ? 'bg-white text-black'
          : '',
        props.class
      )
    "
  >
    <slot />
  </Primitive>
</template>
