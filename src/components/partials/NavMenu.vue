<script setup lang="ts">
import { ref } from 'vue';

import ThemeSwitch from './ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import LogOutButton from './LogOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from './SearchBar.vue';
import RegisterButton from './RegisterButton.vue';
import SignInButton from './SignInButton.vue';

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
    <div class="flex flex-row justify-center items-center md:hidden w-full">
      <div
        class="flex items-center justify-between w-full max-w-screen-lg space-x-3"
      >
        <router-link to="/" @click="closeMenuIfOpen">
          <Logo class="hover:cursor-pointer" />
        </router-link>

        <div class="flex justify-center items-center space-x-5">
          <font-awesome-icon
            icon="fa-solid fa-magnifying-glass"
            class="fa-lg"
          />
          <ThemeSwitch />
          <button @click="toggleMenu" link>
            <font-awesome-icon
              :icon="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"
              class="fa-lg"
            />
          </button>
        </div>
      </div>
    </div>
    <!-- Mobile Navbar (Dropdown) -->
    <div
      :class="{
        block: isMenuOpen,
        hidden: !isMenuOpen,
        'inset-0 h-screen overflow-hidden': isMenuOpen,
      }"
      class="md:hidden flex flex-col mt-10 z-50 transition-all dropdown-transition space-y-5"
      style="top: 0; left: 0"
    >
      <div class="flex flex-row space-x-5 justify-center">
        <RegisterButton v-if="!authStore.user" @click="toggleMenu" class="" />
        <SignInButton v-if="!authStore.user" @click="toggleMenu" class="" />
      </div>
      <div class="flex flex-col items-center space-y-5">
        <router-link :to="`/user/${authStore.userMetadata.username}/account`">
          <img
            v-if="authStore.user"
            :src="authStore.userMetadata.avatarURL"
            class="w-10 h-10 rounded-full"
            @click="toggleMenu"
          />
        </router-link>
        <p>{{ authStore.userMetadata.username }}</p>

        <router-link
          v-if="authStore.user"
          :to="`/user/${authStore.userMetadata.username}/my-books`"
          class=""
          @click="toggleMenu"
          v-slot="{ isActive }"
        >
          <span :class="{ 'active-link': isActive }">My Books</span>
        </router-link>

        <font-awesome-icon
          v-if="authStore.userMetadata.isAdmin"
          icon="fa-solid fa-gear"
          class="fa-xl"
          @click="toggleMenu"
        />
      </div>
      <LogOutButton v-if="authStore.user" @click="toggleMenu" />
    </div>
    <!-- Desktop and Tablet Navbar -->
    <div class="hidden md:block flex-row w-full max-w-screen-xl mx-auto">
      <div
        class="flex items-center justify-between w-full max-w-screen-lg space-x-5"
      >
        <div class="flex flex-row flex-grow space-x-5">
          <router-link to="/" @click="closeMenuIfOpen">
            <Logo class="hover:cursor-pointer" />
          </router-link>
          <SearchBar />
        </div>
        <div class="flex justify-end items-center max-w-screen-xl space-x-5">
          <RegisterButton v-if="!authStore.user" />
          <SignInButton v-if="!authStore.user" />

          <router-link :to="`/user/${authStore.userMetadata.username}/account`">
            <img
              v-if="authStore.user"
              :src="authStore.userMetadata.avatarURL"
              class="w-10 h-10 rounded-full"
            />
          </router-link>
          <font-awesome-icon
            v-if="authStore.userMetadata.isAdmin"
            icon="fa-solid fa-gear"
            class="fa-xl"
          />

          <LogOutButton v-if="authStore.user" />
          <ThemeSwitch class="mr-1.5" />
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
