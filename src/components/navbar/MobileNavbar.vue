<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDarkModeStore } from '@/store/store';
import ThemeSwitch from '@/components/navbar/ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import SignOutButton from '@/components/authentication/SignOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from '@/components/search/SearchBar.vue';
import Separator from '@/components/ui/separator/Separator.vue';
import { Skeleton } from '@/components/ui/skeleton';

const darkModeStore = useDarkModeStore();
const authStore = useAuthStore();
const searchBarRef = ref();
const hasComponentLoaded = ref(false);

const props = defineProps<{
  isMenuOpen: boolean;
  isSearchVisible: boolean;
  shouldClearSearch: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleMenu'): void;
  (e: 'closeMenuIfOpen'): void;
  (e: 'toggleSearch'): void;
  (e: 'handleSearchComplete'): void;
}>();

watch(
  () => props.isMenuOpen,
  (newValue) => {
    if (newValue) {
      hasComponentLoaded.value = false;
    }
  }
);

watch(
  () => props.shouldClearSearch,
  (newValue) => {
    if (newValue && searchBarRef.value) {
      searchBarRef.value.clearSearch();
    }
  }
);

const handleNavClick = () => {
  emit('toggleMenu');
  emit('closeMenuIfOpen');
};
</script>

<template>
  <div class="lg:hidden">
    <!-- Mobile Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-inherit">
      <div
        class="flex items-center justify-between px-5 py-5"
        :class="{
          'bg-white text-black': !darkModeStore.darkMode,
          'bg-gray-900 text-white': darkModeStore.darkMode,
        }"
      >
        <router-link
          to="/"
          @click="
            () => {
              emit('closeMenuIfOpen');
              emit('handleSearchComplete');
            }
          "
        >
          <Logo class="hover:cursor-pointer" />
        </router-link>
        <div class="flex justify-center items-center space-x-5">
          <font-awesome-icon
            v-if="!isMenuOpen"
            icon="fa-solid fa-magnifying-glass"
            class="fa-lg hover:cursor-pointer"
            @click="emit('toggleSearch')"
          />
          <ThemeSwitch />
          <button
            v-if="authStore.userMetadata.username"
            @click="emit('toggleMenu')"
            link
          >
            <font-awesome-icon
              :icon="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"
              class="fa-xl w-6"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Add spacing to account for fixed header -->
    <div class="h-20"></div>

    <!-- Mobile Navbar Overlay -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 z-40 transition-all duration-300 px-5 w-full overflow-hidden"
      :class="{
        'bg-white text-black': !darkModeStore.darkMode,
        'bg-gray-900 text-white': darkModeStore.darkMode,
      }"
    >
      <div class="mt-20 h-full flex flex-col">
        <!-- User Profile Section -->
        <div v-if="authStore.userMetadata.username" class="flex flex-row my-5">
          <!-- Skeleton -->
          <div v-show="!hasComponentLoaded" class="flex items-center space-x-4">
            <Skeleton class="h-12 w-12 rounded-full" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-[250px]" />
              <Skeleton class="h-4 w-[200px]" />
            </div>
          </div>
          <!-- User Content -->
          <div v-show="hasComponentLoaded" class="flex">
            <router-link
              v-if="authStore.userMetadata.username"
              :to="`/user/${authStore.userMetadata.username}/account`"
              @click="handleNavClick"
            >
              <img
                :src="authStore.userMetadata.avatarURL"
                class="w-20 h-20 rounded-full object-cover mr-5"
                @load="hasComponentLoaded = true"
              />
            </router-link>
            <div class="flex flex-col mt-4">
              <router-link
                v-if="authStore.userMetadata.username"
                :to="`/user/${authStore.userMetadata.username}/account`"
                @click="handleNavClick"
              >
                <p class="text-md font-bold">
                  {{ authStore.userMetadata.username }}
                </p>
              </router-link>
              <p class="text-md font-light">
                {{ authStore.userMetadata.isAdmin ? 'Admin' : 'Reader' }}
              </p>
            </div>
          </div>
        </div>
        <Separator v-if="authStore.userMetadata.username" />

        <!-- Mobile Navigation Links -->
        <div class="flex flex-col my-8 space-y-8 items-center">
          <router-link
            v-if="authStore.user && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/account`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-user" class="fa-xl" />
              <p class="text-md font-medium">My Account</p>
            </div>
          </router-link>
          <router-link
            v-if="authStore.user && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/my-books`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-book" class="fa-xl" />
              <p class="text-md font-medium">My Books</p>
            </div>
          </router-link>
          <router-link
            v-if="authStore.user && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/lists`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-bookmark" class="fa-xl" />
              <p class="text-md font-medium">My Lists</p>
            </div>
          </router-link>
          <router-link
            v-if="authStore.user && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/my-stats`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-chart-line" class="fa-xl" />
              <p class="text-md font-medium">My Stats</p>
            </div>
          </router-link>
          <div
            v-if="authStore.user && authStore.userMetadata.username"
            class="flex flex-row space-x-3 items-center w-full"
            @click="handleNavClick"
          >
            <font-awesome-icon icon="fa-solid fa-bell" class="fa-xl" />
            <p class="text-md font-medium">Notifications</p>
          </div>

          <!-- Admin Links -->
          <router-link
            v-if="authStore.userMetadata.isAdmin"
            :to="`/admin/dashboard`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-gear" class="fa-xl" />
              <p class="text-md font-medium">Admin Dashboard</p>
            </div>
          </router-link>
        </div>
        <SignOutButton
          v-if="authStore.userMetadata.username"
          class="flex justify-center w-full"
          @click="handleNavClick"
        />
      </div>
    </div>

    <!-- Mobile Search Bar -->
    <div class="lg:hidden">
      <!-- Search Overlay -->
      <div
        v-if="isSearchVisible"
        class="fixed inset-x-0 top-0 z-50 py-7 px-5 md:px-6"
        :class="{
          'bg-white': !darkModeStore.darkMode,
          'bg-gray-900': darkModeStore.darkMode,
        }"
      >
        <div class="flex items-center gap-1">
          <router-link
            to="/"
            @click="
              () => {
                emit('closeMenuIfOpen');
                emit('handleSearchComplete');
              }
            "
          >
            <Logo class="hover:cursor-pointer hidden md:block mr-3" />
          </router-link>
          <div class="flex-grow">
            <SearchBar
              ref="searchBarRef"
              @search-complete="emit('handleSearchComplete')"
            />
          </div>
          <button class="flex-shrink-0" @click="emit('toggleSearch')">
            <font-awesome-icon icon="fa-solid fa-xmark" class="fa-lg pl-2" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
