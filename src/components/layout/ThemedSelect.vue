<script setup lang="ts" generic="T extends string">
// Themed dropdown for filter bars. Used instead of a native <select> because
// the browser's option list (and its blue hover) can't be styled.
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue';

defineProps<{
  /** `count` is shown beside the option in the list, but not on the trigger */
  options: { value: T; label: string; count?: number }[];
  /** Accessible name for the trigger */
  label: string;
}>();

// Radix Select doesn't allow '' as an option value, so use a real value for "all"
const model = defineModel<T>({ required: true });
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      :aria-label="label"
      class="gr-input flex min-w-0 items-center justify-between gap-3 bg-gr-surface px-3.5 text-left"
    >
      <span class="truncate"><SelectValue /></span>
      <font-awesome-icon
        icon="fa-solid fa-chevron-down"
        class="shrink-0 text-xs text-gr-muted"
      />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        :collision-padding="16"
        class="gr-panel z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] p-1.5"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="flex h-11 cursor-pointer select-none items-center gap-2 rounded-lg px-3 outline-none data-[highlighted]:bg-gr-accent-soft data-[state=checked]:font-[650] data-[highlighted]:text-gr-accent"
          >
            <span class="flex w-4 shrink-0 justify-center">
              <SelectItemIndicator>
                <font-awesome-icon icon="fa-solid fa-check" class="text-sm" />
              </SelectItemIndicator>
            </span>
            <SelectItemText>{{ option.label }}</SelectItemText>
            <span
              v-if="option.count !== undefined"
              class="ml-auto pl-4 text-sm font-normal text-gr-muted"
            >
              {{ option.count }}
            </span>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
