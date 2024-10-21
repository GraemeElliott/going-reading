<script setup lang="ts">
import { Separator } from '@/components/ui/separator';
import SidebarNav from '@/components/account/SidebarNav.vue';

defineProps<{
  sidebarNavItems: { title: string }[];
  selectedOption: string;
}>();
</script>

<template>
  <div class="md:hidden"></div>
  <div class="hidden space-y-6 pb-16 md:block">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">My Account</h2>
      <p class="text-muted-foreground">
        Manage your account settings and set e-mail preferences.
      </p>
    </div>
    <Separator class="my-6" />
    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside class="lg:w-1/5">
        <slot name="sidebar">
          <SidebarNav
            :items="sidebarNavItems"
            :selectedOption="selectedOption"
          />
        </slot>
      </aside>
      <div class="flex-1 lg:max-w-2xl">
        <div class="space-y-6">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
