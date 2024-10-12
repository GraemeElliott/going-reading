<script setup lang="ts">
import { useForm } from 'vee-validate';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/';
import { useAuthStore } from '@/store/auth-store';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const { handleSubmit, resetForm } = useForm({
  validationSchema: authStore.singInFormSchema,
});

const onSubmit = handleSubmit(async (formData) => {
  try {
    await authStore.handleSignIn(formData);

    toast({
      title: 'Logged in',
      description: 'Account successfully logged in.',
      variant: 'success',
    });

    let redirectPath = route.query.redirect;

    if (Array.isArray(redirectPath)) {
      redirectPath = redirectPath[0];
    }

    redirectPath =
      redirectPath || `/user/${authStore.userMetadata.username}/my-books`;

    await router.push(redirectPath);

    resetForm();
  } catch (error) {
    toast({
      title: 'Log in error',
      description: authStore.errorMessage || 'Log in failed. Please try again.',
      variant: 'destructive',
    });
    console.error(error);
  }
});
</script>

<template>
  <Card class="h-full flex flex-col justify-center border-none">
    <CardHeader class="space-y-1">
      <CardTitle class="text-2xl"> Sign in to your account </CardTitle>
      <CardDescription>
        Sign in to your account to track books and see stats
      </CardDescription>
    </CardHeader>

    <form @submit="onSubmit">
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

      <!-- Submit button -->
      <CardFooter class="flex flex-col mt-7">
        <Button type="submit" class="w-full"> Submit </Button>
      </CardFooter>
    </form>
  </Card>
</template>
