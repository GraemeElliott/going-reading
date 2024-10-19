<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToSignInPage = () => {
  router.push('/sign-in');
};
</script>

<template>
  <Button @click="goToSignInPage">Sign In</Button>
</template>
