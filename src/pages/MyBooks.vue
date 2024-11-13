<script setup lang="ts">
import { useAuthStore } from '@/store/auth-store';

const authStore = useAuthStore();
</script>
<template>
  <div>
    <h1>This is the MyBooks page</h1>
    <p>{{ authStore.user.firstName }}</p>
  </div>
</template>
