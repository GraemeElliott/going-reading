<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import ThemeSwitch from '@/components/navbar/ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import SignOutButton from '@/components/authentication/SignOutButton.vue';
import SearchBar from '@/components/search/SearchBar.vue';
import { useAuthStore } from '@/store/auth-store';
import MobileNavMenu from './MobileNavbar.vue';
import LibraryIcon from './LibraryIcon.vue';

const route = useRoute();
const authStore = useAuthStore();

const isHome = computed(() => route.name === 'home');

// Mobile menu and search overlay state (below lg)
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
const username = computed(() => authStore.userMetadata?.username);

// Compute the logo destination based on user authentication status
const logoDestination = computed(() => {
  if (username.value) {
    return '/my-books';
  }
  return '/';
});

const navItems = computed(() => {
  const items: {
    label: string;
    ariaLabel: string;
    /** Font Awesome icon, or 'library' for the custom shelf icon */
    icon: string;
    to: string;
    active: boolean;
  }[] = [];
  const current = String(route.name);

  if (username.value) {
    items.push(
      {
        label: 'Books',
        ariaLabel: 'My Books',
        icon: 'fa-solid fa-book',
        to: '/my-books',
        active: ['my-books', 'bookshelves'].includes(current),
      },
      {
        label: 'Library',
        ariaLabel: 'Library',
        icon: 'library',
        to: '/my-books/library',
        active: current === 'library',
      },
      {
        label: 'Stats',
        ariaLabel: 'Reading Stats',
        icon: 'fa-solid fa-chart-simple',
        to: '/reading-stats',
        active: current === 'reading-stats',
      },
      {
        label: 'Profile',
        ariaLabel: 'My Account',
        icon: 'fa-solid fa-user',
        to: '/account',
        active: current === 'account',
      }
    );
  }

  if (authStore.userMetadata?.isAdmin) {
    items.push({
      label: 'Settings',
      ariaLabel: 'Admin Dashboard',
      icon: 'fa-solid fa-gear',
      to: '/admin/dashboard',
      active: route.path.startsWith('/admin'),
    });
  }

  return items;
});
</script>

<template>
  <MobileNavMenu
    :is-menu-open="isMenuOpen"
    :is-search-visible="isSearchVisible"
    :should-clear-search="shouldClearSearch"
    :is-home="isHome"
    @toggle-menu="toggleMenu"
    @close-menu-if-open="closeMenuIfOpen"
    @toggle-search="toggleSearch"
    @handle-search-complete="handleSearchComplete"
  />
  <!-- Desktop header (lg and up) -->
  <header
    class="relative z-50 hidden w-full font-body text-base leading-[1.4] lg:block"
    :class="
      isHome
        ? 'bg-gr-hero text-gr-on-hero'
        : 'border-b border-gr-line bg-gr-surface text-gr-text'
    "
  >
    <div class="gr-container flex items-center gap-5 py-4">
      <router-link :to="logoDestination" class="flex h-11 shrink-0 items-center">
        <Logo class="hover:cursor-pointer" />
      </router-link>

      <div class="min-w-0 flex-1">
        <SearchBar :isHome="isHome" />
      </div>

      <nav
        v-if="navItems.length"
        aria-label="Main"
        class="flex gap-1"
      >
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :aria-label="item.ariaLabel"
          :aria-current="item.active ? 'page' : undefined"
          class="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] transition-colors"
          :class="
            item.active
              ? 'bg-gr-accent-soft text-gr-accent'
              : 'hover:bg-gr-surface-2'
          "
        >
          <LibraryIcon v-if="item.icon === 'library'" />
          <font-awesome-icon v-else :icon="item.icon" class="fa-xl" />
        </router-link>
      </nav>

      <div class="flex items-center gap-1">
        <ThemeSwitch />
        <SignOutButton
          v-if="username"
          class="h-10 rounded-[10px] border px-3.5 !text-[15px] shadow-none"
          :class="
            isHome
              ? 'border-gr-on-hero bg-transparent text-gr-on-hero hover:border-gr-on-hero hover:bg-gr-on-hero hover:text-gr-hero'
              : 'border-transparent bg-gr-text text-gr-bg hover:border-transparent hover:bg-gr-text hover:text-gr-bg hover:opacity-90'
          "
        />
      </div>
    </div>
  </header>
</template>
