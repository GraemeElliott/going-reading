export interface UserCredentials {
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password: string;
}

export interface UserMetadata {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarURL: string;
  bio: string;
  isAdmin: boolean;
}

export interface UserPartialData {
  id: string;
  email: string;
}
