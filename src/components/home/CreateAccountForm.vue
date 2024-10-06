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
  z
    .object({
      firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(30, 'Max 30 characters'),
      lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(30, 'Max 30 characters'),
      username: z
        .string()
        .min(5, 'Username must be at least 5 characters')
        .max(20, 'Max 20 characters')
        .regex(
          /^[a-zA-Z0-9]+$/,
          'Username must contain only letters and numbers'
        ),
      email: z.string().email('Invalid email address'),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[\W_]/, 'Password must contain at least one special character'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    })
);

// Initialize the form using useForm and the defined schema
const { handleSubmit, resetForm } = useForm({
  validationSchema: formSchema,
});

// Define the submit handler
const onSubmit = handleSubmit(() => {
  toast({
    title: 'Account Created!',
    description: 'Account successfully created.',
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
            <Input type="text" placeholder="shadcn" v-bind="componentField" />
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
        <Button type="submit"> Submit </Button>
        <div class="mt-2">
          <p>Already a member? <span>Sign-in</span></p>
        </div>
      </CardFooter>
    </form>
  </Card>
</template>
