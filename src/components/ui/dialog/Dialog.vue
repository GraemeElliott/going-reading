<script setup lang="ts">
import {
  DialogRoot,
  type DialogRootEmits,
  type DialogRootProps,
  useForwardPropsEmits,
} from 'radix-vue';
import { watch, onBeforeUnmount } from 'vue';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

let scrollPosition = 0;

// Function to apply scroll lock
const applyScrollLock = () => {
  // Store current scroll position
  scrollPosition = window.scrollY;

  // Lock scroll on html and body
  document.documentElement.style.setProperty('overflow', 'hidden');
  document.documentElement.style.setProperty('position', 'fixed');
  document.documentElement.style.setProperty('width', '100%');
  document.documentElement.style.setProperty('top', `-${scrollPosition}px`);

  document.body.style.setProperty('overflow', 'hidden');
  document.body.style.setProperty('position', 'fixed');
  document.body.style.setProperty('width', '100%');
  document.body.style.setProperty('top', `-${scrollPosition}px`);
};

// Function to remove scroll lock
const removeScrollLock = () => {
  // Remove scroll lock
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('position');
  document.documentElement.style.removeProperty('width');
  document.documentElement.style.removeProperty('top');

  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('width');
  document.body.style.removeProperty('top');

  // Restore scroll position
  window.scrollTo(0, scrollPosition);
};

// Watch for dialog state changes to manage scroll lock
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      applyScrollLock();
    } else {
      removeScrollLock();
    }
  },
  { immediate: true }
);

// Ensure scroll lock is removed when component is unmounted
onBeforeUnmount(() => {
  if (props.open) {
    removeScrollLock();
  }
});
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
