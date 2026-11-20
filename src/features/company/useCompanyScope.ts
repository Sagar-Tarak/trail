import { useAuthStore } from "@/store/useAuthStore";
import {
  companyScopeParams,
  useCompanyScopeStore,
} from "@/store/useCompanyScopeStore";
export function useCompanyScopeKey() {
  const tenantId = useAuthStore((state) => state.tenant?.id ?? "");
  const selection = useCompanyScopeStore((state) => state.selections[tenantId]);
  return JSON.stringify([tenantId, companyScopeParams(selection)]);
}

export function useCompanyScopeLabel() {
  const tenantId = useAuthStore((state) => state.tenant?.id ?? "");
  const selection = useCompanyScopeStore((state) => state.selections[tenantId]);
  return selection?.companyId
    ? `${selection.name || selection.companyId} (${selection.companyId})`
    : selection?.companyUnassigned
      ? "Company not recorded"
      : "All ERP companies";
}
