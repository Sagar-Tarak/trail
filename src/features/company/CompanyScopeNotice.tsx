import { Button } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useCompanyScopeStore } from "@/store/useCompanyScopeStore";
export function CompanyScopeNotice() {
  const tenantId = useAuthStore((state) => state.tenant?.id ?? "");
  const selection = useCompanyScopeStore((state) => state.selections[tenantId]);
  const setSelection = useCompanyScopeStore((state) => state.setSelection);
  if (!selection?.companyId && !selection?.companyUnassigned) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-xs text-indigo-900"
    >
      <span>
        Showing audit changes for{" "}
        <strong>
          {selection.companyId
            ? selection.name || selection.companyId
            : "Company not recorded"}
        </strong>
        . Related transactions and reports follow this filter.
      </span>
      <Button
        size="small"
        type="link"
        onClick={() => setSelection(tenantId, {})}
      >
        Show all ERP companies
      </Button>
    </div>
  );
}
