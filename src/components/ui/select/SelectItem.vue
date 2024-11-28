<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Check } from 'lucide-vue-next';
import {
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
  useForwardProps,
} from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';
import { useDarkModeStore } from '@/store/store';

const darkModeStore = useDarkModeStore();

const props = defineProps<
  SelectItemProps & {
    class?: HTMLAttributes['class'];
    isHome?: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, isHome: __, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectItem
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        {
          'text-black focus:text-black':
            isHome || (!darkModeStore.darkMode && !isHome),
          'text-white focus:text-white': darkModeStore.darkMode && !isHome,
          'focus:bg-gray-100': isHome || (!darkModeStore.darkMode && !isHome),
          'focus:bg-gray-800': darkModeStore.darkMode && !isHome,
        },
        props.class
      )
    "
  >
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
