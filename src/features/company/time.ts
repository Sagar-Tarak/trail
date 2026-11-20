export const defaultTimeZone = "Asia/Calcutta";
export function validTimeZone(value: unknown): string {
  if (typeof value === "string") {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: value });
      return value;
    } catch {
      /* Use the configured default. */
    }
  }
  return defaultTimeZone;
}

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatTimestamp(value: string, timeZone = defaultTimeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatClock(value: string, timeZone = defaultTimeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function groupEventsByDay<
  T extends { id: string; event_timestamp: string },
>(events: T[], timeZone: string) {
  const sorted = [
    ...new Map(events.map((event) => [event.id, event])).values(),
  ].sort(
    (a, b) =>
      (Date.parse(b.event_timestamp) || 0) -
        (Date.parse(a.event_timestamp) || 0) || b.id.localeCompare(a.id),
  );
  const groups = new Map<string, T[]>();
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  for (const event of sorted) {
    const date = new Date(event.event_timestamp);
    const day = Number.isNaN(date.getTime())
      ? "Unknown date"
      : formatter.format(date);
    const group = groups.get(day) ?? [];
    group.push(event);
    groups.set(day, group);
  }
  return [...groups].map(([day, entries]) => ({ day, events: entries }));
}

export function formatDateValue(
  value: unknown,
  timeZone = defaultTimeZone,
): string {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  )
    return formatTimestamp(value, timeZone);
  return value == null ? "Not captured" : String(value);
}
