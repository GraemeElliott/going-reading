<script setup lang="ts">
import { onMounted } from 'vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from './store/auth-store';
import Container from './components/partials/Container.vue';
import { useDarkModeStore } from '@/store/store';
import Navbar from '@/components/navbar/Navbar.vue';

const authStore = useAuthStore();
const darkModeStore = useDarkModeStore();

onMounted(() => {
  authStore.initializeAuth();
});
</script>

<template>
  <div
    :class="{
      'bg-white text-black': !darkModeStore.darkMode,
      'bg-gray-900 text-white': darkModeStore.darkMode,
    }"
    class="flex flex-col min-h-screen overflow-x-hidden w-screen relative left-0 right-0 transition-colors duration-300"
  >
    <Container>
      <Navbar />
      <main class="relative">
        <router-view></router-view>
        <Toaster />
      </main>
    </Container>
  </div>
</template>

<style></style>
