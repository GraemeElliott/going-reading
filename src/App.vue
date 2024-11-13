<script setup lang="ts">
import { onMounted } from 'vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from './store/auth-store';
import Container from './components/partials/Container.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initializeAuth();
});
</script>

<template>
  <div>
    <Container>
      <main class="relative">
        <router-view></router-view>
        <Toaster />
      </main>
    </Container>
  </div>
</template>

<style></style>
