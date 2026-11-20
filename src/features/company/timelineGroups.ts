import type { AuditEvent } from "./api";
export type TimelineActivity = AuditEvent & {
  company_labels: string[];
  matching_changes: number;
  affected_tables: string[];
  multiple_actors: boolean;
  has_database_without_context: boolean;
};
/** Group the complete loaded set, including page boundaries; timestamps never define identity.
 * Counts describe loaded filter matches. Inspect loads the full transaction separately.
 */
export function groupTimelineEvents(events: AuditEvent[]): TimelineActivity[] {
  const groups = new Map<string, AuditEvent[]>();
  const seen = new Set<string>();
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const key = event.transaction_group_id
      ? `transaction:${event.transaction_group_id}`
      : `event:${event.id}`;
    const rows = groups.get(key) ?? [];
    rows.push(event);
    groups.set(key, rows);
  }
  return [...groups.values()].map((rows) => {
    const declarations = rows
      .filter((row) => row.source !== "DIRECT_DB" && row.business_operation)
      .map((row) => row.business_operation!);
    const operation =
      declarations.length &&
      declarations.every(
        (value) => JSON.stringify(value) === JSON.stringify(declarations[0]),
      )
        ? declarations[0]
        : null;
    const batches = rows
      .filter((row) => row.source !== "DIRECT_DB" && row.business_batch)
      .map((row) => row.business_batch!);
    const batch =
      !operation &&
      batches.length &&
      batches.every(
        (value) => JSON.stringify(value) === JSON.stringify(batches[0]),
      )
        ? batches[0]
        : null;
    const primary =
      operation &&
      rows.find(
        (row) =>
          row.source !== "DIRECT_DB" &&
          row.resource_identifier === operation.primaryResource.table,
      );
    const head = rows[0];
    const representative = primary || head;
    const severity =
      ["CRITICAL", "ERROR", "WARNING", "INFO"].find((level) =>
        rows.some((row) => row.severity === level),
      ) ?? head.severity;
    return {
      ...representative,
      // Keep the newest matching instant so loading another page cannot move the card to another day.
      event_timestamp: head.event_timestamp,
      business_operation: operation,
      business_batch: batch,
      severity,
      outcome: rows.some((row) => row.outcome === "FAILURE")
        ? "FAILURE"
        : rows.some((row) => row.outcome === "PARTIAL")
          ? "PARTIAL"
          : "SUCCESS",
      company_labels: [
        ...new Set(
          rows.map(
            (row) =>
              row.source_company_name ||
              row.source_company_id ||
              "Company not recorded",
          ),
        ),
      ],
      matching_changes: rows.length,
      affected_tables: [
        ...new Set(
          rows
            .map((row) => row.resource_identifier)
            .filter((value): value is string => !!value),
        ),
      ],
      multiple_actors:
        new Set(
          rows
            .map((row) => row.actor_external_id || row.actor_user_id)
            .filter(Boolean),
        ).size > 1,
      has_database_without_context: rows.some(
        (row) => row.source === "DIRECT_DB",
      ),
    };
  });
}
