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
import { toast } from '@/components/ui/toast';
import { useForm } from 'vee-validate';
import { useAuthStore } from '@/store/auth-store';
import { passwordFormSchema } from '@/store/form-validation-schemas';
import { updateUserDetailsErrorMessages } from '@/store/error-handler';

const authStore = useAuthStore();

const { handleSubmit: handlePasswordSubmit, resetForm: resetPasswordForm } =
  useForm({
    validationSchema: passwordFormSchema,
  });

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
  try {
    await authStore.updatePassword(values.password);
    toast({
      title: 'Password updated',
      description: 'Password successfully updated.',
      variant: 'success',
      duration: 2000,
    });
    resetPasswordForm();
  } catch (error: any) {
    toast({
      title: 'Error updating password',
      description: error.message || updateUserDetailsErrorMessages.unknownError,
      variant: 'destructive',
      duration: 2000,
    });
  }
});
</script>

<template>
  <form class="space-y-8" @submit.prevent="onPasswordSubmit">
    <FormField v-slot="{ field }" name="password">
      <FormItem>
        <FormLabel>New Password</FormLabel>
        <FormControl>
          <Input type="password" v-bind="field" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ field }" name="confirmPassword">
      <FormItem>
        <FormLabel>Confirm New Password</FormLabel>
        <FormControl>
          <Input type="password" v-bind="field" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="flex gap-2 justify-start">
      <Button type="submit"> Update Password </Button>
    </div>
  </form>
</template>
