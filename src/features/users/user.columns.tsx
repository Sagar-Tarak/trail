import type { ColumnDef } from "@/layouts/MasterTablePage";
import type { User, UserStatus, UserRole } from "./user.types";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";

const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  suspended: "bg-red-50 text-red-600",
};

const STATUS_DOT: Record<UserStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  suspended: "bg-red-500",
};

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-purple-50 text-purple-700",
  manager: "bg-sky-50 text-sky-700",
  analyst: "bg-indigo-50 text-indigo-700",
  viewer: "bg-gray-100 text-gray-600",
};

export const userColumns: ColumnDef<User>[] = [
  {
    key: "name",
    title: "User",
    defaultVisible: true,
    sortable: true,
    render: (_, u) => (
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
            {u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${STATUS_DOT[u.status]}`}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{u.name}</p>
          <p className="text-[11px] text-gray-400">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    title: "Role",
    dataIndex: "role",
    sortable: true,
    defaultVisible: true,
    render: (v) => (
      <span
        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${ROLE_STYLES[v as UserRole]}`}
      >
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
      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
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
      const s = v as UserStatus;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[s]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
          {s}
        </span>
      );
    },
  },
  {
    key: "eventCount",
    title: "Events",
    dataIndex: "eventCount",
    sortable: true,
    align: "right",
    defaultVisible: true,
    render: (v) => (
      <span className="tabular-nums text-xs font-semibold text-gray-800">
        {Number(v).toLocaleString()}
      </span>
    ),
  },
  {
    key: "mfaEnabled",
    title: "MFA",
    dataIndex: "mfaEnabled",
    defaultVisible: true,
    align: "center",
    render: (v) =>
      v ? (
        <span title="MFA enabled" className="text-emerald-500">
          <LockOutlined className="text-base" />
        </span>
      ) : (
        <span title="MFA disabled" className="text-gray-300">
          <UnlockOutlined className="text-base" />
        </span>
      ),
  },
  {
    key: "lastLogin",
    title: "Last Login",
    dataIndex: "lastLogin",
    sortable: true,
    defaultVisible: true,
    render: (v) => <span className="text-xs text-gray-400">{String(v)}</span>,
  },
  {
    key: "createdAt",
    title: "Created",
    dataIndex: "createdAt",
    sortable: true,
    defaultVisible: false,
    render: (v) => <span className="text-xs text-gray-400">{String(v)}</span>,
  },
];
