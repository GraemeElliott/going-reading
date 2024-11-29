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

export const registrationErrorMessages = {
  unknownError: 'An unknown error occurred. Please try again.',
  usernameExists: 'Username already exists.',
  emailExists: 'An account with this email address already exists.',
  emailDoesNotExist: 'An account with this email address does not exist.',
  registrationFailed: 'Registration failed. Please try again.',
};

export const signinErrorMessages = {
  unknownError: 'An unknown error occurred. Please try again.',
  noUserFound: 'No user found.',
  signinFailed: 'Log in failed. Please try again.',
};

export const logoutErrorMessages = {
  unknownError: 'An unknown error occurred. Please try again.',
  logoutFailed: 'Logout failed.',
};

export const updateUserDetailsErrorMessages = {
  unknownError: 'An unknown error occurred',
  accountUpdateFailed: 'Account update failed.',
  avatarUpdateFailed: 'Failed to upload avatar.',
  passwordUpdateFailed: 'Failed to update password.',
  usernameExists: 'Username already exists.',
  emailExists: 'An account with this email address already exists.',
};

export const fetchUserDetailsErrorMessages = {
  noUserFound: 'No user found.',
  fetchUserFailed: 'Unable to fetch user data.',
  fetchUserDetailsFailed: 'Error fetching user details.',
  initializeAuthFailed: 'Failed to initialise authentication.',
};

export const updateBookErrorMessages = {
  userNotLoggedInProgress: 'User must be logged in to update book progress.',
  userNotLoggedInStatus: 'User must be logged in to update book status.',
  userNotLoggedInDeleteBook: 'User must be logged in to delete a book.',
  bookNotFound: 'Book not found in user library.',
  fullBookInfoRequired: 'Full book info required for new books.',
  unknownError: 'An unknown error occurred. Please try again.',
  currentPageRequired: 'Please enter the current page number.',
  timeReadingRequired: 'Please enter the time spent reading.',
  invalidCurrentPage: 'Current page must be a valid number.',
  invalidTimeReading: 'Time spent reading must be a valid number.',
  currentPageExceedsTotal:
    'Current page cannot be higher than the total number of pages.',
};

export const updateListErrorMessages = {
  userNotLoggedInList: 'User must be logged in to update list details.',
  listNotFound: 'List not found.',
  unknownError: 'An unknown error occurred. Please try again.',
};
