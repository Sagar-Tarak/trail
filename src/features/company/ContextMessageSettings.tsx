import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Input, Popconfirm, Space, Typography } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { getData, postData } from "./api";
interface Status {
  keys: Array<{ id: string; created_at: string }>;
  counts: Array<{ status: string; committed: boolean; count: string }>;
}
/** One-time secrets stay in component memory, never in query/storage caches. */
export function ContextMessageSettings({ slotId }: { slotId: string }) {
  const tenant = useAuthStore((s) => s.tenant?.id);
  const [key, setKey] = useState<{ id: string; secret: string } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string>();
  useEffect(() => {
    setKey(null);
    setError(undefined);
  }, [slotId, tenant]);
  const status = useQuery({
    queryKey: ["context-message-status", tenant, slotId],
    queryFn: () => getData<Status>(`auto-capture/message-keys/${slotId}`),
  });
  async function create() {
    setBusy(true);
    setError(undefined);
    try {
      const value = await postData(`auto-capture/message-keys/${slotId}`);
      if (typeof value.id !== "string" || typeof value.secret !== "string")
        throw Error("Key response unavailable");
      setKey({ id: value.id, secret: value.secret });
      await status.refetch();
    } catch {
      setError(
        "Key creation could not be confirmed. Check setup history before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Logical context messages">
      <Typography.Title level={5}>SDK context transport</Typography.Title>
      <p>
        Existing outbox integrations continue to work. Logical messages require
        PostgreSQL 14 or newer. For transactional logical messages, issue a
        signing key for this capture source and configure the SDK before
        switching transport. Older keys remain valid for retained WAL replay.
      </p>
      {(error || status.isError) && (
        <Alert
          type="error"
          showIcon
          message={error ?? "Message status could not be loaded"}
        />
      )}
      <Space wrap>
        <Popconfirm
          title="Create a source-specific SDK signing key?"
          description="The secret is displayed once. Existing keys are retained for replay."
          onConfirm={create}
        >
          <Button loading={busy} disabled={busy || status.isPending}>
            Create signing key
          </Button>
        </Popconfirm>
        <Button onClick={() => status.refetch()} loading={status.isFetching}>
          Refresh message status
        </Button>
      </Space>
      {key && (
        <Alert
          type="info"
          showIcon
          message="Save this key securely in the server's SDK configuration"
          description={
            <>
              <p>
                Key ID: <Typography.Text copyable>{key.id}</Typography.Text>
              </p>
              <Input.Password
                aria-label="One-time SDK signing secret"
                value={key.secret}
                readOnly
                autoComplete="off"
              />
              <Typography.Text copyable={{ text: key.secret }}>
                Copy signing secret
              </Typography.Text>
              <p>The secret is not shown again after leaving this page.</p>
              <Button onClick={() => setKey(null)}>Hide key</Button>
            </>
          }
        />
      )}
      {!!status.data && (
        <>
          <p>{status.data.keys.length} retained verification keys.</p>
          {status.data.counts.map((c) => (
            <p key={c.status + String(c.committed)}>
              {c.status === "VALID" ? "Accepted context" : "Rejected context"} ·{" "}
              {c.committed ? "source committed" : "awaiting source commit"}:{" "}
              {c.count}
            </p>
          ))}
          {status.data.counts.some(
            (c) => c.status === "REJECTED" && Number(c.count) > 0,
          ) && (
            <Alert
              type="warning"
              showIcon
              message="Rejected context needs review"
              description="These messages did not supply actor attribution. Review the capture incident; business-row capture continues."
            />
          )}
        </>
      )}
    </section>
  );
}
