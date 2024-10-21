<script setup lang="ts">
import { Input } from '@/components/ui/input';
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <font-awesome-icon
        icon="fa-solid fa-magnifying-glass"
        class="absolute left-2 top-3 size-4 text-muted-foreground"
      />
      <Input type="search" placeholder="Search" class="pl-8 w-full" />
    </div>
  </div>
</template>
