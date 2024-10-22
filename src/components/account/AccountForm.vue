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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import { toast } from '@/components/ui/toast';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { watch, ref } from 'vue';
import * as z from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/supabase';

const authStore = useAuthStore();
const selectedAvatar = ref<File | null>(null);
const previewAvatarUrl = ref(authStore.userMetadata.avatarURL);

const accountFormSchema = toTypedSchema(
  z.object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters.')
      .max(30, 'First name can have a maximum of 30 characters.'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters.')
      .max(30, 'Last name can have a maximum of 30 characters.'),
    username: z
      .string()
      .min(5, 'Username must be at least 5 characters.')
      .max(20, 'Username can have a maximum of 30 characters.')
      .regex(
        /^[a-zA-Z0-9]+$/,
        'Username must contain only letters and numbers.'
      ),
    email: z.string().email('Invalid email address.'),
    bio: z
      .string()
      .max(160, { message: 'Bio must not be longer than 160 characters.' })
      .optional()
      .refine((value) => !value || value.length >= 4, {
        message: 'Bio must be at least 4 characters if provided.',
      }),
  })
);

const passwordFormSchema = toTypedSchema(
  z
    .object({
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(
          /[\W_]/,
          'Password must contain at least one special character.'
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match.',
      path: ['confirmPassword'],
    })
);

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: accountFormSchema,
  initialValues: {
    firstName: authStore.userMetadata.firstName,
    lastName: authStore.userMetadata.lastName,
    username: authStore.userMetadata.username,
    email: authStore.userMetadata.email,
    bio: authStore.userMetadata.bio,
  },
});

// Watch for changes in the authStore and update the form values accordingly
watch(
  () => authStore.userMetadata,
  (newMetadata) => {
    setValues({
      firstName: newMetadata.firstName,
      lastName: newMetadata.lastName,
      username: newMetadata.username,
      email: newMetadata.email,
      bio: newMetadata.bio,
    });
  },
  { immediate: true } // Apply immediately to initialize with current values
);

const updateAccountDetails = async (values: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio?: string;
}) => {
  try {
    await authStore.updateAccount(values);
    toast({
      title: 'Account updated successfully',
      variant: 'success',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    toast({
      title: 'Error updating account',
      description: errorMessage,
      variant: 'destructive',
    });
  }
};

const onSubmit = handleSubmit((values) => {
  updateAccountDetails(values);
});

const onAvatarSelected = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files[0]) {
    selectedAvatar.value = files[0];
    previewAvatarUrl.value = URL.createObjectURL(files[0]);
  }
};

const uploadAvatar = async () => {
  if (selectedAvatar.value) {
    const fileName = `${authStore.user.id}-${selectedAvatar.value.name}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, selectedAvatar.value, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      toast({
        title: 'Error uploading avatar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const publicURL = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (publicURL.data) {
      await authStore.updateAccount({ avatarURL: publicURL.data.publicUrl });
      toast({
        title: 'Avatar updated successfully',
        variant: 'success',
      });
    }
  }
};
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">Account</h3>
    <p class="text-sm text-muted-foreground">Update your account settings.</p>
  </div>
  <Separator />

  <!-- Avatar Update Form -->
  <form @submit.prevent="onSubmit">
    <div class="flex flex-col items-center gap-4 mb-10">
      <img
        :src="previewAvatarUrl"
        class="w-20 h-20 rounded-full"
        alt="User Avatar"
      />
      <input
        type="file"
        accept="image/*"
        @change="onAvatarSelected"
        class="hidden"
        ref="fileInput"
      />
      <Button type="button" variant="outline" @click="$refs.fileInput.click()">
        Select New Avatar
      </Button>
      <Button type="button" @click="uploadAvatar"> Update Avatar </Button>
    </div>
  </form>

  <!-- Account Update Form -->
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

  <Separator />

  <!-- Password Update Form -->
  <form>
    <div class="mb-5">
      <h3 class="text-lg font-medium">Update your password</h3>
    </div>

    <FormField v-slot="{ componentField }" name="new-password">
      <FormItem>
        <FormLabel>New Password</FormLabel>
        <FormControl>
          <Input type="password" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirm-new-password">
      <FormItem>
        <FormLabel>Confirm New Password</FormLabel>
        <FormControl>
          <Input type="password" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit" class="mt-5"> Update Password </Button>
  </form>
</template>
