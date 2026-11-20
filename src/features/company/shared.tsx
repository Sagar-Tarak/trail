import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { Alert, Button, Drawer, Empty, Spin } from "antd";
import type { DrawerProps } from "antd";
import { formatTimestamp, formatDateValue } from "./time";
import type { Data } from "./api";
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: Error | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <div
        className="p-8 text-center"
        role="status"
        aria-label="Loading results"
        aria-live="polite"
      >
        <Spin />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message={error.message}
        action={<Button onClick={retry}>Retry</Button>}
      />
    );
  return null;
}
export function Details({ data }: { data: Data | undefined }) {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  if (!data || !Object.keys(data).length)
    return <Empty description="No details available" />;
  return (
    <dl className="detail-grid">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <dt>
            {key
              .replaceAll("_", " ")
              .replace(/^./, (letter) => letter.toUpperCase())}
          </dt>
          <dd>
            {Array.isArray(value) &&
            value.every((item) => typeof item !== "object") ? (
              <ul className="detail-values">
                {value.map((item, index) => (
                  <li key={index}>{formatDateValue(item, timeZone)}</li>
                ))}
              </ul>
            ) : typeof value === "object" && value !== null ? (
              <pre>{JSON.stringify(value, null, 2)}</pre>
            ) : typeof value === "string" &&
              /^\d{4}-\d{2}-\d{2}T/.test(value) ? (
              <time dateTime={value} title={value}>
                {formatTimestamp(value, timeZone)}
              </time>
            ) : (
              String(value ?? "—")
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DetailDrawer(props: DrawerProps) {
  return (
    <Drawer
      width="min(820px, 100vw)"
      destroyOnHidden
      rootClassName="trail-detail-drawer"
      {...props}
    />
  );
}
