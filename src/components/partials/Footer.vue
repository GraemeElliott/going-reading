<script setup lang="ts">
import Logo from './Logo.vue';
import { Separator } from '@/components/ui/separator';

defineProps<{
  isHome: boolean;
}>();

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer
    :class="[
      'mt-auto py-12',
      isHome ? 'bg-gr-hero text-gr-on-hero' : 'bg-gr-bg text-gr-text',
    ]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36">
      <div class="flex flex-col items-center">
        <div class="w-48">
          <Logo class="mb-4" />
        </div>
        <div
          class="flex flex-col md:flex-col md:space-y-3 justify-between items-center"
        >
          <p class="text-sm opacity-80">
            © {{ currentYear }} Going Reading. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
a {
  transition: all 0.2s ease;
}

a:hover {
  opacity: 0.9;
}
</style>
