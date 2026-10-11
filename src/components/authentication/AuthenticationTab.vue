<script setup lang="ts">
import SignInForm from '@/components/authentication/SignInForm.vue';

// Registration is closed, so only the sign-in form is shown.
// RegisterForm.vue is kept so it can be brought back by restoring the tabs.
</script>

<template>
  <div>
    <SignInForm />
  </div>
</template>
