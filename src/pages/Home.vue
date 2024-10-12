<script setup lang="ts">
import { useAuthStore } from '@/store/auth-store';
const authStore = useAuthStore();
</script>

<template>
  <div>
    <p>Home</p>

    <!-- Only display if user metadata is available -->
    <p
      v-if="authStore.userMetadata.firstName && authStore.userMetadata.lastName"
    >
      Welcome, {{ authStore.userMetadata.firstName }}
      {{ authStore.userMetadata.lastName }}
    </p>

    <!-- Show admin message only if the user is an admin -->
    <p v-if="authStore.userMetadata.isAdmin === true">You are an admin.</p>

    <!-- Use v-if to check if user is loaded before generating the links -->
    <router-link
      v-if="authStore.userMetadata?.username"
      :to="`/user/${authStore.userMetadata.username}/my-account`"
    >
      My Account
    </router-link>
    <router-link
      v-if="authStore.userMetadata?.username"
      :to="`/user/${authStore.userMetadata.username}/my-books`"
    >
      My Books
    </router-link>
  </div>
</template>
<style scoped></style>
