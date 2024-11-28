<script setup lang="ts">
import ThemeSwitch from '@/components/navbar/ThemeSwitch.vue';
import Logo from '@/components/partials/Logo.vue';
import SignOutButton from '@/components/authentication/SignOutButton.vue';
import { useAuthStore } from '@/store/auth-store';
import SearchBar from '@/components/search/SearchBar.vue';

const authStore = useAuthStore();

defineProps<{
  isHome: boolean;
}>();

const emit = defineEmits<{
  (e: 'closeMenuIfOpen'): void;
}>();
</script>

<template>
  <div
    class="hidden lg:block w-full relative z-50 pt-5"
    :class="{ 'bg-[#0F3538] pt-7 text-white': isHome }"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36">
      <div
        class="flex items-center justify-between"
        :class="{ 'py-4': !isHome, 'py-2': isHome }"
      >
        <!-- Left side with logo -->
        <router-link
          to="/"
          @click="emit('closeMenuIfOpen')"
          class="flex-shrink-0"
        >
          <Logo class="hover:cursor-pointer" />
        </router-link>

        <!-- Center with search -->
        <div class="flex-grow max-w-2xl px-8">
          <SearchBar :isHome="isHome" />
        </div>

        <!-- Right side with navigation -->
        <div class="flex items-center gap-6">
          <router-link
            v-if="authStore.userMetadata && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/my-books`"
            @click="emit('closeMenuIfOpen')"
          >
            <font-awesome-icon
              icon="fa-solid fa-book"
              class="fa-xl"
              :class="{ 'text-white': isHome }"
            />
          </router-link>

          <router-link
            v-if="authStore.userMetadata && authStore.userMetadata.username"
            :to="`/user/${authStore.userMetadata.username}/account`"
            @click="emit('closeMenuIfOpen')"
          >
            <font-awesome-icon
              icon="fa-solid fa-user"
              class="fa-xl"
              :class="{ 'text-white': isHome }"
            />
          </router-link>

          <router-link
            v-if="authStore.userMetadata.isAdmin"
            :to="`/admin/dashboard`"
            @click="emit('closeMenuIfOpen')"
          >
            <font-awesome-icon icon="fa-solid fa-gear" class="fa-xl" />
          </router-link>

          <ThemeSwitch />

          <SignOutButton
            v-if="authStore.userMetadata.username"
            @click="emit('closeMenuIfOpen')"
            :class="{ 'text-white bg-transparent border-white': isHome }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
