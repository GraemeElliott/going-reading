<script setup lang="ts">
import { useAuthStore } from '@/store/auth-store';
const authStore = useAuthStore();
</script>

<template>
  <div>
    <p>Home</p>
    <p>
      Welcome, {{ authStore.userMetadata.firstName }}
      {{ authStore.userMetadata.lastName }}
    </p>
    <p v-if="authStore.userMetadata.isAdmin === true">You are an admin.</p>
  </div>
</template>

<style scoped></style>
