import { useCompanyScopeKey } from "./useCompanyScope";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { formatTimestamp } from "./time";
import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { PageShell } from "@/components/page";
import { getData, type Cursor } from "./api";
import { QueryState } from "./shared";
import {
  transactionCaptureLabel,
  isDatabaseWithoutContext,
  capturedTransactionOperation,
} from "./transactionCapture";
import { eventActorLabel } from "./eventFormat";
import { restartSearch } from "./searchQuery";

interface Transaction {
  transaction_group_id: string;
  operation_name: string | null;
  actor_external_id: string | null;
  actor_type?: string | null;
  actor_user_id?: string | null;
  actor_context?: {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
  sources?: string[];
  company_labels?: string[];
  operations?: string[];
  direct_db_event_count?: number;
  unattributed_event_count?: number;
  started_at: string;
  event_count: number;
  tables_affected: string[];
  max_risk_score: number;
}
export function TransactionsPage() {
  const queryClient = useQueryClient();
  const companyScope = useCompanyScopeKey();
  const [form] = Form.useForm();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<{
    operationName?: string;
    actorExternalId?: string;
  }>(() =>
    Object.fromEntries(
      ["operationName", "actorExternalId"]
        .map((key) => [key, params.get(key)?.trim()])
        .filter(([, value]) => value),
    ),
  );
  const location = useLocation();
  const queryKey = ["transactions", companyScope, filters] as const;
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam, signal }) =>
      getData<{ transactions: Transaction[]; nextCursor: Cursor | null }>(
        "/audit-log/transactions",
        { ...filters, ...pageParam, limit: 20 },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const rows = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.transactions)
        .map((row) => [row.transaction_group_id, row]),
    ).values(),
  ];
  const missingActors = rows.filter(
    (row) => !row.actor_external_id?.trim() && !row.actor_user_id?.trim(),
  ).length;
  const databaseWithoutContext = rows.filter(
    (row) => (row.direct_db_event_count ?? 0) > 0,
  ).length;
  return (
    <PageShell
      title="Company transactions"
      subtitle="Follow related changes across tables, grouped by business operation and actor."
      actions={
        <Button
          loading={query.isFetching}
          onClick={() => void restartSearch(queryClient, queryKey, queryKey)}
        >
          Refresh
        </Button>
      }
    >
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={filters}
          onFinish={(values) => {
            const nextFilters = Object.fromEntries(
              Object.entries(values)
                .map(([key, value]) => [
                  key,
                  typeof value === "string" ? value.trim() : value,
                ])
                .filter(([, value]) => value),
            );
            void restartSearch(queryClient, queryKey, [
              "transactions",
              companyScope,
              nextFilters,
            ]);
            setParams(nextFilters, { replace: true });
            setFilters(nextFilters);
          }}
        >
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item name="operationName" label="Business operation">
              <Input
                allowClear
                maxLength={255}
                placeholder="e.g. addPlacement"
              />
            </Form.Item>
            <Form.Item name="actorExternalId" label="Actor ID">
              <Input
                allowClear
                maxLength={255}
                autoComplete="off"
                placeholder="Company user or service ID"
              />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={query.isFetching}>
            Find transactions
          </Button>{" "}
          <Button
            onClick={() => {
              form.resetFields();
              void restartSearch(queryClient, queryKey, [
                "transactions",
                companyScope,
                {},
              ]);
              setParams({}, { replace: true });
              setFilters({});
            }}
          >
            Clear
          </Button>
        </Form>
      </Card>
      <QueryState
        loading={query.isPending}
        error={query.isFetchNextPageError ? null : query.error}
        retry={() => void restartSearch(queryClient, queryKey, queryKey)}
      />
      {(missingActors > 0 || databaseWithoutContext > 0) && (
        <Alert
          type="warning"
          showIcon
          message={
            databaseWithoutContext > 0
              ? `${databaseWithoutContext} of ${rows.length} loaded transactions contain database changes without application context`
              : `${missingActors} of ${rows.length} loaded transactions have no recorded actor ID`
          }
          description="Each transaction now shows its recorded capture source. Database changes without application context are labelled explicitly. A missing actor does not identify a person or prove which SQL client performed the write."
        />
      )}
      <Table<Transaction>
        rowKey="transaction_group_id"
        loading={query.isPending}
        dataSource={rows}
        pagination={false}
        className="audit-table"
        scroll={{ x: 1560 }}
        locale={{
          emptyText:
            query.isPending || query.isError
              ? ""
              : "No grouped transactions match these filters. Try another operation or actor, or check your database capture setup.",
        }}
        columns={[
          {
            title: "Started",
            width: 200,
            dataIndex: "started_at",
            render: (value: string) => formatTimestamp(value, timeZone),
          },
          {
            title: "Operation",
            width: 200,
            dataIndex: "operation_name",
            render: (value: string | null, row: Transaction) =>
              value?.trim() && !isDatabaseWithoutContext(row) ? (
                value
              ) : (
                <div className="flex flex-col gap-1">
                  <span>{capturedTransactionOperation(row)}</span>
                  <Typography.Text type="secondary">
                    Recorded change types
                  </Typography.Text>
                </div>
              ),
          },
          {
            title: "ERP company",
            width: 180,
            render: (_, row: Transaction) =>
              (row.company_labels ?? ["Company not recorded"]).join(" · "),
          },
          {
            title: "Capture source",
            width: 240,
            render: (_, row: Transaction) => (
              <div className="flex flex-col gap-1">
                <Tag>{transactionCaptureLabel(row)}</Tag>
                {!!row.direct_db_event_count && (
                  <span className="text-xs text-slate-500">
                    {row.direct_db_event_count} of {row.event_count} changes
                    without application context
                  </span>
                )}
              </div>
            ),
          },
          {
            title: "Actor",
            width: 260,
            dataIndex: "actor_external_id",
            render: (externalId: string | null, row: Transaction) => {
              const value = externalId || row.actor_user_id;
              if (isDatabaseWithoutContext(row))
                return (
                  <div className="flex flex-col gap-1">
                    <strong>Database change</strong>
                    <Typography.Text type="secondary">
                      Application actor not recorded
                    </Typography.Text>
                    {value && (
                      <Tooltip title="This ID was captured as a row-derived hint; it is not verified application attribution.">
                        <span className="break-all text-xs">
                          Row identity hint: {value}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                );
              const actorLabel = eventActorLabel({
                actor_external_id: value,
                metadata: { actor_context: row.actor_context },
              });
              const contact = [
                row.actor_context?.username,
                row.actor_context?.email,
              ]
                .filter(
                  (item): item is string =>
                    typeof item === "string" && !!item.trim(),
                )
                .map((item) => item.trim())
                .filter(
                  (item, index, items) =>
                    item !== actorLabel && items.indexOf(item) === index,
                );
              return value?.trim() ? (
                <div className="flex flex-col items-start gap-1">
                  <strong className="break-words">
                    {actorLabel === value ? "Application actor" : actorLabel}
                  </strong>
                  {contact.length > 0 && (
                    <Typography.Text
                      className="break-all text-xs"
                      type="secondary"
                    >
                      {contact.join(" · ")}
                    </Typography.Text>
                  )}
                  {actorLabel === value && (
                    <span className="text-xs text-slate-500">
                      Name, username and email were not captured for this
                      transaction
                    </span>
                  )}
                  <Typography.Text
                    className="break-all text-xs"
                    type="secondary"
                    copyable={{ text: value }}
                  >
                    {value}
                  </Typography.Text>
                  {["service", "cron"].includes(row.actor_type ?? "") && (
                    <Tag color="blue">
                      {row.actor_type === "cron"
                        ? "Scheduled service"
                        : "Application service"}
                    </Tag>
                  )}
                </div>
              ) : (
                <Tooltip title="No actor ID was recorded. The stored events have no application actor ID. Inspect the recorded source and changes; the responsible individual is not present in this capture.">
                  <Typography.Text
                    type="secondary"
                    tabIndex={0}
                    aria-label="Actor not recorded. Open the transaction to inspect its source and captured changes."
                  >
                    Actor not recorded
                  </Typography.Text>
                </Tooltip>
              );
            },
          },
          { title: "Changes", width: 90, dataIndex: "event_count" },
          {
            title: "Tables",
            width: 250,
            dataIndex: "tables_affected",
            render: (values: string[]) =>
              values.map((value) => <Tag key={value}>{value}</Tag>),
          },
          { title: "Risk", width: 70, dataIndex: "max_risk_score" },
          {
            title: "Details",
            width: 180,
            render: (_, row) => (
              <Link
                to={`/transactions/${encodeURIComponent(row.transaction_group_id)}`}
                state={{ returnTo: location.pathname + location.search }}
              >
                <Button>View transaction</Button>
              </Link>
            ),
          },
        ]}
      />
      {query.hasNextPage && !query.isFetchNextPageError && (
        <Button
          loading={query.isFetchingNextPage}
          disabled={query.isFetching && !query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          Load more transactions
        </Button>
      )}
      {query.isFetchNextPageError && (
        <Alert
          type="error"
          showIcon
          message="Could not load more transactions"
          description={query.error?.message}
          action={
            <Button
              loading={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              Retry more transactions
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
