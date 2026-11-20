import { useCompanyScopeKey, useCompanyScopeLabel } from "./useCompanyScope";
import { useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { PageShell } from "@/components/page";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { getData, type Cursor, type EventPage } from "./api";
import { DetailDrawer, QueryState } from "./shared";
import { EventTimeline } from "./EventDetails";
import { dayjs } from "./zonedDates";
import { formatTimestamp } from "./time";
import { restartSearch } from "./searchQuery";
import { reportCsv } from "./reportCsv";

interface ReportFilters {
  from: string;
  to: string;
  groupBy: "actor" | "table";
  scope: "database" | "setup";
  actorId?: string;
  table?: string;
}
interface FormValues extends Omit<ReportFilters, "from" | "to"> {
  start: string;
  end: string;
}
interface ReportRow {
  identity: string | null;
  actor_label?: string | null;
  actor_origin: "external" | "internal" | "missing" | "table";
  event_count: number;
  creates: number;
  updates: number;
  deletes: number;
  soft_deletes: number;
  other: number;
  started: number;
  succeeded: number;
  failed: number;
  unsuccessful: number;
  non_exact: number;
  unattributed: number;
  table_count: number;
  actor_count: number;
  first_event: string;
  last_event: string;
}
interface Report {
  rows: ReportRow[];
  totalGroups: number;
  summary: {
    events: number;
    actors: number;
    tables: number;
    unattributed: number;
    nonExact: number;
  };
  generatedAt: string;
}
function identityLabel(row: ReportRow) {
  return (
    row.identity ??
    (row.actor_origin === "table" ? "Table not recorded" : "Actor not recorded")
  );
}

function ReportEvents({
  row,
  filters,
}: {
  row: ReportRow;
  filters: ReportFilters;
}) {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const params = {
    from: filters.from,
    to: filters.to,
    captureScope: filters.scope,
    ...(filters.table ? { table: filters.table } : {}),
    ...(row.actor_origin === "table"
      ? row.identity
        ? { table: row.identity }
        : { unidentifiedTable: "true" }
      : row.actor_origin === "external"
        ? { actorExternalId: row.identity }
        : row.actor_origin === "internal"
          ? { actorUserId: row.identity }
          : { unattributed: "true" }),
    ...(row.actor_origin === "table" && filters.actorId
      ? { actorId: filters.actorId }
      : {}),
  };
  const queryKey = ["report-events", companyScope, params] as const;
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam, signal }) =>
      getData<EventPage>(
        "/audit-log/search",
        { ...params, ...pageParam, limit: 50 },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const events = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.events)
        .map((event) => [event.id, event]),
    ).values(),
  ];
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Typography.Title level={4} style={{ overflowWrap: "anywhere" }}>
        {identityLabel(row)}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        The report counted {row.event_count} captured events. Expand an event to
        inspect its actor and field changes. Times use {timeZone}.
      </Typography.Paragraph>
      <Button
        loading={query.isFetching}
        onClick={() => void restartSearch(queryClient, queryKey, queryKey)}
      >
        Refresh activity
      </Button>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {!query.isError && <EventTimeline events={events} timeZone={timeZone} />}
      {query.hasNextPage && (
        <Button
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Load more activity
        </Button>
      )}
    </div>
  );
}

