import { eventActionLabel } from "./eventFormat.ts";

export interface TransactionCapture {
  sources?: string[];
  direct_db_event_count?: number;
  event_count: number;
  actor_external_id?: string | null;
  actor_user_id?: string | null;
  operations?: string[];
}

/** Describe captured provenance; an absent actor alone never proves a manual SQL write. */
export function transactionCaptureLabel(row: TransactionCapture): string {
  const sources = [...new Set(row.sources ?? [])];
  if (sources.length > 1) return "Mixed capture sources";
  switch (sources[0]) {
    case "DIRECT_DB":
      return "Database · no application context";
    case "DB_CDC":
      return "Database · CDC";
    case "DB_TRIGGER":
      return "Database · trigger";
    case "APP_SDK":
      return "Application · SDK";
    case "APP_DIRECT":
      return "Application event";
    case "IMPORT":
      return "Imported event";
    default:
      return "Capture source not recorded";
  }
}
export function isDatabaseWithoutContext(row: TransactionCapture) {
  return row.event_count > 0 && row.direct_db_event_count === row.event_count;
}
export function capturedTransactionOperation(row: TransactionCapture): string {
  const actions = [...new Set((row.operations ?? []).map(eventActionLabel))];
  return actions.length ? actions.join(" · ") : "Operation not recorded";
}
