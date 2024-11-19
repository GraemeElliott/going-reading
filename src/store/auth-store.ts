import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { supabase } from '@/supabase/supabase';
import { User, UserCredentials, UserMetadata } from '@/types/user';

import {
  validateRegistrationForm,
  checkIfUsernameExists,
  checkIfEmailExists,
} from '@/store/auth-utils.js';
import {
  handleError,
  handleSupabaseError,
  registrationErrorMessages,
  signinErrorMessages,
  logoutErrorMessages,
  updateUserDetailsErrorMessages,
  fetchUserDetailsErrorMessages,
} from '@/store/error-handler';

const defaultAvatarURL = import.meta.env.VITE_DEFAULT_AVATAR_IMAGE_URL;

// Authentication store
export const useAuthStore = defineStore('auth', () => {
  const errorMessage = ref<string>('');
  const user = ref<User | null>(null);
  const userMetadata = ref<UserMetadata>({
    id: '',
    firstName: '',
    lastName: '',
    username: '',
    avatarURL: '',
    email: '',
    bio: '',
    isAdmin: false,
  });

  // Handle registration
  const handleRegister = async (
    credentials: UserCredentials
  ): Promise<void> => {
    validateRegistrationForm(credentials);
    const { email, password, username, firstName, lastName } = credentials;
    const bio = '';

    try {
      // Ensure the username is lowercase
      const lowercaseUsername = username ? username.toLowerCase() : '';

      // Check if the username already exists in the users table
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
        } else {
          throw new Error(error.message);
        }
      }

      if (data.user) {
        user.value = {
          id: data.user.id,
          email: data.user.email ?? '',
        };

        userMetadata.value = {
          id: data.user.id,
          firstName: firstName ?? '',
          lastName: lastName ?? '',
          username: lowercaseUsername ?? '',
          email: email ?? '',
          bio: bio,
          avatarURL: defaultAvatarURL ?? '',
          isAdmin: false,
        };
      }

      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        registrationErrorMessages.registrationFailed
      );
      throw err;
    }
  };

  // Initialize store by checking for an existing session
  const initializeAuth = async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const sessionUser = data.session.user;
        user.value = { id: sessionUser.id, email: sessionUser.email ?? '' };

        // Fetch user metadata from users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (userProfile) {
          userMetadata.value = {
            id: userProfile.id,
            firstName: userProfile.firstname,
            lastName: userProfile.lastname,
            username: userProfile.username,
            avatarURL: userProfile.avatar_url,
            email: userProfile.email,
            bio: userProfile.bio,
            isAdmin: userProfile.is_admin,
          };
        }

        if (error) {
          console.error(
            handleError(
              error,
              fetchUserDetailsErrorMessages.fetchUserDetailsFailed
            )
          );
        }
      }
    } catch (err: any) {
      console.error(
        handleError(err, fetchUserDetailsErrorMessages.initializeAuthFailed)
      );
    }
  };

  // Fetch the user's details
  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          handleError(
            profileError,
            fetchUserDetailsErrorMessages.fetchUserFailed
          )
        );
      }

      if (!userProfile) {
        throw new Error(fetchUserDetailsErrorMessages.noUserFound);
      }

      userMetadata.value = {
        id: userProfile.id,
        firstName: userProfile.firstname,
        lastName: userProfile.lastname,
        username: userProfile.username,
        email: userProfile.email,
        avatarURL: userProfile.avatar_url,
        bio: userProfile.bio,
        isAdmin: userProfile.is_admin,
      };

      user.value = { id: userId, email: userProfile.email };
    } catch (err: any) {
      throw new Error(
        handleError(err, fetchUserDetailsErrorMessages.fetchUserFailed)
      );
    }
  };

  // Handle sign-in
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

  // Handle logout
  const handleSignOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      user.value = null;
      userMetadata.value = {
        id: '',
        firstName: '',
        lastName: '',
        username: '',
        avatarURL: '',
        email: '',
        bio: '',
        isAdmin: false,
      };
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = handleError(err, logoutErrorMessages.logoutFailed);
    }
  };

  const updateAccountDetails = async (values: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio?: string;
  }) => {
    try {
      // Check if the email already exists (excluding the current user's email)
      if (values.email !== userMetadata.value.email) {
        await checkIfEmailExists(values.email, true).catch(() => {
          throw new Error(updateUserDetailsErrorMessages.emailExists);
        });
      }

      // Check if the username already exists (excluding the current user's username)
      if (values.username !== userMetadata.value.username) {
        await checkIfUsernameExists(values.username).catch(() => {
          throw new Error(updateUserDetailsErrorMessages.usernameExists);
        });
      }

      // Proceed with updating account details if validation passes
      await updateAccount(values);

      return 'Account details successfully updated.';
    } catch (err: any) {
      throw new Error(
        handleError(err, updateUserDetailsErrorMessages.accountUpdateFailed)
      );
    }
  };

  //Handle update profile
  const updateAccount = async (
    newMetadata: Partial<UserMetadata>
  ): Promise<void> => {
    try {
      const { error: authError } = await supabase.auth.updateUser({
        email: newMetadata.email,
      });

      if (authError) {
        handleSupabaseError(authError, 'update user email');
      }

      const userId = user.value?.id;

      if (userId) {
        const { error: dbError } = await supabase
          .from('users')
          .update({
            firstname: newMetadata.firstName,
            lastname: newMetadata.lastName,
            username: newMetadata.username,
            bio: newMetadata.bio,
            avatar_url: newMetadata.avatarURL,
          })
          .eq('id', userId);

        if (dbError) {
          handleSupabaseError(dbError, 'update user profile');
        }
      }

      userMetadata.value = { ...userMetadata.value, ...newMetadata };
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.accountUpdateFailed
      );
    }
  };

  //Handle update avatar
  const updateAvatar = async (selectedAvatar: File) => {
    try {
      if (!user.value) {
        throw new Error('User is not logged in.');
      }
      const fileName = `${user.value.id}-${selectedAvatar.name}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedAvatar, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw new Error(
          handleError(error, updateUserDetailsErrorMessages.avatarUpdateFailed)
        );
      }

      const { data: publicURLData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      if (publicURLData?.publicUrl) {
        await updateAccount({ avatarURL: publicURLData.publicUrl });
      }
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.avatarUpdateFailed
      );
      throw err;
    }
  };

  //Handle update password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw new Error(
          handleError(
            authError,
            updateUserDetailsErrorMessages.passwordUpdateFailed
          )
        );
      }
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.passwordUpdateFailed
      );
      throw err;
    }
  };

  return {
    user,
    userMetadata,
    errorMessage,
    handleRegister,
    initializeAuth,
    handleSignIn,
    handleSignOut,
    updateAccount,
    updateAvatar,
    updateAccountDetails,
    updatePassword,
  };
});
