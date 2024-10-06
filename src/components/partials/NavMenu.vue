<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useDarkModeStore } from '@/store/store';
import ThemeSwitch from './ThemeSwitch.vue';
import Logo from '@/components/logo/Logo.vue';

const darkModeStore = useDarkModeStore();
const darkMode = toRef(darkModeStore, 'darkMode');

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : '';
};

const isMenuOpen = ref(false);

const closeMenuIfOpen = () => {
  if (isMenuOpen.value) {
    toggleMenu();
  }
};
</script>

<template>
  <nav class="mb-8">
    <!-- Mobile Navbar -->
    <div class="flex flex-row justify-center items-center md:hidden">
      <div class="flex items-center justify-between w-full max-w-screen-lg">
        <router-link to="/" @click="closeMenuIfOpen">
          <Logo />
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
      class="md:hidden flex flex-col items-center mt-10 z-50 transition-all dropdown-transition"
      style="top: 0; left: 0"
    >
      <router-link
        to="/"
        class="block px-3 py-2"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Home</span>
      </router-link>
      <router-link
        to="/my-books"
        class="block px-3 py-2"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">My Books</span>
      </router-link>
      <router-link
        to="/sign-in"
        class="block px-3 py-2"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Sign In</span>
      </router-link>
    </div>
    <!-- Desktop and Tablet Navbar -->
    <div class="hidden md:block w-full max-w-screen-xl mx-auto">
      <div class="flex items-center">
        <div class="justify-start">
          <Logo class="object-contain w-full" />
        </div>
        <div class="flex-grow flex justify-end">
          <div class="space-x-10">
            <router-link to="/" class="" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">Home</span>
            </router-link>
            <router-link to="/my-books" class="" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">My Books</span>
            </router-link>
            <router-link to="/sign-in" class="" v-slot="{ isActive }">
              <span :class="{ 'active-link': isActive }">Sign In</span>
            </router-link>
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.active-link {
  position: relative;
  color: rgb(0, 124, 137);
  font-weight: bold;
  text-decoration: none;
}

.active-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -3px;
  left: 0;
  background-color: rgb(0, 124, 137);
  visibility: hidden;
  transform: scaleX(0);
  transition: all 0.3s ease-in-out 0s;
}

.active-link:hover::after,
.active-link:focus::after {
  visibility: visible;
  transform: scaleX(1);
}

.dropdown-transition {
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
