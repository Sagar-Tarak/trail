import type { RecentActivity } from "../api";

const STATUS_STYLES = {
  success: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Success" },
  error:   { dot: "bg-red-500",     badge: "bg-red-50 text-red-600",         label: "Error" },
  warning: { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700",     label: "Warning" },
  info:    { dot: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700",   label: "Info" },
};

const MODULE_INITIALS: Record<string, string> = {
  Finance: "FN",
  HRMS: "HR",
  CRM: "CR",
  TMS: "TM",
  Inventory: "IN",
};

const MODULE_COLORS: Record<string, string> = {
  Finance: "bg-sky-100 text-sky-700",
  HRMS: "bg-violet-100 text-violet-700",
  CRM: "bg-emerald-100 text-emerald-700",
  TMS: "bg-purple-100 text-purple-700",
  Inventory: "bg-amber-100 text-amber-700",
};

interface Props {
  data: RecentActivity[];
}

export function RecentActivityFeed({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">Live feed across all modules</p>
        </div>
        <button className="text-xs font-medium text-indigo-600 hover:underline">View all</button>
      </div>

      <ul className="divide-y divide-gray-50">
        {data.map((item) => {
          const st = STATUS_STYLES[item.status];
          const modColor = MODULE_COLORS[item.module] ?? "bg-gray-100 text-gray-600";
          const initials = MODULE_INITIALS[item.module] ?? item.module.slice(0, 2).toUpperCase();

          return (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              {/* Module avatar */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${modColor}`}>
                {initials}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-800">{item.action}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {item.user} · {item.module}
                </p>
              </div>

              {/* Right side */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <span className="text-[10px] text-gray-400">{item.time}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
