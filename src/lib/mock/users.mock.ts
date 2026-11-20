import type { ApiQueryParams } from "@/lib/api/types";
import { delay, parseParams, sortItems, paginate } from "./mockUtils";
import type { User, UserStatus, UserRole } from "@/features/users/user.types";

const MODULES = [
  "Finance",
  "HRMS",
  "CRM",
  "TMS",
  "Inventory",
  "Payroll",
  "Compliance",
];
const ROLES: UserRole[] = ["admin", "manager", "analyst", "analyst", "viewer"];
const STATUSES: UserStatus[] = [
  "active",
  "active",
  "active",
  "inactive",
  "suspended",
];

const NAMES = [
  "Priya Mehta",
  "Rohan Das",
  "Sita Rao",
  "Arjun Singh",
  "Meena Patel",
  "Kiran Nair",
  "Dev Sharma",
  "Anita Kumar",
  "Raj Verma",
  "Pooja Shah",
  "Anil Gupta",
  "Nisha Reddy",
  "Vikram Joshi",
  "Lakshmi Iyer",
  "Suresh Babu",
  "Divya Krishnan",
  "Rahul Chopra",
  "Sneha Pillai",
  "Amit Tiwari",
  "Ritu Bansal",
  "Prasad Naidu",
  "Kavya Menon",
  "Girish Tiwari",
  "Vandana Yadav",
  "Sanjay Pillai",
];

const TOTAL_RECORDS = 500;

function generateUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => {
    const baseName = NAMES[i % NAMES.length];
    const suffix =
      i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : "";
    const name = baseName + suffix;
    const created = new Date(
      Date.now() - (365 - (i % 365)) * 24 * 60 * 60 * 1000,
    );
    const lastLogin = new Date(
      Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 3 * 60 * 60 * 1000,
    );
    return {
      id: `USR-${String(i + 1).padStart(5, "0")}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@corp.com`,
      role: ROLES[i % ROLES.length],
      module: MODULES[i % MODULES.length],
      status: STATUSES[i % STATUSES.length],
      lastLogin: lastLogin
        .toLocaleString("en-IN", { hour12: false })
        .replace(",", ""),
      createdAt: created.toLocaleDateString("en-IN"),
      eventCount: Math.floor(100 + ((i * 137) % 5000)),
      mfaEnabled: i % 3 !== 0,
    };
  });
}

const DB: User[] = generateUsers(TOTAL_RECORDS);

export async function fetchUsersFromServer(
  params: ApiQueryParams,
  signal?: AbortSignal,
) {
  await delay(60, signal);

  const { search, sortKey, sortDir, page, pageSize, filters } =
    parseParams(params);

  let items = DB;

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.module.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }

  if (Array.isArray(filters.status) && filters.status.length > 0) {
    items = items.filter((u) =>
      (filters.status as string[]).includes(u.status),
    );
  }
  if (Array.isArray(filters.role) && filters.role.length > 0) {
    items = items.filter((u) => (filters.role as string[]).includes(u.role));
  }
  if (filters.module) {
    items = items.filter((u) => u.module === filters.module);
  }
  if (
    filters.mfaEnabled !== null &&
    filters.mfaEnabled !== undefined &&
    filters.mfaEnabled !== ""
  ) {
    const want = filters.mfaEnabled === true || filters.mfaEnabled === "true";
    items = items.filter((u) => u.mfaEnabled === want);
  }
  if (filters.eventCount && typeof filters.eventCount === "object") {
    const r = filters.eventCount as { min?: number; max?: number };
    if (r.min !== undefined)
      items = items.filter((u) => u.eventCount >= r.min!);
    if (r.max !== undefined)
      items = items.filter((u) => u.eventCount <= r.max!);
  }

  if (sortKey && sortDir) {
    items = sortItems(items, sortKey, sortDir);
  }

  return paginate(items, page, pageSize, "id");
}
