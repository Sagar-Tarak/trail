import { useCompanyScopeKey } from "./useCompanyScope";
import { activityInspectionUrl } from "./inspectionNavigation";
import { ZonedDatePicker } from "./ZonedDatePicker";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { formatTimestamp } from "./time";
import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  AutoComplete,
  Form,
  Input,
  Select,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { PageShell } from "@/components/page";
import {
  getData,
  type AuditEvent,
  type Cursor,
  type Data,
  type EventPage,
} from "./api";
import { Details, QueryState } from "./shared";
import { EventTimeline } from "./EventDetails";
import { eventActionLabel, eventActorLabel } from "./eventFormat";
import { restartSearch } from "./searchQuery";
import { DocumentHistory } from "./DocumentHistory";
interface Filters {
  search?: string;
  table?: string;
  operation?: string;
  severity?: string;
  actorExternalId?: string;
  operationName?: string;
  changedField?: string;
  from?: string;
  to?: string;
}
function filtersFromParams(params: URLSearchParams): Filters {
  const filters: Filters = {};
  const table = params.get("table")?.trim();
  if (table) filters.table = table;
  for (const key of ["from", "to"] as const) {
    const value = params.get(key);
    if (value && Number.isFinite(Date.parse(value))) {
      filters[key] = new Date(value).toISOString();
    }
  }
  if (filters.from && filters.to && filters.from > filters.to) {
    delete filters.from;
    delete filters.to;
  }
  return filters;
}
export function AuditPage({ errorsOnly = false }: { errorsOnly?: boolean }) {
  const [params, setParams] = useSearchParams();
  const initialFilters = filtersFromParams(params);
  return (
    <AuditView
      key={JSON.stringify([errorsOnly, initialFilters])}
      initialFilters={initialFilters}
      errorsOnly={errorsOnly}
      clearParams={() => setParams({})}
    />
  );
}

