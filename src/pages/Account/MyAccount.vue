<script setup lang="ts">
import { ref } from 'vue';
import Profile from './account-pages/Profile.vue';
import Account from './account-pages/Account.vue';
import ReadingStats from './account-pages/ReadingStats.vue';
import Notifications from './account-pages/Notifications.vue';
import FormsLayout from '@/components/account/FormsLayout.vue';

const selectedOption = ref('Account');

const handleOptionSelect = (option: string) => {
  selectedOption.value = option;
};

const sidebarNavItems = [
  { title: 'Account', href: '#account' },
  { title: 'Profile', href: '#profile' },
  { title: 'Reading Stats', href: '#reading-stats' },
  { title: 'Notifications', href: '#notifications' },
];
</script>

<template>
  <FormsLayout
    :sidebarNavItems="sidebarNavItems"
    :selectedOption="selectedOption"
    @option-selected="handleOptionSelect"
  >
    <component
      :is="
        selectedOption === 'Account'
          ? Account
          : selectedOption === 'Profile'
          ? Profile
          : selectedOption === 'Reading Stats'
          ? ReadingStats
          : Notifications
      "
    />
  </FormsLayout>
</template>

<style scoped></style>
