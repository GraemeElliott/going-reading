export interface UserCredentials {
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password: string;
}

export interface UserMetadata {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarURL: string;
  bio: string;
  isAdmin: boolean;
}

export interface UserPartialData {
  id: string;
  email: string;
}
