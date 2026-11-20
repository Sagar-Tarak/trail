import { PageShell, DataTable, type TableColumn } from "@/components/page";

interface User {
  id: string;
  name: string;
  email: string;
  module: string;
  role: string;
  events: number;
  status: "active" | "inactive" | "suspended";
  lastSeen: string;
}

const USERS: User[] = [
  {
    id: "1",
    name: "Priya Mehta",
    email: "priya@example.com",
    module: "Finance",
    role: "Manager",
    events: 1842,
    status: "active",
    lastSeen: "2 min ago",
  },
  {
    id: "2",
    name: "Rohan Das",
    email: "rohan@example.com",
    module: "HRMS",
    role: "Analyst",
    events: 1560,
    status: "active",
    lastSeen: "8 min ago",
  },
  {
    id: "3",
    name: "Sita Rao",
    email: "sita@example.com",
    module: "CRM",
    role: "Executive",
    events: 1340,
    status: "active",
    lastSeen: "15 min ago",
  },
  {
    id: "4",
    name: "Arjun Singh",
    email: "arjun@example.com",
    module: "TMS",
    role: "Admin",
    events: 1120,
    status: "inactive",
    lastSeen: "2 hrs ago",
  },
  {
    id: "5",
    name: "Meena Patel",
    email: "meena@example.com",
    module: "Inventory",
    role: "Analyst",
    events: 980,
    status: "active",
    lastSeen: "30 min ago",
  },
  {
    id: "6",
    name: "Kiran Nair",
    email: "kiran@example.com",
    module: "HRMS",
    role: "Manager",
    events: 860,
    status: "active",
    lastSeen: "1 hr ago",
  },
  {
    id: "7",
    name: "Dev Sharma",
    email: "dev@example.com",
    module: "Finance",
    role: "Analyst",
    events: 720,
    status: "suspended",
    lastSeen: "3 days ago",
  },
  {
    id: "8",
    name: "Anita Kumar",
    email: "anita@example.com",
    module: "CRM",
    role: "Executive",
    events: 660,
    status: "active",
    lastSeen: "5 min ago",
  },
  {
    id: "9",
    name: "Raj Verma",
    email: "raj@example.com",
    module: "TMS",
    role: "Analyst",
    events: 540,
    status: "inactive",
    lastSeen: "1 day ago",
  },
  {
    id: "10",
    name: "Pooja Shah",
    email: "pooja@example.com",
    module: "Finance",
    role: "Manager",
    events: 490,
    status: "active",
    lastSeen: "20 min ago",
  },
  {
    id: "11",
    name: "Anil Gupta",
    email: "anil@example.com",
    module: "Inventory",
    role: "Admin",
    events: 410,
    status: "active",
    lastSeen: "45 min ago",
  },
  {
    id: "12",
    name: "Nisha Reddy",
    email: "nisha@example.com",
    module: "HRMS",
    role: "Analyst",
    events: 380,
    status: "suspended",
    lastSeen: "5 days ago",
  },
];

const STATUS_BADGE: Record<User["status"], string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  suspended: "bg-red-50 text-red-600",
};

const COLUMNS: TableColumn<User>[] = [
  {
    key: "name",
    title: "User",
    searchable: true,
    sortable: true,
    render: (_, u) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
          {u.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{u.name}</p>
          <p className="text-[11px] text-gray-400">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "module",
    title: "Module",
    dataIndex: "module",
    sortable: true,
    searchable: true,
    render: (v) => (
      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
        {String(v)}
      </span>
    ),
  },
  {
    key: "role",
    title: "Role",
    dataIndex: "role",
    sortable: true,
    searchable: true,
  },
  {
    key: "events",
    title: "Events",
    dataIndex: "events",
    sortable: true,
    align: "right",
    render: (v) => (
      <span className="text-xs font-semibold text-gray-800">
        {Number(v).toLocaleString()}
      </span>
    ),
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    sortable: true,
    render: (v) => {
      const s = v as User["status"];
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGE[s]}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${s === "active" ? "bg-emerald-500" : s === "suspended" ? "bg-red-500" : "bg-gray-400"}`}
          />
          {s}
        </span>
      );
    },
  },
  {
    key: "lastSeen",
    title: "Last Seen",
    dataIndex: "lastSeen",
    render: (v) => <span className="text-xs text-gray-400">{String(v)}</span>,
  },
  {
    key: "actions",
    title: "",
    width: 80,
    align: "right",
    render: (_, u) => (
      <div className="flex items-center justify-end gap-1">
        <button
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Edit ${u.name}`);
          }}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
            />
          </svg>
        </button>
        <button
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Delete ${u.name}`);
          }}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1h6V4a1 1 0 00-1-1m-4 0h4"
            />
          </svg>
        </button>
      </div>
    ),
  },
];

export function UsersPage() {
  return (
    <PageShell
      title="Users"
      subtitle="Manage system users and their access across all modules."
      breadcrumbs={[{ label: "Home" }, { label: "Users" }]}
      actions={
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add User
        </button>
      }
    >
      <DataTable
        data={USERS}
        columns={COLUMNS}
        rowKey="id"
        title="All Users"
        subtitle={`${USERS.length} users registered`}
        searchable
        searchPlaceholder="Search by name, email, module…"
        pageSize={8}
        onRowClick={(u) => console.log("clicked", u)}
      />
    </PageShell>
  );
}
