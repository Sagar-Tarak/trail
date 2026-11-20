import type { AuditEvent } from "./api";

export function eventActionLabel(eventType: string) {
  const type = eventType.toLowerCase();
  const operation = type.split(/[._:]/).at(-1);
  if (type.startsWith("company.setup.")) {
    if (operation === "started") return "Setup started";
    if (operation === "succeeded") return "Setup completed";
    if (operation === "failed") return "Setup failed";
  }
  if (operation === "truncate") return "Table truncated";
  if (type.endsWith(".soft_delete")) return "Soft deleted";
  if (["insert", "inserted", "create", "created"].includes(operation ?? ""))
    return "Created";
  if (["update", "updated"].includes(operation ?? "")) return "Updated";
  if (["delete", "deleted", "remove", "removed"].includes(operation ?? ""))
    return "Deleted";
  return eventType.replaceAll("_", " ");
}

export function eventActorLabel(event: {
  actor_external_id?: string | null;
  source?: string;
  metadata?: unknown;
}) {
  const fallback =
    event.actor_external_id ||
    (event.source === "DIRECT_DB"
      ? "Unattributed database writer"
      : "Actor not recorded");
  if (event.source === "DIRECT_DB") return fallback;
  const metadata = event.metadata as {
    actor_context?: {
      displayName?: unknown;
      username?: unknown;
      email?: unknown;
    };
  } | null;
  const context = metadata?.actor_context;
  const name = [context?.displayName, context?.username, context?.email].find(
    (value) => typeof value === "string" && value.trim(),
  );
  return typeof name === "string" ? name.trim() : fallback;
}

export function eventActorTitle(event: {
  actor_external_id?: string | null;
  actor_type?: string | null;
  source?: string;
  metadata?: unknown;
}) {
  const label = eventActorLabel(event);
  if (label !== event.actor_external_id || !event.actor_external_id)
    return label;
  if (event.source === "DIRECT_DB") return "Database writer";
  return event.actor_type === "service" || event.actor_type === "cron"
    ? "Application service"
    : "Application user";
}
export function transactionActorEvent(
  events: AuditEvent[],
  actorExternalId: unknown,
) {
  return (
    (typeof actorExternalId === "string"
      ? events.find((event) => event.actor_external_id === actorExternalId)
      : undefined) ??
    events.find((event) => event.actor_external_id || event.actor_user_id) ??
    events[0]
  );
}
