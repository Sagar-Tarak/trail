import type { AuditEvent, Data } from "./api";

export function recordHistoryTarget(event: {
  resource_identifier?: string | null;
  metadata?: unknown;
}) {
  const table = event.resource_identifier;
  if (typeof table !== "string" || !table || table.length > 127)
    return undefined;
  const metadata = event.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return undefined;
  const key = (metadata as Data).primary_key_data;
  if (!key || typeof key !== "object" || Array.isArray(key)) return undefined;

  // FULL replica identity can include the entire row. Never pick an arbitrary
  // first field; the record-history API searches this metadata, not snapshots.
  const entries = Object.entries(key);
  const ids = entries.filter(([name]) => name.toLowerCase() === "id");
  const entry =
    ids.length === 1
      ? ids[0]
      : ids.length === 0 && entries.length === 1
        ? entries[0]
        : undefined;
  const value: unknown = entry?.[1];
  if (
    typeof value !== "string" &&
    !(typeof value === "number" && Number.isSafeInteger(value))
  )
    return undefined;
  const recordId = String(value);
  if (!recordId || recordId.trim() !== recordId || recordId.length > 255)
    return undefined;
  return { table, recordId };
}

export function displayValue(value: unknown) {
  if (value === undefined) return "Not captured";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function fieldChanges(event: AuditEvent) {
  // CDC detail paths are schema.table.column, while row snapshots use column.
  // Match them before comparing so values are not duplicated and a sensitive
  // detail also masks the corresponding snapshot field.
  const prefix = event.resource_identifier
    ? `${event.resource_identifier}.`
    : undefined;
  const fieldName = (path: string) =>
    prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
  const changedFields = event.changed_fields.map(fieldName);
  const details =
    event.audit_event_details?.map((detail) => ({
      ...detail,
      field: fieldName(detail.field_path),
    })) ?? [];
  const fields = [
    ...new Set([
      ...changedFields,
      ...details.map((detail) => detail.field),
      ...Object.keys(event.before_data ?? {}),
      ...Object.keys(event.after_data ?? {}),
    ]),
  ];
  return fields
    .filter(
      (field) =>
        changedFields.includes(field) ||
        details.some((detail) => detail.field === field) ||
        JSON.stringify(event.before_data?.[field]) !==
          JSON.stringify(event.after_data?.[field]),
    )
    .map((field) => {
      const matchingDetails = details.filter(
        (detail) => detail.field === field,
      );
      const detail =
        matchingDetails.find((item) => item.is_sensitive) ?? matchingDetails[0];
      if (detail?.is_sensitive)
        return { field, before: "***REDACTED***", after: "***REDACTED***" };
      const type = event.event_type.toLowerCase();
      return {
        field,
        before:
          event.before_data === null &&
          (type.includes("insert") || type.includes("create"))
            ? "No previous record"
            : Object.hasOwn(event.before_data ?? {}, field)
              ? displayValue(event.before_data?.[field])
              : detail
                ? displayValue(detail.old_value)
                : displayValue(event.before_data?.[field]),
        after:
          event.after_data === null && type.includes("delete")
            ? "Record deleted"
            : Object.hasOwn(event.after_data ?? {}, field)
              ? displayValue(event.after_data?.[field])
              : detail
                ? displayValue(detail.new_value)
                : displayValue(event.after_data?.[field]),
      };
    });
}

export function eventMetadata(event: AuditEvent): Data {
  const safe = Object.fromEntries(
    Object.entries(event).filter(
      ([key]) => !["before_data", "after_data"].includes(key),
    ),
  );
  if (event.audit_event_details)
    safe.audit_event_details = event.audit_event_details.map((detail) =>
      detail.is_sensitive
        ? {
            ...detail,
            old_value: "***REDACTED***",
            new_value: "***REDACTED***",
          }
        : detail,
    );
  return safe;
}
