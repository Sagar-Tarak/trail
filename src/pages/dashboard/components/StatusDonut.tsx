import { DonutChart } from "@/components/charts";
import type { StatusDistribution } from "../api";

interface Props {
  data: StatusDistribution[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: "Success", color: "#10b981" },
  info:    { label: "Info",    color: "#6366f1" },
  warning: { label: "Warning", color: "#f59e0b" },
  error:   { label: "Error",   color: "#f43f5e" },
};

export function StatusDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const successPct = Math.round(
    ((data.find((d) => d.status === "success")?.count ?? 0) / total) * 100
  );

  const slices = data.map((d) => ({
    name: STATUS_CONFIG[d.status]?.label ?? d.status,
    value: d.count,
    color: STATUS_CONFIG[d.status]?.color ?? "#94a3b8",
  }));

  return (
    <DonutChart
      data={slices}
      title="Status Distribution"
      subtitle={`${total.toLocaleString()} total events`}
      centerLabel={`${successPct}%`}
      centerSub="success"
      height={140}
    />
  );
}
