// Base user properties that are common across all user types
export interface UserBase {
  id: string;
  email: string;
}

// Extended user metadata with full profile information
export interface UserMetadata extends UserBase {
  firstName: string;
  lastName: string;
  username: string;
  avatarURL: string;
  bio: string;
  isAdmin: boolean;
}

// Authentication credentials - kept separate as it's for sign-up/login only
export interface UserCredentials {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

// Type alias for basic user type for simpler use cases
export type User = UserBase;
