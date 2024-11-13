<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';

const authStore = useAuthStore();
const router = useRouter();

const handleSignOut = async () => {
  try {
    await authStore.handleSignOut();

    toast({
      title: 'Logged out',
      description: 'Account has successfully signed out.',
      variant: 'success',
      duration: 2000,
    });

    router.push('/');
  } catch (error) {
    toast({
      title: 'Sign out error',
      description: 'Failed to sign out. Please try again.',
      variant: 'destructive',
      duration: 2000,
    });
  }
};
</script>

<template>
  <Button @click="handleSignOut">Sign Out</Button>
</template>
