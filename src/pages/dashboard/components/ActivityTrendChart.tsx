import { AreaChart } from "@/components/charts";
import type { TrendPoint } from "../api";

interface Props {
  data: TrendPoint[];
}

const RANGE_TABS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

const SERIES = [{ key: "value", label: "Events", color: "#6366f1" }];

export function ActivityTrendChart({ data }: Props) {
  return (
    <AreaChart
      data={data as unknown as Record<string, unknown>[]}
      series={SERIES}
      xKey="label"
      title="Activity Trend"
      subtitle="Events per day — this week"
      height={160}
      rangeTabs={RANGE_TABS}
      valueFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
    />
  );
}
