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
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';
import { signInFormSchema } from '@/store/form-validation-schemas';
import { signinErrorMessages } from '@/store/error-handler';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const { handleSubmit, resetForm } = useForm({
  validationSchema: signInFormSchema,
});

const onSubmit = handleSubmit(async (formData) => {
  try {
    await authStore.handleSignIn(formData);

    toast({
      title: 'Logged in',
      description: 'Account successfully logged in.',
      variant: 'success',
      duration: 2000,
    });

    let redirectPath = route.query.redirect;

    if (Array.isArray(redirectPath)) {
      redirectPath = redirectPath[0];
    }

    redirectPath = redirectPath || `/user/${authStore.user.username}/my-books`;

    await router.push(redirectPath);

    resetForm();
  } catch (error) {
    toast({
      title: 'Log in error',
      description: authStore.errorMessage || signinErrorMessages.signinFailed,
      variant: 'destructive',
      duration: 2000,
    });
  }
});
</script>

<template>
  <TabsContent value="sign-in">
    <Card class="h-full flex flex-col justify-center border-none">
      <CardHeader class="space-y-1 pl-0 md:p-6">
        <CardTitle class="text-2xl"> Sign in to your account </CardTitle>
        <CardDescription>
          Sign in to your account to track books and see stats
        </CardDescription>
      </CardHeader>

      <form @submit="onSubmit" class="px-2 md:px-4">
        <!-- Email -->
        <FormField v-slot="{ componentField, handleChange }" name="email">
          <FormItem>
            <FormLabel required>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="john.smith@email.com"
                v-bind="componentField"
                @input="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Password -->
        <FormField v-slot="{ componentField, handleChange }" name="password">
          <FormItem>
            <FormLabel required>Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                v-bind="componentField"
                @input="handleChange"
              />
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
  </TabsContent>
</template>
