import type { RowAction, ToolbarAction, BulkAction } from "@/layouts/MasterTablePage";
import type { Activity } from "./activity.types";
import { CopyOutlined, FlagOutlined, DeleteOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";

export const activityRowActions: RowAction<Activity>[] = [
  {
    key: "copy-id",
    label: "Copy ID",
    icon: <CopyOutlined />,
    onClick: (a) => navigator.clipboard?.writeText(a.id),
  },
  {
    key: "flag",
    label: "Flag for review",
    icon: <FlagOutlined />,
    onClick: (a) => alert(`Flagged: ${a.id}`),
    show: (a) => a.severity !== "low",
  },
  {
    key: "delete",
    label: "Delete",
    danger: true,
    icon: <DeleteOutlined />,
    onClick: (a) => confirm(`Delete activity ${a.id}?`),
  },
];

export const activityToolbarActions: ToolbarAction[] = [
  {
    key: "export-report",
    label: "Export Report",
    variant: "primary",
    icon: <FileTextOutlined />,
    onClick: () => alert("Generating report…"),
  },
];

export const activityBulkActions: BulkAction<Activity>[] = [
  {
    key: "bulk-export",
    label: "Export selected",
    icon: <DownloadOutlined />,
    onClick: (rows) => alert(`Exporting ${rows.length} activities`),
  },
  {
    key: "bulk-flag",
    label: "Flag all",
    icon: <FlagOutlined />,
    onClick: (rows) => alert(`Flagging ${rows.length} activities`),
  },
  {
    key: "bulk-delete",
    label: "Delete selected",
    danger: true,
    icon: <DeleteOutlined />,
    onClick: (rows) => confirm(`Delete ${rows.length} activities?`),
  },
];
