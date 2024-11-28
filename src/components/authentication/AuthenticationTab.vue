<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RegisterForm from '@/components/authentication/RegisterForm.vue';
import SignInForm from '@/components/authentication/SignInForm.vue';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';

const authStore = useAuthStore();
const isLoading = ref(false);

const handleTabChange = async () => {
  isLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 300));
  isLoading.value = false;
};
</script>

<template>
  <div>
    <Tabs default-value="register" @update:value="handleTabChange">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="register">Register</TabsTrigger>
        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
      </TabsList>

      <div class="relative h-[650px]">
        <!-- Loading Overlay -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50"
        >
          <Loader2 class="animate-spin h-8 w-8 text-gray-500" />
        </div>

        <!-- Tab Contents -->
        <div class="h-full overflow-hidden">
          <TabsContent
            value="register"
            class="transition-all duration-300 h-full"
            :class="{ 'opacity-50': isLoading }"
          >
            <RegisterForm />
          </TabsContent>

          <TabsContent
            value="sign-in"
            class="transition-all duration-300 h-full"
            :class="{ 'opacity-50': isLoading }"
          >
            <SignInForm />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</template>

<style scoped>
:deep([role='tabpanel']) {
  @apply flex flex-col absolute inset-0;
}

:deep([role='tabpanel'][data-state='inactive']) {
  @apply pointer-events-none opacity-0;
}

:deep([role='tabpanel'][data-state='active']) {
  @apply opacity-100;
}
</style>
