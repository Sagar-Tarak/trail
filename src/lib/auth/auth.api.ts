import type { LoginCredentials, LoginResponse } from "./auth.types";

// ---------------------------------------------------------------------------
// Swap these functions for real API calls when the backend is ready.
// Every function has the same signature it will have in production.
// ---------------------------------------------------------------------------

/** POST /auth/login */
export async function apiLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  // --- MOCK ---
  await new Promise((r) => setTimeout(r, 800)); // simulate network

  if (credentials.email === "demo@trail.app" && credentials.password === "password") {
    return {
      user: {
        id: "usr_1",
        email: "demo@trail.app",
        name: "Demo User",
        role: "admin",
      },
      tokens: {
        accessToken: "mock-access-token",
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 h
      },
    };
  }

  throw new Error("Invalid email or password");
  // --- END MOCK ---

  // Real implementation (uncomment when API is ready):
  // const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials);
  // return data;
}

/** POST /auth/logout */
export async function apiLogout(): Promise<void> {
  // --- MOCK ---
  await new Promise((r) => setTimeout(r, 200));
  // --- END MOCK ---

  // Real implementation:
  // await apiClient.post("/auth/logout");
}
