import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, DatePicker, Select, Tag } from "antd";
import dayjs from "dayjs";
import { DataTable } from "@/components/DataTable";
import type { ActiveFilter, DataTableQueryResult } from "@/components/DataTable";

interface Activity {
  id: string;
  user: string;
  module: string;
  action: string;
  status: "success" | "warning" | "error" | "info";
  severity: "low" | "medium" | "high";
  ipAddress: string;
  createdAt: string;
}

interface ActivityFilters extends Record<string, unknown> {
  module?: string;
  status?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}

const col = createColumnHelper<Activity>();

const STATUS_COLORS: Record<string, string> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "processing",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "default",
  medium: "warning",
  high: "error",
};

const columns = [
  col.accessor("id", {
    header: "ID",
    size: 100,
    meta: { label: "ID" },
    cell: (info) => (
      <span className="font-mono text-[11px] text-gray-400">{info.getValue()}</span>
    ),
  }),
  col.accessor("user", {
    header: "User",
    size: 180,
    meta: { label: "User" },
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-600">
          {info.getValue().slice(0, 2).toUpperCase()}
        </div>
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  col.accessor("module", {
    header: "Module",
    size: 120,
    meta: { label: "Module" },
    cell: (info) => (
      <span className="text-gray-500">{info.getValue()}</span>
    ),
  }),
  col.accessor("action", {
    header: "Action",
    size: 220,
    meta: { label: "Action" },
  }),
  col.accessor("status", {
    header: "Status",
    size: 110,
    meta: { label: "Status" },
    cell: (info) => (
      <Tag color={STATUS_COLORS[info.getValue()] ?? "default"} className="capitalize text-[11px]">
        {info.getValue()}
      </Tag>
    ),
  }),
  col.accessor("severity", {
    header: "Severity",
    size: 100,
    meta: { label: "Severity" },
    cell: (info) => (
      <Tag color={SEVERITY_COLORS[info.getValue()] ?? "default"} className="capitalize text-[11px]">
        {info.getValue()}
      </Tag>
    ),
  }),
  col.accessor("createdAt", {
    header: "Timestamp",
    size: 160,
    meta: { label: "Timestamp" },
    cell: (info) => (
      <span className="text-[11px] text-gray-400">
        {dayjs(info.getValue()).format("DD MMM YYYY, HH:mm")}
      </span>
    ),
  }),
];

function ActivityFilterContent({
  filters,
  onChange,
  onClose,
}: {
  filters: ActivityFilters;
  onChange: (f: ActivityFilters) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ActivityFilters>(filters);
  const patch = (key: keyof ActivityFilters, val: string | undefined) =>
    setLocal((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">Module</label>
        <Select
          value={local.module}
          onChange={(v: string) => patch("module", v)}
          allowClear
          placeholder="All modules"
          className="w-full"
          options={[
            { label: "HRMS", value: "HRMS" },
            { label: "Finance", value: "Finance" },
            { label: "Inventory", value: "Inventory" },
            { label: "CRM", value: "CRM" },
            { label: "TMS", value: "TMS" },
          ]}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
        <Select
          value={local.status}
          onChange={(v: string) => patch("status", v)}
          allowClear
          placeholder="All statuses"
          className="w-full"
          options={[
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
            { label: "Info", value: "info" },
          ]}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">Severity</label>
        <Select
          value={local.severity}
          onChange={(v: string) => patch("severity", v)}
          allowClear
          placeholder="All severities"
          className="w-full"
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ]}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600">Date range</label>
        <DatePicker.RangePicker
          className="w-full"
          value={
            local.dateFrom && local.dateTo
              ? [dayjs(local.dateFrom), dayjs(local.dateTo)]
              : undefined
          }
          onChange={(dates) => {
            patch("dateFrom", dates?.[0]?.toISOString() ?? undefined);
            patch("dateTo", dates?.[1]?.toISOString() ?? undefined);
          }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="primary"
          className="flex-1"
          onClick={() => {
            onChange(local);
            onClose();
          }}
        >
          Apply filters
        </Button>
        <Button
          onClick={() => {
            const reset: ActivityFilters = {};
            setLocal(reset);
            onChange(reset);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

export function ActivityTable() {
  const [filters, setFilters] = useState<ActivityFilters>({});

  // React Query — swap fetchActivities with your actual API call
  const rawQuery = useQuery({
    queryKey: ["activities", filters],
    queryFn: () => fetchActivities(filters),
    placeholderData: (prev) => prev,
  });

  // Adapt React Query result to DataTableQueryResult shape
  const query: DataTableQueryResult<Activity> = useMemo(
    () => ({
      data: rawQuery.data,
      isLoading: rawQuery.isLoading,
      isFetching: rawQuery.isFetching,
      isError: rawQuery.isError,
      error: rawQuery.error,
      refetch: rawQuery.refetch,
    }),
    [rawQuery]
  );

  // Build active filter badges from filters state
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const result: ActiveFilter[] = [];
    if (filters.module) result.push({ key: "module", label: "Module", value: filters.module });
    if (filters.status) result.push({ key: "status", label: "Status", value: filters.status });
    if (filters.severity) result.push({ key: "severity", label: "Severity", value: filters.severity });
    if (filters.dateFrom) result.push({ key: "dateFrom", label: "From", value: dayjs(filters.dateFrom).format("DD MMM") });
    return result;
  }, [filters]);

  const handleFilterRemove = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key as keyof ActivityFilters];
      return next;
    });
  }, []);

  return (
    <DataTable<Activity>
      columns={columns}
      query={query}
      rowKey="id"
      tableId="activities"
      searchable
      selectable
      filterable
      exportable
      actions={
        <Button type="primary" size="small">
          Add activity
        </Button>
      }
      filters={filters}
      activeFilters={activeFilters}
      onFiltersChange={setFilters}
      onFilterRemove={handleFilterRemove}
      filterDrawerContent={(drawerProps) => (
        <ActivityFilterContent {...drawerProps} filters={drawerProps.filters as ActivityFilters} />
      )}
      onRowClick={(row) => {
        // Open your drawer here
        console.log("Row clicked:", row.original);
      }}
      bulkActions={({ selectedRows, clearSelection }) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-700">
            {selectedRows.length} selected
          </span>
          <Button size="small" danger onClick={() => { /* bulk delete */ clearSelection(); }}>
            Delete
          </Button>
          <Button size="small" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}
      emptyStateTitle="No activities yet"
      emptyStateDescription="Activities will appear here as users interact with the system."
    />
  );
}

async function fetchActivities(
  _filters: ActivityFilters
): Promise<{ rows: Activity[]; total: number }> {
  // Replace with:
  // const { data } = await axios.get("/api/activities", { params: filters });
  // return data;
  const mock: Activity[] = Array.from({ length: 20 }, (_, i) => ({
    id: `ACT-${String(i + 1).padStart(4, "0")}`,
    user: ["Priya Mehta", "Rohan Das", "Sita Rao"][i % 3],
    module: ["HRMS", "Finance", "CRM", "TMS", "Inventory"][i % 5],
    action: ["Login", "Invoice approved", "Deal closed", "Route updated", "Stock adjusted"][i % 5],
    status: (["success", "warning", "error", "info"] as const)[i % 4],
    severity: (["low", "medium", "high"] as const)[i % 3],
    ipAddress: `192.168.1.${i + 1}`,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
  return { rows: mock, total: 2847 };
}
