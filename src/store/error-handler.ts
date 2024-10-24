export const handleError = (error: any, defaultMessage: string): string => {
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

export const handleSupabaseError = (error: any, action: string): never => {
  const message = error?.message || `Failed to ${action}`;
  throw new Error(message);
};

export const errorMessages = {
  usernameExists: 'Username already exists.',
  noUserFound: 'No user found.',
  emailExists: 'An account with this email address already exists.',
  emailDoesNotExist: 'An account with this email address does not exist.',
  registrationFailed: 'Registration failed. Please try again.',
  loginFailed: 'Log in failed. Please try again.',
  logoutFailed: 'Logout failed.',
  accountUpdateFailed: 'Account update failed.',
  avatarUpdateFailed: 'Failed to upload avatar.',
  passwordUpdateFailed: 'Failed to update password.',
  fetchUserFailed: 'Unable to fetch user data.',
  fetchUserDetailsFailed: 'Error fetching user details.',
  initializeAuthFailed: 'Failed to initialise authentication.',
  unknownError: 'An unknown error occurred',
};
