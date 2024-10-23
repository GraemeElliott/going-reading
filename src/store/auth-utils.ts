import { rawSchema } from './validation-schemas.ts';

import { supabase } from '../supabase.ts';

interface Credentials {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Validate the registration form
export const validateRegistrationForm = (credentials: Credentials) => {
  const parsed = rawSchema.safeParse(credentials);

  if (!parsed.success) {
    const errorMessage = ref<string>('');
    const errors = parsed.error.format();
    errorMessage.value = Object.values(errors)
      .flatMap((err) => (Array.isArray(err) ? err : err._errors || []))
      .join(', ');
    throw new Error(errorMessage.value);
  }
};

// Check if a username already exists
export const checkIfUsernameExists = async (username: string) => {
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

// Check if the email address exists
export const ensureEmailExists = async (email: string) => {
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

// Handle sign-up errors
export const handleSignupError = (error: any) => {
  if (error.message.includes('User already registered.')) {
    throw new Error('Email address is already registered.');
  } else {
    throw new Error(error.message);
  }
};
