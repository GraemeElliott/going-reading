<script setup lang="ts">
import { Separator } from '@/components/ui/separator';
import { useListsStore } from '@/store/lists-store';
import { onMounted } from 'vue';

const listsStore = useListsStore();

onMounted(async () => {
  await listsStore.initialize();
});
</script>
<template>
  <div class="w-full py-4 mb-10">
    <div class="flex flex-col gap-1">
      <h3 class="text-lg font-medium">Lists</h3>
      <p class="text-sm text-muted-foreground">
        {{ listsStore.lists.length }} lists
      </p>
    </div>
    <Separator class="my-6" />
    <div v-for="list in listsStore.lists">
      <p>{{ list.name }}</p>
    </div>
  </div>
</template>
