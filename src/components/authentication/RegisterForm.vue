<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'vee-validate';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { TabsContent } from '@/components/ui/tabs';
import { registerFormSchema } from '@/store/form-validation-schemas';
import router from '@/router/router';
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { registrationErrorMessages } from '@/store/error-handler';
import { useDarkModeStore } from '@/store/store';
const darkModeStore = useDarkModeStore();
const authStore = useAuthStore();
const { handleSubmit, resetForm } = useForm({
  validationSchema: registerFormSchema,
});
const isLoading = ref(false);
const onSubmit = handleSubmit(async (formData) => {
  isLoading.value = true;
  try {
    await authStore.handleRegister(formData);
    toast({
      title: 'Account created',
      description: 'Account successfully created.',
      variant: 'success',
      duration: 2000,
    });
    router.push('/my-books');
    resetForm();
  } catch (error) {
    toast({
      title: 'Registration error',
      description:
        authStore.errorMessage || registrationErrorMessages.registrationFailed,
      variant: 'destructive',
      duration: 2000,
    });
  } finally {
    isLoading.value = false;
  }
});
</script>
<template>
  <TabsContent value="register">
    <Card class="h-full border-none">
      <CardHeader class="space-y-1 pl-0 md:p-6">
        <CardTitle class="text-2xl"> Create an account </CardTitle>
        <CardDescription> Sign up to create your account </CardDescription>
      </CardHeader>
      <form @submit.prevent="onSubmit" class="px-2 md:px-4">
        <!-- First Name -->
        <FormField v-slot="{ componentField }" name="firstName">
          <FormItem>
            <FormLabel required>First Name</FormLabel>
            <FormControl>
              <Input type="text" placeholder="John" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Last Name -->
        <FormField v-slot="{ componentField }" name="lastName">
          <FormItem>
            <FormLabel required>Last Name</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Smith" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Username -->
        <FormField v-slot="{ componentField }" name="username">
          <FormItem>
            <FormLabel required>Username</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="johnsmith"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Email -->
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel required>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="john.smith@email.com"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Password -->
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel required>Password</FormLabel>
            <FormControl>
              <Input type="password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Confirm Password -->
        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel required>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <!-- Submit button -->
        <CardFooter class="flex flex-col mt-7">
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Submitting...' : 'Submit' }}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </TabsContent>
</template>
<style scoped>
:deep(input) {
  @apply bg-white text-black !important;
}
:deep(button) {
  @apply bg-black text-white !important;
}
</style>
