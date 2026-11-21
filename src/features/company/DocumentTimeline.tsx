import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Collapse, Empty, Space, Tag } from "antd";
import { Link } from "react-router-dom";
import { getData, type AuditEvent } from "./api";
import { useCompanyScopeKey } from "./useCompanyScope";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { formatTimestamp } from "./time";
import { eventActorTitle, eventActionLabel } from "./eventFormat";
import { fieldChanges } from "./eventData";
import { QueryState } from "./shared";
interface Save {
  save_key: string;
  saved_at: string;
  company_key: string;
  transaction_group_id: string | null;
  event_count: number;
  actors: Array<{ id: string | null; name: string }>;
}
interface Page {
  saves: Save[];
  nextCursor: string | null;
  coverage: Record<string, string>;
}
function DocumentTimelineContent({
  table,
  documentId,
}: {
  table: string;
  documentId: string;
}) {
  const company = useCompanyScopeKey(),
    zone = useTimeZoneStore((s) => s.timeZone);
  const [cursors, setCursors] = useState<string[]>([""]);
  const cursor = cursors.at(-1);
  const query = useQuery({
    queryKey: ["document-saves", company, table, documentId, cursor],
    queryFn: ({ signal }) =>
      getData<Page>(
        `/audit-log/documents/${encodeURIComponent(table)}/${encodeURIComponent(documentId)}/history`,
        { limit: 20, cursor: cursor || undefined },
        signal,
      ),
  });
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="Captured document history across separate saves"
        description="Includes linked header, line, charge and voucher events. Later approvals and background jobs remain separate transactions. Unmapped or uncaptured changes cannot be reconstructed; legacy links are not protected by v1 hashes."
      />
      <div>
        <Tag>{table}</Tag>
        {documentId}
      </div>
      <Button
        onClick={() => {
          setCursors([""]);
          void query.refetch();
        }}
        loading={query.isFetching}
      >
        Refresh document history
      </Button>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data?.saves.length === 0 && (
        <Empty description="No indexed document saves. Older events may require a document-link backfill." />
      )}
      {query.data?.saves.map((save) => (
        <Card
          key={save.save_key + save.company_key}
          size="small"
          title={`${formatTimestamp(save.saved_at, zone)} · ${save.event_count} captured changes`}
        >
          <p>
            {save.actors.map((actor) => actor.name).join(", ")} · Company:{" "}
            {save.company_key || "Not recorded"}
          </p>

          <Collapse
            destroyOnHidden
            items={[
              {
                key: "events",
                label: "Inspect this save",
                children: (
                  <SaveEvents
                    table={table}
                    documentId={documentId}
                    save={save}
                  />
                ),
              },
            ]}
          />
        </Card>
      ))}
      <Space>
        <Button
          disabled={cursors.length === 1 || query.isFetching}
          onClick={() => setCursors((old) => old.slice(0, -1))}
        >
          Previous saves
        </Button>
        <Button
          disabled={!query.data?.nextCursor || query.isFetching}
          onClick={() => setCursors((old) => [...old, query.data!.nextCursor!])}
        >
          Older saves
        </Button>
      </Space>
    </Space>
  );
}
function SaveEvents({
  table,
  documentId,
  save,
}: {
  table: string;
  documentId: string;
  save: Save;
}) {
  const companyScope = useCompanyScopeKey();
  const [cursors, setCursors] = useState<string[]>([""]);
  const zone = useTimeZoneStore((s) => s.timeZone);
  const cursor = cursors.at(-1);
  const query = useQuery({
    queryKey: [
      companyScope,
      "document-save-events",
      table,
      documentId,
      save.save_key,
      save.company_key,
      cursor,
    ],
    queryFn: ({ signal }) =>
      getData<{ events: AuditEvent[]; nextCursor: string | null }>(
        `/audit-log/documents/${encodeURIComponent(table)}/${encodeURIComponent(documentId)}/history/${encodeURIComponent(save.save_key)}`,
        {
          limit: 30,
          cursor: cursor || undefined,
          ...(save.company_key
            ? { companyId: save.company_key }
            : { companyUnassigned: "true" }),
        },
        signal,
      ),
  });
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data?.events.map((event) => (
        <Card
          key={event.id}
          size="small"
          title={`${eventActionLabel(event.event_type)} · ${event.resource_identifier}`}
        >
          <p>
            {eventActorTitle(event)} ·{" "}
            {formatTimestamp(event.event_timestamp, zone)}
          </p>
          {fieldChanges(event).map((change) => (
            <div key={change.field}>
              <strong>{change.field}</strong>: {JSON.stringify(change.before)} →{" "}
              {JSON.stringify(change.after)}
            </div>
          ))}
          <Link to={`/activities/${encodeURIComponent(event.id)}`}>
            Event details
          </Link>
        </Card>
      ))}
      <Space>
        <Button
          disabled={cursors.length === 1 || query.isFetching}
          onClick={() => setCursors((old) => old.slice(0, -1))}
        >
          Previous changes
        </Button>
        <Button
          disabled={!query.data?.nextCursor || query.isFetching}
          onClick={() => setCursors((old) => [...old, query.data!.nextCursor!])}
        >
          More changes in this save
        </Button>
      </Space>
    </Space>
  );
}

export function DocumentTimeline(props: { table: string; documentId: string }) {
  const scope = useCompanyScopeKey();
  return (
    <DocumentTimelineContent
      key={scope + props.table + props.documentId}
      {...props}
    />
  );
}
