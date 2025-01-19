<script setup lang="ts">
import {
  DialogRoot,
  type DialogRootEmits,
  type DialogRootProps,
  useForwardPropsEmits,
} from 'radix-vue';
import { watch } from 'vue';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

// Watch for dialog state changes to manage scroll lock
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.documentElement.style.setProperty('overflow', 'hidden');
      document.body.style.setProperty('overflow', 'hidden');
    } else {
      document.documentElement.style.setProperty('overflow', '');
      document.body.style.setProperty('overflow', '');
    }
  },
  { immediate: true }
);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
