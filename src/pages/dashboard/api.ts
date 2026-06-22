export interface DashboardStats {
  totalUsers: number;
  totalActivities: number;
  errorCount: number;
  successRate: number;
  usersDelta: number;
  activitiesDelta: number;
  errorDelta: number;
  successRateDelta: number;
}

export interface ModuleStat {
  module: string;
  count: number;
  errors: number;
}

export interface StatusDistribution {
  status: "success" | "warning" | "error" | "info";
  count: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  module: string;
  status: "success" | "warning" | "error" | "info";
  time: string;
}

export interface DashboardData {
  stats: DashboardStats;
  moduleStats: ModuleStat[];
  statusDistribution: StatusDistribution[];
  activityTrend: TrendPoint[];
  recentActivities: RecentActivity[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/v1/dashboard`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  const json = await res.json();
  // Backend wraps in { statusCode, data, message }
  return (json.data ?? json) as DashboardData;
}
