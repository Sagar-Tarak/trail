import { useCompanyScopeKey } from "./useCompanyScope";
import { groupTimelineEvents } from "./timelineGroups";
import { activitySummary, activityTableLabel } from "./activitySummary";
import { ActivityDateRange } from "./ActivityDateRange";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Tag,
} from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { dayjs, rangeToUtcBounds } from "./zonedDates";
import { defaultTimeZone } from "./time";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { activityInspectionUrl } from "./inspectionNavigation";
import { PageShell } from "@/components/page";
import { useAuthStore } from "@/store/useAuthStore";
import { getData, type Cursor, type EventPage } from "./api";
import { QueryState } from "./shared";
import { eventActionLabel, eventActorLabel } from "./eventFormat";
import { formatClock, formatTimestamp, groupEventsByDay } from "./time";
import { restartSearch } from "./searchQuery";

interface SearchValues {
  range?: [Dayjs, Dayjs];
  search?: string;
  table?: string;
  actorExternalId?: string;
  operation?: string;
}
interface Filters extends Omit<SearchValues, "range"> {
  from: string;
  to: string;
}
function defaultRange(timeZone = defaultTimeZone): [Dayjs, Dayjs] {
  return [
    dayjs().tz(timeZone).subtract(6, "day").startOf("day"),
    dayjs().tz(timeZone).endOf("day"),
  ];
}
function normalize({
  range = defaultRange(),
  ...values
}: SearchValues): Filters {
  return {
    ...Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, value?.trim()])
        .filter(([, value]) => value),
    ),
    ...rangeToUtcBounds(range),
  };
}

