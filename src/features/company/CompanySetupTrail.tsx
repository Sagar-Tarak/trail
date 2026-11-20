import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Alert, Button, Card, Checkbox, Collapse, Select, Tag } from "antd";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getData, postData, type AuditEvent, type Cursor } from "./api";
import { DetailDrawer, QueryState } from "./shared";
import { EventInspector } from "./EventDetails";
import { eventActorLabel } from "./eventFormat";
import { formatTimestamp, formatDateValue } from "./time";
import { restartSearch } from "./searchQuery";

type SetupEvent = Pick<
  AuditEvent,
  | "id"
  | "event_timestamp"
  | "event_type"
  | "outcome"
  | "event_description"
  | "actor_user_id"
  | "actor_role"
  | "before_data"
  | "after_data"
  | "changed_fields"
> & {
  metadata: {
    submitted_settings?: Record<string, unknown>;
    evidenceEventId?: string;
  };
};
interface SetupState {
  completed: boolean;
  completedAt: string | null;
  lastConfirmedAt: string | null;
  registrationRecorded: boolean;
  snapshot: { status: string; outboxVerifiedAt: string | null } | null;
  reasons: string[];
  evidence: {
    id: string;
    event_timestamp: string;
    resource_identifier: string;
    actor_external_id: string;
    actorName: string | null;
  }[];
  events: SetupEvent[];
  nextCursor: Cursor | null;
}
const display = (value: unknown, timeZone: string) =>
  value == null
    ? "Not set"
    : typeof value === "string"
      ? formatDateValue(value, timeZone)
      : JSON.stringify(value);
