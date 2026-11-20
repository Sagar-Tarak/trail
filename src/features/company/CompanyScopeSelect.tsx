import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Select, Typography } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useCompanyScopeStore } from "@/store/useCompanyScopeStore";
import { getData } from "./api";

type Company = { id: string; name: string | null };
export function CompanyScopeSelect() {
  const tenantId = useAuthStore((state) => state.tenant?.id ?? "");
  const selection = useCompanyScopeStore((state) => state.selections[tenantId]);
  const setSelection = useCompanyScopeStore((state) => state.setSelection);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ["source-company-options", tenantId, debounced],
    enabled: !!tenantId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getData<{ companies: Company[]; nextCursor: string | null }>(
        "/audit-log/companies",
        { search: debounced, cursor: pageParam, limit: 50 },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const companies = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.companies) ?? []).map(
        (company) => [company.id, company],
      ),
    ).values(),
  ];
  const value = selection?.companyId
    ? `company:${selection.companyId}`
    : selection?.companyUnassigned
      ? "unassigned"
      : "all";
  const selectedLabel = selection?.companyId
    ? selection.name || selection.companyId
    : selection?.companyUnassigned
      ? "Company not recorded"
      : "All ERP companies";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-xs text-gray-500 lg:inline">
        ERP company
      </span>
      <Select
        aria-label="Filter audit data by ERP company"
        title="Filters captured audit data. Workspace setup, team and database configuration remain workspace-wide."
        size="small"
        className="w-48 sm:w-60"
        showSearch
        filterOption={false}
        loading={query.isFetching}
        labelInValue
        value={{ value, label: selectedLabel }}
        searchValue={search}
        onSearch={setSearch}
        onDropdownVisibleChange={(open) => {
          if (open) void query.refetch();
        }}
        onChange={(option) => {
          const company = companies.find(
            (item) => `company:${item.id}` === option.value,
          );
          setSelection(
            tenantId,
            company
              ? { companyId: company.id, name: company.name || company.id }
              : option.value === "unassigned"
                ? { companyUnassigned: true }
                : {},
          );
          setSearch("");
        }}
        options={[
          { value: "all", label: "All ERP companies" },
          { value: "unassigned", label: "Company not recorded" },
          ...companies.map((company) => ({
            value: `company:${company.id}`,
            label: company.name
              ? `${company.name} · ${company.id}`
              : company.id,
          })),
        ]}
        notFoundContent={
          query.isError
            ? "Could not load companies"
            : query.isFetching
              ? "Finding companies…"
              : "No captured companies match"
        }
        dropdownRender={(menu) => (
          <>
            {menu}
            {query.isError && (
              <Button size="small" onClick={() => void query.refetch()}>
                Retry companies
              </Button>
            )}
            {query.hasNextPage && (
              <Button
                block
                type="text"
                loading={query.isFetchingNextPage}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void query.fetchNextPage()}
              >
                Load more companies
              </Button>
            )}
            <Typography.Text
              type="secondary"
              className="block px-3 py-2 text-xs"
            >
              Companies observed in this workspace’s captured changes.
            </Typography.Text>
          </>
        )}
      />
    </div>
  );
}
