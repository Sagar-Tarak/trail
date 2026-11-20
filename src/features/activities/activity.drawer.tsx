import type {
  Activity,
  ActivityStatus,
  ActivitySeverity,
} from "./activity.types";

const STATUS_STYLES: Record<
  ActivityStatus,
  { bg: string; text: string; dot: string }
> = {
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  info: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  error: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

const SEVERITY_COLORS: Record<ActivitySeverity, string> = {
  low: "text-gray-500",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-700 font-bold",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="text-sm text-gray-800">{children}</dd>
    </div>
  );
}

interface ActivityDrawerProps {
  record: Activity;
  onClose: () => void;
}

export function ActivityDrawer({ record, onClose }: ActivityDrawerProps) {
  const st = STATUS_STYLES[record.status];

  return (
    <div className="flex flex-col gap-0">
      {/* Status banner */}
      <div className={`flex items-center gap-2 px-5 py-3 ${st.bg}`}>
        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
        <span className={`text-xs font-semibold capitalize ${st.text}`}>
          {record.status}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {record.timestamp}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {/* Action */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Action
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">
            {record.action}
          </p>
        </div>

        {/* Details grid */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Activity ID">
            <code className="font-mono text-xs text-indigo-600">
              {record.id}
            </code>
          </Field>

          <Field label="Severity">
            <span
              className={`capitalize text-sm ${SEVERITY_COLORS[record.severity]}`}
            >
              {record.severity}
            </span>
          </Field>

          <Field label="Module">
            <span className="text-sm font-medium">{record.module}</span>
          </Field>

          <Field label="Duration">
            <span className="tabular-nums">
              {record.duration.toLocaleString()} ms
            </span>
          </Field>

          <Field label="IP Address">
            <code className="font-mono text-xs text-gray-600">
              {record.ipAddress}
            </code>
          </Field>

          {record.recordId && (
            <Field label="Record ID">
              <code className="font-mono text-xs text-gray-600">
                {record.recordId}
              </code>
            </Field>
          )}
        </dl>

        {/* User section */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Performed By
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {record.user
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {record.user}
              </p>
              <p className="text-xs text-gray-400">{record.email}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2 border-t border-gray-100 pt-5">
          <button
            onClick={() => navigator.clipboard?.writeText(record.id)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Copy ID
          </button>
          <button
            onClick={() => alert(`Flagging ${record.id} for review`)}
            className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
          >
            Flag for review
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
