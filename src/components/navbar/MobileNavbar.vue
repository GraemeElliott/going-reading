<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
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
const isImageLoaded = ref(false);
const hasAttemptedLoad = ref(false);

const props = defineProps<{
  isMenuOpen: boolean;
  isSearchVisible: boolean;
  shouldClearSearch: boolean;
  isHome: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggleMenu'): void;
  (e: 'closeMenuIfOpen'): void;
  (e: 'toggleSearch'): void;
  (e: 'handleSearchComplete'): void;
}>();

// Cache user data with computed properties
const userData = computed(() => ({
  username: authStore.userMetadata.username,
  avatarURL: authStore.userMetadata.avatarURL,
  isAdmin: authStore.userMetadata.isAdmin,
}));

// Preload avatar image only if not already loaded
const preloadAvatar = () => {
  if (userData.value.avatarURL && !hasAttemptedLoad.value) {
    hasAttemptedLoad.value = true;
    const img = new Image();
    img.src = userData.value.avatarURL;
    img.onload = () => {
      isImageLoaded.value = true;
    };
  }
};

// Function to toggle body scroll
const toggleBodyScroll = (disable: boolean) => {
  if (disable) {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  } else {
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }
};

// Watch for menu state changes
watch(
  () => props.isMenuOpen,
  (newValue) => {
    toggleBodyScroll(newValue);
  }
);

// Preload avatar when component mounts
onMounted(preloadAvatar);

// Clean up body styles when component unmounts
onUnmounted(() => {
  toggleBodyScroll(false);
});

// Only reset and reload if avatar URL changes
watch(
  () => userData.value.avatarURL,
  (newValue, oldValue) => {
    if (newValue && newValue !== oldValue) {
      isImageLoaded.value = false;
      hasAttemptedLoad.value = false;
      preloadAvatar();
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
    <div class="fixed top-0 left-0 right-0 z-50">
      <div
        class="flex items-center justify-between px-5 py-5"
        :class="{
          'bg-[#0F3538] text-white': isHome,
          'bg-white text-black': !isHome && !darkModeStore.darkMode,
          'bg-gray-900 text-white': !isHome && darkModeStore.darkMode,
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
            :class="{ 'text-white': isHome }"
            @click="emit('toggleSearch')"
          />
          <ThemeSwitch />
          <button v-if="userData.username" @click="emit('toggleMenu')" link>
            <font-awesome-icon
              :icon="isMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"
              class="fa-xl w-6"
              :class="{ 'text-white': isHome }"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="h-20"></div>
    <!-- Mobile Navbar Overlay -->
    <div
      v-show="isMenuOpen"
      class="fixed inset-0 z-40 transition-all duration-300 px-5 w-full h-full overflow-hidden touch-none"
      :class="{
        'bg-white text-black': !darkModeStore.darkMode,
        'bg-gray-900 text-white': darkModeStore.darkMode,
      }"
    >
      <div class="mt-20 h-[calc(100%-5rem)] flex flex-col overflow-y-auto">
        <!-- User Profile Section -->
        <div v-if="userData.username" class="flex flex-row my-5">
          <div class="flex">
            <router-link
              :to="`/user/${userData.username}/account`"
              @click="handleNavClick"
              class="relative"
            >
              <!-- Skeleton loader for image -->
              <Skeleton
                v-show="!isImageLoaded"
                class="w-20 h-20 rounded-full absolute top-0 left-0"
              />
              <img
                :src="userData.avatarURL"
                class="w-20 h-20 rounded-full object-cover mr-5"
                :class="{ 'opacity-0': !isImageLoaded }"
                alt="User avatar"
                loading="eager"
                @load="isImageLoaded = true"
              />
            </router-link>
            <div class="flex flex-col mt-4">
              <router-link
                :to="`/user/${userData.username}/account`"
                @click="handleNavClick"
              >
                <p class="text-md font-bold">
                  {{ userData.username }}
                </p>
              </router-link>
              <p class="text-md font-light">
                {{ userData.isAdmin ? 'Admin' : 'Reader' }}
              </p>
            </div>
          </div>
        </div>
        <Separator v-if="userData.username" />

        <!-- Mobile Navigation Links -->
        <div class="flex flex-col my-8 space-y-8 items-center">
          <router-link
            v-if="authStore.user && userData.username"
            :to="`/user/${userData.username}/account`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-user" class="fa-xl" />
              <p class="text-md font-medium">My Account</p>
            </div>
          </router-link>
          <router-link
            v-if="authStore.user && userData.username"
            :to="`/user/${userData.username}/my-books`"
            class="w-full"
            @click="handleNavClick"
          >
            <div class="flex flex-row space-x-3 items-center">
              <font-awesome-icon icon="fa-solid fa-book" class="fa-xl" />
              <p class="text-md font-medium">My Books</p>
            </div>
          </router-link>

          <!-- Admin Links -->
          <router-link
            v-if="userData.isAdmin"
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
          v-if="userData.username"
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
              :isHome="isHome"
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
