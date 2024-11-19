<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { updateUserDetailsErrorMessages } from '@/store/error-handler';

const authStore = useAuthStore();
const selectedAvatar = ref<File | null>(null);
const previewAvatarUrl = ref(authStore.userMetadata.avatarURL);

const onAvatarSelected = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files[0]) {
    selectedAvatar.value = files[0];
    previewAvatarUrl.value = URL.createObjectURL(files[0]);
  }
};

const onSubmit = async () => {
  if (selectedAvatar.value) {
    try {
      await authStore.updateAvatar(selectedAvatar.value);
      toast({
        title: 'Avatar updated',
        description: 'Avatar successfully updated.',
        variant: 'success',
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: 'Error uploading avatar',
        description:
          error.message || updateUserDetailsErrorMessages.unknownError,
        variant: 'destructive',
        duration: 2000,
      });
    }
  }
};
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="flex flex-col items-center gap-4 mb-10">
      <img
        :src="previewAvatarUrl"
        class="w-32 h-32 rounded-full object-cover"
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
      <Button type="submit"> Update Avatar </Button>
    </div>
  </form>
</template>
