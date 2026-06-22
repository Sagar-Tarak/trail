import type { FilterDef } from "@/layouts/MasterTablePage";

export const activityFilters: FilterDef[] = [
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
    key: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "Success", value: "success" },
      { label: "Info", value: "info" },
      { label: "Warning", value: "warning" },
      { label: "Error", value: "error" },
    ],
  },
  {
    key: "severity",
    label: "Severity",
    type: "multi-select",
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Critical", value: "critical" },
    ],
  },
  {
    key: "dateRange",
    label: "Date Range",
    type: "date-range",
  },
  {
    key: "user",
    label: "User",
    type: "text",
    placeholder: "Search by user name or email…",
  },
  {
    key: "duration",
    label: "Duration (ms)",
    type: "number-range",
  },
];
