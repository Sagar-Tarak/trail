import type { FilterDef } from "@/layouts/MasterTablePage";

export const userFilters: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Suspended", value: "suspended" },
    ],
  },
  {
    key: "role",
    label: "Role",
    type: "multi-select",
    options: [
      { label: "Admin", value: "admin" },
      { label: "Manager", value: "manager" },
      { label: "Analyst", value: "analyst" },
      { label: "Viewer", value: "viewer" },
    ],
  },
  {
    key: "module",
    label: "Module",
    type: "select",
    options: [
      { label: "Finance", value: "Finance" },
      { label: "HRMS", value: "HRMS" },
      { label: "CRM", value: "CRM" },
      { label: "TMS", value: "TMS" },
      { label: "Inventory", value: "Inventory" },
    ],
  },
  {
    key: "mfaEnabled",
    label: "MFA Enabled",
    type: "boolean",
  },
  {
    key: "eventCount",
    label: "Event Count",
    type: "number-range",
  },
];
