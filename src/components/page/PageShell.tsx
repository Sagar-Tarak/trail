import type { ReactNode } from "react";
import { RightOutlined } from "@ant-design/icons";

export interface Breadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PageShellProps {
  title: string;
  subtitle?: string;
  /** Buttons / controls rendered top-right */
  actions?: ReactNode;
  /** Optional breadcrumb trail */
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  /** Remove the default vertical spacing between sections */
  noSpacing?: boolean;
}

export function PageShell({
  title,
  subtitle,
  actions,
  breadcrumbs,
  children,
  noSpacing = false,
}: PageShellProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* ── Breadcrumbs ── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronIcon />}
              {crumb.href || crumb.onClick ? (
                <a
                  href={crumb.href ?? "#"}
                  onClick={crumb.onClick}
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className={i === breadcrumbs.length - 1 ? "text-gray-700 font-medium" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {/* ── Page content ── */}
      <div className={noSpacing ? "" : "space-y-6"}>{children}</div>
    </div>
  );
}

function ChevronIcon() {
  return <RightOutlined style={{ fontSize: 10 }} />;
}
