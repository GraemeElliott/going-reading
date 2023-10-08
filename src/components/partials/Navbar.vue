<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const isLoading = ref(true);

const isUserSignedIn = ref(false);

const signOut = () => {
  authStore.signOut();
  router.push('/');
};

// Watch for changes in authStore.user
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser !== null) {
      isUserSignedIn.value = true;
    } else {
      isUserSignedIn.value = false;
    }
    isLoading.value = false;
  }
);

const isSticky = ref(false);

const handleScroll = () => {
  const scrollY = window.scrollY;
  isSticky.value = scrollY > 0; // Adjust the threshold as needed
};

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 350);

  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="h-20">
    <nav
      v-if="!isLoading"
      class="sticky-navbar mt-5 mb-5 flex justify-center relative transition-[top] duration-[0.3s] ease-[ease-in-out] h-20"
      :class="{ sticky: isSticky }"
    >
      <ul class="flex flex-row [&>*:not(:last-child)]:mr-7">
        <RouterLink :to="`/`">Home</RouterLink>
        <RouterLink :to="`/my-books`">My Books</RouterLink>
        <RouterLink :to="`/browse`">Browse</RouterLink>

        <template v-if="!isUserSignedIn">
          <RouterLink :to="`/register`">Register</RouterLink>
          <RouterLink :to="`/sign-in`">Sign In</RouterLink>
        </template>
        <template v-else>
          <!-- Links for signed-in users -->
          <li>
            <n-button type="error" @click="signOut" lazy> Sign Out </n-button>
          </li>
          <li>
            <n-avatar
              size="small"
              :src="'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg'"
              lazy
              :intersection-observer-options="{
                root: '#image-scroll-container',
              }"
            />
          </li>
        </template>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}
</style>
