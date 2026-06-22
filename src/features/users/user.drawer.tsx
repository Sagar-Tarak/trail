import type { User, UserStatus } from "./user.types";

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "text-emerald-600",
  inactive: "text-gray-500",
  suspended: "text-red-600",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800">{children}</dd>
    </div>
  );
}

interface UserDrawerProps {
  record: User;
  onClose: () => void;
}

export function UserDrawer({ record, onClose }: UserDrawerProps) {
  return (
    <div className="px-5 py-5">
      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
            {record.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 text-xs font-bold capitalize ${STATUS_COLORS[record.status]}`} />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-900">{record.name}</h4>
          <p className="text-sm text-gray-500">{record.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs font-semibold capitalize ${STATUS_COLORS[record.status]}`}>{record.status}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-medium capitalize text-gray-500">{record.role}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-indigo-50 px-4 py-3 text-center">
          <p className="text-xl font-bold text-indigo-700">{record.eventCount.toLocaleString()}</p>
          <p className="text-[11px] text-indigo-500">Total Events</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
          <p className="text-xl font-bold text-gray-700">
            {record.mfaEnabled ? (
              <span className="text-emerald-600">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
          </p>
          <p className="text-[11px] text-gray-400">MFA Enabled</p>
        </div>
      </div>

      {/* Detail fields */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="User ID">
          <code className="font-mono text-xs text-indigo-600">{record.id}</code>
        </Field>
        <Field label="Module">
          <span className="font-medium">{record.module}</span>
        </Field>
        <Field label="Last Login">
          <span className="text-sm">{record.lastLogin}</span>
        </Field>
        <Field label="Account Created">
          <span className="text-sm">{record.createdAt}</span>
        </Field>
      </dl>

      {/* Actions */}
      <div className="mt-8 flex gap-2 border-t border-gray-100 pt-5">
        <button
          onClick={() => alert(`Editing ${record.name}`)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Edit User
        </button>
        {record.status === "active" ? (
          <button
            onClick={() => alert(`Suspending ${record.name}`)}
            className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() => alert(`Activating ${record.name}`)}
            className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Activate
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
