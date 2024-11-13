import { computed } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '@/supabase/supabase';
import { useAuth } from '@/composables/useAuth';
import { useUserProfile } from '@/composables/useUserProfile';
import { useProfileUpdate } from '@/composables/useProfileUpdate';
import {
  handleError,
  fetchUserDetailsErrorMessages,
} from '@/store/error-handler';

export const useAuthStore = defineStore('auth', () => {
  const {
    errorMessage: authError,
    handleRegister,
    handleSignIn,
    handleSignOut,
  } = useAuth();

  const { userMetadata, fetchUserProfile } = useUserProfile();

  const {
    errorMessage: updateError,
    updateAccountDetails,
    updateAvatar,
    updatePassword,
  } = useProfileUpdate(userMetadata);

  const initializeAuth = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await fetchUserProfile(data.session.user.id);
      }
    } catch (error) {
      throw new Error(
        handleError(error, fetchUserDetailsErrorMessages.initializeAuthFailed)
      );
    }
  };

  return {
    userMetadata,
    errorMessage: computed(() => authError.value || updateError.value),

    initializeAuth,
    handleRegister,
    handleSignIn,
    handleSignOut,
    updateAccountDetails,
    updateAvatar,
    updatePassword,
  };
});
