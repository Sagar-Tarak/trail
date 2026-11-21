import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { getData, postData } from "./api";
import { formatTimestamp } from "./time";
interface Failure {
  id: string;
  source_event_id: string | null;
  schema_name: string | null;
  table_name: string | null;
  recovery_status: string;
  retry_count: number;
  occurred_at: string;
  replayable: boolean;
}
export function FailedEventRecovery() {
  const user = useAuthStore((s) => s.user),
    tenant = useAuthStore((s) => s.tenant?.id),
    zone = useTimeZoneStore((s) => s.timeZone);
  const admin = ["ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");
  const [status, setStatus] = useState("QUARANTINED"),
    [cursors, setCursors] = useState<string[]>([""]);
  const [selected, setSelected] = useState<Failure | null>(null),
    [reason, setReason] = useState(""),
    [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["failed-events", tenant, status, cursors.at(-1)],
    enabled: admin,
    queryFn: ({ signal }) =>
      getData<{ events: Failure[]; nextCursor: string | null }>(
        "/audit-log/failed-events",
        { status, cursor: cursors.at(-1), limit: 20 },
        signal,
      ),
    refetchInterval: 30000,
  });
  if (!admin) return null;
  const replay = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await postData(
        `/audit-log/failed-events/${encodeURIComponent(selected.id)}/replay`,
        { reason },
      );
      setSelected(null);
      setReason("");
      void message.success(
        "Replay queued. Check Replaying, then Recovered or Excluded for its outcome.",
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: ["failed-events", tenant] }),
        client.invalidateQueries({ queryKey: ["capture-health", tenant] }),
      ]);
    } catch {
      void message.error(
        "Replay was not confirmed. Refresh the list before retrying; check that the original raw event is available.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Typography.Title level={5}>Failed-event recovery</Typography.Title>
      <Space wrap>
        <Select
          aria-label="Recovery status"
          value={status}
          style={{ minWidth: 180 }}
          onChange={(value) => {
            setStatus(value);
            setCursors([""]);
          }}
          options={[
            { value: "QUARANTINED", label: "Needs recovery" },
            { value: "REPLAY_PENDING", label: "Replaying" },
            { value: "RECOVERED", label: "Recovered" },
            { value: "EXCLUDED", label: "Excluded (no audit event)" },
            { value: "LEGACY_RESOLVED", label: "Legacy resolved (unverified)" },
          ]}
        />
        <Button onClick={() => void query.refetch()} loading={query.isFetching}>
          Refresh failures
        </Button>
      </Space>
      <Typography.Text type="secondary">
        Recovery covers all source companies in this workspace. Replay uses the
        original captured event, not a new business write. Fix the failure cause
        before requesting replay. Missing raw events require reconciliation.
      </Typography.Text>
      {query.isError && (
        <Alert
          type="error"
          message="Failed events could not be loaded"
          showIcon
        />
      )}
      <Table<Failure>
        rowKey="id"
        size="small"
        loading={query.isLoading}
        dataSource={query.data?.events ?? []}
        pagination={false}
        scroll={{ x: 650 }}
        columns={[
          {
            title: "Failure recorded",
            dataIndex: "occurred_at",
            render: (v: string) => formatTimestamp(v, zone),
          },
          {
            title: "Table",
            render: (_, r) =>
              `${r.schema_name ?? "Unknown"}.${r.table_name ?? "Unknown"}`,
          },
          {
            title: "Status",
            dataIndex: "recovery_status",
            render: (v: string) => <Tag>{v}</Tag>,
          },
          { title: "Replay requests", dataIndex: "retry_count" },
          {
            title: "Recovery",
            render: (_, r) =>
              r.recovery_status === "QUARANTINED" ? (
                <Button
                  disabled={!r.replayable}
                  onClick={() => {
                    setSelected(r);
                    setReason("");
                  }}
                >
                  {r.replayable ? "Request replay" : "Reconciliation required"}
                </Button>
              ) : null,
          },
        ]}
      />
      <Space>
        <Button
          disabled={cursors.length === 1}
          onClick={() => setCursors(cursors.slice(0, -1))}
        >
          Previous
        </Button>
        <Button
          disabled={!query.data?.nextCursor || query.isFetching}
          onClick={() => {
            if (query.data?.nextCursor)
              setCursors([...cursors, query.data.nextCursor]);
          }}
        >
          Next
        </Button>
      </Space>
      <Modal
        title="Replay captured event"
        open={!!selected}
        onCancel={() => {
          if (!saving) setSelected(null);
        }}
        onOk={() => void replay()}
        confirmLoading={saving}
        okText="Queue replay"
        okButtonProps={{ disabled: reason.trim().length < 10 }}
      >
        <Typography.Paragraph>
          This queues the original event for audit processing. It does not
          change the source document or guarantee recovery until processing
          succeeds.
        </Typography.Paragraph>
        <Input.TextArea
          aria-label="Recovery reason"
          placeholder="What was fixed and why is replay needed?"
          value={reason}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </Space>
  );
}
