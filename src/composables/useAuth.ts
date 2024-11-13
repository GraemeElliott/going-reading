import { ref } from 'vue';
import { supabase } from '@/supabase/supabase';
import { UserCredentials } from '@/types/user';
import {
  checkIfEmailExists,
  checkIfUsernameExists,
  validateRegistrationForm,
} from '@/store/auth-utils';
import { useUserProfile } from '@/composables/useUserProfile';

import {
  handleError,
  registrationErrorMessages,
  signinErrorMessages,
  logoutErrorMessages,
} from '@/store/error-handler';

const defaultAvatarURL = import.meta.env.VITE_DEFAULT_AVATAR_IMAGE_URL;

export function useAuth() {
  const errorMessage = ref<string>('');
  const { fetchUserProfile } = useUserProfile();

  const handleRegister = async (credentials: UserCredentials) => {
    validateRegistrationForm(credentials);

    const { email, password, username, firstName, lastName } = credentials;
    const bio = '';

    try {
      const lowercaseUsername = username ? username.toLowerCase() : '';

      if (lowercaseUsername) {
        await checkIfUsernameExists(lowercaseUsername);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            username: lowercaseUsername,
            bio,
            avatar_url: defaultAvatarURL,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('user already registered')) {
          throw new Error(registrationErrorMessages.emailExists);
        }
        throw new Error(error.message);
      }
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        registrationErrorMessages.registrationFailed
      );
      throw err;
    }
  };

  const handleSignIn = async (credentials: UserCredentials): Promise<void> => {
    const { email, password } = credentials;

    try {
      await checkIfEmailExists(email, false);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(handleError(error, signinErrorMessages.signinFailed));
      }

      await fetchUserProfile(data.user.id);
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = handleError(err, signinErrorMessages.signinFailed);
      throw err;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = handleError(err, logoutErrorMessages.logoutFailed);
    }
  };

  return {
    errorMessage,
    handleRegister,
    handleSignIn,
    handleSignOut,
  };
}
