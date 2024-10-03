<script setup lang="ts">
import { ref } from 'vue';
import QuoteBubble from '@/components/home/QuoteBubble.vue'

const isLoading = ref(true);
</script>

<template>
  <div v-if="isLoading"></div>
  <div class="">
    <h1>Home</h1>
    <QuoteBubble />
  </div>
</template>

<style scoped></style>
