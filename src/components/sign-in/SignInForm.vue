<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
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

// Define the form schema with zod
const formSchema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string(),
  })
);

// Initialize the form using useForm and the defined schema
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
});

// Define the submit handler
const onSubmit = handleSubmit(() => {
  toast({
    title: 'Logged in',
    description: 'Account successfully logged in.',
    variant: 'success',
  });
  resetForm();
});
</script>

<template>
  <Card class="h-full">
    <CardHeader class="space-y-1">
      <CardTitle class="text-2xl"> Create an account </CardTitle>
      <CardDescription> Sign up to create your account </CardDescription>
    </CardHeader>

    <!-- Form structure -->
    <form @submit="onSubmit">
      <!-- First Name -->

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
        <Button type="submit"> Submit </Button>
      </CardFooter>
    </form>
  </Card>
</template>
