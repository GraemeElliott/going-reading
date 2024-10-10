import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase.ts';
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

// Register form validation schema using Zod
const rawSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters.')
      .max(30, 'First name can have a maximum of 30 characters.'),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters.')
      .max(30, 'Last name can have a maximum of 30 characters.'),
    username: z
      .string()
      .min(5, 'Username must be at least 5 characters.')
      .max(20, 'Username can have a maximum of 30 characters.')
      .regex(
        /^[a-zA-Z0-9]+$/,
        'Username must contain only letters and numbers.'
      ),
    email: z.string().email('Invalid email address.'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[\W_]/, 'Password must contain at least one special character.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

const formSchema = toTypedSchema(rawSchema);

// Sign-in form validation schema using Zod
const singInFormSchema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string(),
  })
);

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
    isAdmin: false,
  });

  // Validate the registration form
  const validateRegistrationForm = (credentials: Credentials) => {
    const parsed = rawSchema.safeParse(credentials);

    if (!parsed.success) {
      const errors = parsed.error.format();
      errorMessage.value = Object.values(errors)
        .map((err) => err._errors[0])
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

    try {
      // Check if the username already exists in the users table
      await checkIfUsernameExists(username);

      // Proceed with Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            firstName,
            lastName,
          },
        },
      });

      if (error) {
        handleSignupError(error);
      }

      // Set user data on successful registration
      user.value = data.user;
      userMetadata.value = { firstName, lastName, username };
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
      userMetadata.value = {};
      errorMessage.value = '';
    } catch (err: any) {
      errorMessage.value = 'Logout failed.';
    }
  };

  //Handle update profile
  const updateProfile = async (newMetadata: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: newMetadata,
      });

      if (error) {
        throw error;
      }

      // Update the store with new user metadata
      userMetadata.value = { ...userMetadata.value, ...newMetadata };
    } catch (err: any) {
      errorMessage.value = err.message || 'Profile update failed.';
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
    updateProfile,
    formSchema,
    singInFormSchema,
  };
});
