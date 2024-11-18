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
  <nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
    <Button
      v-for="item in items"
      :key="item.title"
      variant="ghost"
      @click="handleClick(item.title)"
      :class="
        cn(
          'w-full text-left justify-start',
          item.title === selectedOption ? 'bg-gray-100 text-black' : ''
        )
      "
    >
      {{ item.title }}
    </Button>
  </nav>
</template>
