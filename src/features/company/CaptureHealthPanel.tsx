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
  notificationsConfigured: boolean;
  anchoringConfigured: boolean;
}
export function CaptureHealthPanel() {
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
