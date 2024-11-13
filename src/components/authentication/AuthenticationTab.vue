<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegisterForm from '@/components/authentication/RegisterForm.vue';
import SignInForm from '@/components/authentication/SignInForm.vue';
</script>

<template>
  <div class="">
    <Tabs default-value="register" class="w-[400px]">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="register"> Register </TabsTrigger>
        <TabsTrigger value="sign-in"> Sign In </TabsTrigger>
      </TabsList>
      <RegisterForm />
      <SignInForm />
    </Tabs>
  </div>
</template>
