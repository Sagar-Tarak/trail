import { userColumns } from "./user.columns";
import { userFilters } from "./user.filters";
import { useUsersQuery } from "./user.query";
import { UserDrawer } from "./user.drawer";
import type { User } from "./user.types";
import type {
  MasterTableConfig,
  RowAction,
  ToolbarAction,
  BulkAction,
} from "@/layouts/MasterTablePage";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

const rowActions: RowAction<User>[] = [
  {
    key: "edit",
    label: "Edit",
    icon: <EditOutlined />,
    onClick: (u) => alert(`Editing ${u.name}`),
  },
  {
    key: "suspend",
    label: "Suspend",
    danger: true,
    show: (u) => u.status === "active",
    onClick: (u) => confirm(`Suspend ${u.name}?`),
  },
  {
    key: "activate",
    label: "Activate",
    show: (u) => u.status !== "active",
    onClick: (u) => alert(`Activating ${u.name}`),
  },
];

const toolbarActions: ToolbarAction[] = [
  {
    key: "add-user",
    label: "Add User",
    variant: "primary",
    icon: <PlusOutlined />,
    onClick: () => alert("Open add user form"),
  },
];

const bulkActions: BulkAction<User>[] = [
  {
    key: "bulk-activate",
    label: "Activate",
    show: (rows) => rows.some((r) => r.status !== "active"),
    onClick: (rows) => alert(`Activating ${rows.length} users`),
  },
  {
    key: "bulk-suspend",
    label: "Suspend",
    danger: true,
    show: (rows) => rows.some((r) => r.status === "active"),
    onClick: (rows) => confirm(`Suspend ${rows.length} users?`),
  },
];

export const userConfig: MasterTableConfig<User> = {
  title: "Users",
  subtitle: "Manage user accounts, roles, and access across all modules.",
  breadcrumbs: [{ label: "Home" }, { label: "Users" }],
  rowKey: "id",
  persistenceKey: "users-v1",
  searchPlaceholder: "Search by name, email, module…",
  defaultPageSize: 20,

  columns: userColumns,
  filters: userFilters,
  rowActions,
  toolbarActions,
  bulkActions,

  queryHook: useUsersQuery,

  drawer: {
    component: UserDrawer,
    width: 420,
    title: (u) => u.name,
  },

  permissions: {
    create: true,
    edit: true,
    delete: false,
    export: true,
  },

  emptyState: {
    title: "No users found",
    description: "Try adjusting your search or filters, or add a new user.",
  },
};
