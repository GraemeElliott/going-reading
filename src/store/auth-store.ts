import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase.ts';
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import {
  registerFormSchema,
  signInFormSchema,
  accountFormSchema,
  passwordFormSchema,
} from './validation-schemas.ts';

const defaultAvatarURL = import.meta.env.VITE_DEFAULT_AVATAR_IMAGE_URL;

interface Credentials {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Authentication store
export const useAuthStore = defineStore('auth', () => {
  const errorMessage = ref<string>('');
  const user = ref<any>(null);
  const userMetadata = ref({
    firstName: '',
    lastName: '',
    username: '',
    avatarURL: '',
    email: '',
    bio: '',
    isAdmin: false,
  });

  // Validate the registration form
  const validateRegistrationForm = (credentials: Credentials) => {
    const parsed = rawSchema.safeParse(credentials);

    if (!parsed.success) {
      const errors = parsed.error.format();
      errorMessage.value = Object.values(errors)
        .flatMap((err) => (Array.isArray(err) ? err : err._errors || []))
        .join(', ');
      throw new Error(errorMessage.value);
    }
  };

  // Check if a username already exists
  const checkIfUsernameExists = async (username: string) => {
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()
      .throwOnError();

    if (existingUsername) {
      throw new Error('Username already exists.');
    }
  };

  // Handle sign-up errors
  const handleSignupError = (error: any) => {
    if (error.message.includes('User already registered.')) {
      throw new Error('Email address is already registered.');
    } else {
      throw new Error(error.message);
    }
  };

  // Handle registration
  const handleRegister = async (credentials: Credentials) => {
    // Validate form data using Zod and throw error if invalid
    validateRegistrationForm(credentials);

    const { email, password, username, firstName, lastName } = credentials;

    const bio = '';

    try {
      // Check if the username already exists in the users table
      if (username) {
        await checkIfUsernameExists(username);
      }

      // Proceed with Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            username,
            bio,
            avatar_url: defaultAvatarURL,
          },
        },
      });

      if (error) {
        handleSignupError(error);
      }

      // Set user data on successful registration
      user.value = data.user;
      userMetadata.value = {
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        username: username ?? '',
        email: email ?? '',
        bio: bio,
        avatarURL: defaultAvatarURL ?? '',
        isAdmin: false,
      };
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = err.message || 'Registration failed.';
      throw err;
    }
  };

  // Initialize store by checking for an existing session
  const initializeAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const sessionUser = data.session.user;

      user.value = sessionUser;

      // Fetch user metadata from users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (userProfile) {
        userMetadata.value = {
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
        console.error('Error fetching user details.', error.message);
      }
    }
  };

  // Check if the email address exists
  const ensureEmailExists = async (email: string) => {
    const { data: existingUser, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (emailError) {
      throw new Error('Error checking email existence.');
    }

    if (!existingUser) {
      throw new Error('An account with this email address does not exist.');
    }
  };

  // Fetch the user's details
  const fetchUserProfile = async (userId: string) => {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message || 'Unable to fetch user data.');
    }

    if (!userProfile) {
      throw new Error('No user found.');
    }

    // Update the store with the user's profile from the users table
    userMetadata.value = {
      firstName: userProfile.firstname,
      lastName: userProfile.lastname,
      username: userProfile.username,
      email: userProfile.email,
      avatarURL: userProfile.avatar_url,
      bio: userProfile.bio,
      isAdmin: userProfile.is_admin,
    };

    user.value = { id: userId };
  };

  // Handle sign-in
  const handleSignIn = async (credentials: Credentials) => {
    const { email, password } = credentials;

    try {
      // Check if the email exists before attempting to sign in
      await ensureEmailExists(email);

      // Sign in the user with Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid login credentials.');
      }

      // Fetch the user's profile after successful authentication
      await fetchUserProfile(data.user.id);

      errorMessage.value = ''; // Clear error message on success
    } catch (err: any) {
      errorMessage.value = err.message || 'Login failed.';
      throw err;
    }
  };

  // Handle logout
  const handleLogOut = async () => {
    try {
      await supabase.auth.signOut();
      user.value = null;
      userMetadata.value = {
        firstName: '',
        lastName: '',
        username: '',
        bio: '',
        isAdmin: false,
      };
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = 'Logout failed.';
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
      // Update user information in Supabase auth and users table
      await updateAccount(values);
      return 'Account details successfully updated.';
    } catch (err: any) {
      throw err.message || 'Profile update failed.';
    }
  };

  //Handle update profile
  const updateAccount = async (newMetadata: {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    email?: string;
    avatarURL?: string;
  }) => {
    try {
      // Update authentication user data in Supabase
      const { error: authError } = await supabase.auth.updateUser({
        email: newMetadata.email,
      });

      if (authError) {
        throw authError;
      }

      // Update profile information in the users table
      const userId = user.value?.id; // Get user ID from the current session

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
          throw dbError;
        }
      }

      // Update the store with new user metadata
      userMetadata.value = { ...userMetadata.value, ...newMetadata };
    } catch (err: any) {
      errorMessage.value = err.message || 'Account update failed.';
    }
  };

  const updateAvatar = async (selectedAvatar: File) => {
    try {
      const fileName = `${user.value.id}-${selectedAvatar.name}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedAvatar, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicURLData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      if (publicURLData?.publicUrl) {
        await updateAccount({ avatarURL: publicURLData.publicUrl });
      }
    } catch (err: any) {
      errorMessage.value = err.message || 'Avatar update failed.';
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      // Update authentication user password in Supabase
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw authError;
      }

      // If there are any user data updates needed in the users table, you can do that here.
      // In this case, updating the password does not require additional updates in the users table.
    } catch (err: any) {
      errorMessage.value = err.message || 'Password update failed.';
      throw err; // Throw error to let the caller handle the toast message
    }
  };

  return {
    user,
    userMetadata,
    errorMessage,
    handleRegister,
    initializeAuth,
    handleSignIn,
    handleLogOut,
    updateAccount,
    updateAvatar,
    updateAccountDetails,
    updatePassword,
  };
});
