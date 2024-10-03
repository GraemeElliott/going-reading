<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useDarkModeStore } from '@/store/store';
import ThemeSwitch from './ThemeSwitch.vue';
import Logo from '@/components/logo/Logo.vue';

const darkModeStore = useDarkModeStore();
const darkMode = ref(darkModeStore.darkMode); // No need for toRef unless reactivity is required for nested objects

const isMenuOpen = ref(false);
let scrollPosition = 0;
let scrollBarWidth = 0;

const calculateScrollBarWidth = () => {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);
  const inner = document.createElement('div');
  outer.appendChild(inner);
  scrollBarWidth = outer.offsetWidth - inner.offsetWidth;
  outer.remove();
};

const lockScroll = () => {
  scrollPosition = window.scrollY;
  document.body.style.cssText = `
    overflow: hidden;
    position: fixed;
    top: -${scrollPosition}px;
    width: 100%;
    padding-right: ${scrollBarWidth}px;
  `;
};

const unlockScroll = () => {
  document.body.style.cssText = '';
  window.scrollTo(0, scrollPosition);
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  isMenuOpen.value ? lockScroll() : unlockScroll();
};

onMounted(calculateScrollBarWidth);

onUnmounted(() => {
  if (isMenuOpen.value) unlockScroll();
});
</script>

<template>
  <nav>
    <!-- Mobile Navbar -->
    <div class="flex flex-row my-3 justify-center items-center md:hidden">
      <div class="flex items-center justify-between w-full max-w-screen-lg">
        <router-link to="/" @click="toggleMenu">
          <Logo link />
        </router-link>
        <div class="flex items-center">
          <ThemeSwitch class="mr-1.5" />
          <div class="w-8 flex justify-center items-center">
            <button @click="toggleMenu" link>
              <font-awesome-icon
                :icon="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"
                class="fa-lg"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Mobile Navbar (Dropdown) -->
    <div
      :class="{
        block: isMenuOpen,
        hidden: !isMenuOpen,
        'bg-white text-black': !darkMode,
        'bg-gray-900 text-white': darkMode,
        'inset-0 h-screen overflow-hidden': isMenuOpen,
      }"
      class="md:hidden flex flex-col items-center mt-10 z-50 transition-all"
      style="top: 0; left: 0"
    >
      <router-link
        to="/"
        class="block px-3 py-2 uppercase ubuntu-large"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Home</span>
      </router-link>
      <router-link
        to="/articles"
        class="block px-3 py-2 uppercase ubuntu-large"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Articles</span>
      </router-link>
      <router-link
        to="/contact"
        class="block px-3 py-2 uppercase ubuntu-large"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Contact</span>
      </router-link>
    </div>
    <!-- Desktop and Tablet Navbar -->
    <nav class="hidden md:block w-full max-w-screen-xl mx-auto">
      <div class="flex items-center">
        <div class="justify-start">
          <Logo class="object-contain w-full" />
        </div>
        <div class="flex-grow flex justify-center">
          <div class="space-x-10">
            <router-link to="/" class="uppercase" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">Home</span>
            </router-link>
            <router-link to="/articles" class="uppercase" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">Articles</span>
            </router-link>
            <router-link to="/contact" class="uppercase" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">Contact</span>
            </router-link>
          </div>
        </div>
        <div class="w-0 flex-shrink-0 flex justify-end">
          <ThemeSwitch />
        </div>
      </div>
    </nav>
  </nav>
</template>

<style scoped></style>
