import { useCompanyScopeKey } from "./useCompanyScope";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Card, Empty, Segmented, Statistic, Table, Tag } from "antd";
import {
  ArrowRightOutlined,
  AuditOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { PageShell } from "@/components/page";
import { AreaChart } from "@/components/charts";
import { useAuthStore } from "@/store/useAuthStore";
import { getData, type AuditEvent } from "./api";
import { DetailDrawer, QueryState } from "./shared";
import { EventInspector } from "./EventDetails";
import { eventActorLabel } from "./eventFormat";
import { formatTimestamp } from "./time";

interface Stats {
  summary: {
    total_events: number;
    total_transactions: number;
    unique_actors: number;
    unique_tables: number;
    setup_events: number;
    setup_last_event: string | null;
  };
  configured_tables: number | null;
  configured_scope: "none" | "selected" | "all";
  recent_events: AuditEvent[];
  table_page: { page: number; pageSize: number; total: number };
  generated_at: string;
  events_by_day: { day: string; event_count: number }[];
  events_by_table: {
    table_name: string;
    event_count: number;
    last_event: string;
  }[];
  events_by_severity: { severity: string; event_count: number }[];
}
const metrics = [
  {
    key: "total_events",
    label: "Captured database changes",
    icon: <AuditOutlined />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    key: "total_transactions",
    label: "Transactions",
    icon: <ApartmentOutlined />,
    color: "bg-sky-50 text-sky-600",
  },
  {
    key: "unique_actors",
    label: "Active actors",
    icon: <TeamOutlined />,
    color: "bg-violet-50 text-violet-600",
  },
  {
    key: "unique_tables",
    label: "Tables with captured changes",
    icon: <DatabaseOutlined />,
    color: "bg-emerald-50 text-emerald-600",
  },
] as const;
export function OverviewPage() {
  const companyScope = useCompanyScopeKey();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const tenant = useAuthStore((state) => state.tenant);
  const [days, setDays] = useState(30);
  const [selected, setSelected] = useState<string>();
  const [tablePageState, setTablePageState] = useState({
    scope: companyScope,
    value: 1,
  });
  const tablePage =
    tablePageState.scope === companyScope ? tablePageState.value : 1;
  const setTablePage = (value: number) =>
    setTablePageState({ scope: companyScope, value });
  const [openedAt] = useState(() => Date.now());
  if (tablePageState.scope !== companyScope) {
    setTablePageState({ scope: companyScope, value: 1 });
    if (selected) setSelected(undefined);
  }

  const from = useMemo(
    () => new Date(openedAt - days * 86400000).toISOString(),
    [days, openedAt],
  );
  const query = useQuery({
    queryKey: [
      "company-dashboard",
      companyScope,
      tenant?.id,
      from,
      timeZone,
      tablePage,
    ],
    queryFn: ({ signal }) =>
      getData<Stats>(
        "/audit-log/dashboard",
        { from, timeZone, tablePage, tableLimit: 5 },
        signal,
      ),
    staleTime: 15000,
  });
  const detail = useQuery({
    queryKey: ["dashboard-event-detail", companyScope, tenant?.id, selected],
    enabled: !!selected,
    queryFn: ({ signal }) =>
      getData<{ event: AuditEvent }>(
        `/audit-events/${selected}`,
        undefined,
        signal,
      ),
  });
  return (
    <PageShell
      title={tenant?.company_name ?? "Company overview"}
      subtitle={[tenant?.industry?.replaceAll("_", " "), tenant?.slug]
        .filter(Boolean)
        .join(" · ")}
      actions={
        <Button
          loading={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          Refresh
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            Set up your company, one step at a time
          </p>
          <p className="mt-1 text-sm text-indigo-800">
            See which details to prepare, who should help, and how to reach your
            first captured activity.
          </p>
        </div>
        <Link to="/setup">
          <Button>Open setup guide</Button>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your company at a glance
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Database changes over the last {days} days · Configured tables
            reflect the current saved selection
          </p>
        </div>
        <Segmented
          aria-label="Activity date range"
          value={days}
          onChange={(value) => {
            setDays(Number(value));
            setTablePage(1);
          }}
          options={[
            { label: "7 days", value: 7 },
            { label: "30 days", value: 30 },
            { label: "90 days", value: 90 },
          ]}
        />
      </div>
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => query.refetch()}
      />
      {query.data && (
        <>
          <p className="text-xs text-slate-500">
            Updated {formatTimestamp(query.data.generated_at, timeZone)} ·
            Activity figures may be cached for up to 15 seconds.
          </p>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <Card>
              <Statistic
                title="Configured tables"
                value={query.data.configured_tables ?? "All supported"}
              />
              <Link className="text-xs text-indigo-600" to="/software">
                Review capture selection →
              </Link>
            </Card>
            {metrics.map(({ key, label, icon, color }) => (
              <Card key={key}>
                <div className="flex items-center justify-between gap-3">
                  <Statistic
                    title={label}
                    value={Number(query.data.summary[key] ?? 0)}
                  />
                  <span
                    className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl sm:flex ${color}`}
                  >
                    {icon}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <Card
            title="Company setup activity"
            extra={
              <Link to="/setup" className="text-sm text-indigo-600">
                View setup history →
              </Link>
            }
          >
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">
                {query.data.summary.setup_events}
              </strong>{" "}
              setup events in this period, kept separate from captured database
              changes.
              {query.data.summary.setup_last_event &&
                ` Last setup activity: ${formatTimestamp(query.data.summary.setup_last_event, timeZone)}.`}
            </p>
          </Card>
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            {query.data.events_by_day.length ? (
              <AreaChart
                title="Activity over time"
                subtitle={`Captured database changes by day · ${timeZone}`}
                height={240}
                data={[...query.data.events_by_day]
                  .sort((a, b) => a.day.localeCompare(b.day))
                  .map((point) => ({
                    label: new Date(
                      `${point.day}T00:00:00Z`,
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    }),
                    events: point.event_count,
                  }))}
                series={[
                  {
                    key: "events",
                    label: "Captured database changes",
                    color: "#4f46e5",
                  },
                ]}
                xKey="label"
              />
            ) : (
              <Card title="Activity over time">
                <div className="py-10">
                  <Empty
                    description={`No activity captured in the last ${days} days`}
                  >
                    <Link to="/software">
                      <Button type="primary">Set up company database</Button>
                    </Link>
                  </Empty>
                </div>
              </Card>
            )}
            <Card title="Explore your workspace">
              <div className="space-y-1">
                {[
                  {
                    href: "/timeline",
                    title: "What happened, and when",
                    text: "Follow company activity in a chronological timeline.",
                    icon: <AuditOutlined />,
                  },
                  {
                    href: "/software",
                    title: "Manage database capture",
                    text: "Connect PostgreSQL and check capture status.",
                    icon: <DatabaseOutlined />,
                  },
                  {
                    href: "/users",
                    title: "Bring your team",
                    text: "Create company members and review sessions.",
                    icon: <TeamOutlined />,
                  },
                ].map(({ href, title, text, icon }) => (
                  <Link
                    key={href}
                    to={href}
                    className="flex items-start gap-3 rounded-xl px-2 py-4 transition hover:bg-slate-50"
                  >
                    <span className="mt-1 text-lg text-indigo-500">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {text}
                      </p>
                    </div>
                    <ArrowRightOutlined className="mt-2 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Card title="Tables with captured changes">
              <Table
                rowKey="table_name"
                size="small"
                dataSource={query.data.events_by_table}
                loading={query.isFetching}
                pagination={{
                  current: tablePage,
                  pageSize: 5,
                  total: query.data.table_page.total,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                  onChange: setTablePage,
                }}
                scroll={{ x: 420 }}
                columns={[
                  {
                    title: "Table",
                    width: 250,
                    dataIndex: "table_name",
                    render: (value: string) => (
                      <Link
                        className="text-indigo-600"
                        to={`/activities?${new URLSearchParams({ table: value, from, to: query.data!.generated_at })}`}
                      >
                        {value}
                      </Link>
                    ),
                  },
                  { title: "Events", dataIndex: "event_count" },
                  {
                    title: "Last activity",
                    dataIndex: "last_event",
                    render: (value: string) =>
                      value ? formatTimestamp(value, timeZone) : "—",
                  },
                ]}
              />
            </Card>
            <Card title="Activity by severity">
              {!query.data.events_by_severity.length && (
                <Empty description="No severity data yet" />
              )}
              <div className="space-y-4">
                {query.data.events_by_severity.map((item) => (
                  <div key={item.severity}>
                    <div className="mb-2 flex items-center justify-between">
                      <Tag
                        color={
                          ["ERROR", "CRITICAL"].includes(item.severity)
                            ? "red"
                            : item.severity === "WARNING"
                              ? "gold"
                              : "blue"
                        }
                      >
                        {item.severity}
                      </Tag>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.event_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${["ERROR", "CRITICAL"].includes(item.severity) ? "bg-rose-500" : item.severity === "WARNING" ? "bg-amber-400" : "bg-indigo-500"}`}
                        style={{
                          width: `${Math.min(100, (item.event_count / Math.max(1, query.data.summary.total_events)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
      <Card
        title="Recent database changes"
        extra={
          <Link className="text-sm text-indigo-600" to="/activities">
            View all <ArrowRightOutlined />
          </Link>
        }
      >
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={() => query.refetch()}
        />
        {query.data && (
          <Table<AuditEvent>
            rowKey="id"
            size="small"
            dataSource={query.data.recent_events}
            pagination={false}
            scroll={{ x: 700 }}
            columns={[
              {
                title: "When",
                width: 200,
                dataIndex: "event_timestamp",
                render: (value: string) => formatTimestamp(value, timeZone),
              },
              {
                title: "Activity",
                dataIndex: "event_description",
                render: (value: string | null) =>
                  value || "No description recorded",
              },
              {
                title: "Actor",
                width: 190,
                dataIndex: "actor_external_id",
                render: (_, event) => (
                  <span title={event.actor_external_id ?? undefined}>
                    {eventActorLabel(event)}
                  </span>
                ),
              },
              {
                title: "Table",
                width: 250,
                dataIndex: "resource_identifier",
                render: (value: string | null) => value || "Not recorded",
              },
              {
                title: "",
                render: (_, event) => (
                  <Button size="small" onClick={() => setSelected(event.id)}>
                    Inspect
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>
      <DetailDrawer
        title="Activity details"
        open={!!selected}
        onClose={() => setSelected(undefined)}
      >
        <QueryState
          loading={!!selected && detail.isPending}
          error={detail.error}
          retry={() => detail.refetch()}
        />
        {detail.data && (
          <EventInspector
            key={detail.data.event.id}
            event={detail.data.event}
          />
        )}
      </DetailDrawer>
    </PageShell>
  );
}
