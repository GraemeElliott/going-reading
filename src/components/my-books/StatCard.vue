<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { bookCount } from '@/utils/book-display';

// A linked count card for the My Books sections. The 'add' variant stands in
// for an empty count and links somewhere the user can start filling it.
const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw;
    label: string;
    count?: number;
    caption: string;
    variant?: 'stat' | 'add';
    /** Shown in place of the count on the 'add' variant, e.g. "No ebooks yet" */
    emptyText?: string;
    /** Font Awesome icon for the tile; use the `icon` slot for anything else */
    icon?: string;
  }>(),
  { count: 0, variant: 'stat', emptyText: '', icon: undefined }
);

const slots = useSlots();
const isAdd = computed(() => props.variant === 'add');
const hasIcon = computed(() => !!props.icon || !!slots.icon);

const accessibleName = computed(() =>
  isAdd.value
    ? `${props.label}: ${props.emptyText}. ${props.caption}`
    : `${props.label}: ${bookCount(props.count)}, ${props.caption}`
);
</script>

<template>
  <router-link
    :to="to"
    :aria-label="accessibleName"
    class="group flex min-h-11 items-center justify-between gap-4 rounded-2xl p-6 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gr-accent"
    :class="
      isAdd
        ? 'border-[1.5px] border-dashed border-gr-line text-gr-muted hover:border-gr-accent hover:text-gr-accent'
        : 'gr-card'
    "
  >
    <div class="flex min-w-0 items-center gap-4">
      <span
        v-if="hasIcon"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
        :class="isAdd ? 'bg-gr-surface-2 group-hover:text-gr-accent' : 'bg-gr-surface-2 text-gr-muted'"
        aria-hidden="true"
      >
        <slot name="icon">
          <font-awesome-icon :icon="icon!" />
        </slot>
      </span>
      <div class="min-w-0">
        <p
          class="font-semibold"
          :class="isAdd ? 'text-gr-text transition-colors duration-200 group-hover:text-gr-accent' : ''"
        >
          {{ label }}
        </p>
        <p v-if="isAdd" class="mt-1 text-[15px] font-semibold">{{ emptyText }}</p>
        <p
          v-else
          class="mt-1 text-4xl font-bold leading-tight tracking-[-0.02em] transition-colors duration-200 group-hover:text-gr-accent"
        >
          {{ count }}
        </p>
        <p class="mt-1 text-sm" :class="isAdd ? '' : 'text-gr-muted'">{{ caption }}</p>
      </div>
    </div>
    <font-awesome-icon
      :icon="isAdd ? 'fa-solid fa-plus' : 'fa-solid fa-angle-right'"
      class="shrink-0 transition duration-200"
      :class="
        isAdd
          ? 'group-hover:text-gr-accent'
          : 'text-gr-muted group-hover:translate-x-1 group-hover:text-gr-text'
      "
      aria-hidden="true"
    />
  </router-link>
</template>
