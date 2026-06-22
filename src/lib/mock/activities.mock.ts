import type { ApiQueryParams } from "@/lib/api/types";
import { delay, parseParams, sortItems, paginate } from "./mockUtils";
import type { Activity, ActivityStatus, ActivitySeverity } from "@/features/activities/activity.types";

const USERS = [
  { name: "Priya Mehta", email: "priya@corp.com" },
  { name: "Rohan Das", email: "rohan@corp.com" },
  { name: "Sita Rao", email: "sita@corp.com" },
  { name: "Arjun Singh", email: "arjun@corp.com" },
  { name: "Meena Patel", email: "meena@corp.com" },
  { name: "Kiran Nair", email: "kiran@corp.com" },
  { name: "Dev Sharma", email: "dev@corp.com" },
  { name: "Anita Kumar", email: "anita@corp.com" },
  { name: "Raj Verma", email: "raj@corp.com" },
  { name: "Pooja Shah", email: "pooja@corp.com" },
  { name: "Anil Gupta", email: "anil@corp.com" },
  { name: "Nisha Reddy", email: "nisha@corp.com" },
  { name: "Vikram Joshi", email: "vikram@corp.com" },
  { name: "Lakshmi Iyer", email: "lakshmi@corp.com" },
  { name: "Suresh Babu", email: "suresh@corp.com" },
  { name: "Divya Krishnan", email: "divya@corp.com" },
];

const MODULES = ["Finance", "HRMS", "CRM", "TMS", "Inventory", "Payroll", "Compliance"];
const STATUSES: ActivityStatus[] = ["success", "success", "success", "info", "warning", "error"];
const SEVERITIES: ActivitySeverity[] = ["low", "low", "medium", "medium", "high", "critical"];
const ACTIONS = [
  "User login", "User logout", "Record created", "Record updated", "Record deleted",
  "Report exported", "Bulk import", "Permission changed", "Password reset",
  "Invoice approved", "Payment processed", "Stock adjusted", "Route optimised",
  "Config changed", "Role assigned", "Data archived", "API key generated",
  "Audit log accessed", "Backup initiated", "Alert acknowledged",
];

const TOTAL_RECORDS = 10_000;

function generateActivities(count: number): Activity[] {
  return Array.from({ length: count }, (_, i) => {
    const user = USERS[i % USERS.length];
    // spread evenly over the last year so the date range filter actually has something to work with
    const msAgo = (i / count) * 365 * 24 * 60 * 60 * 1000;
    const d = new Date(Date.now() - msAgo);
    return {
      id: `ACT-${String(i + 1).padStart(7, "0")}`,
      timestamp: d.toLocaleString("en-IN", { hour12: false }).replace(",", ""),
      user: user.name,
      email: user.email,
      action: ACTIONS[i % ACTIONS.length],
      module: MODULES[i % MODULES.length],
      status: STATUSES[i % STATUSES.length],
      severity: SEVERITIES[(i * 3) % SEVERITIES.length],
      ipAddress: `10.${(i % 5) + 1}.${(i % 10) + 1}.${(i % 50) + 10}`,
      duration: 50 + (i * 37) % 5000,
      recordId: i % 4 === 0 ? `REC-${String(i * 7).padStart(6, "0")}` : undefined,
    };
  });
}

// generated once at module load — pretend this is a pre-populated DB table
const DB: Activity[] = generateActivities(TOTAL_RECORDS);

export async function fetchActivitiesFromServer(
  params: ApiQueryParams,
  signal?: AbortSignal
) {
  // tweak this if loading states feel too fast/slow in dev
  await delay(80, signal);

  const { search, sortKey, sortDir, page, pageSize, filters } = parseParams(params);

  let items = DB;

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (a) =>
        a.user.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }

  if (filters.module) {
    items = items.filter((a) => a.module === filters.module);
  }
  if (Array.isArray(filters.status) && filters.status.length > 0) {
    items = items.filter((a) => (filters.status as string[]).includes(a.status));
  }
  if (Array.isArray(filters.severity) && filters.severity.length > 0) {
    items = items.filter((a) => (filters.severity as string[]).includes(a.severity));
  }
  if (filters.user) {
    const q = String(filters.user).toLowerCase();
    items = items.filter(
      (a) => a.user.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }
  if (filters.dateRange && typeof filters.dateRange === "object") {
    const r = filters.dateRange as { from?: string; to?: string };
    if (r.from) {
      const from = new Date(r.from).getTime();
      items = items.filter((a) => new Date(a.timestamp).getTime() >= from);
    }
    if (r.to) {
      // add a day so the "to" date is inclusive
      const to = new Date(r.to).getTime() + 86_400_000;
      items = items.filter((a) => new Date(a.timestamp).getTime() <= to);
    }
  }
  if (filters.duration && typeof filters.duration === "object") {
    const r = filters.duration as { min?: number; max?: number };
    if (r.min !== undefined) items = items.filter((a) => a.duration >= r.min!);
    if (r.max !== undefined) items = items.filter((a) => a.duration <= r.max!);
  }

  if (sortKey && sortDir) {
    items = sortItems(items, sortKey, sortDir);
  }

  return paginate(items, page, pageSize, "id");
}
