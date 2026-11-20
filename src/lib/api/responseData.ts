import type { LoginResponse, Tenant, User } from "../auth/auth.types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function checkResponse(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (!isRecord(value) || typeof value.statusCode !== "number") {
    throw new Error(
      "The backend returned an unexpected response. Please refresh or contact support.",
    );
  }
  if (
    value.success === false ||
    value.statusCode < 200 ||
    value.statusCode >= 300
  ) {
    throw new Error(
      typeof value.message === "string"
        ? value.message
        : "The backend could not complete the request.",
    );
  }
}

export function readResponseData<T>(value: unknown): T {
  checkResponse(value);
  if (
    !Object.hasOwn(value, "data") ||
    value.data === undefined ||
    value.data === null
  ) {
    throw new Error(
      "The backend response did not include the requested data. Please retry.",
    );
  }
  return value.data as T;
}

export function readAuthResponse(value: unknown): LoginResponse {
  const data = readResponseData<unknown>(value);
  if (
    !isRecord(value) ||
    !isRecord(data) ||
    !isRecord(data.user) ||
    !isRecord(data.tenant) ||
    typeof value.token !== "string" ||
    !value.token ||
    !["id", "name", "user_name", "email", "role"].every(
      (key) => typeof (data.user as Record<string, unknown>)[key] === "string",
    ) ||
    !["id", "company_name", "industry"].every(
      (key) =>
        typeof (data.tenant as Record<string, unknown>)[key] === "string",
    ) ||
    !(data.tenant.slug === null || typeof data.tenant.slug === "string")
  ) {
    throw new Error(
      "The backend did not return a valid company session. Please sign in again.",
    );
  }
  return {
    user: data.user as unknown as User,
    tenant: data.tenant as unknown as Tenant,
    tokens: { accessToken: value.token },
  };
}
