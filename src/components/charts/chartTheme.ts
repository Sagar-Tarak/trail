export const CHART_COLORS = {
  indigo: "#6366f1",
  sky: "#0ea5e9",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  orange: "#f97316",
};

export const PALETTE = Object.values(CHART_COLORS);

export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  padding: "8px 12px",
};

export const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "#374151",
  fontWeight: 600,
  marginBottom: 4,
};

export const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 11,
};

export const AXIS_STYLE = {
  tick: { fill: "#9ca3af", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};