export function TimelinePage() {
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const company = useAuthStore((state) => state.tenant?.company_name);
  const [form] = Form.useForm<SearchValues>();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const [initialRange] = useState<[Dayjs, Dayjs]>(() => {
    const from = dayjs(params.get("from") ?? "");
    const to = dayjs(params.get("to") ?? "");
    return from.isValid() && to.isValid() && !from.isAfter(to)
      ? [from.tz(timeZone), to.tz(timeZone)]
      : defaultRange(timeZone);
  });
  const [filters, setFilters] = useState<Filters>(() =>
    normalize({
      ...Object.fromEntries(
        ["search", "table", "actorExternalId", "operation"].map((key) => [
          key,
          params.get(key) ?? undefined,
        ]),
      ),
      range: initialRange,
    }),
  );
  const queryKey = ["company-timeline-summary", companyScope, filters] as const;
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam, signal }) =>
      getData<EventPage>(
        "/audit-log/search",
        { ...filters, ...pageParam, limit: 50, summaryOnly: "true" },
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
  const activities = groupTimelineEvents(
    query.data?.pages.flatMap((page) => page.events) ?? [],
  );
  const groups = groupEventsByDay(activities, timeZone);
  const matchingChanges = activities.reduce(
    (total, event) => total + event.matching_changes,
    0,
  );
  const count = groups.reduce((total, group) => total + group.events.length, 0);
  return (
    <PageShell
      title="Activity timeline"
      subtitle={`See what happened at ${company ?? "your company"}, in time order.`}
      actions={
        <Button
          loading={query.isFetching}
          onClick={() => void restartSearch(queryClient, queryKey, queryKey)}
        >
          Refresh activity
        </Button>
      }
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ ...filters, range: initialRange }}
          onFinish={(values) => {
            const nextFilters = normalize(values);
            void restartSearch(queryClient, queryKey, [
              "company-timeline-summary",
              companyScope,
              nextFilters,
            ]);
            setParams(
              Object.fromEntries(
                Object.entries(nextFilters).filter(([, value]) => value),
              ),
              { replace: true },
            );
            setFilters(nextFilters);
          }}
        >
          <div className="grid gap-x-4 md:grid-cols-2 xl:grid-cols-4">
            <Form.Item
              name="range"
              label="When did it happen?"
              className="md:col-span-2"
              rules={[
                { required: true, message: "Choose a start and end date" },
                {
                  validator: (_, range: [Dayjs, Dayjs] | undefined) =>
                    !range ||
                    range[0].isBefore(range[1], "second") ||
                    range[0].isSame(range[1], "second")
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("End time must be after start time"),
                        ),
                },
              ]}
            >
              <ActivityDateRange />
            </Form.Item>
            <Form.Item name="table" label="Table">
              <AutoComplete
                allowClear
                options={options.data?.tables?.map(({ value }) => ({ value }))}
                placeholder="All tables"
                filterOption={(input, option) =>
                  String(option?.value)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="actorExternalId" label="Who made the change?">
              <Input
                allowClear
                autoComplete="off"
                maxLength={255}
                placeholder="Enter exact actor ID"
              />
            </Form.Item>
            <Form.Item
              name="search"
              label="What happened?"
              className="md:col-span-2"
            >
              <Input
                allowClear
                maxLength={500}
                placeholder="Search descriptions, such as order approved"
              />
            </Form.Item>
            <Form.Item name="operation" label="Type of change">
              <Select
                allowClear
                placeholder="All changes"
                options={[
                  { value: "INSERT", label: "Created" },
                  { value: "UPDATE", label: "Updated" },
                  { value: "DELETE", label: "Deleted" },
                  { value: "TRUNCATE", label: "Table truncated" },
                  { value: "SOFT_DELETE", label: "Soft deleted" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="primary" htmlType="submit" loading={query.isFetching}>
              Find activity
            </Button>
            <Button
              onClick={() => {
                const range = defaultRange(timeZone);
                form.resetFields();
                form.setFieldsValue({
                  range,
                  search: "",
                  table: "",
                  actorExternalId: "",
                  operation: undefined,
                });
                const nextFilters = normalize({ range });
                void restartSearch(queryClient, queryKey, [
                  "company-timeline-summary",
                  companyScope,
                  nextFilters,
                ]);
                setParams(
                  Object.fromEntries(
                    Object.entries(nextFilters).filter(([, value]) => value),
                  ),
                  { replace: true },
                );
                setFilters(nextFilters);
              }}
            >
              Reset
            </Button>
            <p className="text-xs text-slate-500">
              All dates and times use {timeZone}. Change it in the top bar.
            </p>
          </div>
        </Form>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            What happened, and when
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Newest first · {count} activities · {matchingChanges} matching
            changes loaded · {formatTimestamp(filters.from, timeZone)} —{" "}
            {formatTimestamp(filters.to, timeZone)}
          </p>
        </div>
      </div>
      <QueryState
        loading={query.isPending}
        error={query.isFetchNextPageError ? null : query.error}
        retry={() => void restartSearch(queryClient, queryKey, queryKey)}
      />
      {query.isSuccess && count === 0 && (
        <Card>
          <Empty description="No captured activity in this period. Try another date range or check your database capture setup.">
            <Link to="/software">
              <Button>Check database capture</Button>
            </Link>
          </Empty>
        </Card>
      )}
      {groups.map((group) => (
        <section key={group.day} aria-label={group.day}>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {group.day}
            </h3>
            <Tag>
              {group.events.length}{" "}
              {group.events.length === 1 ? "activity" : "activities"}
            </Tag>
          </div>
          <ol className="ml-2 space-y-4 border-l-2 border-indigo-100 pl-5 sm:ml-4 sm:pl-7">
            {group.events.map((event) => {
              const primaryTable =
                event.business_operation?.primaryResource.table;
              const primaryTables = primaryTable
                ? [primaryTable]
                : (event.business_batch?.primaryResources.map(
                    (resource) => resource.table,
                  ) ?? []);
              const relatedTables = event.affected_tables.filter(
                (table) => !primaryTables.includes(table),
              );
              return (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[27px] top-6 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 sm:-left-[35px]"
                    aria-hidden="true"
                  />
                  <Card size="small">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <time
                            dateTime={event.event_timestamp}
                            title={event.event_timestamp}
                            className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-indigo-700"
                          >
                            <ClockCircleOutlined />
                            {formatClock(event.event_timestamp, timeZone)}
                          </time>
                          <Tag
                            color={
                              ["Deleted", "Soft deleted"].includes(
                                eventActionLabel(event.event_type),
                              )
                                ? "red"
                                : eventActionLabel(event.event_type) ===
                                    "Created"
                                  ? "green"
                                  : "blue"
                            }
                          >
                            {eventActionLabel(event.event_type)}
                          </Tag>
                          <Tag
                            color={
                              ["ERROR", "CRITICAL"].includes(event.severity)
                                ? "red"
                                : event.severity === "WARNING"
                                  ? "gold"
                                  : "default"
                            }
                          >
                            {event.severity}
                          </Tag>
                          {event.company_labels.map((company) => (
                            <Tag key={company} title={company}>
                              {company}
                            </Tag>
                          ))}
                          {event.has_database_without_context && (
                            <Tag color="red">
                              Database change · no app context
                            </Tag>
                          )}
                          {event.diff_quality !== "EXACT" && (
                            <Tag color="gold">
                              {event.diff_quality === "PARTIAL"
                                ? "Partial comparison"
                                : "Comparison unknown"}
                            </Tag>
                          )}
                          {event.outcome !== "SUCCESS" && (
                            <Tag color="red">{event.outcome}</Tag>
                          )}
                        </div>
                        <h4 className="break-words text-base font-semibold text-slate-900">
                          {event.transaction_group_id &&
                          event.matching_changes > 1 &&
                          !event.business_operation &&
                          !event.business_batch
                            ? `Transaction · ${event.matching_changes} matching ${event.matching_changes === 1 ? "change" : "changes"} loaded`
                            : activitySummary(event)}
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span
                            className="break-all"
                            title={event.actor_external_id ?? undefined}
                          >
                            <UserOutlined />{" "}
                            {event.multiple_actors
                              ? "Multiple captured actors"
                              : eventActorLabel(event)}
                          </span>
                          {event.transaction_group_id && (
                            <span>
                              {event.matching_changes} matching{" "}
                              {event.matching_changes === 1
                                ? "change"
                                : "changes"}{" "}
                              loaded · {event.affected_tables.length}{" "}
                              {event.affected_tables.length === 1
                                ? "table"
                                : "tables"}
                            </span>
                          )}
                          {event.operation_name && (
                            <span className="break-all">
                              Operation: {event.operation_name}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          {event.business_operation ? (
                            <p>
                              <DatabaseOutlined /> <strong>Main:</strong>{" "}
                              <span
                                title={
                                  event.business_operation.primaryResource.table
                                }
                              >
                                {activityTableLabel(
                                  event.business_operation.primaryResource
                                    .table,
                                )}
                              </span>
                            </p>
                          ) : event.business_batch ? (
                            <p>
                              <DatabaseOutlined />{" "}
                              <strong>
                                Main documents (
                                {event.business_batch.primaryResources.length}):
                              </strong>{" "}
                              {event.business_batch.primaryResources
                                .slice(0, 3)
                                .map((resource, index) => (
                                  <span
                                    key={`${resource.table}:${resource.id}`}
                                    title={`${resource.table} · ${resource.id}`}
                                  >
                                    {index > 0 && " · "}
                                    {resource.displayId || resource.id}
                                  </span>
                                ))}
                              {event.business_batch.primaryResources.length >
                                3 &&
                                ` · +${event.business_batch.primaryResources.length - 3} more`}
                            </p>
                          ) : (
                            <p>
                              <DatabaseOutlined /> <strong>Tables:</strong>{" "}
                              {event.affected_tables.length
                                ? event.affected_tables
                                    .slice(0, 3)
                                    .map((table, index) => (
                                      <span key={table} title={table}>
                                        {index > 0 && " · "}
                                        {activityTableLabel(table)}
                                      </span>
                                    ))
                                : "No table recorded"}
                              {event.affected_tables.length > 3 &&
                                ` · +${event.affected_tables.length - 3} more`}
                            </p>
                          )}
                          {(event.business_operation || event.business_batch) &&
                            relatedTables.length > 0 && (
                              <p title={relatedTables.join(", ")}>
                                <strong>Related (loaded):</strong>{" "}
                                {relatedTables
                                  .slice(0, 3)
                                  .map((table, index) => (
                                    <span key={table} title={table}>
                                      {index > 0 && " · "}
                                      {activityTableLabel(table)}
                                    </span>
                                  ))}
                                {relatedTables.length > 3 &&
                                  ` · +${relatedTables.length - 3} more`}
                              </p>
                            )}
                        </div>
                      </div>
                      <Link
                        to={activityInspectionUrl(event.id, true)}
                        state={{
                          returnTo: location.pathname + location.search,
                        }}
                      >
                        <Button>Inspect</Button>
                      </Link>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {query.hasNextPage && !query.isFetchNextPageError && (
        <div className="text-center">
          <Button
            loading={query.isFetchingNextPage}
            disabled={query.isFetching && !query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
          >
            Load older activity
          </Button>
        </div>
      )}
      {query.isSuccess && count > 0 && !query.hasNextPage && (
        <p className="text-center text-xs text-slate-400">
          You’ve reached the beginning of captured activity matching these
          filters.
        </p>
      )}
      {query.isFetchNextPageError && (
        <Alert
          type="error"
          showIcon
          message="Could not load older activity"
          description={query.error?.message}
          action={
            <Button
              loading={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              Retry older activity
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
