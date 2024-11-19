export interface UserCredentials {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface UserMetadata {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarURL: string;
  email: string;
  bio: string;
  isAdmin: boolean;
}
