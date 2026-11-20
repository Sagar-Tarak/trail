import { BarChart } from "@/components/charts";
import type { ModuleStat } from "../api";

interface Props {
  data: ModuleStat[];
}

const SERIES = [
  { key: "count", label: "Events", color: "#6366f1" },
  { key: "errors", label: "Errors", color: "#f43f5e" },
];

export function ModuleBarChart({ data }: Props) {
  return (
    <BarChart
      data={data as unknown as Record<string, unknown>[]}
      series={SERIES}
      xKey="module"
      title="Activity by Module"
      subtitle="Total events this week"
      height={220}
      showLegend
    />
  );
}