export function CompanySetupTrail() {
  const queryClient = useQueryClient();
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const role = useAuthStore((state) => state.user?.role);
  const canManage = role === "ADMIN" || role === "SUPER_ADMIN";
  const [evidenceId, setEvidenceId] = useState<string>();
  const [review, setReview] = useState<{
    evidenceId: string;
    state: SetupState;
  }>();
  const [inspected, setInspected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const queryKey = ["company-setup-trail"] as const;
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as Cursor | null,
    queryFn: ({ pageParam, signal }) =>
      getData<SetupState>(
        "/company-setup/trail",
        pageParam ?? undefined,
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const inspectedEvent = useQuery({
    queryKey: ["setup-evidence", inspected],
    enabled: !!inspected,
    queryFn: ({ signal }) =>
      getData<{ event: AuditEvent }>(
        `/audit-events/${encodeURIComponent(inspected!)}`,
        undefined,
        signal,
      ),
  });
  const state = query.data?.pages.at(-1);
  const selectedEvidence = state?.evidence.find(
    (event) => event.id === evidenceId,
  );
  const reviewed =
    !!selectedEvidence &&
    review?.evidenceId === selectedEvidence.id &&
    review?.state === state;
  const canConfirm =
    canManage &&
    reviewed &&
    !!state &&
    !state.completed &&
    state.reasons.length === 0 &&
    !busy &&
    !query.isFetching &&
    !query.isError;
  const events = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.events)
        .map((event) => [event.id, event]),
    ).values(),
  ];
  function refreshTrail() {
    setReview(undefined);
    setError("");
    return restartSearch(queryClient, queryKey, queryKey);
  }
  async function complete() {
    if (!canConfirm || !selectedEvidence) return;
    setBusy(true);
    setError("");
    try {
      await postData("/company-setup/complete", {
        evidenceEventId: selectedEvidence.id,
      });
      setReview(undefined);
      await restartSearch(queryClient, queryKey, queryKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to confirm setup");
      setReview(undefined);
      await restartSearch(queryClient, queryKey, queryKey);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card
      title="Your company setup trail"
      extra={
        <div className="flex flex-wrap gap-2">
          <a href="#company-setup-instructions">
            <Button>Setup instructions</Button>
          </a>
          <Button
            loading={query.isFetching}
            disabled={busy}
            onClick={() => void refreshTrail()}
          >
            Refresh trail
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Confirmed backend history: who performed each setup action, what changed
        and when. Reading guide steps does not complete setup.
      </p>
      <QueryState
        loading={query.isPending}
        error={query.isFetchNextPageError ? null : query.error}
        retry={() => void refreshTrail()}
      />
      {state && (
        <div className="flex min-w-0 flex-col gap-5">
          <Alert
            showIcon
            type={state.completed ? "success" : "info"}
            message={
              state.completed
                ? "Company setup confirmed complete"
                : "Company setup needs confirmation"
            }
            description={
              state.completed
                ? `Confirmed ${formatTimestamp(state.completedAt!, timeZone)} using a captured application change.`
                : state.lastConfirmedAt
                  ? `Previously confirmed ${formatTimestamp(state.lastConfirmedAt, timeZone)}. Current setup or capture conditions need to be checked again.`
                  : "Complete database setup, capture an identified application change and verify its details below."
            }
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Company registered", true],
              ["Database configured", !!state.snapshot],
              ["Outbox verified", !!state.snapshot?.outboxVerifiedAt],
              ["Capture active", state.snapshot?.status === "ACTIVE"],
              ["Attributed change available", state.evidence.length > 0],
              ["Administrator confirmed", state.completed],
            ].map(([label, done]) => (
              <div
                key={String(label)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm"
              >
                <span>{label}</span>
                <Tag color={done ? "green" : "default"}>
                  {done ? "Done" : "Pending"}
                </Tag>
              </div>
            ))}
          </div>
          {!state.registrationRecorded && (
            <Alert
              type="warning"
              showIcon
              message="Earlier setup history was not recorded"
              description="This company existed before setup tracking was added. Its current configuration is shown, but earlier users and action times cannot be reconstructed from it. New setup actions will appear below."
            />
          )}
          {!state.completed && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
              <h3 className="font-semibold text-slate-900">
                Verify the first application change
              </h3>
              {state.reasons.length > 0 ? (
                <>
                  <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {state.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <Link to="/software">
                    <Button>Open database setup</Button>
                  </Link>{" "}
                  <Link to="/sdk-setup">
                    <Button>SDK instructions</Button>
                  </Link>
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <label
                    htmlFor="setup-evidence"
                    className="text-sm text-slate-600"
                  >
                    Select a known application change and inspect its user, time
                    and values.
                  </label>
                  <Select
                    id="setup-evidence"
                    aria-label="Captured change for setup verification"
                    className="w-full"
                    value={selectedEvidence?.id}
                    disabled={busy || query.isFetching || query.isError}
                    placeholder="Choose a captured change"
                    onChange={(id) => {
                      setEvidenceId(id);
                      setReview(undefined);
                      setError("");
                    }}
                    options={state.evidence.map((event) => ({
                      value: event.id,
                      label: `${formatTimestamp(event.event_timestamp, timeZone)} · ${event.resource_identifier} · ${event.actorName || event.actor_external_id}`,
                    }))}
                  />
                  <div>
                    <Button
                      disabled={!selectedEvidence || busy || query.isFetching}
                      onClick={() => setInspected(selectedEvidence?.id)}
                    >
                      Inspect selected change
                    </Button>
                  </div>
                  {canManage ? (
                    <>
                      <Checkbox
                        checked={reviewed}
                        disabled={
                          !selectedEvidence ||
                          busy ||
                          query.isFetching ||
                          query.isError
                        }
                        onChange={(e) =>
                          setReview(
                            e.target.checked && selectedEvidence && state
                              ? { evidenceId: selectedEvidence.id, state }
                              : undefined,
                          )
                        }
                      >
                        I checked the selected change against the application:
                        the user, time and values are correct.
                      </Checkbox>
                      <div>
                        <Button
                          type="primary"
                          loading={busy}
                          disabled={!canConfirm}
                          onClick={complete}
                        >
                          Confirm company setup complete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Ask your company administrator to confirm setup after
                      reviewing this change.
                    </p>
                  )}
                </div>
              )}
              {error && (
                <Alert type="error" showIcon className="mt-3" message={error} />
              )}
            </div>
          )}
          <div>
            <h3 className="mb-3 font-semibold text-slate-900">
              Setup activity · newest first
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">
                No setup actions have been recorded yet.
              </p>
            ) : (
              <ol className="flex min-w-0 flex-col gap-3">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="min-w-0 rounded-lg border border-slate-200 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <Tag
                        color={
                          event.outcome === "SUCCESS"
                            ? "green"
                            : event.outcome === "FAILURE"
                              ? "red"
                              : "blue"
                        }
                      >
                        {event.outcome === "SUCCESS"
                          ? "Completed"
                          : event.outcome === "FAILURE"
                            ? "Failed"
                            : "Started"}
                      </Tag>
                      <time
                        className="text-xs text-slate-500"
                        dateTime={event.event_timestamp}
                        title={event.event_timestamp}
                      >
                        {formatTimestamp(event.event_timestamp, timeZone)}
                      </time>
                    </div>
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {event.event_description}
                    </p>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      {eventActorLabel(event)} ·{" "}
                      {event.actor_role || "Role not recorded"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-400">
                      User ID: {event.actor_user_id || "Not recorded"}
                    </p>
                    {(event.changed_fields.length > 0 ||
                      event.metadata?.submitted_settings ||
                      event.metadata?.evidenceEventId) && (
                      <Collapse
                        size="small"
                        className="mt-3"
                        items={[
                          {
                            key: "changes",
                            label: event.changed_fields.length
                              ? `What changed (${event.changed_fields.length})`
                              : "Action details",
                            children: (
                              <div className="min-w-0 space-y-3">
                                {event.changed_fields.map((field) => (
                                  <div
                                    key={field}
                                    className="rounded border border-slate-100 p-3"
                                  >
                                    <p className="break-all text-sm font-medium">
                                      {field}
                                    </p>
                                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <p className="text-xs text-slate-500">
                                          Before
                                        </p>
                                        <p className="break-words text-sm [overflow-wrap:anywhere]">
                                          {display(
                                            event.before_data?.[field],
                                            timeZone,
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500">
                                          After
                                        </p>
                                        <p className="break-words text-sm [overflow-wrap:anywhere]">
                                          {display(
                                            event.after_data?.[field],
                                            timeZone,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!!event.metadata?.submitted_settings && (
                                  <>
                                    <p className="text-xs text-slate-500">
                                      Submitted settings · credentials excluded
                                    </p>
                                    <pre className="whitespace-pre-wrap break-words text-xs [overflow-wrap:anywhere]">
                                      {JSON.stringify(
                                        event.metadata.submitted_settings,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </>
                                )}
                                {typeof event.metadata?.evidenceEventId ===
                                  "string" && (
                                  <Button
                                    onClick={() =>
                                      setInspected(
                                        event.metadata
                                          .evidenceEventId as string,
                                      )
                                    }
                                  >
                                    View verified application change
                                  </Button>
                                )}
                              </div>
                            ),
                          },
                        ]}
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
          {query.hasNextPage && !query.isFetchNextPageError && (
            <div>
              <Button
                loading={query.isFetchingNextPage}
                disabled={
                  busy || (query.isFetching && !query.isFetchingNextPage)
                }
                onClick={() => query.fetchNextPage()}
              >
                Load earlier setup actions
              </Button>
            </div>
          )}
          {query.isFetchNextPageError && (
            <Alert
              type="error"
              showIcon
              message="Could not load earlier setup actions"
              description={query.error?.message}
              action={
                <Button
                  loading={query.isFetchingNextPage}
                  onClick={() => query.fetchNextPage()}
                >
                  Retry earlier setup actions
                </Button>
              }
            />
          )}
        </div>
      )}
      <DetailDrawer
        title="Verify captured application change"
        open={!!inspected}
        onClose={() => setInspected(undefined)}
      >
        <QueryState
          loading={inspectedEvent.isPending}
          error={inspectedEvent.error}
          retry={() => inspectedEvent.refetch()}
        />
        {inspectedEvent.data && (
          <EventInspector
            key={inspectedEvent.data.event.id}
            event={inspectedEvent.data.event}
          />
        )}
      </DetailDrawer>
    </Card>
  );
}
