import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TOOLTIP_STYLE } from "./chartTheme";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "#6366f1", height = 40 }: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <ResponsiveContainer width={80} height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Tooltip
          contentStyle={{ ...TOOLTIP_STYLE, padding: "4px 8px", minWidth: 60 }}
          formatter={(v) => [Number(v).toLocaleString(), ""]}
          labelFormatter={() => ""}
          itemStyle={{ color, fontSize: 11, fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.8}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
