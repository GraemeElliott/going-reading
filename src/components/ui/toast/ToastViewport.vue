<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { ToastViewport, type ToastViewportProps } from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps<
  ToastViewportProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ToastViewport
    v-bind="delegatedProps"
    :class="
      cn(
        'fixed top-0 z-[100] flex right-0 max-h-screen w-full flex-col-reverse p-4 bottom-0 max-w-[420px]',
        props.class
      )
    "
  />
</template>
