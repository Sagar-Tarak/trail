export type UserStatus = "active" | "inactive" | "suspended";
export type UserRole = "admin" | "manager" | "analyst" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  module: string;
  status: UserStatus;
  lastLogin: string;
  eventCount: number;
  createdAt: string;
  mfaEnabled: boolean;
}
