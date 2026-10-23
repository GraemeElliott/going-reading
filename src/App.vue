<script setup lang="ts">
import { useDarkModeStore } from './store/store';
import { useRoute } from 'vue-router';
import Navbar from './components/navbar/Navbar.vue';
import Footer from './components/partials/Footer.vue';
import Toaster from './components/ui/toast/Toaster.vue';
import { useAuthStore } from './store/auth-store';
import { useUserBooksStore } from './store/user-books-store';
import { useLibraryStore } from './store/library-store';
import { useListsStore } from './store/lists-store';
import { backfillCovers } from './services/coverBackfillService';
import { onMounted, computed, watch } from 'vue';

const authStore = useAuthStore();
const darkModeStore = useDarkModeStore();
const userBooksStore = useUserBooksStore();
const libraryStore = useLibraryStore();
const listsStore = useListsStore();
const route = useRoute();

// Swap covers saved from ISBNdb for current ones, in the background after
// sign-in, then reload anything already on screen
watch(
  () => authStore.user?.id,
  async (userId) => {
    if (!userId) return;
    try {
      const { updated } = await backfillCovers(userId);
      if (!updated) return;

      if (userBooksStore.initialized) await userBooksStore.fetchUserBooks();
      if (libraryStore.initialized) await libraryStore.fetchEntries();
      if (listsStore.lists.length) await listsStore.fetchUserListsAndBooks();
    } catch (error) {
      console.error('Cover backfill failed:', error);
    }
  },
  { immediate: true }
);

// Apply the saved theme to <html> so the theme tokens match the toggle on load
darkModeStore.initializeDarkMode();

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
    <main class="relative flex flex-col flex-grow">
      <div
        v-if="!route.meta.fullWidth"
        class="w-full max-w-7xl mx-auto px-6 lg:px-26 xl:px-36"
      >
        <router-view></router-view>
      </div>
      <div v-else class="flex flex-col flex-grow">
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
