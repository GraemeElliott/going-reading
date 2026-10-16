<script setup lang="ts">
// Standard page format: page background, centred container, page title and
// evenly spaced sections. Routes using it need `meta: { fullWidth: true }`.
defineProps<{
  title: string;
  subtitle?: string;
  count?: string;
  backTo?: string;
  backLabel?: string;
  /** Smaller title (40px, 30px on mobile), e.g. for search results */
  compactTitle?: boolean;
}>();
</script>

<template>
  <div
    class="flex-grow bg-gr-bg font-body text-base leading-[1.4] text-gr-text"
  >
    <div class="gr-container pb-[72px]" :class="backTo ? 'pt-5' : 'pt-10'">
      <router-link
        v-if="backTo"
        :to="backTo"
        class="mb-1 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-gr-muted transition-colors hover:text-gr-text"
      >
        <font-awesome-icon icon="fa-solid fa-chevron-left" class="text-xs" />
        {{ backLabel }}
      </router-link>
      <!-- Optional #actions slot sits at the bottom right of the title block -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0 flex-1 basis-full md:basis-auto">
          <div class="flex items-baseline justify-between gap-4">
            <h1
              class="font-heading font-medium leading-tight"
              :class="compactTitle ? 'text-[30px] md:text-[40px]' : 'text-[34px] md:text-[44px]'"
            >
              {{ title }}
            </h1>
            <span v-if="count" class="shrink-0 text-sm text-gr-muted">
              {{ count }}
            </span>
          </div>
          <p v-if="subtitle" class="mt-1 text-[15px] text-gr-muted">
            {{ subtitle }}
          </p>
        </div>
        <div v-if="$slots.actions" class="shrink-0">
          <slot name="actions" />
        </div>
      </div>
      <div class="mt-10 flex flex-col gap-14">
        <slot />
      </div>
    </div>
  </div>
</template>
