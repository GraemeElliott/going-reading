<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useDarkModeStore } from '@/store/store';
import ThemeSwitch from './ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import LogOutButton from './LogOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from './SearchBar.vue';
import RegisterButton from './RegisterButton.vue';
import SignInButton from './SignInButton.vue';

const darkModeStore = useDarkModeStore();
const darkMode = toRef(darkModeStore, 'darkMode');

const authStore = useAuthStore();

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
          <router-link to="/">
            <Logo class="hover:cursor-pointer" />
          </router-link>
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
      <div class="flex flex-row space-x-3">
        <RegisterButton v-if="!authStore.user" @click="toggleMenu" class="" />
        <SignInButton v-if="!authStore.user" @click="toggleMenu" class="" />
      </div>

      <router-link
        v-if="authStore.user"
        :to="`/user/${authStore.userMetadata.username}/my-books`"
        class="block px-3 py-2"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">My Books</span>
      </router-link>

      <router-link
        v-if="authStore.user"
        :to="`/user/${authStore.userMetadata.username}/account`"
        class="block px-3 py-2"
        @click="toggleMenu"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Account</span>
      </router-link>

      <router-link
        v-if="authStore.userMetadata.isAdmin"
        to="/admin"
        class="block px-3 py-2"
        v-slot="{ isActive }"
      >
        <span :class="{ 'active-link': isActive }">Admin Portal</span>
      </router-link>
    </div>
    <!-- Desktop and Tablet Navbar -->
    <div class="hidden md:block w-full max-w-screen-xl mx-auto">
      <div class="flex items-center">
        <div class="justify-start">
          <router-link to="/">
            <Logo class="object-contain w-full hover:cursor-pointer" />
          </router-link>
        </div>
        <SearchBar class="ml-5" />

        <div class="flex-grow flex justify-end items-center space-x-5">
          <RegisterButton v-if="!authStore.user" />
          <SignInButton v-if="!authStore.user" />

          <router-link
            v-if="authStore.user"
            :to="`/user/${authStore.userMetadata.username}/my-books`"
            class="flex items-center space-x-3"
            v-slot="{ isActive }"
          >
            <span :class="{ 'active-link': isActive }">My Books</span>
            <router-link
              :to="`/user/${authStore.userMetadata.username}/account`"
            >
              <img
                v-if="authStore.user"
                :src="authStore.userMetadata.avatarURL"
                class="w-10 h-10 rounded-full"
              />
            </router-link>
          </router-link>
          <router-link
            v-if="authStore.userMetadata.isAdmin"
            to="/admin"
            class=""
            v-slot="{ isActive }"
          >
            <span :class="{ 'active-link': isActive }">Admin Portal</span>
          </router-link>

          <LogOutButton v-if="authStore.user" />
          <ThemeSwitch />
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