export function ReportsPage() {
  const companyLabel = useCompanyScopeLabel();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const [form] = Form.useForm<FormValues>();
  const [initial] = useState<FormValues>(() => ({
    start: dayjs().tz(timeZone).subtract(29, "day").format("YYYY-MM-DD"),
    end: dayjs().tz(timeZone).format("YYYY-MM-DD"),
    groupBy: "actor",
    scope: "database",
  }));
  function normalize(values: FormValues): ReportFilters {
    return {
      groupBy: values.groupBy,
      scope: values.scope,
      from: dayjs.tz(values.start, timeZone).startOf("day").toISOString(),
      to: dayjs.tz(values.end, timeZone).endOf("day").toISOString(),
      actorId: values.actorId?.trim() || undefined,
      table: values.table?.trim() || undefined,
    };
  }
  const [filters, setFilters] = useState<ReportFilters>(() =>
    normalize(initial),
  );
  const [pageState, setPageState] = useState({ scope: companyScope, value: 1 });
  const page = pageState.scope === companyScope ? pageState.value : 1;
  const setPage = (value: number) =>
    setPageState({ scope: companyScope, value });
  const [selected, setSelected] = useState<ReportRow>();
  const [exporting, setExporting] = useState(false);
  if (pageState.scope !== companyScope) {
    setPageState({ scope: companyScope, value: 1 });
    if (selected) setSelected(undefined);
  }

  const queryKey = ["change-report", companyScope, filters, page] as const;
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getData<Report>(
        "/audit-log/reports",
        { ...filters, page, pageSize: 20 },
        signal,
      ),
  });
  const report = query.data;
  async function exportPage() {
    setExporting(true);
    try {
      const data = await getData<Report>("/audit-log/reports", {
        ...filters,
        page,
        pageSize: 20,
        export: "csv",
      });
      const rows: unknown[][] = [
        [
          "ERP company",
          "Scope",
          "Grouped by",
          "Table filter",
          "Actor filter",
          "From (UTC)",
          "To (UTC)",
          "Display time zone",
          "Page",
          "Total groups",
          "Generated (UTC)",
        ],
        [
          companyLabel,
          filters.scope,
          filters.groupBy,
          filters.table ?? "All tables",
          filters.actorId ?? "All actors",
          filters.from,
          filters.to,
          timeZone,
          page,
          data.totalGroups,
          data.generatedAt,
        ],
        [
          "Identity",
          "Identity source",
          "Latest captured name",
          "Events",
          "Creates",
          "Updates",
          "Deletes",
          "Soft deletes",
          "Setup started",
          "Setup succeeded",
          "Setup failed",
          "Other",
          "Non-success outcomes",
          "Non-exact comparisons",
          "Unattributed",
          "Tables",
          "Actors",
          "First change",
          "Last change",
        ],
      ];
      for (const row of data.rows)
        rows.push([
          identityLabel(row),
          row.actor_origin,
          row.actor_label ?? "",
          row.event_count,
          row.creates,
          row.updates,
          row.deletes,
          row.soft_deletes,
          row.started,
          row.succeeded,
          row.failed,
          row.other,
          row.unsuccessful,
          row.non_exact,
          row.unattributed,
          row.table_count,
          row.actor_count,
          formatTimestamp(row.first_event, timeZone),
          formatTimestamp(row.last_event, timeZone),
        ]);
      const url = URL.createObjectURL(
        new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `trio-trail-${filters.scope}-${filters.groupBy}-page-${page}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      void message.error(
        error instanceof Error ? error.message : "Report export failed",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <PageShell
      title="Change reports"
      subtitle="Review captured changes by user or table, then inspect the events behind each total."
      actions={
        <Button
          loading={query.isFetching}
          onClick={() => void restartSearch(queryClient, queryKey, queryKey)}
        >
          Refresh report
        </Button>
      }
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={initial}
          onFinish={(values) => {
            const next = normalize(values);
            if (
              Date.parse(next.from) > Date.parse(next.to) ||
              Date.parse(next.to) - Date.parse(next.from) > 91 * 86400000
            ) {
              void message.error(
                "Choose an ordered date range of at most 91 days",
              );
              return;
            }
            void restartSearch(queryClient, queryKey, [
              "change-report",
              companyScope,
              next,
              1,
            ]);
            setFilters(next);
            setPage(1);
            setSelected(undefined);
          }}
        >
          <div className="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-3">
            <Form.Item name="groupBy" label="Report by">
              <Select
                options={[
                  { value: "actor", label: "User / actor" },
                  { value: "table", label: "Table" },
                ]}
              />
            </Form.Item>
            <Form.Item name="scope" label="Activity scope">
              <Select
                options={[
                  { value: "database", label: "Captured database changes" },
                  { value: "setup", label: "Company setup activity" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="start"
              label={`From (${timeZone})`}
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="end"
              label={`Through (${timeZone})`}
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item name="actorId" label="Actor ID (exact)">
              <Input
                allowClear
                autoComplete="off"
                maxLength={255}
                placeholder="All actors"
              />
            </Form.Item>
            <Form.Item name="table" label="Table (exact)">
              <Input
                allowClear
                autoComplete="off"
                maxLength={255}
                placeholder="All tables, e.g. public.materials"
              />
            </Form.Item>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="primary" htmlType="submit" loading={query.isFetching}>
              Generate report
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
                form.submit();
              }}
            >
              Reset
            </Button>
            <span className="text-sm text-slate-500">
              Up to 91 days per report. Filters run on the server.
            </span>
          </div>
        </Form>
      </Card>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {report && !query.isError && (
        <>
          <Alert
            type="info"
            showIcon
            message={
              filters.scope === "database"
                ? "Captured database changes only; company setup activity is reported separately."
                : "Company setup activity only. Started, succeeded, and failed setup steps are counted separately."
            }
            description="These totals describe stored audit events, not a reconciliation against all source writes. Missing actors and incomplete comparisons remain visible."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Captured events", report.summary.events],
              ["Identified actors", report.summary.actors],
              ["Tables with changes", report.summary.tables],
              ["Actor not recorded", report.summary.unattributed],
              ["Non-exact comparisons", report.summary.nonExact],
            ].map(([title, value]) => (
              <Card key={title}>
                <Statistic title={title} value={value} />
              </Card>
            ))}
          </div>
          <Card
            title={
              filters.groupBy === "actor"
                ? "Changes by user / actor"
                : "Changes by table"
            }
            extra={
              <Button
                loading={exporting}
                disabled={!report.rows.length}
                onClick={() => void exportPage()}
              >
                Export this page (CSV)
              </Button>
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              {formatTimestamp(filters.from, timeZone)} —{" "}
              {formatTimestamp(filters.to, timeZone)} · {timeZone}. Generated{" "}
              {formatTimestamp(report.generatedAt, timeZone)}. Totals cover all
              matching events; this page shows up to 20 groups.
            </p>
            <div
              className="mb-4 flex flex-wrap gap-2"
              style={{ overflowWrap: "anywhere" }}
            >
              <Tag>Table: {filters.table ?? "All tables"}</Tag>
              <Tag>Actor: {filters.actorId ?? "All actors"}</Tag>
              <Tag>
                {filters.scope === "database"
                  ? "Database changes"
                  : "Company setup"}
              </Tag>
            </div>
            <Table<ReportRow>
              rowKey={(row) =>
                `${row.actor_origin}:${row.identity ?? "missing"}`
              }
              dataSource={report.rows}
              loading={query.isFetching}
              scroll={{ x: 1700 }}
              pagination={{
                current: page,
                pageSize: 20,
                total: report.totalGroups,
                showSizeChanger: false,
                onChange: setPage,
              }}
              columns={[
                {
                  title:
                    filters.groupBy === "actor" ? "User / actor ID" : "Table",
                  width: 270,
                  render: (_, row) => (
                    <div style={{ overflowWrap: "anywhere" }}>
                      {row.actor_label && (
                        <strong className="mb-1 block">
                          {row.actor_label}
                        </strong>
                      )}
                      <Typography.Text copyable={!!row.identity}>
                        {identityLabel(row)}
                      </Typography.Text>
                      {row.actor_origin !== "table" && (
                        <div>
                          <Tag>
                            {row.actor_origin === "internal"
                              ? "Trio Trail user"
                              : row.actor_origin === "external"
                                ? "Application actor"
                                : "Unattributed"}
                          </Tag>
                        </div>
                      )}
                    </div>
                  ),
                },
                ...[
                  ["Events", "event_count"],
                  ...(filters.scope === "setup"
                    ? [
                        ["Started", "started"],
                        ["Succeeded", "succeeded"],
                        ["Failed", "failed"],
                      ]
                    : [
                        ["Created", "creates"],
                        ["Updated", "updates"],
                        ["Deleted", "deletes"],
                        ["Soft deleted", "soft_deletes"],
                      ]),
                  ["Other", "other"],
                  ["Non-success", "unsuccessful"],
                  ["Non-exact", "non_exact"],
                  [
                    filters.groupBy === "actor" ? "Tables" : "Actors",
                    filters.groupBy === "actor" ? "table_count" : "actor_count",
                  ],
                ].map(([title, dataIndex]) => ({
                  title,
                  dataIndex,
                  width: 100,
                })),
                {
                  title: "Last change",
                  dataIndex: "last_event",
                  width: 180,
                  render: (value: string) => formatTimestamp(value, timeZone),
                },
                {
                  title: "Activity",
                  width: 150,
                  fixed: "right",
                  render: (_, row) => (
                    <Button onClick={() => setSelected(row)}>
                      View changes
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
      <DetailDrawer
        title="Report activity"
        open={!!selected}
        onClose={() => setSelected(undefined)}
      >
        {selected && <ReportEvents row={selected} filters={filters} />}
      </DetailDrawer>
    </PageShell>
  );
}
