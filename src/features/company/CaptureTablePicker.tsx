import { useState } from "react";
import {
  Button,
  Checkbox,
  Collapse,
  Empty,
  Input,
  Pagination,
  Select,
  Switch,
} from "antd";
import { DatabaseOutlined, SearchOutlined } from "@ant-design/icons";

type Props = {
  id?: string;
  value?: string[];
  onChange?: (tables: string[]) => void;
  availableTables?: string[];
  savedTables?: string[];
  disabled?: boolean;
};

export function CaptureTablePicker({
  id,
  value = [],
  onChange,
  availableTables,
  savedTables = [],
  disabled,
}: Props) {
  const [search, setSearch] = useState("");
  const [schema, setSchema] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState("");
  const [enteredTables, setEnteredTables] = useState<string[]>([]);
  const selected = new Set(value);
  const tables = [
    ...new Set([
      ...(availableTables ?? savedTables),
      ...enteredTables,
      ...value,
    ]),
  ].sort();
  const schemas = [...new Set(tables.map((table) => table.split(".")[0]))];
  const activeSchema = schemas.includes(schema) ? schema : "";
  const matching = tables.filter(
    (table) =>
      (!activeSchema || table.split(".")[0] === activeSchema) &&
      table.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!selectedOnly || selected.has(table)),
  );
  const selectedMatches = matching.filter((table) => selected.has(table));
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(matching.length / 20)),
  );
  const visible = matching.slice((currentPage - 1) * 20, currentPage * 20);
  function addManual() {
    const names = manual
      .split(/[,\n]+/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (
      !names.length ||
      names.some(
        (name) =>
          !/^[A-Za-z_][A-Za-z0-9_-]{0,62}\.[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(
            name,
          ),
      )
    ) {
      setManualError(
        "Enter schema.table names separated by commas or new lines.",
      );
      return;
    }
    setEnteredTables((previous) => [...new Set([...previous, ...names])]);
    onChange?.([...new Set([...value, ...names])]);
    setManual("");
    setManualError("");
  }
  return (
    <div
      id={id}
      className="capture-picker"
      role="group"
      aria-label="Table selection"
    >
      <div className="capture-picker-summary">
        <span className="capture-picker-icon">
          <DatabaseOutlined />
        </span>
        <div>
          <strong>{value.length.toLocaleString()} tables selected</strong>
          <p>
            {availableTables === undefined
              ? value.length
                ? "Review your selection below. Test the connection to browse additional tables."
                : "Test the connection to load tables, or add names manually."
              : `${availableTables.length.toLocaleString()} tables available · Select only the data you need.`}
          </p>
        </div>
      </div>
      <div className="capture-picker-tools">
        <Input
          id={`${id ?? "tables"}-search`}
          aria-label="Search tables"
          placeholder="Search by table or schema…"
          prefix={<SearchOutlined />}
          allowClear
          disabled={disabled}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filter by schema"
          value={activeSchema}
          disabled={disabled}
          onChange={(next) => {
            setSchema(next);
            setPage(1);
          }}
          options={[
            { value: "", label: "All schemas" },
            ...schemas.map((name) => ({ value: name, label: name })),
          ]}
        />
      </div>
      <div className="capture-picker-controls">
        <label>
          <Switch
            size="small"
            aria-label="Show selected tables only"
            checked={selectedOnly}
            disabled={disabled}
            onChange={(checked) => {
              setSelectedOnly(checked);
              setPage(1);
            }}
          />{" "}
          Selected only
        </label>
        <div>
          <Button
            type="text"
            size="small"
            disabled={
              disabled ||
              !matching.length ||
              selectedMatches.length === matching.length
            }
            title="Select every matching table across all pages"
            onClick={() => onChange?.([...new Set([...value, ...matching])])}
          >
            Select all {matching.length.toLocaleString()}
          </Button>
          <Button
            type="text"
            size="small"
            disabled={disabled || !selectedMatches.length}
            title="Deselect matching tables across all pages"
            onClick={() => {
              const removed = new Set(matching);
              onChange?.(value.filter((table) => !removed.has(table)));
            }}
          >
            Deselect {selectedMatches.length.toLocaleString()}
          </Button>
        </div>
      </div>
      <div className="capture-picker-list" aria-label="Database tables">
        {visible.length ? (
          visible.map((table) => {
            const separator = table.indexOf(".");
            return (
              <div
                key={table}
                className={
                  selected.has(table)
                    ? "capture-picker-row is-selected"
                    : "capture-picker-row"
                }
              >
                <Checkbox
                  checked={selected.has(table)}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange?.(
                      event.target.checked
                        ? [...value, table]
                        : value.filter((name) => name !== table),
                    )
                  }
                >
                  <span className="capture-picker-name">
                    {table.slice(separator + 1)}
                  </span>
                  <span className="capture-picker-schema">
                    {table.slice(0, separator)}
                  </span>
                </Checkbox>
              </div>
            );
          })
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              search || activeSchema || selectedOnly
                ? "No tables match these filters"
                : "Test your connection or add table names below"
            }
          />
        )}
      </div>
      <div className="capture-picker-pagination">
        <span>
          {matching.length
            ? `${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, matching.length)} of ${matching.length} tables`
            : "0 tables"}
        </span>
        <Pagination
          simple
          size="small"
          current={currentPage}
          pageSize={20}
          total={matching.length}
          showSizeChanger={false}
          hideOnSinglePage
          onChange={setPage}
        />
      </div>
      <Collapse
        ghost
        className="capture-picker-manual"
        items={[
          {
            key: "manual",
            label: "Add table names manually",
            children: (
              <div className="capture-picker-manual-fields">
                <p>
                  Paste schema.table names, separated by commas or new lines.
                </p>
                <Input.TextArea
                  aria-label="Manual table names"
                  placeholder={"public.orders, public.customers"}
                  rows={3}
                  disabled={disabled}
                  value={manual}
                  onChange={(event) => {
                    setManual(event.target.value);
                    setManualError("");
                  }}
                />
                {manualError && (
                  <span role="alert" className="capture-picker-error">
                    {manualError}
                  </span>
                )}
                <Button
                  disabled={disabled || !manual.trim()}
                  onClick={addManual}
                >
                  Add tables
                </Button>
              </div>
            ),
          },
        ]}
      />
      <p className="capture-picker-note">
        Changes apply when you configure capture. Review token and session
        tables before including them.
      </p>
    </div>
  );
}
