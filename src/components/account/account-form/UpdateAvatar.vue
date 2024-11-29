<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { updateUserDetailsErrorMessages } from '@/store/error-handler';
import { Skeleton } from '@/components/ui/skeleton';

const authStore = useAuthStore();
const selectedAvatar = ref<File | null>(null);
const previewAvatarUrl = ref<string | null>(null);
const isImageLoaded = ref(false);
const hasAttemptedLoad = ref(false);

// Cache avatar URL with computed property
const avatarUrl = computed(
  () => previewAvatarUrl.value || authStore.userMetadata.avatarURL
);

// Preload avatar image only if not already loaded
const preloadAvatar = () => {
  if (avatarUrl.value && !hasAttemptedLoad.value) {
    hasAttemptedLoad.value = true;
    const img = new Image();
    img.src = avatarUrl.value;
    img.onload = () => {
      isImageLoaded.value = true;
    };
  }
};

// Preload avatar when component mounts
onMounted(preloadAvatar);

// Watch for avatar URL changes
watch(avatarUrl, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) {
    isImageLoaded.value = false;
    hasAttemptedLoad.value = false;
    preloadAvatar();
  }
});

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
      previewAvatarUrl.value = null;
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
      <div class="relative w-32 h-32">
        <Skeleton
          v-show="!isImageLoaded"
          class="w-32 h-32 rounded-full absolute top-0 left-0"
        />
        <img
          :src="avatarUrl"
          class="w-32 h-32 rounded-full object-cover"
          :class="{ 'opacity-0': !isImageLoaded }"
          alt="User Avatar"
          loading="eager"
          @load="isImageLoaded = true"
        />
      </div>
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
