<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth-store';

const authStore = useAuthStore();
const router = useRouter();

const handleLogOut = async () => {
  try {
    await authStore.handleLogOut();

    toast({
      title: 'Logged out',
      description: 'Account has successfully logged out.',
      variant: 'success',
      duration: 2000,
    });

    router.push('/');
  } catch (error) {
    toast({
      title: 'Log out error',
      description: 'Failed to log out. Please try again.',
      variant: 'destructive',
      duration: 2000,
    });
  }
};
</script>

<template>
  <Button @click="handleLogOut">Log Out</Button>
</template>
