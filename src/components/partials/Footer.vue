<script setup lang="ts">
import Logo from './Logo.vue';
import { useDarkModeStore } from '@/store/store';

const darkModeStore = useDarkModeStore();

defineProps<{
  isHome: boolean;
}>();

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer
    :class="[
      'mt-auto py-12',
      isHome
        ? 'bg-[#0F3538] text-white'
        : darkModeStore.darkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-black',
    ]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-26 xl:px-36">
      <!-- Main footer content -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
        <!-- Logo and description -->
        <div class="space-y-6">
          <div class="w-48">
            <Logo />
          </div>
          <p class="text-sm opacity-80 leading-relaxed text-center">
            Your personal reading companion. Track, discover, and analyse your
            reading journey.
          </p>
        </div>

        <!-- Links sections container -->
        <div
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 col-span-2 gap-8"
        >
          <!-- Quick Links -->
          <div class="flex flex-col">
            <h3 class="font-semibold text-lg mb-6">Quick Links</h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="/my-books"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >My Books</a
                >
              </li>
              <li>
                <a
                  href="/account"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >My Account</a
                >
              </li>
            </ul>
          </div>

          <!-- Resources -->
          <div class="flex flex-col">
            <h3 class="font-semibold text-lg mb-6">Resources</h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="/help"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >Help Center</a
                >
              </li>
              <li>
                <a
                  href="/privacy"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >Privacy Policy</a
                >
              </li>
              <li>
                <a
                  href="/terms"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >Terms of Service</a
                >
              </li>
              <li>
                <a
                  href="/about"
                  class="text-sm hover:text-goingTeal transition-colors"
                  >About Us</a
                >
              </li>
            </ul>
          </div>
        </div>

        <!-- Social Links -->
        <div class="flex flex-col">
          <h3 class="font-semibold text-lg mb-6">Connect</h3>
          <div class="flex items-center space-x-4">
            <a
              href="#"
              class="hover:text-goingTeal transition-colors"
              aria-label="Tumblr"
            >
              <font-awesome-icon
                icon="fa-brands fa-tumblr-square"
                class="text-xl"
              />
            </a>
            <a
              href="#"
              class="hover:text-goingTeal transition-colors"
              aria-label="Instagram"
            >
              <font-awesome-icon
                icon="fa-brands fa-instagram"
                class="text-xl"
              />
            </a>
            <a
              href="#"
              class="hover:text-goingTeal transition-colors"
              aria-label="Email"
            >
              <font-awesome-icon
                icon="fa-regular fa-envelope"
                class="text-xl"
              />
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div
        class="pt-8 border-t"
        :class="isHome ? 'border-gray-700' : 'border-gray-200'"
      >
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm opacity-80">
            © {{ currentYear }} Going Reading. All rights reserved.
          </p>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <a
              href="/privacy"
              class="text-sm hover:text-goingTeal transition-colors"
              >Privacy</a
            >
            <a
              href="/terms"
              class="text-sm hover:text-goingTeal transition-colors"
              >Terms</a
            >
            <a
              href="/contact"
              class="text-sm hover:text-goingTeal transition-colors"
              >Contact</a
            >
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
a {
  transition: all 0.2s ease;
}

a:hover {
  opacity: 0.9;
}
</style>
