<script setup lang="ts">
defineProps<{
  title: string;
  count?: string;
}>();
</script>

<template>
  <section>
    <!-- With an #actions slot the count sits beside the title and the actions
         go on the right, wrapping below on narrow screens -->
    <div class="mb-[18px] flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div
        class="flex min-w-0 items-baseline"
        :class="$slots.actions ? 'flex-wrap gap-x-3 gap-y-1' : 'flex-1 justify-between gap-4'"
      >
        <h2 class="font-heading text-[26px] font-medium leading-tight">
          {{ title }}
        </h2>
        <span v-if="count" class="shrink-0 text-sm text-gr-muted">
          {{ count }}
        </span>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
