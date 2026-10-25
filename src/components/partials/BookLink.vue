<script setup lang="ts">
import { computed } from 'vue';
import { isManualBookId } from '@/utils/book-display';

// Links to a book's page. Books added by hand without an ISBN have no page,
// so they render as a plain span; classes and other attributes pass through.
const props = defineProps<{
  isbn: string;
}>();

const linkable = computed(() => !isManualBookId(props.isbn));
</script>

<template>
  <router-link v-if="linkable" :to="`/book/${isbn}`"><slot /></router-link>
  <span v-else><slot /></span>
</template>
