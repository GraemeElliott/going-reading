<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';
import homeImage from '@/assets/images/home-image.jpg';
import CreateAccountForm from '@/components/home/CreateAccountForm.vue';

const loadingStore = useLoadingStore();
const { isLoading } = storeToRefs(loadingStore);
</script>

<template>
  <div v-if="isLoading">
    <div class="flex flex-col space-y-3">
      <Skeleton class="h-[600px] w-full rounded-xl" />
      <div class="space-y-2"></div>
    </div>
  </div>

  <div v-else class="flex flex-col md:flex-row">
    <div
      class="homepage-create-account relative inline-block w-full md:w-1/2 mr-4"
    >
      <img :src="homeImage" class="block w-full h-full" />
      <div
        class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30"
      >
        <font-awesome-icon
          icon="fa-solid fa-bookmark"
          class="fa-2xl mx-2 text-white"
        />
        <p class="text-white rounded-lg p-4 text-center font-thin sm: text-4xl">
          Discover new books and track your reading
        </p>
      </div>
    </div>
    <div class="w-full md:w-1/2 mt-4 md:mt-0">
      <CreateAccountForm />
    </div>
  </div>
</template>

<style scoped></style>
