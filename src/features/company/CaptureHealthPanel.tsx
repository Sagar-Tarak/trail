import { FailedEventRecovery } from "./FailedEventRecovery";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Space, Tag, Typography } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { getData } from "./api";
import { formatTimestamp } from "./time";
interface Health {
  incidents: Array<{
    id: string;
    severity: string;
    code: string;
    owner: string | null;
    message: string;
    details?: {
      unexpected?: string[];
      missing?: string[];
      table?: string;
      tables?: Array<{
        table: string;
        identity: string;
        error?: string;
        sql?: string;
      }>;
    };
    opened_at: string;
    last_notified_at: string | null;
    notification_error: string | null;
  }>;
  anchors: Array<{
    checkpoint_id: string;
    verified_at: string;
    retention_until: string;
  }>;
  backlog: Array<{ unprocessed: string; oldest: string | null }>;
  recovery: Array<{
    recovery_status: string;
    count: string;
    oldest: string | null;
  }>;
  gaps: Array<{
    id: string;
    slot_id: string;
    detected_at: string;
    last_durable_lsn: string | null;
    reason: string;
  }>;
  retention: Array<{
    slot_id: string;
    observed_at: string;
    snapshot: {
      retainedBytes: string;
      safeBytes: string | null;
      maxKeepBytes: string | null;
      retentionUnlimited: boolean;
      active: boolean;
    };
  }>;
  notificationsConfigured: boolean;
  anchoringConfigured: boolean;
}
export function CaptureHealthPanel() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const tenant = useAuthStore((s) => s.tenant?.id),
    zone = useTimeZoneStore((s) => s.timeZone);
  const query = useQuery({
    queryKey: ["capture-health", tenant],
    queryFn: ({ signal }) =>
      getData<Health>("/audit-log/capture-health", undefined, signal),
    refetchInterval: 30000,
  });
  const health = query.data,
    anchor = health?.anchors[0];
  return (
    <Card
      className="capture-card"
      title="Capture safety and recovery"
      extra={
        <Button onClick={() => void query.refetch()} loading={query.isFetching}>
          Refresh health
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {query.isError && (
          <Alert
            type="error"
            showIcon
            message="Capture health is unavailable"
            description="Retry the check before relying on incoming audit activity."
          />
        )}
        {health && (
          <>
            <Typography.Text>
              Waiting for audit processing:{" "}
              <strong>{health.backlog[0]?.unprocessed ?? "0"}</strong>
              {health.backlog[0]?.oldest
                ? ` · Oldest: ${formatTimestamp(health.backlog[0].oldest, zone)}`
                : ""}
            </Typography.Text>
            <Space wrap>
              {(health.recovery ?? []).map((r) => (
                <Tag
                  key={r.recovery_status}
                  color={r.recovery_status === "RECOVERED" ? "green" : "orange"}
                >
                  {r.recovery_status}: {r.count}
                </Tag>
              ))}
            </Space>
            <FailedEventRecovery />
            {(health.gaps ?? []).map((g) => (
              <Alert
                key={g.id}
                type="error"
                showIcon
                message="Capture continuity requires reconciliation"
                description={
                  <>
                    <div>{g.reason}</div>
                    <div>
                      Detected: {formatTimestamp(g.detected_at, zone)} · Last
                      durable WAL: {g.last_durable_lsn ?? "Unknown"}
                    </div>
                    <div>
                      Missing event count is unknown. Restarting capture does
                      not resolve this incident.
                    </div>
                  </>
                }
              />
            ))}
            {(health.retention ?? []).map((r) => (
              <Typography.Paragraph key={r.slot_id} style={{ marginBottom: 0 }}>
                Slot: <Typography.Text code>{r.slot_id}</Typography.Text> ·
                Retained WAL: {r.snapshot.retainedBytes} bytes · Limit:{" "}
                {r.snapshot.retentionUnlimited
                  ? "Unlimited / unverified — DBA action required"
                  : `${r.snapshot.maxKeepBytes} bytes`}
                <br />
                Checked: {formatTimestamp(r.observed_at, zone)}
                {now - Date.parse(r.observed_at) > 90000
                  ? " · STALE: retention safety is unknown"
                  : ""}
              </Typography.Paragraph>
            ))}
            <Space wrap>
              <Tag color={health.notificationsConfigured ? "green" : "orange"}>
                {health.notificationsConfigured
                  ? "Operations notifications configured"
                  : "Operations notifications not configured"}
              </Tag>
              <Tag color={health.anchoringConfigured ? "green" : "orange"}>
                {health.anchoringConfigured
                  ? "External checkpoints configured"
                  : "External checkpoints not configured"}
              </Tag>
            </Space>
            {!health.incidents.length && (
              <Typography.Text>
                No open capture incidents. This alone does not certify capture
                completeness.
              </Typography.Text>
            )}
            {health.incidents.map((i) => (
              <Alert
                key={i.id}
                showIcon
                type={i.severity === "CRITICAL" ? "error" : "warning"}
                message={i.message}
                description={
                  <>
                    {i.code === "FULL_HISTORY_BLOCKED" &&
                      i.details?.tables?.map((table) => (
                        <div key={table.table}>
                          <strong>{table.table}</strong> · {table.identity} ·{" "}
                          {table.error}
                          <br />
                          <code>{table.sql}</code>
                        </div>
                      ))}
                    {i.code === "CAPTURE_SCOPE_DRIFT" && (
                      <>
                        {!!i.details?.unexpected?.length && (
                          <div>
                            Unreviewed tables: {i.details.unexpected.join(", ")}
                          </div>
                        )}
                        {!!i.details?.missing?.length && (
                          <div>
                            Missing reviewed tables:{" "}
                            {i.details.missing.join(", ")}
                          </div>
                        )}
                        {i.details?.table && (
                          <div>Unreviewed WAL table: {i.details.table}</div>
                        )}
                      </>
                    )}
                    <div>
                      Owner: {i.owner ?? "Not assigned"} · Opened{" "}
                      {formatTimestamp(i.opened_at, zone)}
                    </div>
                    <div>
                      {i.last_notified_at
                        ? `Last notification: ${formatTimestamp(i.last_notified_at, zone)}`
                        : "Notification not yet delivered"}
                      {i.notification_error
                        ? " · Delivery requires attention"
                        : ""}
                    </div>
                  </>
                }
              />
            ))}
            {anchor && (
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Latest externally verified checkpoint:{" "}
                {formatTimestamp(anchor.verified_at, zone)}. Protected until{" "}
                {formatTimestamp(anchor.retention_until, zone)}.<br />
                <Typography.Text code copyable>
                  {anchor.checkpoint_id}
                </Typography.Text>
              </Typography.Paragraph>
            )}
          </>
        )}
      </Space>
    </Card>
  );
}
