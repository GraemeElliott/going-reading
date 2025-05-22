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

// Function to apply scroll lock
const applyScrollLock = () => {
  document.documentElement.style.setProperty('overflow', 'hidden');
  document.body.style.setProperty('overflow', 'hidden');
};

// Function to remove scroll lock
const removeScrollLock = () => {
  document.documentElement.style.setProperty('overflow', '');
  document.body.style.setProperty('overflow', '');
};

// Watch for sheet state changes to manage scroll lock
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
