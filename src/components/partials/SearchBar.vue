<script setup lang="ts">
import { Input } from '@/components/ui/input';
</script>

<template>
  <div>
    <div class="relative">
      <font-awesome-icon
        icon="fa-solid fa-magnifying-glass"
        class="absolute left-2 top-2.5 size-4 text-muted-foreground"
      />
      <Input
        type="search"
        placeholder="Search..."
        class="pl-8 md:w-[250px] lg:w-[400px]"
      />
    </div>
  </div>
</template>
