<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';
import signInImage from '@/assets/images/sign-in-image.jpg';
import SignInForm from '@/components/sign-in/SignInForm.vue';
import { onMounted, nextTick } from 'vue';

const loadingStore = useLoadingStore();
const { isLoading } = storeToRefs(loadingStore);

onMounted(() => {
  loadingStore.setLoading(true);

  // Consider using nextTick instead of setTimeout
  nextTick(() => {
    loadingStore.setLoading(false);
  });
});
</script>

<template>
  <div class="flex flex-col-reverse md:flex-row">
    <template v-if="isLoading">
      <Skeleton
        class="h-100 relative inline-block w-full md:w-1/2 mr-4 rounded-xl"
      />
      <Skeleton class="w-full md:w-1/2 mt-4 md:mt-0 h-[600px] rounded-xl" />
    </template>
    <template v-else>
      <div class="sign-in relative inline-block w-full md:w-1/2 mr-4">
        <img :src="signInImage" class="block w-full h-full" />
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30"
        >
          <font-awesome-icon
            icon="fa-solid fa-bookmark"
            class="fa-2xl mx-2 text-white"
          />
          <p
            class="text-white rounded-lg p-4 text-center font-thin sm: text-4xl"
          >
            Discover new books and track your reading
          </p>
        </div>
      </div>
      <div class="w-full md:w-1/2 mt-4 md:mt-0">
        <SignInForm />
      </div>
    </template>
  </div>
</template>

<style scoped></style>
