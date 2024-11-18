<script setup lang="ts">
import UpdateAccountDetails from './UpdateAccountDetails.vue';
import UpdateAvatar from './UpdateAvatar.vue';
import UpdatePassword from './UpdatePassword.vue';
import { Separator } from '@/components/ui/separator';
</script>

<template>
  <div>
    <h3 class="text-lg font-medium">Account</h3>
    <p class="text-sm text-muted-foreground">Update your account settings.</p>
  </div>
  <Separator />

  <!-- Avatar Update Form -->
  <UpdateAvatar />

  <Separator />

  <!-- Account Details Update Form -->
  <UpdateAccountDetails />

  <Separator />

  <!-- Password Update Form -->
  <UpdatePassword />
</template>
