<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

defineProps<{
  items: { title: string }[];
  selectedOption: string;
}>();

const emit = defineEmits(['optionSelected']);

const handleClick = (title: string) => {
  emit('optionSelected', title);
};
</script>

<template>
  <nav
    class="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1"
  >
    <Button
      v-for="item in items"
      :key="item.title"
      variant="ghost"
      @click="handleClick(item.title)"
      :class="
        cn(
          'justify-start text-left',
          item.title === selectedOption ? 'bg-gray-100 text-black' : ''
        )
      "
    >
      {{ item.title }}
    </Button>
  </nav>
</template>
