<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goToRegisterPage = () => {
  router.push('/register');
};
</script>

<template>
  <Button @click="goToRegisterPage">Register</Button>
</template>
