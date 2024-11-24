<script setup lang="ts">
import StarRating from '@/components/partials/StarRating.vue';

defineProps<{
  modelValue: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const clearRating = () => {
  emit('update:modelValue', null);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <StarRating
      :model-value="modelValue ?? undefined"
      @update:model-value="(val: number) => emit('update:modelValue', val)"
    />
    <button
      v-if="modelValue !== null"
      @click="clearRating"
      class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      title="Clear rating"
    >
      <font-awesome-icon icon="fa-regular fa-circle-xmark" />
    </button>
  </div>
</template>
