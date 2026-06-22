import { useQuery } from "@tanstack/react-query";
import {
  TeamOutlined, ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { fetchDashboardData } from "./api";
import { StatCard } from "./components/StatCard";
import { ModuleBarChart } from "./components/ModuleBarChart";
import { StatusDonut } from "./components/StatusDonut";
import { ActivityTrendChart } from "./components/ActivityTrendChart";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { TopUsersCard } from "./components/TopUsersCard";
import { PageShell } from "@/components/page";

// last 7 days of mock data for the stat card sparklines
// replace with real historical API data when the endpoint exists
const SPARK_USERS = [980, 1020, 1100, 1050, 1180, 1240, 1284];
const SPARK_ACTIVITY = [36000, 38200, 41000, 39500, 44200, 46800, 48302];
const SPARK_ERRORS = [310, 285, 260, 290, 245, 250, 237];
const SPARK_SUCCESS = [96.1, 96.4, 96.8, 96.5, 97.0, 97.2, 97.4];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-gray-200 lg:col-span-2" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
    >
      <ReloadOutlined className="text-xs" />
      Refresh
    </button>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    // dashboard data doesn't change that fast, 1 minute feels right
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
        <p className="text-sm font-medium text-red-700">Failed to load dashboard data</p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, moduleStats, statusDistribution, activityTrend, recentActivities } = data!;

  return (
    <PageShell
      title="Dashboard"
      subtitle="Welcome back — here's what's happening today."
      actions={
        <>
          <RefreshButton onClick={() => refetch()} />
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-400 shadow-sm">
            Last updated: just now
          </span>
        </>
      }
    >
      {/* top row — 4 KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          delta={stats.usersDelta}
          sparkData={SPARK_USERS}
          sparkColor="#6366f1"
          iconBg="bg-indigo-100"
          icon={<TeamOutlined className="text-xl text-indigo-600" />}
        />
        <StatCard
          label="Total Activities"
          value={stats.totalActivities}
          delta={stats.activitiesDelta}
          sparkData={SPARK_ACTIVITY}
          sparkColor="#0ea5e9"
          iconBg="bg-sky-100"
          icon={<ThunderboltOutlined className="text-xl text-sky-600" />}
        />
        <StatCard
          label="Errors This Week"
          value={stats.errorCount}
          delta={stats.errorDelta}
          sparkData={SPARK_ERRORS}
          sparkColor="#f43f5e"
          iconBg="bg-red-100"
          icon={<WarningOutlined className="text-xl text-red-500" />}
        />
        <StatCard
          label="Success Rate"
          value={stats.successRate}
          delta={stats.successRateDelta}
          sparkData={SPARK_SUCCESS}
          sparkColor="#10b981"
          iconBg="bg-emerald-100"
          suffix="%"
          icon={<CheckCircleOutlined className="text-xl text-emerald-600" />}
        />
      </div>

      {/* full-width trend chart */}
      <ActivityTrendChart data={activityTrend} />

      {/* 3/5 + 2/5 split — bar chart gets more space since it has more categories */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ModuleBarChart data={moduleStats} />
        </div>
        <div className="lg:col-span-2">
          <StatusDonut data={statusDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivityFeed data={recentActivities} />
        </div>
        <div className="lg:col-span-2">
          <TopUsersCard />
        </div>
      </div>
    </PageShell>
  );
}
