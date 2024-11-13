<script setup lang="ts">
import { onMounted } from 'vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from './store/auth-store';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initializeAuth();
});
</script>

<template>
  <div>
    <main class="relative">
      <router-view></router-view>
      <Toaster />
    </main>
  </div>
</template>

<style></style>
