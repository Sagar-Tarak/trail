import React from "react";

/** Thin wrapper — renders a blank bg while the lazy chunk loads. */
export function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="flex-1 bg-gray-50" />}>
      {children}
    </React.Suspense>
  );
}
