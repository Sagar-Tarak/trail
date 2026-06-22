import { useState } from "react";
import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE, AXIS_STYLE } from "./chartTheme";

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
}

export interface AreaChartRangeTab {
  label: string;
  value: string;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  series: AreaSeries[];
  xKey: string;
  title?: string;
  subtitle?: string;
  height?: number;
  rangeTabs?: AreaChartRangeTab[];
  activeRange?: string;
  onRangeChange?: (range: string) => void;
  valueFormatter?: (v: number) => string;
  actions?: React.ReactNode;
  /** Show Recharts Legend below chart */
  showLegend?: boolean;
}

export function AreaChart({
  data,
  series,
  xKey,
  title,
  subtitle,
  height = 200,
  rangeTabs,
  activeRange,
  onRangeChange,
  valueFormatter = (v) => v.toLocaleString(),
  actions,
  showLegend = false,
}: AreaChartProps) {
  const [localRange, setLocalRange] = useState(rangeTabs?.[0]?.value ?? "");
  const currentRange = activeRange ?? localRange;

  const handleRange = (v: string) => {
    setLocalRange(v);
    onRangeChange?.(v);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {(title || subtitle || rangeTabs || actions) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          {(title || subtitle) && (
            <div>
              {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {rangeTabs && rangeTabs.length > 0 && (
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
                {rangeTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleRange(tab.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      currentRange === tab.value
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ReAreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS_STYLE} dy={6} />
          <YAxis
            {...AXIS_STYLE}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
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
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
