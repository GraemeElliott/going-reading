<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RegisterForm from '@/components/authentication/RegisterForm.vue';
import SignInForm from '@/components/authentication/SignInForm.vue';
import { ref } from 'vue';

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
      <TabsList
        class="grid w-full grid-cols-2 bg-transparent border border-white text-white"
      >
        <TabsTrigger value="register">Register</TabsTrigger>
        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
      </TabsList>

      <div class="relative h-[650px]">
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
