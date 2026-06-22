import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, AXIS_STYLE, PALETTE } from "./chartTheme";

export interface BarSeries {
  key: string;
  label: string;
  color?: string;
  /** Radius on the bar ends. default 4 */
  radius?: number;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  series: BarSeries[];
  xKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  /** Rotate bars so categories are on Y axis */
  horizontal?: boolean;
  /** Stack all bars on top of each other */
  stacked?: boolean;
  showLegend?: boolean;
  /** Color each bar of a single series differently */
  multiColor?: boolean;
  valueFormatter?: (v: number) => string;
  actions?: React.ReactNode;
}

export function BarChart({
  data,
  series,
  xKey,
  title,
  subtitle,
  height = 220,
  horizontal = false,
  stacked = false,
  showLegend = false,
  multiColor = false,
  valueFormatter = (v) => v.toLocaleString(),
  actions,
}: BarChartProps) {
  const stackId = stacked ? "stack" : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {(title || subtitle || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          {(title || subtitle) && (
            <div>
              {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
            </div>
          )}
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 8, left: horizontal ? 8 : -8, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v: number) => (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))} />
              <YAxis type="category" dataKey={xKey} {...AXIS_STYLE} width={64} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS_STYLE} dy={6} />
              <YAxis {...AXIS_STYLE} tickFormatter={(v: number) => (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))} width={40} />
            </>
          )}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v, name) => {
              const s = series.find((x) => x.key === name);
              return [valueFormatter(Number(v)), s?.label ?? String(name)];
            }}
            cursor={{ fill: "#f9fafb" }}
          />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, si) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.key}
              fill={s.color ?? PALETTE[si % PALETTE.length]}
              stackId={stackId}
              radius={stacked ? (si === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
              maxBarSize={40}
            >
              {multiColor && data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
