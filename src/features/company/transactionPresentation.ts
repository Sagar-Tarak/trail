import type { AuditEvent } from "./api";
import { fieldChanges, recordHistoryTarget } from "./eventData.ts";
import { eventActionLabel } from "./eventFormat.ts";

export function transactionRecordLabel(event: AuditEvent): string {
  const changes = fieldChanges(event);
  const labels: string[] = [];
  for (const field of ["code", "name", "label"]) {
    const change = changes.find((item) => item.field === field);
    if (!change) continue;
    const value = event.after_data === null ? change.before : change.after;
    if (
      typeof value === "string" &&
      value &&
      !value.includes("REDACTED") &&
      value !== "Not captured"
    ) {
      labels.push(value);
    }
  }
  if (labels.length) return [...new Set(labels)].join(" · ");
  return (
    recordHistoryTarget(event)?.recordId ?? "Record identifier not captured"
  );
}

export function transactionHeading(
  events: AuditEvent[],
  selectedEventId?: string,
): string {
  const selected = events.find((event) => event.id === selectedEventId);
  const primary =
    selected ??
    events.find(
      (event) => event.resource_identifier !== "public.code_sequences",
    ) ??
    events[0];
  if (!primary) return "Captured transaction";
  return `${eventActionLabel(primary.event_type)} · ${primary.resource_identifier ?? "Company record"}`;
}
