<script setup lang="ts">
defineProps<{
  title: string;
  count?: string;
}>();
</script>

<template>
  <section>
    <div class="mb-[18px] flex items-baseline justify-between gap-4">
      <h2 class="font-heading text-[26px] font-medium leading-tight">
        {{ title }}
      </h2>
      <span v-if="count" class="shrink-0 text-sm text-gr-muted">
        {{ count }}
      </span>
    </div>
    <slot />
  </section>
</template>
