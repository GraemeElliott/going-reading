<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';

const route = useRoute();
const username = route.params.username;
const authStore = useAuthStore();
</script>

<template>
  <!-- Display the username only if the user is authenticated -->
  <p v-if="authStore.user && authStore.userMetadata.username === username">
    Welcome, {{ username }} (This is your profile)
  </p>
  <p v-else-if="authStore.user">Viewing profile of {{ username }}</p>
</template>

<style scoped></style>
