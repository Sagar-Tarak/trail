import { apiClient } from "@/lib/api/client";
import { readAuthResponse } from "@/lib/api/responseData";
import type { LoginCredentials, SignupCredentials } from "./auth.types";
const normalize = readAuthResponse;
export async function apiLogin(values: LoginCredentials) {
  return normalize(
    (await apiClient.post<unknown>("/auth/log-in", values)).data,
  );
}
export async function apiSignup(values: SignupCredentials) {
  return normalize(
    (
      await apiClient.post<unknown>("/auth/sign-up", {
        name: values.name,
        user_name: values.user_name,
        email: values.email,
        password: values.password,
        company_name: values.company_name,
        slug: values.slug,
        industry: values.industry,
        role: "ADMIN",
      })
    ).data,
  );
}
export async function apiCheckToken() {
  return normalize(
    (await apiClient.post<unknown>("/auth/check-token", {})).data,
  );
}
export async function apiLogout() {
  await apiClient.post("/auth/log-out", {});
}
