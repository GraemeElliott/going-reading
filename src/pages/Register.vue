<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useLoadingStore } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';
import CreateAccountForm from '@/components/register/CreateAccountForm.vue';
import { onMounted } from 'vue';
const loadingStore = useLoadingStore();
const { isLoading } = storeToRefs(loadingStore);
onMounted(() => {
  loadingStore.setLoading(true);
  setTimeout(() => {
    loadingStore.setLoading(false);
  }, 500);
});
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row">
      <Skeleton
        class="h-100 relative inline-block w-full md:w-1/2 mr-4 rounded-xl"
        v-if="isLoading"
      />
      <div
        v-else
        class="create-account relative inline-block w-full md:w-1/2 mr-4"
      >
        <div class="flex flex-col items-center justify-center bg-opacity-30">
          <div
            class="flex flex-col justify-center items-center md:absolute inset-0"
          >
            <font-awesome-icon
              icon="fa-solid fa-bookmark"
              class="fa-2xl mx-2 p4"
            />
            <p class="rounded-lg p-4 font-thin sm: text-4xl">
              Benefits for account holders
            </p>
            <div class="p-4">
              <ul>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Create lists</span>
                </li>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Track your reading</span>
                </li>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Analyse reading stats</span>
                </li>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Set reading challenges</span>
                </li>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Get recommendations</span>
                </li>
                <li class="flex items-center space-x-2">
                  <font-awesome-icon
                    icon="fa-solid fa-check"
                    class="text-green-600"
                  />
                  <span>Follow other users</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full md:w-1/2 mt-4 md:mt-0">
        <Skeleton class="h-[600px] rounded-xl" v-if="isLoading" />
        <CreateAccountForm v-else />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
