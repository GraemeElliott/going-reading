import { rawSchema } from '@/store/form-validation-schemas';
import { supabase } from '@/supabase/supabase';
import { registrationErrorMessages } from '../store/error-handler';
import { ref } from 'vue';
import { UserCredentials } from '@/types/user';

// Validate the registration form
export const validateRegistrationForm = (credentials: UserCredentials) => {
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
    .ilike('username', username)
    .maybeSingle()
    .throwOnError();

  if (existingUsername) {
    throw new Error(registrationErrorMessages.usernameExists);
  }
};

// Check if the email address exists
export const checkIfEmailExists = async (
  email: string,
  forRegistration: boolean = true
) => {
  const { data: existingEmail, error: emailError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (emailError) {
    throw new Error(registrationErrorMessages.unknownError);
  }

  if (forRegistration && existingEmail) {
    throw new Error(registrationErrorMessages.emailExists);
  }

  if (forRegistration && !existingEmail) {
    throw new Error(registrationErrorMessages.emailDoesNotExist);
  }
};
