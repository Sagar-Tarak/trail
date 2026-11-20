import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TOOLTIP_STYLE } from "./chartTheme";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title?: string;
  subtitle?: string;
  /** Text shown in center of donut */
  centerLabel?: string;
  /** Sub-text shown below center label */
  centerSub?: string;
  /** Inner radius 0–100 relative to chart. Default 55 */
  innerRadius?: number;
  /** Outer radius 0–100 relative to chart. Default 80 */
  outerRadius?: number;
  height?: number;
  showLegend?: boolean;
  /** Render legend inline beside chart (default true) */
  inlineLegend?: boolean;
  valueFormatter?: (v: number) => string;
  actions?: React.ReactNode;
}

function InlineLegend({
  data,
  total,
  valueFormatter,
}: {
  data: DonutSlice[];
  total: number;
  valueFormatter: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2.5 flex-1 min-w-0">
      {data.map((item) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div
            key={item.name}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-xs text-gray-600">
                {item.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">
                {valueFormatter(item.value)}
              </span>
              <span className="w-7 text-right text-xs text-gray-400">
                {pct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  data,
  title,
  subtitle,
  centerLabel,
  centerSub,
  innerRadius = 55,
  outerRadius = 80,
  height = 160,
  showLegend = false,
  inlineLegend = true,
  valueFormatter = (v) => v.toLocaleString(),
  actions,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {(title || subtitle || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
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

      <div
        className={`flex items-center gap-6 ${inlineLegend ? "" : "justify-center"}`}
      >
        <div className="relative shrink-0" style={{ width: height, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={`${innerRadius}%`}
                outerRadius={`${outerRadius}%`}
                dataKey="value"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ ...TOOLTIP_STYLE, padding: "6px 10px" }}
                formatter={(v, name) => [
                  valueFormatter(Number(v)),
                  String(name),
                ]}
              />
              {showLegend && !inlineLegend && (
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          {(centerLabel || centerSub) && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {centerLabel && (
                <span className="text-lg font-bold text-gray-900 leading-none">
                  {centerLabel}
                </span>
              )}
              {centerSub && (
                <span className="mt-0.5 text-[10px] text-gray-400">
                  {centerSub}
                </span>
              )}
            </div>
          )}
        </div>

        {inlineLegend && (
          <InlineLegend
            data={data}
            total={total}
            valueFormatter={valueFormatter}
          />
        )}
      </div>
    </div>
  );
}
