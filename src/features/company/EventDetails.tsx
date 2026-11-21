import { EventIntegrity } from "./EventIntegrity";
import { useCompanyScopeKey } from "./useCompanyScope";
import { businessOperationLabel } from "./activitySummary";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Collapse, Empty, Tabs, Tag, Timeline, Typography } from "antd";
import {
  getData,
  type AuditEvent,
  type BusinessDocument,
  type Data,
} from "./api";
import { Details, QueryState } from "./shared";
import { formatTimestamp, formatDateValue } from "./time";
import { fieldChanges, eventMetadata, recordHistoryTarget } from "./eventData";
import { DocumentHistory } from "./DocumentHistory";
import {
  transactionCaptureLabel,
  isDatabaseWithoutContext,
} from "./transactionCapture";
import { requestDetails } from "./requestDetails";
import {
  transactionHeading,
  transactionRecordLabel,
} from "./transactionPresentation";
import {
  eventActionLabel,
  eventActorLabel,
  eventActorTitle,
  transactionActorEvent,
} from "./eventFormat";

export function EventDetails({
  event,
  timeZone: overrideTimeZone,
}: {
  event: AuditEvent;
  timeZone?: string;
}) {
  const selectedTimeZone = useTimeZoneStore((state) => state.timeZone);
  const timeZone = overrideTimeZone ?? selectedTimeZone;
  const historyTarget = recordHistoryTarget(event);
  const request = requestDetails(event);
  const hasKeyMetadata =
    !!event.metadata &&
    typeof event.metadata === "object" &&
    Object.hasOwn(event.metadata, "primary_key_data");
  const changes = fieldChanges(event);
  const action = eventActionLabel(event.event_type);
  const created = action === "Created";
  const deleted = action === "Deleted";
  const softDeleted = action === "Soft deleted";
  return (
    <div className="event-details">
      <EventIntegrity eventId={event.id} />
      <section className="event-summary">
        <p className="mb-3 text-sm text-slate-600">
          ERP company:{" "}
          <strong>
            {event.source_company_name ||
              event.source_company_id ||
              "Company not recorded"}
          </strong>
          {event.source_company_name && event.source_company_id && (
            <span className="ml-2 break-all">{event.source_company_id}</span>
          )}
        </p>
        <div className="event-badges">
          <Tag
            color={deleted || softDeleted ? "red" : created ? "green" : "blue"}
          >
            {action}
          </Tag>
          <Tag
            color={
              event.outcome === "FAILURE"
                ? "red"
                : event.outcome === "PARTIAL"
                  ? "gold"
                  : "green"
            }
          >
            {event.outcome}
          </Tag>
          <Tag>
            {transactionCaptureLabel({
              sources: [event.source],
              event_count: 1,
            })}
          </Tag>
        </div>
        <h2>{event.resource_identifier || "Company activity"}</h2>
        {softDeleted && (
          <p className="mb-3 text-sm text-slate-600">
            Soft delete: the database recorded an UPDATE setting deleted_at from
            NULL to a value. The row was marked deleted rather than physically
            removed.
          </p>
        )}
        <div className="event-summary-grid">
          <div>
            <span className="detail-label">Who</span>
            <strong>{eventActorTitle(event)}</strong>
            {event.source === "DIRECT_DB" && event.actor_external_id && (
              <span className="detail-label">
                Row-derived identity hint (unverified)
              </span>
            )}
            {(event.actor_external_id || event.actor_user_id) && (
              <Typography.Text className="actor-identifier" copyable>
                {event.actor_external_id || event.actor_user_id}
              </Typography.Text>
            )}
          </div>
          <div>
            <span className="detail-label">When</span>
            <strong>{formatTimestamp(event.event_timestamp, timeZone)}</strong>
          </div>
          <div>
            <span className="detail-label">Request IP address</span>
            <strong>{request.ipAddress || "Not captured"}</strong>
          </div>
          <div>
            <span className="detail-label">Browser / platform (reported)</span>
            <strong>{request.device || "Not captured"}</strong>
          </div>
        </div>
        {Array.isArray(event.document_links) &&
          event.document_links
            .filter(
              (link) =>
                link &&
                typeof link.document_table === "string" &&
                typeof link.document_id === "string" &&
                !(
                  link.document_table === historyTarget?.table &&
                  link.document_id === historyTarget?.recordId
                ),
            )
            .map((link) => (
              <p
                key={link.company_key + link.document_table + link.document_id}
              >
                <Link
                  to={`/records?${new URLSearchParams({ table: link.document_table, recordId: link.document_id })}`}
                >
                  Document history: {link.display_id || link.document_id} ·{" "}
                  {link.document_table}
                </Link>
              </p>
            ))}
        {historyTarget && (
          <Link to={`/records?${new URLSearchParams(historyTarget)}`}>
            Follow this record’s history →
          </Link>
        )}
        {hasKeyMetadata && !historyTarget && (
          <p className="mt-3 text-sm text-slate-500">
            Captured metadata does not identify a single record ID supported by
            the record-history view. Use table and time filters or inspect the
            technical metadata below.
          </p>
        )}
      </section>
      {event.diff_quality !== "EXACT" && (
        <Alert
          showIcon
          type="warning"
          message={
            event.diff_quality === "PARTIAL"
              ? "Partial comparison"
              : "Comparison quality unknown"
          }
          description="The source database did not provide a complete previous row. Captured values are shown below; the list cannot establish every field that changed."
        />
      )}
      {event.source === "DIRECT_DB" && (
        <Alert
          showIcon
          type="error"
          message="Direct database change"
          description="This change has no application actor attribution. Check the source and database access before attributing it to an application user."
        />
      )}
      <Tabs
        defaultActiveKey="changes"
        items={[
          {
            key: "changes",
            label: `Changes (${changes.length})`,
            children: (
              <div className="event-details">
                {(created || deleted || softDeleted) && (
                  <p className="event-lifecycle-note">
                    {deleted
                      ? "This record was deleted. Its last captured values are shown below."
                      : softDeleted
                        ? "This record was soft deleted. The row remains in the database; its deletion fields are compared below."
                        : "A new record was created with the following values."}
                  </p>
                )}
                {changes.length ? (
                  <div
                    className={`change-list ${created || deleted ? "change-list-lifecycle" : ""}`}
                  >
                    {changes.map((change) => (
                      <section
                        className={`change-field ${created || deleted ? "change-field-single" : ""}`}
                        key={change.field}
                      >
                        <h3>{change.field}</h3>
                        <div
                          className={`change-values ${created || deleted ? "change-values-single" : ""}`}
                        >
                          {!created && (
                            <div className="change-before">
                              {!deleted && (
                                <span className="detail-label">Before</span>
                              )}
                              <pre>
                                {formatDateValue(change.before, timeZone)}
                              </pre>
                            </div>
                          )}
                          {!deleted && (
                            <div className="change-after">
                              {!created && (
                                <span className="detail-label">After</span>
                              )}
                              <pre>
                                {formatDateValue(change.after, timeZone)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <Empty
                    description={
                      event.diff_quality === "EXACT"
                        ? "No field changes recorded for this event"
                        : "No comparable field values were captured"
                    }
                  />
                )}
              </div>
            ),
          },
          {
            key: "context",
            label: "Event details",
            children: (
              <div className="event-details">
                <Details
                  data={{
                    description: event.event_description,
                    actor: eventActorLabel(event),
                    application_user_id:
                      event.actor_external_id ||
                      "Not supplied by the source application",
                    role_at_time_of_change:
                      event.actor_role ||
                      "Not supplied by the source application",
                    trio_trail_account_id:
                      event.actor_user_id ||
                      "Not applicable for an external application identity",
                    ...(request.operationIssue
                      ? {
                          business_operation_note: request.operationIssue,
                          business_operation_failure_stage:
                            request.operationFailureStage,
                          business_operation_failure_code:
                            request.operationFailureCode,
                          business_operation_attempt_id:
                            request.operationFailureId,
                          business_operation_failure_time:
                            request.operationFailureTime
                              ? formatTimestamp(
                                  request.operationFailureTime,
                                  timeZone,
                                )
                              : undefined,
                        }
                      : {}),
                    actor_type: event.actor_type,
                    actor_context_status:
                      request.contextStatus || "Not recorded",
                    name_at_time_of_change:
                      request.displayName || "Not captured",
                    username_at_time_of_change:
                      request.username || "Not captured",
                    email_at_time_of_change: request.email || "Not captured",
                    request_ip_address: request.ipAddress || "Not captured",
                    reported_browser_and_platform:
                      request.device || "Not captured",
                    reported_user_agent: request.userAgent || "Not captured",
                    request_method: request.method || "Not captured",
                    request_path: request.path || "Not captured",
                    company_at_time_of_change:
                      request.company || "Not captured",
                    received: formatTimestamp(event.received_at, timeZone),
                    source: event.source,
                    comparison_quality: event.diff_quality,
                    risk_score: `${event.risk_score} / 10`,
                  }}
                />
                <div className="exact-timestamp">
                  <span className="detail-label">Exact timestamp (UTC)</span>
                  <Typography.Text copyable>
                    {event.event_timestamp}
                  </Typography.Text>
                </div>
              </div>
            ),
          },
        ]}
      />
      <Collapse
        items={[
          {
            key: "raw",
            label: "Technical metadata",
            children: <Details data={eventMetadata(event)} />,
          },
        ]}
      />
    </div>
  );
}

export function EventTimeline({
  events,
  primaryResource,
  primaryResources,
  timeZone: overrideTimeZone,
}: {
  events: AuditEvent[];
  primaryResource?: { table: string; id: string };
  primaryResources?: { table: string; id: string }[];
  timeZone?: string;
}) {
  const selectedTimeZone = useTimeZoneStore((state) => state.timeZone);
  const timeZone = overrideTimeZone ?? selectedTimeZone;
  const isMain = (event: AuditEvent) =>
    (primaryResource ? [primaryResource] : (primaryResources ?? [])).some(
      (resource) =>
        resource.table === event.resource_identifier &&
        resource.id === recordHistoryTarget(event)?.recordId,
    );
  if (!events.length)
    return <Empty description="No history found for this record." />;
  return (
    <Timeline
      items={events.map((event) => ({
        color:
          event.severity === "ERROR" || event.severity === "CRITICAL"
            ? "red"
            : "blue",
        children: (
          <div className="pb-4">
            <p className="mb-2 text-sm text-gray-500">
              {formatTimestamp(event.event_timestamp, timeZone)}
            </p>
            <Collapse
              items={[
                {
                  key: event.id,
                  label: (
                    <div className="min-w-0 space-y-1">
                      {(primaryResource || primaryResources?.length) && (
                        <Tag color={isMain(event) ? "purple" : undefined}>
                          {isMain(event)
                            ? "Main document change"
                            : "Related change"}
                        </Tag>
                      )}
                      <strong className="block break-words">
                        {eventActionLabel(event.event_type)} ·{" "}
                        {event.resource_identifier ?? "Record"}
                      </strong>
                      <span className="block break-words text-sm">
                        {transactionRecordLabel(event)}
                      </span>
                      <span className="block break-words text-xs text-slate-500">
                        {eventActorTitle(event)} ·{" "}
                        {event.actor_external_id ||
                          event.actor_user_id ||
                          "Actor ID not recorded"}
                      </span>
                      <span className="block break-words text-xs text-slate-500">
                        {event.changed_fields.length
                          ? `Fields: ${event.changed_fields.join(", ")}`
                          : event.event_description ||
                            "Expand to inspect captured values"}
                      </span>
                    </div>
                  ),
                  children: <EventDetails event={event} timeZone={timeZone} />,
                },
              ]}
            />
          </div>
        ),
      }))}
    />
  );
}

export function TransactionDetails({
  groupId,
  selectedEventId,
  timeZone: overrideTimeZone,
}: {
  groupId: string;
  selectedEventId?: string;
  timeZone?: string;
}) {
  const selectedTimeZone = useTimeZoneStore((state) => state.timeZone);
  const timeZone = overrideTimeZone ?? selectedTimeZone;
  const companyScope = useCompanyScopeKey();
  const query = useQuery({
    queryKey: ["transaction", companyScope, groupId],
    queryFn: ({ signal }) =>
      getData<{ summary: Data; events: AuditEvent[] }>(
        `/audit-log/transactions/${encodeURIComponent(groupId)}`,
        undefined,
        signal,
      ),
  });
  const operation = query.data?.summary.business_operation as
    | {
        action: string;
        primaryResource: {
          table: string;
          id: string;
          displayId?: string;
          companyId?: string;
          companyName?: string;
        };
      }
    | null
    | undefined;
  const batch = query.data?.summary.business_batch as
    | { action: string; primaryResources: BusinessDocument[] }
    | null
    | undefined;
  const capture = query.data
    ? {
        sources: [...new Set(query.data.events.map((event) => event.source))],
        event_count: query.data.events.length,
        direct_db_event_count: query.data.events.filter(
          (event) => event.source === "DIRECT_DB",
        ).length,
      }
    : undefined;
  const actorEvent = query.data
    ? transactionActorEvent(
        query.data.events,
        query.data.summary.actor_external_id,
      )
    : undefined;
  return (
    <div className="event-details">
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
      {query.data && (
        <>
          <section className="event-summary">
            <span className="detail-label">
              {capture && isDatabaseWithoutContext(capture)
                ? "Database transaction"
                : "Business transaction"}{" "}
              · {query.data.events.length} captured{" "}
              {query.data.events.length === 1 ? "change" : "changes"}
            </span>
            {capture && (
              <div className="my-2">
                <Tag>{transactionCaptureLabel(capture)}</Tag>
                {capture.direct_db_event_count > 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    {capture.direct_db_event_count} captured database changes
                    have no application actor context. The database login and
                    individual operator were not recorded in these events.
                  </p>
                )}
              </div>
            )}
            <h2>
              {String(
                ((operation?.action ||
                  batch?.action ||
                  query.data.summary.operation_name) &&
                  businessOperationLabel(
                    String(
                      operation?.action ||
                        batch?.action ||
                        query.data.summary.operation_name,
                    ),
                  )) ||
                  query.data.summary.operation_name ||
                  transactionHeading(query.data.events, selectedEventId),
              )}
            </h2>
            {operation ? (
              <div className="mb-4 rounded-lg border border-indigo-200 bg-white p-4">
                <span className="detail-label">
                  Main document · declared by the application
                </span>
                <h3 className="mt-1 break-words font-semibold">
                  {operation.primaryResource.displayId ||
                    operation.primaryResource.id}
                </h3>
                <p className="mb-2 break-all text-sm text-slate-600">
                  {operation.primaryResource.table} ·{" "}
                  {operation.primaryResource.id}
                </p>
                {operation.primaryResource.companyId && (
                  <Typography.Paragraph>
                    Source company:{" "}
                    {operation.primaryResource.companyName ||
                      operation.primaryResource.companyId}
                    {operation.primaryResource.companyName &&
                      ` · ${operation.primaryResource.companyId}`}
                  </Typography.Paragraph>
                )}
                <Link
                  to={`/records?table=${encodeURIComponent(operation.primaryResource.table)}&recordId=${encodeURIComponent(operation.primaryResource.id)}`}
                >
                  Open main document history
                </Link>
              </div>
            ) : batch ? (
              <div className="mb-4 rounded-lg border border-indigo-200 bg-white p-4">
                <strong>
                  Main documents ({batch.primaryResources.length})
                </strong>
                <ul className="mt-2 space-y-2">
                  {batch.primaryResources.map((resource) => (
                    <li key={`${resource.table}:${resource.id}`}>
                      <Link
                        to={`/records?table=${encodeURIComponent(resource.table)}&recordId=${encodeURIComponent(resource.id)}`}
                      >
                        {resource.displayId || resource.id}
                      </Link>
                      <span className="ml-2 text-xs text-slate-500">
                        {resource.table}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mb-3 text-sm text-slate-500">
                Main document not declared by the application for this
                transaction.
              </p>
            )}
            <p className="mb-3 text-sm text-slate-600">
              These changes share the same captured transaction group. Expand
              each record below to compare its values. Related rows and
              code-number updates can appear alongside the main record.
            </p>
            {!operation && !query.data.summary.operation_name && (
              <p className="mb-3 text-xs text-slate-500">
                Summary based on captured changes; the application did not
                supply an operation name.
              </p>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                ...new Set(
                  query.data.events
                    .map((event) => event.resource_identifier)
                    .filter(Boolean),
                ),
              ].map((table) => {
                const count = query.data.events.filter(
                  (event) => event.resource_identifier === table,
                ).length;
                return (
                  <Tag key={table}>
                    {table} · {count} {count === 1 ? "change" : "changes"}
                  </Tag>
                );
              })}
            </div>
            {selectedEventId && (
              <p className="mb-3 break-words text-sm">
                <strong>Selected record: </strong>
                {transactionRecordLabel(
                  query.data.events.find(
                    (event) => event.id === selectedEventId,
                  ) ?? query.data.events[0],
                )}
              </p>
            )}
            <div className="event-summary-grid">
              <div>
                <span className="detail-label">Who</span>
                <strong>
                  {actorEvent ? eventActorTitle(actorEvent) : "Unknown actor"}
                </strong>
                {actorEvent?.source === "DIRECT_DB" &&
                  actorEvent.actor_external_id && (
                    <span className="detail-label">
                      Row-derived identity hint (unverified)
                    </span>
                  )}
                {(actorEvent?.actor_external_id ||
                  actorEvent?.actor_user_id) && (
                  <Typography.Text className="actor-identifier" copyable>
                    {actorEvent.actor_external_id || actorEvent.actor_user_id}
                  </Typography.Text>
                )}
              </div>
              <div>
                <span className="detail-label">Started</span>
                <strong>
                  {formatTimestamp(
                    String(query.data.summary.started_at),
                    timeZone,
                  )}
                </strong>
              </div>
            </div>
          </section>
          {query.data.summary.request_id && (
            <Typography.Paragraph
              copyable={{ text: String(query.data.summary.request_id) }}
            >
              Request ID: {String(query.data.summary.request_id)}
            </Typography.Paragraph>
          )}
          <EventTimeline
            events={query.data.events}
            timeZone={timeZone}
            primaryResource={operation?.primaryResource}
            primaryResources={batch?.primaryResources}
          />
          <Collapse
            items={[
              {
                key: "summary",
                label: "Transaction identifiers and context",
                children: <Details data={query.data.summary} />,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

/** Keep the related transaction in a separate view instead of appending another full event trail. */
export function EventInspector({
  event,
  timeZone,
  activeTab,
  onTabChange,
}: {
  event: AuditEvent;
  timeZone?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const target = recordHistoryTarget(event);
  return (
    <Tabs
      className="event-inspector"
      defaultActiveKey="activity"
      activeKey={
        (activeTab === "transaction" && !event.transaction_group_id) ||
        (activeTab === "document-history" && !target)
          ? "activity"
          : activeTab
      }
      onChange={onTabChange}
      items={[
        {
          key: "activity",
          label: "Activity",
          children: <EventDetails event={event} timeZone={timeZone} />,
        },
        ...(event.transaction_group_id
          ? [
              {
                key: "transaction",
                label: "Related transaction",
                children: (
                  <TransactionDetails
                    groupId={event.transaction_group_id!}
                    selectedEventId={event.id}
                    timeZone={timeZone}
                  />
                ),
              },
            ]
          : []),
        ...(target
          ? [
              {
                key: "document-history",
                label: "Document history",
                children: (
                  <DocumentHistory
                    key={`${target.table}:${target.recordId}`}
                    {...target}
                    fieldOptions={[
                      ...event.changed_fields,
                      ...Object.keys(event.before_data ?? {}),
                      ...Object.keys(event.after_data ?? {}),
                    ]}
                  />
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
