<script setup lang="ts">
import ListsSection from '@/components/my-books/ListsSection.vue';

defineProps<{
  isProfilePage?: boolean;
}>();
</script>

<template>
  <ListsSection :is-profile-page="isProfilePage" />
</template>
