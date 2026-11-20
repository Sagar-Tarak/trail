import { useCompanyScopeKey } from "./useCompanyScope";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card } from "antd";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { PageShell } from "@/components/page";
import { getData, type AuditEvent } from "./api";
import { EventInspector, TransactionDetails } from "./EventDetails";
import { QueryState } from "./shared";
import { inspectionReturnTo } from "./inspectionNavigation";

export function ActivityDetailsPage() {
  const companyScope = useCompanyScopeKey();
  const { eventId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
    eventId,
  );
  const primary = params.get("primary") === "true";
  const activeTab = ["activity", "transaction", "document-history"].includes(
    params.get("tab") ?? "",
  )
    ? params.get("tab")!
    : "activity";
  const query = useQuery({
    queryKey: [
      "audit-event-detail",
      companyScope,
      eventId,
      primary ? "primary" : "event",
    ],
    enabled: validId,
    queryFn: ({ signal }) =>
      getData<{
        event: AuditEvent;
        primaryDocument?: { table: string; id: string; displayId?: string };
        mainEventCaptured?: boolean;
      }>(
        `/audit-events/${encodeURIComponent(eventId)}`,
        primary ? { primary: "true" } : undefined,
        signal,
      ),
  });
  const returnTo = inspectionReturnTo(
    (location.state as { returnTo?: unknown } | null)?.returnTo,
  );
  return (
    <PageShell
      title="Activity details"
      subtitle="Inspect the main record, its related transaction and document history."
      actions={
        <div className="flex gap-2">
          <Button onClick={() => void navigate(returnTo)}>
            Back to results
          </Button>
          <Button
            disabled={!validId}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Refresh
          </Button>
        </div>
      }
    >
      {!validId ? (
        <Alert type="error" showIcon message="Invalid activity reference" />
      ) : (
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        />
      )}
      {query.data?.mainEventCaptured === false &&
        query.data.primaryDocument && (
          <Alert
            type="info"
            showIcon
            message="The main document has no captured row change in this transaction"
            description={
              <>
                Showing the selected related record's changes.{" "}
                <Link
                  to={`/records?table=${encodeURIComponent(query.data.primaryDocument.table)}&recordId=${encodeURIComponent(query.data.primaryDocument.id)}`}
                >
                  Open main document history
                </Link>
                .
              </>
            }
          />
        )}
      {query.data && (
        <Card>
          <EventInspector
            key={query.data.event.id}
            event={query.data.event}
            activeTab={activeTab}
            onTabChange={(tab) => {
              const next = new URLSearchParams(params);
              next.set("tab", tab);
              setParams(next, { replace: true, state: location.state });
            }}
          />
        </Card>
      )}
    </PageShell>
  );
}

export function TransactionDetailsPage() {
  const { groupId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
    groupId,
  );
  return (
    <PageShell
      title="Transaction details"
      subtitle="Follow the main document and related changes in this captured transaction."
      actions={
        <Button
          onClick={() =>
            void navigate(
              inspectionReturnTo(
                (location.state as { returnTo?: unknown } | null)?.returnTo,
              ),
            )
          }
        >
          Back to results
        </Button>
      }
    >
      {validId ? (
        <Card>
          <TransactionDetails groupId={groupId} />
        </Card>
      ) : (
        <Alert type="error" showIcon message="Invalid transaction reference" />
      )}
    </PageShell>
  );
}