function AuditView({
  initialFilters,
  errorsOnly,
  clearParams,
}: {
  initialFilters: Filters;
  errorsOnly: boolean;
  clearParams: () => void;
}) {
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const [form] = Form.useForm<Filters>();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const location = useLocation();
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialFilters.from || initialFilters.to),
  );
  const queryKey = ["audit", companyScope, filters, errorsOnly] as const;
  const q = useInfiniteQuery({
    queryKey,
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam, signal }) =>
      getData<EventPage>(
        "/audit-log/search",
        {
          ...filters,
          ...pageParam,
          ...(errorsOnly ? { severity: filters.severity || "ERROR" } : {}),
          limit: 50,
        },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const options = useQuery({
    queryKey: ["audit-filter-options"],
    queryFn: ({ signal }) =>
      getData<Record<string, { value: string; count: number }[]>>(
        "/audit-log/filters",
        undefined,
        signal,
      ),
  });
  const rows = [
    ...new Map(
      q.data?.pages
        .flatMap((page) => page.events)
        .map((event) => [event.id, event]),
    ).values(),
  ];
  return (
    <PageShell
      title={errorsOnly ? "Errors & critical activity" : "Company audit trail"}
      subtitle="Search captured company changes and inspect who changed each record."
      actions={
        <Button
          onClick={() => void restartSearch(queryClient, queryKey, queryKey)}
          loading={q.isFetching}
        >
          Refresh
        </Button>
      }
    >
      <Card>
        <Form
          form={form}
          initialValues={filters}
          layout="vertical"
          onFinish={(values) => {
            const nextFilters = Object.fromEntries(
              Object.entries(values)
                .map(([key, value]) => [
                  key,
                  typeof value === "string" ? value.trim() : value,
                ])
                .filter(([, value]) => value !== undefined && value !== ""),
            );
            void restartSearch(queryClient, queryKey, [
              "audit",
              companyScope,
              nextFilters,
              errorsOnly,
            ]);
            setFilters(nextFilters);
          }}
        >
          <div className="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-4">
            <Form.Item name="search" label="Search description">
              <Input
                allowClear
                maxLength={500}
                placeholder="Search company activity"
              />
            </Form.Item>
            <Form.Item name="table" label="Table">
              <AutoComplete
                allowClear
                options={options.data?.tables?.map(({ value }) => ({ value }))}
                placeholder="public.orders"
                filterOption={(input, option) =>
                  String(option?.value)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="operation" label="Operation">
              <Select
                allowClear
                options={[
                  { value: "INSERT", label: "Created (INSERT)" },
                  { value: "UPDATE", label: "Updated (UPDATE)" },
                  { value: "DELETE", label: "Deleted (DELETE)" },
                  { value: "TRUNCATE", label: "Table truncated (TRUNCATE)" },
                  { value: "SOFT_DELETE", label: "Soft deleted" },
                ]}
              />
            </Form.Item>
            <Form.Item name="severity" label="Severity">
              <Select
                allowClear
                placeholder={errorsOnly ? "ERROR" : "All severities"}
                options={(errorsOnly
                  ? ["ERROR", "CRITICAL"]
                  : ["INFO", "WARNING", "ERROR", "CRITICAL"]
                ).map((value) => ({ value, label: value }))}
              />
            </Form.Item>
            <div
              id="advanced-audit-filters"
              className={showAdvanced ? "contents" : "hidden"}
            >
              <Form.Item name="actorExternalId" label="Actor ID">
                <Input
                  allowClear
                  autoComplete="off"
                  maxLength={255}
                  placeholder="Enter exact actor ID"
                />
              </Form.Item>
              <Form.Item name="operationName" label="Business operation">
                <AutoComplete
                  allowClear
                  maxLength={255}
                  options={options.data?.operations?.map(({ value }) => ({
                    value,
                  }))}
                  placeholder="Select or enter operation"
                />
              </Form.Item>
              <Form.Item name="changedField" label="Changed field">
                <Input allowClear maxLength={255} placeholder="e.g. status" />
              </Form.Item>
              <Form.Item
                name="from"
                label="From"
                getValueFromEvent={(v) => v?.toISOString()}
                getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
              >
                <ZonedDatePicker showTime className="w-full" />
              </Form.Item>
              <Form.Item
                name="to"
                label="To"
                dependencies={["from"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator: (_, to: string | undefined) => {
                      const from = getFieldValue("from") as string | undefined;
                      return !from || !to || Date.parse(from) <= Date.parse(to)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "End time must be on or after start time",
                            ),
                          );
                    },
                  }),
                ]}
                getValueFromEvent={(v) => v?.toISOString()}
                getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
              >
                <ZonedDatePicker showTime className="w-full" />
              </Form.Item>
            </div>
          </div>
          <Button type="primary" htmlType="submit" loading={q.isFetching}>
            Apply filters
          </Button>{" "}
          <Button
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                search: "",
                table: "",
                operation: undefined,
                severity: undefined,
                actorExternalId: "",
                operationName: "",
                changedField: "",
                from: undefined,
                to: undefined,
              });
              void restartSearch(queryClient, queryKey, [
                "audit",
                companyScope,
                {},
                errorsOnly,
              ]);
              setFilters({});
              clearParams();
            }}
          >
            Clear
          </Button>{" "}
          <Button
            type="link"
            aria-expanded={showAdvanced}
            aria-controls="advanced-audit-filters"
            onClick={() => setShowAdvanced((open) => !open)}
          >
            {showAdvanced ? "Fewer filters" : "More filters"}
            {Object.entries(filters).some(
              ([key, value]) =>
                !["table", "search", "operation", "severity"].includes(key) &&
                value,
            )
              ? " · active"
              : ""}
          </Button>
        </Form>
      </Card>
      <QueryState
        loading={q.isPending}
        error={q.isFetchNextPageError ? null : q.error}
        retry={() => void restartSearch(queryClient, queryKey, queryKey)}
      />
      {errorsOnly && (
        <Alert
          type="info"
          showIcon
          message="Showing ERROR by default. Select CRITICAL to investigate critical events."
        />
      )}
      <Table<AuditEvent>
        rowKey="id"
        loading={q.isPending}
        dataSource={rows}
        pagination={false}
        className="audit-table"
        scroll={{ x: 1250 }}
        locale={{
          emptyText:
            q.isPending || q.isError
              ? ""
              : "No captured events match these filters.",
        }}
        columns={[
          {
            title: "Time",
            width: 200,
            dataIndex: "event_timestamp",
            render: (v: string) => formatTimestamp(v, timeZone),
          },
          {
            title: "Event",
            width: 120,
            dataIndex: "event_type",
            render: (v: string) => <Tag title={v}>{eventActionLabel(v)}</Tag>,
          },
          {
            title: "Description",
            width: 280,
            dataIndex: "event_description",
            render: (value: string | null) =>
              value || "No description recorded",
          },
          {
            title: "Actor",
            width: 200,
            dataIndex: "actor_external_id",
            render: (_, row) => (
              <span title={row.actor_external_id ?? undefined}>
                {eventActorLabel(row)}
              </span>
            ),
          },
          {
            title: "ERP company",
            width: 200,
            render: (_, row) => (
              <span title={row.source_company_id || undefined}>
                {row.source_company_name ||
                  row.source_company_id ||
                  "Company not recorded"}
              </span>
            ),
          },
          {
            title: "Resource",
            width: 230,
            dataIndex: "resource_identifier",
            render: (value: string | null) => value || "Not recorded",
          },
          {
            title: "Severity",
            width: 110,
            dataIndex: "severity",
            render: (v: string) => (
              <Tag color={["ERROR", "CRITICAL"].includes(v) ? "red" : "blue"}>
                {v}
              </Tag>
            ),
          },
          {
            title: "Details",
            width: 110,
            render: (_, row) => (
              <Link
                to={activityInspectionUrl(row.id)}
                state={{ returnTo: location.pathname + location.search }}
              >
                <Button>Inspect</Button>
              </Link>
            ),
          },
        ]}
      />
      {q.hasNextPage && !q.isFetchNextPageError && (
        <Button
          onClick={() => q.fetchNextPage()}
          loading={q.isFetchingNextPage}
          disabled={q.isFetching && !q.isFetchingNextPage}
        >
          Load more events
        </Button>
      )}
      {q.isFetchNextPageError && (
        <Alert
          type="error"
          showIcon
          message="Could not load more events"
          description={q.error?.message}
          action={
            <Button
              loading={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
            >
              Retry more events
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
export function RecordsPage() {
  const [params] = useSearchParams();
  const table = params.get("table")?.trim();
  const recordId = params.get("recordId")?.trim();
  const initialTarget =
    table && recordId && table.length <= 127 && recordId.length <= 255
      ? { table, recordId }
      : undefined;
  return (
    <RecordHistoryView
      key={JSON.stringify(initialTarget)}
      initialTarget={initialTarget}
    />
  );
}

function RecordHistoryView({
  initialTarget,
}: {
  initialTarget: { table: string; recordId: string } | undefined;
}) {
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const [target, setTarget] = useState<
    { table: string; recordId: string } | undefined
  >(initialTarget);
  const queryKey = ["record-history", companyScope, target] as const;
  const q = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getData<{ events: AuditEvent[]; lifecycle?: Data }>(
        `/audit-log/records/${encodeURIComponent(
          target!.table,
        )}/${encodeURIComponent(target!.recordId)}`,
        { limit: 200 },
        signal,
      ),
    enabled: !!target,
  });
  return (
    <PageShell
      title="Record history"
      subtitle="Follow the full lifecycle of a specific company record."
    >
      <Card>
        <Form
          layout="vertical"
          className="grid gap-x-4 sm:grid-cols-3"
          initialValues={target}
          onFinish={(values: { table: string; recordId: string }) => {
            const nextTarget = {
              table: values.table.trim(),
              recordId: values.recordId.trim(),
            };
            void restartSearch(queryClient, queryKey, [
              "record-history",
              companyScope,
              nextTarget,
            ]);
            setTarget(nextTarget);
          }}
        >
          <Form.Item
            name="table"
            label="Table"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={127} placeholder="public.orders" />
          </Form.Item>
          <Form.Item
            name="recordId"
            label="Record ID"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={255} placeholder="Record identifier" />
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" htmlType="submit" loading={q.isFetching}>
              Find trail
            </Button>
          </Form.Item>
        </Form>
      </Card>
      {!target ? (
        <Alert
          type="info"
          message="Enter a table and record ID to view its changes, lifecycle and before/after values."
        />
      ) : (
        <>
          <QueryState
            loading={q.isPending}
            error={q.error}
            retry={() => void restartSearch(queryClient, queryKey, queryKey)}
          />
          {q.data && (
            <Card>
              {q.data.events.length === 200 && (
                <Alert
                  className="mb-6"
                  type="warning"
                  showIcon
                  message="Record history display limit reached"
                  description="The earliest 200 changes in the past year are shown. More recent changes may exist beyond this display limit."
                />
              )}
              {q.data.lifecycle && (
                <div className="mb-6">
                  <Details data={q.data.lifecycle} />
                </div>
              )}
              <EventTimeline events={q.data.events} />
              <div className="mt-6 border-t border-slate-200 pt-6">
                <DocumentHistory
                  key={`${target.table}:${target.recordId}`}
                  {...target}
                  fieldOptions={
                    Array.isArray(q.data.lifecycle?.fields_ever_changed)
                      ? q.data.lifecycle.fields_ever_changed.filter(
                          (field): field is string => typeof field === "string",
                        )
                      : []
                  }
                />
              </div>
              <p className="mt-4 text-xs text-gray-500">
                The full event trail above shows the earliest 200 events from
                the past year. Document history uses its own field, activity and
                order filters.
              </p>
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
