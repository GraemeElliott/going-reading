<script setup lang="ts">
import StarRating from '@/components/partials/StarRating.vue';

defineProps<{
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <StarRating
      :model-value="modelValue"
      @update:model-value="(val: number) => emit('update:modelValue', val)"
    />
  </div>
</template>
