import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TOOLTIP_STYLE,
  TOOLTIP_LABEL_STYLE,
  AXIS_STYLE,
  PALETTE,
} from "./chartTheme";

export interface LineSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  series: LineSeries[];
  xKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (v: number) => string;
  actions?: React.ReactNode;
}

export function LineChart({
  data,
  series,
  xKey,
  title,
  subtitle,
  height = 220,
  showLegend = false,
  valueFormatter = (v) => v.toLocaleString(),
  actions,
}: LineChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {(title || subtitle || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          {(title || subtitle) && (
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ReLineChart
          data={data}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            vertical={false}
          />
          <XAxis dataKey={xKey} {...AXIS_STYLE} dy={6} />
          <YAxis
            {...AXIS_STYLE}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            width={44}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v, name) => {
              const s = series.find((x) => x.key === name);
              return [valueFormatter(Number(v)), s?.label ?? String(name)];
            }}
            cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
          {series.map((s, si) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.color ?? PALETTE[si % PALETTE.length]}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "5 3" : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
