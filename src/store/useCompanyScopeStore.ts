import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompanySelection {
  companyId?: string;
  companyUnassigned?: true;
  name?: string;
}
export function companyScopeParams(selection?: CompanySelection) {
  if (
    typeof selection?.companyId === "string" &&
    selection.companyId.trim() &&
    selection.companyId.length <= 256
  )
    return { companyId: selection.companyId };
  return selection?.companyUnassigned ? { companyUnassigned: "true" } : {};
}
export const useCompanyScopeStore = create<{
  selections: Record<string, CompanySelection>;
  setSelection: (tenantId: string, selection: CompanySelection) => void;
}>()(
  persist(
    (set) => ({
      selections: {},
      setSelection: (tenantId, selection) =>
        set((state) => ({
          selections: { ...state.selections, [tenantId]: selection },
        })),
    }),
    { name: "trail-source-company", version: 1 },
  ),
);
