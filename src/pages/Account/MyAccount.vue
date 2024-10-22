<script setup lang="ts">
import { ref } from 'vue';
import Profile from './account-form/Profile.vue';
import Account from './account-form/Account.vue';
import Notifications from './account-form/Notifications.vue';
import FormsLayout from '@/components/account/FormsLayout.vue';
import SidebarNav from '@/components/account/SidebarNav.vue';

const selectedOption = ref('Account');

const handleOptionSelect = (option: string) => {
  selectedOption.value = option;
};

const sidebarNavItems = [
  { title: 'Account', href: '#account' },
  { title: 'Profile', href: '#profile' },
  { title: 'Notifications', href: '#notifications' },
];
</script>

<template>
  <FormsLayout
    :sidebarNavItems="sidebarNavItems"
    :selectedOption="selectedOption"
    @option-selected="handleOptionSelect"
  >
    <template #sidebar>
      <aside>
        <SidebarNav
          :items="sidebarNavItems"
          @option-selected="handleOptionSelect"
          :selectedOption="selectedOption"
        />
      </aside>
    </template>

    <component
      :is="
        selectedOption === 'Account'
          ? Account
          : selectedOption === 'Profile'
          ? Profile
          : Notifications
      "
    />
  </FormsLayout>
</template>

<style scoped></style>
