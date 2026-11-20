export type ActivityStatus = "success" | "warning" | "error" | "info";
export type ActivitySeverity = "low" | "medium" | "high" | "critical";

export interface Activity {
  id: string;
  timestamp: string;
  user: string;
  email: string;
  action: string;
  module: string;
  status: ActivityStatus;
  severity: ActivitySeverity;
  ipAddress: string;
  duration: number; // ms
  recordId?: string;
}
