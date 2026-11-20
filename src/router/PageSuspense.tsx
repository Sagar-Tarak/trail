import { Suspense, type ReactNode } from "react";

export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div role="status" className="w-full animate-pulse space-y-5 p-6">
          <span className="sr-only">Loading page…</span>
          <div className="h-7 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 max-w-full rounded bg-slate-100" />
          <div className="h-48 rounded-xl border border-slate-100 bg-white" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
