const USERS = [
  {
    name: "Priya Mehta",
    module: "Finance",
    events: 1842,
    avatar: "PM",
    color: "bg-sky-100 text-sky-700",
  },
  {
    name: "Rohan Das",
    module: "HRMS",
    events: 1560,
    avatar: "RD",
    color: "bg-violet-100 text-violet-700",
  },
  {
    name: "Sita Rao",
    module: "CRM",
    events: 1340,
    avatar: "SR",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Arjun Singh",
    module: "TMS",
    events: 1120,
    avatar: "AS",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Meena Patel",
    module: "Inventory",
    events: 980,
    avatar: "MP",
    color: "bg-amber-100 text-amber-700",
  },
];

const max = Math.max(...USERS.map((u) => u.events));

export function TopUsersCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Top Users</h3>
        <p className="text-xs text-gray-400 mt-0.5">By event count this week</p>
      </div>

      <div className="space-y-3">
        {USERS.map((u, i) => (
          <div key={u.name} className="flex items-center gap-3">
            <span className="w-3 text-xs text-gray-300 font-medium">
              {i + 1}
            </span>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${u.color}`}
            >
              {u.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-medium text-gray-700">
                  {u.name}
                </span>
                <span className="ml-2 shrink-0 text-xs font-semibold text-gray-800">
                  {u.events.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                  style={{ width: `${(u.events / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
