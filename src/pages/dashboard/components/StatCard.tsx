import type { ReactNode } from "react";
import { Sparkline } from "@/components/charts";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface StatCardProps {
  label: string;
  value: string | number;
  delta: number;
  icon: ReactNode;
  iconBg: string;
  sparkData: number[];
  sparkColor: string;
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  iconBg,
  sparkData,
  sparkColor,
  prefix,
  suffix,
}: StatCardProps) {
  const positive = delta >= 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <Sparkline data={sparkData} color={sparkColor} height={40} />
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">{label}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {positive ? (
            <ArrowUpOutlined className="text-xs" />
          ) : (
            <ArrowDownOutlined className="text-xs" />
          )}
          {Math.abs(delta)}%
        </span>
        <span className="text-xs text-gray-400">vs last week</span>
      </div>
    </div>
  );
}
