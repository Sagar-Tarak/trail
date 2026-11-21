import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Space } from "antd";
import { getData } from "./api";
import { useCompanyScopeKey } from "./useCompanyScope";
import { QueryState } from "./shared";
export function EventIntegrity({ eventId }: { eventId: string }) {
  const scope = useCompanyScopeKey();
  const [requested, setRequested] = useState(false);
  const query = useQuery({
    queryKey: ["event-integrity", scope, eventId],
    enabled: requested,
    queryFn: ({ signal }) =>
      getData<{
        valid: boolean;
        hashVersion: number;
        coverage: string;
        trust: string;
      }>(
        `/audit-log/integrity/${encodeURIComponent(eventId)}`,
        undefined,
        signal,
      ),
  });
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button
        loading={query.isFetching}
        onClick={() => {
          setRequested(true);
          if (requested) void query.refetch();
        }}
      >
        Verify stored event hash
      </Button>
      {requested && (
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}
      {query.data && (
        <Alert
          showIcon
          type={query.data.valid ? "success" : "error"}
          message={`Hash v${query.data.hashVersion}: ${query.data.valid ? "stored content matches" : "content mismatch"}`}
          description={
            <>
              <div>{query.data.coverage}</div>
              <div>{query.data.trust}</div>
            </>
          }
        />
      )}
    </Space>
  );
}
