<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import MobileNavMenu from './MobileNavbar.vue';
import DesktopNavMenu from './DesktopNavbar.vue';

const route = useRoute();
const isMenuOpen = ref(false);
const isSearchVisible = ref(false);
const shouldClearSearch = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : '';
};

const closeMenuIfOpen = () => {
  if (isMenuOpen.value) {
    toggleMenu();
  }
  // Trigger search clear when logo is clicked
  shouldClearSearch.value = true;
  // Reset the flag after a short delay
  setTimeout(() => {
    shouldClearSearch.value = false;
  }, 100);
};

const toggleSearch = () => {
  isSearchVisible.value = !isSearchVisible.value;
};

const handleSearchComplete = () => {
  isSearchVisible.value = false;
};
</script>

<template>
  <nav>
    <MobileNavMenu
      :is-menu-open="isMenuOpen"
      :is-search-visible="isSearchVisible"
      :should-clear-search="shouldClearSearch"
      :is-home="route.name === 'home'"
      @toggle-menu="toggleMenu"
      @close-menu-if-open="closeMenuIfOpen"
      @toggle-search="toggleSearch"
      @handle-search-complete="handleSearchComplete"
    />
    <DesktopNavMenu
      :is-home="route.name === 'home'"
      @close-menu-if-open="closeMenuIfOpen"
    />
  </nav>
</template>
