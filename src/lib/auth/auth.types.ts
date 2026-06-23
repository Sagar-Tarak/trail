export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "viewer" | "editor";
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  /** ISO datetime string — when the access token expires */
  expiresAt: string;
  refreshToken?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
