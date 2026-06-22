import type { MasterTableConfig, ColumnDef } from "./types";
import { RightOutlined } from "@ant-design/icons";
import { useTableController } from "./useTableController";
import { Toolbar } from "./Toolbar";
import { FilterPanel } from "./FilterPanel";
import { ActiveFilters } from "./ActiveFilters";
import { SavedViews } from "./SavedViews";
import { BulkActionBar } from "./BulkActionBar";
import { RecordDrawer } from "./RecordDrawer";
import { TableCore } from "./TableCore";

// basic CSV export — handles quoting but nothing fancy
// if we ever need xlsx or streaming exports this should move to a utility
function exportCSV<T extends object>(data: T[], columns: ColumnDef<T>[], filename: string) {
  const headers = columns.map((c) => `"${String(c.title ?? c.key)}"`).join(",");
  const rows = data.map((record) =>
    columns.map((col) => {
      const key = (col.dataIndex ?? col.key) as keyof T;
      const val = String(record[key] ?? "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(",")
  ).join("\n");

  const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Breadcrumbs({ items }: { items: Array<{ label: string }> }) {
  return (
    <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <RightOutlined style={{ fontSize: 10 }} />}
          <span className={i === items.length - 1 ? "font-medium text-gray-600" : ""}>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}

interface MasterTablePageProps<T extends object> {
  config: MasterTableConfig<T>;
}

export function MasterTablePage<T extends object>({ config }: MasterTablePageProps<T>) {
  const ctrl = useTableController(config);

  const hasBulkActions = (config.bulkActions?.length ?? 0) > 0;
  const canExport = config.permissions?.export !== false;

  const handleExport = () => {
    // slugify the page title for the filename
    exportCSV(ctrl.queryResult.data, ctrl.visibleColumns, config.title.toLowerCase().replace(/\s+/g, "-"));
  };

  return (
    <div className="flex h-full w-full flex-col">
      {config.breadcrumbs && config.breadcrumbs.length > 0 && (
        <Breadcrumbs items={config.breadcrumbs} />
      )}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            {config.icon && <span>{config.icon}</span>}
            {config.title}
          </h1>
          {config.subtitle && (
            <p className="mt-0.5 text-sm text-gray-500">{config.subtitle}</p>
          )}
        </div>

        {/* show record count once data loads — ~ prefix means the server returned an estimate */}
        {!ctrl.queryResult.loading && (
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 shadow-sm">
              {ctrl.queryResult.totalIsEstimate ? "~" : ""}
              {ctrl.queryResult.total.toLocaleString()} records
            </span>
            {ctrl.queryResult.isFetching && (
              <span className="text-[10px] text-indigo-400">Refreshing…</span>
            )}
          </div>
        )}
      </div>

      {/* only show saved views if filters are configured */}
      {(config.filters && config.filters.length > 0) && (
        <div className="mb-3">
          <SavedViews
            views={ctrl.savedViews}
            activeViewId={ctrl.activeViewId}
            onLoad={ctrl.loadView}
            onDelete={ctrl.deleteView}
            onSave={ctrl.saveCurrentView}
          />
        </div>
      )}

      <div className="mb-3">
        <Toolbar
          searchInput={ctrl.searchInput}
          onSearch={ctrl.setSearch}
          placeholder={config.searchPlaceholder}
          activeFilterCount={ctrl.activeFilterCount}
          onToggleFilters={ctrl.toggleFilterPanel}
          isFilterPanelOpen={ctrl.isFilterPanelOpen}
          columns={config.columns}
          columnVisibility={ctrl.columnVisibility}
          onColumnChange={ctrl.setColumnVisibility}
          onToggleAllColumns={ctrl.toggleAllColumns}
          density={ctrl.density}
          onDensityChange={ctrl.setDensity}
          onExport={handleExport}
          onRefresh={ctrl.queryResult.refetch}
          toolbarActions={config.toolbarActions}
          canExport={canExport}
          total={ctrl.queryResult.total}
        />
      </div>

      {(config.filters?.length ?? 0) > 0 && ctrl.activeFilterCount > 0 && (
        <div className="mb-3">
          <ActiveFilters
            filters={config.filters ?? []}
            values={ctrl.filters}
            onRemove={(key) => ctrl.setFilter(key, null)}
            onClearAll={ctrl.clearFilters}
          />
        </div>
      )}

      {hasBulkActions && ctrl.selectedIds.size > 0 && (
        <div className="mb-3">
          <BulkActionBar
            count={ctrl.selectedIds.size}
            actions={config.bulkActions ?? []}
            selected={ctrl.selectedRecords}
            onClear={ctrl.clearSelection}
          />
        </div>
      )}

      <TableCore
        data={ctrl.queryResult.data}
        total={ctrl.queryResult.total}
        columns={ctrl.visibleColumns}
        rowActions={config.rowActions}
        loading={ctrl.queryResult.loading}
        isFetching={ctrl.queryResult.isFetching}
        error={ctrl.queryResult.error}
        density={ctrl.density}
        sortKey={ctrl.sortKey}
        sortDir={ctrl.sortDir}
        onSort={ctrl.setSort}
        page={ctrl.page}
        pageSize={ctrl.pageSize}
        onPageChange={ctrl.setPage}
        onPageSizeChange={ctrl.setPageSize}
        selectedIds={hasBulkActions ? ctrl.selectedIds : undefined}
        onToggleRow={hasBulkActions ? ctrl.toggleRow : undefined}
        onToggleAll={hasBulkActions ? ctrl.toggleAll : undefined}
        isAllSelected={ctrl.isAllSelected}
        isSomeSelected={ctrl.isSomeSelected}
        getRowKey={ctrl.getRowKey}
        onRowClick={config.drawer ? ctrl.openDrawer : undefined}
        emptyState={config.emptyState}
        hasDrawer={!!config.drawer}
      />

      {/* filter panel slides in from the left */}
      <FilterPanel
        open={ctrl.isFilterPanelOpen}
        onClose={ctrl.toggleFilterPanel}
        filters={config.filters ?? []}
        values={ctrl.filters}
        onFilterChange={ctrl.setFilter}
        onClearAll={ctrl.clearFilters}
        activeCount={ctrl.activeFilterCount}
      />

      {/* record drawer slides in from the right */}
      {config.drawer && (
        <RecordDrawer
          record={ctrl.drawerRecord}
          onClose={ctrl.closeDrawer}
          component={config.drawer.component}
          width={config.drawer.width}
          title={config.drawer.title}
        />
      )}
    </div>
  );
}
