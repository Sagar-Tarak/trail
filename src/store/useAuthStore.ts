import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiLogin, apiLogout, apiSignup } from "@/lib/auth/auth.api";
import type {
  User,
  Tenant,
  LoginCredentials,
  SignupCredentials,
  AuthTokens,
} from "@/lib/auth/auth.types";
interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (values: LoginCredentials) => Promise<void>;
  signup: (values: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      tokens: null,
      isAuthenticated: false,
      login: async (values) => {
        set({ ...(await apiLogin(values)), isAuthenticated: true });
      },
      signup: async (values) => {
        set({ ...(await apiSignup(values)), isAuthenticated: true });
      },
      logout: async () => {
        await apiLogout().catch(() => {});
        set({ user: null, tenant: null, tokens: null, isAuthenticated: false });
      },
      clear: () =>
        set({ user: null, tenant: null, tokens: null, isAuthenticated: false }),
    }),
    {
      name: "trail-auth",
      version: 2,
      partialize: ({ user, tenant, tokens, isAuthenticated }) => ({
        user,
        tenant,
        tokens,
        isAuthenticated,
      }),
    },
  ),
);
