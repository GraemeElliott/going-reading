<script setup lang="ts">
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useForm } from 'vee-validate';
import { watch } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { accountFormSchema } from '@/store/form-validation-schemas';
import { updateUserDetailsErrorMessages } from '@/store/error-handler';

const authStore = useAuthStore();

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: accountFormSchema,
  initialValues: {
    firstName: authStore.user.firstName,
    lastName: authStore.user.lastName,
    username: authStore.user.username,
    email: authStore.user.email,
    bio: authStore.user.bio,
  },
});

watch(
  () => authStore.user,
  (newMetadata) => {
    setValues({
      firstName: newMetadata.firstName,
      lastName: newMetadata.lastName,
      username: newMetadata.username,
      email: newMetadata.email,
      bio: newMetadata.bio,
    });
  },
  { immediate: true }
);

const onSubmit = handleSubmit(async (values) => {
  try {
    const successMessage = await authStore.updateAccountDetails(values);
    toast({
      title: 'Account details updated',
      description: successMessage,
      variant: 'success',
      duration: 2000,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : updateUserDetailsErrorMessages.unknownError;
    toast({
      title: 'Error updating account',
      description: errorMessage,
      variant: 'destructive',
      duration: 2000,
    });
  }
});
</script>

<template>
  <form class="space-y-8" @submit="onSubmit">
    <div class="flex flex-col md:flex-row md:space-x-7">
      <FormField v-slot="{ componentField }" name="firstName">
        <FormItem class="w-full">
          <FormLabel required>First Name</FormLabel>
          <FormControl>
            <Input type="text" placeholder="John" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="lastName">
        <FormItem class="w-full">
          <FormLabel required>Last Name</FormLabel>
          <FormControl>
            <Input type="text" placeholder="Smith" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
    <FormField v-slot="{ componentField }" name="username">
      <FormItem>
        <FormLabel required>Username</FormLabel>
        <FormControl>
          <Input type="text" placeholder="johnsmith" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
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
    <FormField v-slot="{ componentField }" name="bio">
      <FormItem>
        <FormLabel>Bio</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Tell us a little bit about yourself"
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="flex gap-2 justify-start">
      <Button type="submit"> Update Profile </Button>
      <Button type="button" variant="outline" @click="resetForm">
        Reset Form
      </Button>
    </div>
  </form>
</template>
