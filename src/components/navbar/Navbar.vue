<script setup lang="ts">
import { ref } from 'vue';
import MobileNavMenu from './MobileNavbar.vue';
import DesktopNavMenu from './DesktopNavbar.vue';

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
  <nav class="lg-px-0 mb-4 lg:mb-8">
    <MobileNavMenu
      :is-menu-open="isMenuOpen"
      :is-search-visible="isSearchVisible"
      :should-clear-search="shouldClearSearch"
      @toggle-menu="toggleMenu"
      @close-menu-if-open="closeMenuIfOpen"
      @toggle-search="toggleSearch"
      @handle-search-complete="handleSearchComplete"
    />
    <DesktopNavMenu
      :should-clear-search="shouldClearSearch"
      @close-menu-if-open="closeMenuIfOpen"
      @handle-search-complete="handleSearchComplete"
    />
  </nav>
</template>
