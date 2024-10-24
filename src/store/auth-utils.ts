import { rawSchema } from './validation-schemas.ts';
import { supabase } from '../supabase.ts';
import { errorMessages } from './error-handler.ts';

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
    .ilike('username', username)
    .maybeSingle()
    .throwOnError();

  if (existingUsername) {
    throw new Error(errorMessages.usernameExists);
  }
};

// Check if the email address exists
export const checkIfEmailExists = async (
  email: string,
  forRegistrationUpdate: boolean = true
) => {
  const { data: existingEmail, error: emailError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (emailError) {
    throw new Error(errorMessages.unknownError);
  }

  if (forRegistrationUpdate && existingEmail) {
    throw new Error(errorMessages.emailExists);
  }

  if (forRegistrationUpdate && !existingEmail) {
    throw new Error(errorMessages.emailDoesNotExist);
  }
};
