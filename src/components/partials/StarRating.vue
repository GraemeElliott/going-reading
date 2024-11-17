<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue?: number;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const hoverRating = ref<number | null>(null);
const stars = ref([1, 2, 3, 4, 5]);

const displayRating = computed(() => {
  return hoverRating.value ?? props.modelValue ?? 0;
});

const handleMouseEnter = (star: number) => {
  if (!props.readonly) {
    hoverRating.value = star;
  }
};

const handleMouseLeave = () => {
  hoverRating.value = null;
};

const handleClick = (star: number) => {
  if (!props.readonly) {
    emit('update:modelValue', star);
  }
};

const getStarClass = (star: number) => {
  const isFilled = star <= displayRating.value;
  return {
    'text-yellow-400': isFilled,
    'text-gray-300 dark:text-gray-600': !isFilled,
    'cursor-pointer hover:scale-110 transition-transform': !props.readonly,
    'cursor-default': props.readonly,
  };
};
</script>

<template>
  <div class="flex gap-1" @mouseleave="handleMouseLeave">
    <font-awesome-icon
      v-for="star in stars"
      :key="star"
      icon="fa-solid fa-star"
      :class="getStarClass(star)"
      @mouseenter="handleMouseEnter(star)"
      @click="handleClick(star)"
    />
  </div>
</template>
