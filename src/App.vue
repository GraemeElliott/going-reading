<script setup lang="ts">
import { useDarkModeStore } from '@/store/store';
import NavMenu from '@/components/partials/NavMenu.vue';
import Container from '@/components/partials/Container.vue';
import Footer from '@/components/partials/Footer.vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useAuthStore } from '@/store/auth-store';
import { onMounted } from 'vue';

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
    class="flex flex-col min-h-screen, wrapper"
  >
    <Container>
      <NavMenu />
      <main>
        <router-view></router-view>
        <Toaster />
      </main>
    </Container>
    <Footer />
  </div>
</template>

<style>
.wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease, color 0.3s ease;
}

main {
  flex-grow: 1;
}
</style>
