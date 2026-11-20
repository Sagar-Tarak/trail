import type { ColumnDef } from "@/layouts/MasterTablePage";
import type {
  Activity,
  ActivityStatus,
  ActivitySeverity,
} from "./activity.types";

const STATUS_STYLES: Record<ActivityStatus, string> = {
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-indigo-50 text-indigo-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-600",
};

const SEVERITY_STYLES: Record<ActivitySeverity, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-50 text-yellow-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-100 text-red-800 font-bold",
};

const MODULE_COLORS: Record<string, string> = {
  Finance: "bg-sky-100 text-sky-700",
  HRMS: "bg-violet-100 text-violet-700",
  CRM: "bg-emerald-100 text-emerald-700",
  TMS: "bg-purple-100 text-purple-700",
  Inventory: "bg-amber-100 text-amber-700",
};

export const activityColumns: ColumnDef<Activity>[] = [
  {
    key: "timestamp",
    title: "Timestamp",
    dataIndex: "timestamp",
    sortable: true,
    width: 160,
    defaultVisible: true,
    render: (v) => (
      // tabular-nums keeps digits from jumping around as you scroll
      <span className="text-xs text-gray-500 tabular-nums">{String(v)}</span>
    ),
  },
  {
    key: "user",
    title: "User",
    defaultVisible: true,
    render: (_, a) => (
      <div className="flex items-center gap-2.5">
        {/* initials avatar — take first letter of each name word, cap at 2 chars */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
          {a.user
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{a.user}</p>
          <p className="text-[11px] text-gray-400">{a.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "action",
    title: "Action",
    dataIndex: "action",
    defaultVisible: true,
    render: (v) => (
      <span className="max-w-xs truncate text-xs text-gray-700">
        {String(v)}
      </span>
    ),
  },
  {
    key: "module",
    title: "Module",
    dataIndex: "module",
    sortable: true,
    defaultVisible: true,
    render: (v) => (
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${MODULE_COLORS[String(v)] ?? "bg-gray-100 text-gray-600"}`}
      >
        {String(v)}
      </span>
    ),
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    sortable: true,
    defaultVisible: true,
    render: (v) => {
      const s = v as ActivityStatus;
      // dot color is slightly different from the badge color to add visual weight
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[s]}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${s === "success" ? "bg-emerald-500" : s === "error" ? "bg-red-500" : s === "warning" ? "bg-amber-400" : "bg-indigo-500"}`}
          />
          {s}
        </span>
      );
    },
  },
  {
    key: "severity",
    title: "Severity",
    dataIndex: "severity",
    sortable: true,
    defaultVisible: true,
    render: (v) => (
      <span
        className={`rounded-md px-2 py-0.5 text-[11px] capitalize ${SEVERITY_STYLES[v as ActivitySeverity]}`}
      >
        {String(v)}
      </span>
    ),
  },
  {
    key: "ipAddress",
    title: "IP Address",
    dataIndex: "ipAddress",
    defaultVisible: false, // hidden by default, not useful in most views
    render: (v) => (
      <span className="font-mono text-xs text-gray-500">{String(v)}</span>
    ),
  },
  {
    key: "duration",
    title: "Duration",
    dataIndex: "duration",
    sortable: true,
    align: "right",
    defaultVisible: false,
    render: (v) => (
      <span className="tabular-nums text-xs text-gray-500">
        {Number(v).toLocaleString()} ms
      </span>
    ),
  },
];
