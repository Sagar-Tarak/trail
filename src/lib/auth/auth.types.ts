export interface User {
  id: string;
  email: string;
  name: string;
  user_name: string;
  role: string;
}
export interface Tenant {
  id: string;
  company_name: string;
  slug: string | null;
  industry: string;
}
export interface LoginCredentials {
  email?: string;
  user_name?: string;
  password: string;
}
export interface SignupCredentials extends LoginCredentials {
  email: string;
  name: string;
  user_name: string;
  company_name: string;
  slug: string;
  industry: string;
}
export interface AuthTokens {
  accessToken: string;
}
export interface LoginResponse {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}
