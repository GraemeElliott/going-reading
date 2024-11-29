<script setup lang="ts">
import { useDarkModeStore } from '@/store/store';
import { useRoute } from 'vue-router';
import Navbar from './components/navbar/Navbar.vue';
import Footer from '@/components/partials/Footer.vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from '@/store/auth-store';
import { onMounted, computed } from 'vue';

const authStore = useAuthStore();
const darkModeStore = useDarkModeStore();
const route = useRoute();

const isHome = computed(() => route.name === 'home');

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
    class="flex flex-col min-h-screen wrapper overflow-x-hidden"
  >
    <Navbar />
    <main class="relative flex-grow">
      <div
        v-if="!route.meta.fullWidth"
        class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36"
      >
        <router-view></router-view>
      </div>
      <div v-else>
        <router-view></router-view>
      </div>
      <Toaster />
    </main>
    <Footer :is-home="isHome" />
  </div>
</template>

<style>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
  width: 100vw;
  position: relative;
  left: 0;
  right: 0;
}
</style>
