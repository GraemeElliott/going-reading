<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from './store/auth-store';
import Container from './components/partials/Container.vue';
import { useDarkModeStore } from './store/store';
import Navbar from './components/navbar/Navbar.vue';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/partials/Logo.vue';

const authStore = useAuthStore();
const darkModeStore = useDarkModeStore();
const isInitializing = ref(true);

// Initialize auth at the app level
onMounted(async () => {
  try {
    await authStore.initializeAuth();
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  } finally {
    isInitializing.value = false;
  }
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
    <!-- App Loading State -->
    <div
      v-if="isInitializing"
      class="fixed inset-0 flex items-center justify-center"
    >
      <div class="flex flex-col">
        <Logo class="mb-4" />
        <div class="space-y-4">
          <Skeleton class="h-12 w-48" />
          <Skeleton class="h-4 w-32" />
        </div>
      </div>
    </div>

    <!-- App Content -->
    <Container v-else>
      <Navbar />
      <main class="relative">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
        <Toaster />
      </main>
    </Container>
  </div>
</template>

<style></style>
