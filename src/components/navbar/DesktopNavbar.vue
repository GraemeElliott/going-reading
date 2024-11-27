<script setup lang="ts">
import ThemeSwitch from '@/components/navbar/ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import SignOutButton from '@/components/authentication/SignOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from '@/components/search/SearchBar.vue';

const authStore = useAuthStore();

const emit = defineEmits<{
  (e: 'closeMenuIfOpen'): void;
}>();
</script>

<template>
  <div class="hidden lg:block flex-row w-full mx-auto">
    <div
      class="flex items-center justify-between w-full max-w-screen-lg space-x-5"
    >
      <div class="flex flex-row flex-grow space-x-5">
        <router-link to="/" @click="emit('closeMenuIfOpen')">
          <Logo class="hover:cursor-pointer" />
        </router-link>
        <SearchBar />
      </div>
      <div class="flex justify-end items-center max-w-screen-xl space-x-5">
        <router-link
          v-if="authStore.userMetadata && authStore.userMetadata.username"
          :to="`/user/${authStore.userMetadata.username}/my-books`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-book" class="fa-xl" />
        </router-link>

        <router-link
          v-if="authStore.userMetadata && authStore.userMetadata.username"
          :to="`/user/${authStore.userMetadata.username}/account`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-user" class="fa-xl" />
        </router-link>

        <router-link
          v-if="authStore.userMetadata.isAdmin"
          :to="`/admin/dashboard`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-gear" class="fa-xl" />
        </router-link>
        <ThemeSwitch class="mr-1.5" />
        <SignOutButton
          v-if="authStore.userMetadata.username"
          @click="emit('closeMenuIfOpen')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
