<script setup lang="ts">
import ThemeSwitch from '@/components/navbar/ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import SignOutButton from '@/components/authentication/SignOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from '@/components/search/SearchBar.vue';
import { ref, watch } from 'vue';

const authStore = useAuthStore();
const searchBarRef = ref();

const props = defineProps<{
  shouldClearSearch: boolean;
}>();

const emit = defineEmits<{
  (e: 'closeMenuIfOpen'): void;
  (e: 'handleSearchComplete'): void;
}>();

watch(
  () => props.shouldClearSearch,
  (newValue) => {
    if (newValue && searchBarRef.value) {
      searchBarRef.value.clearSearch();
    }
  }
);
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
        <SearchBar
          ref="searchBarRef"
          @search-complete="emit('handleSearchComplete')"
        />
      </div>
      <div class="flex justify-end items-center max-w-screen-xl space-x-5">
        <router-link
          v-if="authStore.user && authStore.user.username"
          :to="`/user/${authStore.user.username}/my-books`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-book" class="fa-xl" />
        </router-link>

        <font-awesome-icon
          v-if="authStore.user && authStore.user.username"
          icon="fa-solid fa-chart-line"
          class="fa-xl"
          @click="emit('closeMenuIfOpen')"
        />

        <router-link
          v-if="authStore.user && authStore.user.username"
          :to="`/user/${authStore.user.username}/account`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-user" class="fa-xl" />
        </router-link>

        <font-awesome-icon
          v-if="authStore.user && authStore.user.username"
          icon="fa-solid fa-bell"
          class="fa-xl"
          @click="emit('closeMenuIfOpen')"
        />

        <router-link
          v-if="authStore.user.isAdmin"
          :to="`/admin/dashboard`"
          @click="emit('closeMenuIfOpen')"
        >
          <font-awesome-icon icon="fa-solid fa-gear" class="fa-xl" />
        </router-link>
        <ThemeSwitch class="mr-1.5" />
        <SignOutButton
          v-if="authStore.user.username"
          @click="emit('closeMenuIfOpen')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
