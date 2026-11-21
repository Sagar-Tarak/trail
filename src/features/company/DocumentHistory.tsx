import { DocumentTimeline } from "./DocumentTimeline";
import { Tabs } from "antd";
import { useCompanyScopeKey } from "./useCompanyScope";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  AutoComplete,
  Select,
  Tag,
  Typography,
} from "antd";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { getData, type AuditEvent } from "./api";
import { fieldChanges } from "./eventData";
import { eventActionLabel, eventActorTitle } from "./eventFormat";
import { formatTimestamp, formatDateValue } from "./time";
import { QueryState } from "./shared";
import { restartSearch } from "./searchQuery";
import "./document-history.css";

interface Filters {
  changedField?: string;
  operation?: string;
  order: "asc" | "desc";
}
export function RecordFieldHistory({
  table,
  recordId,
  fieldOptions = [],
}: {
  table: string;
  recordId: string;
  fieldOptions?: string[];
}) {
  const zone = useTimeZoneStore((state) => state.timeZone);
  const display = (value: unknown) =>
    value == null || value === "" ? "(empty)" : formatDateValue(value, zone);
  const client = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const [filters, setFilters] = useState<Filters>({ order: "desc" });
  const [shown, setShown] = useState(50);
  const key = [
    "document-history",
    companyScope,
    table,
    recordId,
    filters,
  ] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      getData<{ events: AuditEvent[] }>(
        `/audit-log/records/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
        { ...filters, limit: 200 },
        signal,
      ),
  });
  const entries = (query.data?.events ?? []).flatMap((event) =>
    fieldChanges(event)
      .filter(
        (change) =>
          !filters.changedField || change.field === filters.changedField,
      )
      .map((change) => ({ event, change })),
  );
  return (
    <div className="document-history">
      <div className="document-history-heading">
        <h3 className="font-semibold">Document history</h3>
        <div className="document-history-record">
          <Tag>{table}</Tag>
          <Typography.Text copyable={{ text: recordId }}>
            Record ID: {recordId}
          </Typography.Text>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Follow each captured field change, its previous and updated values,
          and the person or service recorded at that time.
        </p>
      </div>
      <Form
        layout="vertical"
        initialValues={filters}
        onFinish={(values: Filters) => {
          const next = {
            ...values,
            changedField: values.changedField?.trim() || undefined,
          };
          void restartSearch(client, key, [
            "document-history",
            companyScope,
            table,
            recordId,
            next,
          ]);
          setFilters(next);
          setShown(50);
        }}
      >
        <div className="document-history-filters">
          <Form.Item label="Field name" name="changedField">
            <AutoComplete
              options={[...new Set(fieldOptions)]
                .sort()
                .map((value) => ({ value }))}
              filterOption={(input, option) =>
                String(option?.value)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
              placeholder="All fields, e.g. status"
            >
              <Input
                placeholder="All fields, e.g. status"
                maxLength={255}
                allowClear
              />
            </AutoComplete>
          </Form.Item>
          <Form.Item label="Activity" name="operation">
            <Select
              allowClear
              placeholder="All activities"
              options={[
                { value: "INSERT", label: "Created" },
                { value: "UPDATE", label: "Updated" },
                { value: "DELETE", label: "Deleted" },
                { value: "SOFT_DELETE", label: "Soft deleted" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Order" name="order">
            <Select
              options={[
                { value: "desc", label: "Newest first" },
                { value: "asc", label: "Oldest first" },
              ]}
            />
          </Form.Item>
        </div>
        <div className="document-history-actions">
          <Button type="primary" htmlType="submit" loading={query.isFetching}>
            Find history
          </Button>
          <Button
            loading={query.isFetching}
            onClick={() => {
              setShown(50);
              void restartSearch(client, key, key);
            }}
          >
            Refresh
          </Button>
        </div>
      </Form>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void restartSearch(client, key, key)}
      />
      {query.data && (
        <>
          <div className="document-history-result-summary">
            <div>
              <strong>
                {entries.length} captured field{" "}
                {entries.length === 1 ? "change" : "changes"} in{" "}
                {query.data.events.length} matching{" "}
                {query.data.events.length === 1 ? "event" : "events"}
              </strong>
              <span>Times use {zone}</span>
            </div>
            <p>
              Up to 200 events from the past year. Captured history; current
              record values may differ.
            </p>
          </div>
          {query.data.events.length === 200 && (
            <Alert
              type="warning"
              showIcon
              message="History limit reached"
              description="Additional events may exist. Use a field or activity filter to narrow the API results, or change the order."
            />
          )}
          {!entries.length && (
            <Empty description="No captured field changes match this record and these filters." />
          )}
          {entries.slice(0, shown).map(({ event, change }) => (
            <Card
              className="document-history-card"
              key={`${event.id}:${change.field}`}
              size="small"
            >
              <div className="document-history-card-title">
                <strong>{change.field}</strong>
                <Tag>{eventActionLabel(event.event_type)}</Tag>
              </div>
              <p className="document-history-event-meta">
                {formatTimestamp(event.event_timestamp, zone)} ·{" "}
                {eventActorTitle(event)}
              </p>
              <Typography.Text
                className="document-history-actor"
                copyable={!!(event.actor_external_id || event.actor_user_id)}
              >
                {event.actor_external_id ||
                  event.actor_user_id ||
                  "Actor ID not recorded"}
              </Typography.Text>
              <div className="document-history-values">
                <div>
                  <p>Previous</p>
                  <pre>{display(change.before)}</pre>
                </div>
                <div>
                  <p>Updated</p>
                  <pre>{display(change.after)}</pre>
                </div>
              </div>
              <div className="document-history-card-footer">
                <span>Audit reference: {event.id}</span>
                <span>Comparison: {event.diff_quality}</span>
              </div>
            </Card>
          ))}
          {shown < entries.length && (
            <Button onClick={() => setShown((count) => count + 50)}>
              Show more field changes ({entries.length - shown} remaining in
              loaded events)
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function DocumentHistory(props: {
  table: string;
  recordId: string;
  fieldOptions?: string[];
}) {
  return (
    <Tabs
      defaultActiveKey="document"
      items={[
        {
          key: "document",
          label: "Document across saves",
          children: (
            <DocumentTimeline table={props.table} documentId={props.recordId} />
          ),
        },
        {
          key: "row",
          label: "This row’s field history",
          children: <RecordFieldHistory {...props} />,
        },
      ]}
    />
  );
}
