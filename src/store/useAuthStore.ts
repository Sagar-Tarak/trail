import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiLogin, apiLogout } from "@/lib/auth/auth.api";
import type { User, LoginCredentials, AuthTokens } from "@/lib/auth/auth.types";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const { user, tokens } = await apiLogin(credentials);
        set({ user, tokens, isAuthenticated: true });
      },

      logout: async () => {
        await apiLogout().catch(() => {}); // best-effort server-side invalidation
        set({ user: null, tokens: null, isAuthenticated: false });
      },
    }),
    {
      name: "trail-auth",
      // Only persist identity — never the raw password or full token tree
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
